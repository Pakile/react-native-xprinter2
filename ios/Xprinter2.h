
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNXprinter2Spec.h"

@interface Xprinter2 : NSObject <NativeXprinter2Spec>
#else
#import <React/RCTBridgeModule.h>

@interface Xprinter2 : NSObject <RCTBridgeModule>
#endif

@end
