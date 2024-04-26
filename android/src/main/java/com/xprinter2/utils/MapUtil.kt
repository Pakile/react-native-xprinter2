package com.xprinter2.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import android.util.*

class MapUtil {
  @Throws(JSONException::class)
  fun toJSONObject(readableMap: ReadableMap): JSONObject {
    val jsonObject = JSONObject()
    val iterator = readableMap.keySetIterator()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      val type = readableMap.getType(key)

      when (type) {
        ReadableType.Null -> jsonObject.put(key, JSONObject.NULL)
        ReadableType.Boolean -> jsonObject.put(key, readableMap.getBoolean(key))
        ReadableType.Number -> jsonObject.put(key, readableMap.getDouble(key))
        ReadableType.String -> jsonObject.put(key, readableMap.getString(key))
        ReadableType.Map -> jsonObject.put(key, toJSONObject(readableMap.getMap(key)!!))
        ReadableType.Array -> jsonObject.put(key, toArray(readableMap.getArray(key)!!))
        else -> throw IllegalArgumentException("Unsupported type: $type")
      }
    }

    return jsonObject
  }

  @Throws(JSONException::class)
  fun toMap(jsonObject: JSONObject): Map<String, Any> {
    val map = HashMap<String, Any>()
    val iterator = jsonObject.keys()

    while (iterator.hasNext()) {
      val key = iterator.next()
      var value = jsonObject.get(key)

      if (value is JSONObject) {
        value = toMap(value)
      }
      if (value is JSONArray) {
        value = toArray(value)
      }

      map[key] = value
    }

    return map
  }

  fun toMap(readableMap: ReadableMap): Map<String, Any?> {
    val map = HashMap<String, Any?>()
    val iterator = readableMap.keySetIterator()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      val type = readableMap.getType(key)

      when (type) {
        ReadableType.Null -> map[key] = null
        ReadableType.Boolean -> map[key] = readableMap.getBoolean(key)
        ReadableType.Number -> map[key] = readableMap.getDouble(key)
        ReadableType.String -> map[key] = readableMap.getString(key)
        ReadableType.Map -> map[key] = toMap(readableMap.getMap(key)!!)
        ReadableType.Array -> map[key] = toArray(readableMap.getArray(key)!!)
        else -> throw IllegalArgumentException("Unsupported type: $type")
      }
    }

    return map
  }
  fun toWritableArray(array: Array<*>): WritableArray {
      val writableArray = Arguments.createArray()

      for (value in array) {
        when (value) {
          null -> writableArray.pushNull()
          is Boolean -> writableArray.pushBoolean(value)
          is Double -> writableArray.pushDouble(value)
          is Int -> writableArray.pushInt(value)
          is String -> writableArray.pushString(value)
          is Map<*, *> -> writableArray.pushMap(toWritableMap(value as Map<String, Any>))
          is Array<*> -> writableArray.pushArray(toWritableArray(value))
          else -> throw IllegalArgumentException("Unsupported type: ${value?.javaClass}")
        }
      }

      return writableArray
    }

  fun toWritableMap(map: Map<String, Any?>): WritableMap {
    val writableMap = Arguments.createMap()

    for ((key, value) in map) {
      when (value) {
        null -> writableMap.putNull(key)
        is Boolean -> writableMap.putBoolean(key, value)
        is Double -> writableMap.putDouble(key, value)
        is Int -> writableMap.putInt(key, value)
        is String -> writableMap.putString(key, value)
        is Map<*, *> -> writableMap.putMap(key, toWritableMap(value as Map<String, Any>))
        is Array<*> -> writableMap.putArray(key, toWritableArray(value))
        else -> throw IllegalArgumentException("Unsupported type for key $key: ${value?.javaClass}")
      }
    }

    return writableMap
  }



  @Throws(JSONException::class)
  fun toJSONArray(readableArray: ReadableArray): JSONArray {
    val jsonArray = JSONArray()

    for (i in 0 until readableArray.size()) {
      val type = readableArray.getType(i)

      when (type) {
        ReadableType.Null -> jsonArray.put(i, JSONObject.NULL)
        ReadableType.Boolean -> jsonArray.put(i, readableArray.getBoolean(i))
        ReadableType.Number -> jsonArray.put(i, readableArray.getDouble(i))
        ReadableType.String -> jsonArray.put(i, readableArray.getString(i))
        ReadableType.Map -> jsonArray.put(i, toJSONObject(readableArray.getMap(i)!!))
        ReadableType.Array -> jsonArray.put(i, toJSONArray(readableArray.getArray(i)!!))
        else -> throw IllegalArgumentException("Unsupported type: $type")
      }
    }

    return jsonArray
  }

  @Throws(JSONException::class)
  fun toArray(jsonArray: JSONArray): Array<Any?> {
    val array = arrayOfNulls<Any>(jsonArray.length())

    for (i in 0 until jsonArray.length()) {
      var value = jsonArray.get(i)

      if (value is JSONObject) {
        value = toMap(value)
      }
      if (value is JSONArray) {
        value = toArray(value)
      }

      array[i] = value
    }

    return array
  }

  fun toArray(readableArray: ReadableArray): Array<Any?> {
    val array = arrayOfNulls<Any>(readableArray.size())

    for (i in 0 until readableArray.size()) {
      val type = readableArray.getType(i)

      when (type) {
        ReadableType.Null -> array[i] = null
        ReadableType.Boolean -> array[i] = readableArray.getBoolean(i)
        ReadableType.Number -> array[i] = readableArray.getDouble(i)
        ReadableType.String -> array[i] = readableArray.getString(i)
        ReadableType.Map -> array[i] = toMap(readableArray.getMap(i)!!)
        ReadableType.Array -> array[i] = toArray(readableArray.getArray(i)!!)
        else -> throw IllegalArgumentException("Unsupported type: $type")
      }
    }

    return array
  }

  fun toWritableArrayAny(array: Array<Any?>): WritableArray {
    val writableArray = Arguments.createArray()

    for (i in array.indices) {
      val value = array[i]

      when (value) {
        null -> writableArray.pushNull()
        is Boolean -> writableArray.pushBoolean(value)
        is Double -> writableArray.pushDouble(value)
        is Int -> writableArray.pushInt(value)
        is String -> writableArray.pushString(value)
        is Map<*, *> -> writableArray.pushMap(toWritableMap(value as Map<String, Any>))
        is Array<*> -> writableArray.pushArray(toWritableArray(value as Array<Any?>))
        else -> throw IllegalArgumentException("Unsupported type: ${value.javaClass}")
      }
    }
    return writableArray
  }
}
