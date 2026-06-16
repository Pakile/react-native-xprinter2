package com.xprinter2

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class Xprinter2Package : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == Xprinter2Module.NAME) Xprinter2Module(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      Xprinter2Module.NAME to ReactModuleInfo(
        Xprinter2Module.NAME,
        Xprinter2Module.NAME,
        false,
        false,
        false,
        BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      )
    )
  }
}
