#import <React/RCTBridgeModule.h>
#import "POSWIFIManager.h"
#import "POSBLEManager.h"

@interface Xprinter2 : NSObject <RCTBridgeModule, POSWIFIManagerDelegate, POSBLEManagerDelegate>

@end
