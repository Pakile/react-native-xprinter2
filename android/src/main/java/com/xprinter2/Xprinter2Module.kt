package com.xprinter2


import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.util.Base64
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
import net.posprinter.TSPLPrinter
import net.posprinter.esc.PosUdpNet
import java.net.InetAddress


data class Bean(
  var isMatching: Boolean,
  var name: String,
  var mac: String
)

private const val TAG: String = "Xprinter"
private const val ACTION_USB_PERMISSION = "com.xprinter2.USB_PERMISSION"


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
  fun disconnect(promise: Promise) {
    try {
      curConnect?.close()
      curConnect = null
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("DISCONNECT_ERROR", e.message)
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
           promise.resolve(false)
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



  // Raw bytes (base64) straight to the connected printer
  @ReactMethod
  fun printRawData(base64: String, promise: Promise) {
    try {
      val connection = curConnect ?: return promise.reject("NOT_CONNECTED", "Printer is not connected")
      connection.sendData(Base64.decode(base64, Base64.DEFAULT))
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("PRINT_ERROR", e.message)
    }
  }

  // TSPL label; same options as the iOS printTSCLabel (size, gap, density,
  // speed, copies, texts, barcodes, qrcodes)
  @ReactMethod
  fun printTSCLabel(options: ReadableMap, promise: Promise) {
    try {
      val connection = curConnect ?: return promise.reject("NOT_CONNECTED", "Printer is not connected")
      fun num(map: ReadableMap, key: String, default: Double) =
        if (map.hasKey(key) && !map.isNull(key)) map.getDouble(key).takeIf { it != 0.0 } ?: default else default
      fun str(map: ReadableMap, key: String, default: String) =
        if (map.hasKey(key) && !map.isNull(key)) {
          if (map.getType(key).name == "Number") map.getDouble(key).toInt().toString() else map.getString(key) ?: default
        } else default

      val printer = TSPLPrinter(connection)
        .sizeMm(num(options, "width", 40.0), num(options, "height", 30.0))
        .gapMm(num(options, "gap", 2.0), 0.0)
        .density(num(options, "density", 8.0).toInt())
        .speed(num(options, "speed", 4.0))
        .direction(0)
        .cls()

      options.getArray("texts")?.let { texts ->
        for (i in 0 until texts.size()) {
          val t = texts.getMap(i) ?: continue
          printer.text(
            num(t, "x", 0.0).toInt(), num(t, "y", 0.0).toInt(), str(t, "font", "3"),
            num(t, "rotation", 0.0).toInt(), num(t, "xMul", 1.0).toInt(), num(t, "yMul", 1.0).toInt(),
            str(t, "content", "")
          )
        }
      }
      options.getArray("barcodes")?.let { barcodes ->
        for (i in 0 until barcodes.size()) {
          val b = barcodes.getMap(i) ?: continue
          printer.barcode(
            num(b, "x", 0.0).toInt(), num(b, "y", 0.0).toInt(), str(b, "codeType", "128"),
            num(b, "height", 100.0).toInt(), num(b, "readable", 1.0).toInt(), num(b, "rotation", 0.0).toInt(),
            num(b, "narrow", 2.0).toInt(), num(b, "wide", 2.0).toInt(), str(b, "content", "")
          )
        }
      }
      options.getArray("qrcodes")?.let { qrcodes ->
        for (i in 0 until qrcodes.size()) {
          val q = qrcodes.getMap(i) ?: continue
          printer.qrcode(
            num(q, "x", 0.0).toInt(), num(q, "y", 0.0).toInt(), str(q, "eccLevel", "M"),
            num(q, "cellWidth", 4.0).toInt(), str(q, "mode", "A"), num(q, "rotation", 0.0).toInt(),
            str(q, "content", "")
          )
        }
      }
      printer.print(num(options, "copies", 1.0).toInt())
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("TSC_PRINT_ERROR", e.message)
    }
  }

  // WiFi + static IP of the printer (vendor "set all network options"
  // command); printers only accept it over USB
  @ReactMethod
  fun wifiConfig(
    ip: String, mask: String, gateway: String, ssid: String, password: String, keyType: Int,
    promise: Promise
  ) {
    try {
      val connection = curConnect ?: return promise.reject("NOT_CONNECTED", "Printer is not connected")
      POSPrinter(connection).wifiConfig(
        InetAddress.getByName(ip).address,
        InetAddress.getByName(mask).address,
        InetAddress.getByName(gateway).address,
        ssid, password, keyType.toByte()
      )
      promise.resolve(true)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("WIFI_CONFIG_ERROR", e.message)
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

  //USB connection; the SDK doesn't ask for the USB permission, so ask first
  private fun connectUSB(pathName: String) {
    if (pathName == "") {
      promiseConnect?.resolve(false)
      return
    }
    val usbManager = reactApplicationContext.getSystemService(Context.USB_SERVICE) as UsbManager
    val device: UsbDevice? = usbManager.deviceList[pathName]
    if (device == null || usbManager.hasPermission(device)) {
      openUSB(pathName)
      return
    }
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_USB_PERMISSION) return
        reactApplicationContext.unregisterReceiver(this)
        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
          openUSB(pathName)
        } else {
          promiseConnect?.resolve(false)
        }
      }
    }
    val filter = IntentFilter(ACTION_USB_PERMISSION)
    if (Build.VERSION.SDK_INT >= 33) {
      reactApplicationContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      reactApplicationContext.registerReceiver(receiver, filter)
    }
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
    val intent = Intent(ACTION_USB_PERMISSION).setPackage(reactApplicationContext.packageName)
    usbManager.requestPermission(device, PendingIntent.getBroadcast(reactApplicationContext, 0, intent, flags))
  }

  private fun openUSB(pathName: String) {
    curConnect?.close()
    curConnect = POSConnect.createDevice(POSConnect.DEVICE_TYPE_USB)
    curConnect!!.connect(pathName, connectListener)
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
