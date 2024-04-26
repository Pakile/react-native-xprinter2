package com.xprinter2.utils

import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import android.graphics.Bitmap


class ImageUtils {
  fun base64ToBitmap(base64: String): Bitmap? {
    var bitmap: Bitmap? = null
    try {
      val byteArr: ByteArray = Base64.decode(base64, 0)
      bitmap = BitmapFactory.decodeByteArray(byteArr, 0, byteArr.size)
    } catch (e: Exception) {
      Log.d("rongta", "escPrint: base64ToBitmap")
      e.printStackTrace()
      return null
    }
    return bitmap
  }

  fun resizeBitmap(bitmap: Bitmap, targetWidth: Int): Bitmap {
      val aspectRatio = bitmap.width.toFloat() / bitmap.height.toFloat()
      val targetHeight = (targetWidth / aspectRatio).toInt()
      return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, false)
  }

}
