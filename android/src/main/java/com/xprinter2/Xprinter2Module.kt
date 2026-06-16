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
import com.facebook.react.bridge.ReadableMap
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
  NativeXprinter2Spec(reactContext) {

  var curConnect: IDeviceConnection? = null
  var promiseConnect: Promise? = null

  private val bluetoothAdapter: BluetoothAdapter by lazy {
    (reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
  }

  override fun getName(): String = NAME

  init {
    POSConnect.init(reactApplicationContext)
  }

  override fun discovery(connType: Double, promise: Promise) {
    when (connType.toInt()) {
      0 -> searchUsb(promise)
      1 -> searchNet(promise)
      2 -> searchBt(promise)
    }
  }

  override fun connect(connType: Double, address: String, promise: Promise) {
    promiseConnect = promise
    when (connType.toInt()) {
      0 -> connectUSB(address)
      1 -> connectNet(address)
      2 -> connectBt(address)
    }
  }

  override fun disconnect(promise: Promise) {
    try {
      curConnect?.close()
      curConnect = null
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("DISCONNECT_ERROR", e.message)
    }
  }

  override fun printBitmap(base64: String, promise: Promise) {
    val bitmap = ImageUtils().base64ToBitmap(base64)
    if (bitmap != null) {
      try {
        val printer = POSPrinter(curConnect)
        val bitmapPrint = ImageUtils().resizeBitmap(bitmap, 580)
        printer.printBitmap(bitmapPrint, POSConst.ALIGNMENT_CENTER, 760)
        printer.cutPaper()
        promise.resolve(null)
      } catch (e: Exception) {
        e.printStackTrace()
        promise.reject("PRINT_ERROR", e.message)
      }
    } else {
      promise.reject("IMAGE_ERROR", "Failed to decode base64 image")
    }
  }

  override fun openCashBox(promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      printer.openCashBox(POSConst.PIN_TWO)
      promise.resolve(null)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("CASH_BOX_ERROR", e.message)
    }
  }

  override fun printerStatus(promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      printer.printerStatus {
        if (it > 0) {
          promise.resolve(it.toDouble())
        } else {
          promise.reject("STATUS", it.toString())
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }

  override fun isConnect(promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      printer.isConnect {
        promise.resolve(it == 0)
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }

  override fun setIp(address: String, promise: Promise) {
    try {
      val printer = POSPrinter(curConnect)
      val bytes = InetAddress.getByName(address).address
      printer.setIp(bytes)
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("STATUS", e.message)
    }
  }

  override fun printTSCLabel(options: ReadableMap, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "TSC label printing not yet implemented on Android")
  }

  override fun printZPLLabel(options: ReadableMap, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "ZPL label printing not yet implemented on Android")
  }

  override fun printCPCLLabel(options: ReadableMap, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "CPCL label printing not yet implemented on Android")
  }

  override fun printLabelImage(base64: String, printType: Double, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "Label image printing not yet implemented on Android")
  }

  private fun searchUsb(promise: Promise) {
    try {
      val usbNames = POSConnect.getUsbDevices(reactApplicationContext)
      if (usbNames.isNotEmpty()) {
        promise.resolve(usbNames.firstOrNull())
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
      ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    } else {
      true
    }
  }

  private fun searchBt(promise: Promise) {
    if (!bluetoothAdapter.isEnabled) {
      promise.reject("fail", "Bluetooth turn off")
      return
    }
    if (!checkLocationPermission(reactApplicationContext)) {
      promise.reject("fail", "Bluetooth permission has not been granted")
      return
    }
    val device: Set<BluetoothDevice> = bluetoothAdapter.bondedDevices
    val datas: MutableList<Bean> = mutableListOf()
    device.forEach { datas.add(Bean(true, it.name ?: "none", it.address)) }
    val writableArray = Arguments.createArray()
    for (i in 0 until datas.size) {
      val info: MutableMap<String, Any> = HashMap()
      info["NAME"] = datas[i].name
      info["IS_MATCHING"] = datas[i].isMatching
      info["MAC"] = datas[i].mac
      writableArray.pushMap(MapUtil().toWritableMap(info))
    }
    promise.resolve(writableArray)
    if (bluetoothAdapter.isDiscovering) bluetoothAdapter.cancelDiscovery()
    runBlocking { delay(300); bluetoothAdapter.startDiscovery() }
  }

  private fun connectNet(ipAddress: String) {
    if (ipAddress.isNotEmpty()) {
      curConnect?.close()
      curConnect = POSConnect.createDevice(POSConnect.DEVICE_TYPE_ETHERNET)
      curConnect!!.connect(ipAddress, connectListener)
    }
  }

  private fun connectUSB(pathName: String) {
    if (pathName.isNotEmpty()) {
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

  private val connectListener = IConnectListener { code, _, _ ->
    when (code) {
      POSConnect.CONNECT_SUCCESS -> promiseConnect?.resolve(true)
      POSConnect.CONNECT_FAIL,
      POSConnect.CONNECT_INTERRUPT,
      POSConnect.SEND_FAIL,
      POSConnect.USB_DETACHED,
      POSConnect.USB_ATTACHED -> promiseConnect?.resolve(false)
    }
  }

  companion object {
    const val NAME = "Xprinter2"
  }
}
