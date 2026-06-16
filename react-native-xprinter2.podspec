require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-xprinter2"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/Pakile/react-native-xprinter2.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"

  # Vendor the Xprinter static SDK
  s.vendored_libraries = "ios/PrinterSDK/libPrinterSDK.a"
  s.preserve_paths     = "ios/PrinterSDK/**"

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => '"$(PODS_TARGET_SRCROOT)/ios/PrinterSDK/Headers"',
    "LIBRARY_SEARCH_PATHS" => '"$(PODS_TARGET_SRCROOT)/ios/PrinterSDK"'
  }

  s.frameworks = "CoreBluetooth", "ExternalAccessory"

  # install_modules_dependencies handles New Architecture dependencies (RN >= 0.71)
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
