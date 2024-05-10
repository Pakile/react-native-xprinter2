#import "Xprinter2.h"
#import "POSCommand.h"

@implementation Xprinter2{
    POSWIFIManager *_wifiManager;
    BOOL _connectionResolveInvoked;
    RCTPromiseResolveBlock _connectionResolve;
    RCTPromiseRejectBlock _connectionReject;
}

RCT_EXPORT_MODULE()

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize wifiManager and set its delegate to self
        _wifiManager = [POSWIFIManager sharedInstance];
        _wifiManager.delegate = self;
    }
    return self;
}


RCT_EXPORT_METHOD(connect:(NSNumber *)connType address:(NSString *)address
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    _connectionResolve = resolve;
    _connectionReject = reject;

    if (_wifiManager.isConnect) {
        [_wifiManager disconnect];
    }

    [_wifiManager connectWithHost:address port:9100];

}

- (void)resetConnectionFlags {
    _connectionResolveInvoked = NO;
    _connectionResolve = nil;
    _connectionReject = nil;
}


//connected success
- (void)POSwifiConnectedToHost:(NSString *)host port:(UInt16)port {
    NSLog(@"connected success");
    if (_connectionResolve && !_connectionResolveInvoked) {
        _connectionResolve(@(YES));
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

//disconnected
- (void)POSwifiDisconnectWithError:(NSError *)error {
    NSLog(@"disconnected");
    if (error) {
        if (_connectionReject && !_connectionResolveInvoked) {
            _connectionReject(@"0", @"error", error);
            _connectionResolveInvoked = YES;
            [self resetConnectionFlags];
        }
    } else {
        if (_connectionResolve && !_connectionResolveInvoked) {
            _connectionResolve(@(NO));
            _connectionResolveInvoked = YES;
            [self resetConnectionFlags];
        }
    }
}


// Example method
// See // https://reactnative.dev/docs/native-modules-ios
RCT_EXPORT_METHOD(multiply:(double)a
                  b:(double)b
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSNumber *result = @(a * b);

    resolve(result);
}

RCT_EXPORT_METHOD(discovery:(nonnull NSNumber *)connType
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [_wifiManager closeUdpSocket];
    if ([_wifiManager createUdpSocket]) {
        [_wifiManager sendFindCmd:^(PrinterProfile *printer) {
            NSLog(@"printer %@", printer);
        }];
    }
    resolve(@"NO");
}

RCT_EXPORT_METHOD(printerStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    if ([_wifiManager printerIsConnect]) {
        [_wifiManager printerStatus:^(NSData *responseData) {
            if (responseData.length == 0) return;
            if (responseData.length == 1) {
                const Byte *byte = (Byte *)[responseData bytes];
                unsigned status = byte[0];
                
                if (status == 0x12) {
                    resolve(@"Ready");
                } else if (status == 0x16) {
                    resolve(@"Cover opened");
                } else if (status == 0x32) {
                    resolve(@"Paper end");
                } else if (status == 0x36) {
                    resolve(@"Cover opened & Paper end");
                } else {
                    resolve(@"error");
                }
            }
        }];
    }
    resolve(@"NO");
}

RCT_EXPORT_METHOD(isConnect:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    
    resolve(@"NO");
}

RCT_EXPORT_METHOD(setIp:(NSString *)adress 
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    resolve(@"NO");
}

RCT_EXPORT_METHOD(printBitmap:(NSString *)base64)
{
   
}

RCT_EXPORT_METHOD(openCashBox)
{
    NSMutableData *dataM = [NSMutableData dataWithData:[POSCommand initializePrinter]];
    [dataM appendData:[POSCommand creatCashBoxContorPulseWithM:0 andT1:30 andT2:255]];
    [_wifiManager writeCommandWithData:dataM];
}


@end
