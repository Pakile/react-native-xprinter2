package com.xprinter2.utils

import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import android.graphics.Bitmap
import android.graphics.Color


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
      // Filtered scaling keeps text strokes even before the SDK turns the image black and white
      return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
  }

  // The SDK only prints pixels darker than 50% gray, so thin or small text (anti-aliased to light gray once
  // scaled to the print width) came out as scattered dots. Anything darker than `threshold` prints black.
  fun toMonochrome(bitmap: Bitmap, threshold: Int = 200): Bitmap {
      val width = bitmap.width
      val height = bitmap.height
      val pixels = IntArray(width * height)
      bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
      for (i in pixels.indices) {
          val pixel = pixels[i]
          val alpha = Color.alpha(pixel)
          // Rec. 601 luma; transparent pixels are paper
          val luma = (Color.red(pixel) * 299 + Color.green(pixel) * 587 + Color.blue(pixel) * 114) / 1000
          pixels[i] = if (alpha > 0 && luma < threshold) Color.BLACK else Color.WHITE
      }
      return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
  }

}
