#import "Xprinter2.h"

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


RCT_EXPORT_METHOD(connect:(NSString *)ipAddress
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    _connectionResolve = resolve;
    _connectionReject = reject;
    
    if (_wifiManager.isConnect) {
        [_wifiManager disconnect];
    }
    
    [_wifiManager connectWithHost:ipAddress port:9100];

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


@end
