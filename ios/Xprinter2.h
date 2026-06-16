#ifdef RCT_NEW_ARCH_ENABLED
#import <RNXprinter2Spec/RNXprinter2Spec.h>
#import "POSWIFIManager.h"
#import "POSBLEManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface Xprinter2 : NSObject <NativeXprinter2Spec, POSWIFIManagerDelegate, POSBLEManagerDelegate>

@end

NS_ASSUME_NONNULL_END

#else

#import <React/RCTBridgeModule.h>
#import "POSWIFIManager.h"
#import "POSBLEManager.h"

@interface Xprinter2 : NSObject <RCTBridgeModule, POSWIFIManagerDelegate, POSBLEManagerDelegate>

@end

#endif
