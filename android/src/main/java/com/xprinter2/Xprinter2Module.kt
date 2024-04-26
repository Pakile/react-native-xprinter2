package com.xprinter2


import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.xprinter2.utils.ImageUtils
import com.xprinter2.utils.MapUtil
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import net.posprinter.IConnectListener
import net.posprinter.IDeviceConnection
import net.posprinter.POSConnect
import net.posprinter.POSConst
import net.posprinter.POSPrinter
import net.posprinter.esc.PosUdpNet
import java.net.InetAddress


data class Bean(
  var isMatching: Boolean,
  var name: String,
  var mac: String
)

private const val TAG: String = "Xprinter"


class Xprinter2Module(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {


  var curConnect: IDeviceConnection? = null
  var promiseConnect: Promise? = null

  //bluetooth
  private val bluetoothAdapter: BluetoothAdapter by lazy {
    (reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
  }


  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }


  override fun getConstants(): Map<String, Any>? {
    val constants: MutableMap<String, Any> = HashMap()
    constants["CON_BLUETOOTH"] = 2
    constants["CON_WIFI"] = 1
    constants["CON_USB"] = 0
    return constants
  }

  init {
    POSConnect.init(reactApplicationContext)
  }

  @ReactMethod
  fun discovery(connType: Int, promise: Promise) {
    when (connType) {
      0 -> searchUsb(promise)
      1 -> searchNet(promise)
      2 -> searchBt(promise)
    }
  }


  @ReactMethod
  fun connect(connType: Int, address: String, promise: Promise) {
    promiseConnect = promise
    when (connType) {
      0 -> connectUSB(address)
      1 -> connectNet(address)
      2 -> connectBt(address)
    }
  }

  @ReactMethod
  fun printBitmap(base64: String) {
    val bitmap = ImageUtils().base64ToBitmap(base64)
    if (bitmap != null) {
      try {
        val printer = POSPrinter(curConnect)
        val bitmapPrint = ImageUtils().resizeBitmap(bitmap, 580)
        printer.printBitmap(bitmapPrint, POSConst.ALIGNMENT_CENTER, 760)
        printer.cutPaper()
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  @ReactMethod
  fun openCashBox() {
    try {
      val printer = POSPrinter(curConnect)
      printer.openCashBox(POSConst.PIN_TWO)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }


  @ReactMethod
  fun printerStatus(promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      printer.printerStatus {
        if (it > 0) {
          promise.resolve(true)
        } else {
          promise.reject("STATUS", it.toString())
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }


  @ReactMethod
  fun isConnect(promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      printer.isConnect {
        if (it == 0) {
          promise.resolve(true)
        } else {
          promise.reject("STATUS", it.toString())
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }


  @ReactMethod
  fun setIp(ipAddress: String, promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      val bytes = InetAddress.getByName(ipAddress).address
      printer.setIp(bytes)
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }


  private fun searchUsb(promise: Promise) {
    try {
      val usbNames = POSConnect.getUsbDevices(reactApplicationContext)
      if (usbNames.isNotEmpty()) {
        val firstItem: String? = usbNames.firstOrNull()
        promise.resolve(firstItem)
      } else {
        promise.reject("SCAN_ERROR", "not found")
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }

  private fun searchNet(promise: Promise) {
    PosUdpNet().searchNetDevice {
      if (it != null) {
        Log.d(TAG, "searchNet: " + it.ipStr)
        promise.resolve(it.ipStr)
      } else {
        promise.reject("SCAN_ERROR", "not found")
      }
    }
  }

  private fun checkLocationPermission(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_FINE_LOCATION
      ) == PackageManager.PERMISSION_GRANTED
    } else {
      true
    }
  }

  private fun searchBt(promise: Promise) {
    // Kiểm tra thiết bị có hỗ trợ Bluetooth hay không
    if (bluetoothAdapter == null) {
      // Thiết bị không hỗ trợ Bluetooth
      // Xử lý tại đây
      promise.reject("fail", "Device not support")
      return
    }

    // Kiểm tra xem Bluetooth đã được bật hay chưa
    if (!bluetoothAdapter.isEnabled) {
      // Bluetooth chưa được bật, yêu cầu người dùng bật Bluetooth
      promise.reject("fail", "Bluetooth turn off")
      return
    }

    // Bluetooth đã được bật, kiểm tra quyền vị trí
    if (checkLocationPermission(reactApplicationContext)) {
      // Quyền vị trí đã được cấp, có thể kết nối Bluetooth
      val device: Set<BluetoothDevice> = bluetoothAdapter.bondedDevices
      val datas: MutableList<Bean> = mutableListOf()
      device.forEach {
        val name = it.name ?: "none"
        datas.add(Bean(true, name, it.address))
      }
      val writableArray = Arguments.createArray()
      for (i in 0 until datas.size) {
        val info: MutableMap<String, Any> = HashMap()
        info["NAME"] = datas[i].name
        info["IS_MATCHING"] = datas[i].isMatching
        info["MAC"] = datas[i].mac
        writableArray.pushMap(MapUtil().toWritableMap(info))
      }
      promise.resolve(writableArray)
    } else {
      promise.reject("fail", "Bluetooth  permission has not been granted")
    }

    if (bluetoothAdapter.isDiscovering) {
      bluetoothAdapter.cancelDiscovery()
    }

    runBlocking {
      delay(300)
      bluetoothAdapter.startDiscovery()
    }
  }

  //net connection
  private fun connectNet(ipAddress: String) {
    if (ipAddress != "") {
      curConnect?.close()
      curConnect = POSConnect.createDevice(POSConnect.DEVICE_TYPE_ETHERNET)
      curConnect!!.connect(ipAddress, connectListener)
    }
  }

  //USB connection
  private fun connectUSB(pathName: String) {
    if (pathName != "") {
      curConnect?.close()
      curConnect = POSConnect.createDevice(POSConnect.DEVICE_TYPE_USB)
      curConnect!!.connect(pathName, connectListener)
    }
  }


  private fun connectBt(bleAddress: String) {
    curConnect?.close()
    curConnect = POSConnect.createDevice(POSConnect.DEVICE_TYPE_BLUETOOTH)
    curConnect!!.connect(bleAddress, connectListener)
  }

  private fun connectMAC(macAddress: String) {
    curConnect?.close()
    curConnect = POSConnect.connectMac(macAddress, connectListener)
  }


  private val connectListener = IConnectListener { code, connInfo, msg ->
    when (code) {
      POSConnect.CONNECT_SUCCESS -> {
        promiseConnect?.resolve(true)
      }

      POSConnect.CONNECT_FAIL -> {
        promiseConnect?.resolve(false)
      }

      POSConnect.CONNECT_INTERRUPT -> {
        promiseConnect?.resolve(false)
      }

      POSConnect.SEND_FAIL -> {
        promiseConnect?.resolve(false)
      }

      POSConnect.USB_DETACHED -> {
        promiseConnect?.resolve(false)
      }

      POSConnect.USB_ATTACHED -> {
        promiseConnect?.resolve(false)
      }
    }
  }

  companion object {
    const val NAME = "Xprinter2"
  }
}
