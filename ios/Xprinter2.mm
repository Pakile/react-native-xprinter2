#import "Xprinter2.h"
#import "POSCommand.h"
#import "POSWIFIManager.h"
#import "POSBLEManager.h"
#import "TSCCommand.h"
#import "ZPLCommand.h"
#import "CPCLCommand.h"
#import "TSCWIFIManager.h"
#import "TSCBLEManager.h"
#import "LabelImageTranster.h"
#import <UIKit/UIKit.h>

@implementation Xprinter2 {
    POSWIFIManager *_wifiManager;
    POSBLEManager *_bleManager;
    TSCWIFIManager *_tscWifiManager;
    TSCBLEManager *_tscBleManager;
    BOOL _connectionResolveInvoked;
    RCTPromiseResolveBlock _connectionResolve;
    RCTPromiseRejectBlock _connectionReject;
    RCTPromiseResolveBlock _discoveryResolve;
    RCTPromiseRejectBlock _discoveryReject;
    NSInteger _currentConnectionType;
    NSMutableArray *_discoveredPrinters;
}

RCT_EXPORT_MODULE()

- (instancetype)init {
    self = [super init];
    if (self) {
        _wifiManager = [POSWIFIManager sharedInstance];
        _wifiManager.delegate = self;
        _bleManager = [POSBLEManager sharedInstance];
        _bleManager.delegate = self;
        _tscWifiManager = [TSCWIFIManager sharedInstance];
        _tscBleManager = [TSCBLEManager sharedInstance];
        _discoveredPrinters = [[NSMutableArray alloc] init];
        _currentConnectionType = -1;
    }
    return self;
}

- (NSDictionary *)constantsToExport {
    return @{@"CON_USB": @0, @"CON_WIFI": @1, @"CON_BLUETOOTH": @2};
}

#pragma mark - Private shared implementations

- (void)_discoveryImpl:(NSInteger)connType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    _discoveryResolve = resolve;
    _discoveryReject = reject;

    switch (connType) {
        case 0:
            reject(@"UNSUPPORTED", @"USB discovery is not supported on iOS", nil);
            break;
        case 1:
            [_wifiManager closeUdpSocket];
            if ([_wifiManager createUdpSocket]) {
                [_wifiManager sendFindCmd:^(PrinterProfile *printer) {
                    if (_discoveryResolve) {
                        _discoveryResolve(printer.getIPString);
                        _discoveryResolve = nil;
                        _discoveryReject = nil;
                    }
                }];
                dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                    if (_discoveryReject) {
                        _discoveryReject(@"TIMEOUT", @"Discovery timeout", nil);
                        _discoveryResolve = nil;
                        _discoveryReject = nil;
                    }
                });
            } else {
                reject(@"UDP_ERROR", @"Failed to create UDP socket", nil);
            }
            break;
        case 2:
            [_discoveredPrinters removeAllObjects];
            [_bleManager startScan];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                [_bleManager stopScan];
                if (_discoveryReject && _discoveredPrinters.count == 0) {
                    _discoveryReject(@"NO_DEVICES", @"No Bluetooth devices found", nil);
                    _discoveryResolve = nil;
                    _discoveryReject = nil;
                }
            });
            break;
        default:
            reject(@"INVALID_TYPE", @"Invalid connection type", nil);
            break;
    }
}

- (void)_connectImpl:(NSInteger)connType address:(NSString *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    _connectionResolve = resolve;
    _connectionReject = reject;
    _connectionResolveInvoked = NO;
    _currentConnectionType = connType;

    if (_wifiManager.isConnect) [_wifiManager disconnect];
    if (_bleManager.isConnecting) [_bleManager disconnectRootPeripheral];

    switch (connType) {
        case 0:
            reject(@"UNSUPPORTED", @"USB connection is not supported on iOS", nil);
            break;
        case 1:
            [_wifiManager connectWithHost:address port:9100];
            break;
        case 2:
            [self connectBluetooth:address];
            break;
        default:
            reject(@"INVALID_TYPE", @"Invalid connection type", nil);
            break;
    }
}

- (void)_printBitmapImpl:(NSString *)base64 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    UIImage *img = [self imageFromBase64String:base64];
    if (!img) {
        reject(@"IMAGE_ERROR", @"Failed to decode base64 image", nil);
        return;
    }
    NSMutableData *dataM = [NSMutableData dataWithData:[POSCommand initializePrinter]];
    [dataM appendData:[POSCommand selectAlignment:1]];
    [dataM appendData:[POSCommand printRasteBmpWithM:RasterNolmorWH andImage:img andType:Dithering]];
    [dataM appendData:[POSCommand printAndFeedForwardWhitN:6]];
    [dataM appendData:[POSCommand selectCutPageModelAndCutpage:1]];
    [self sendLabelData:dataM];
    resolve(nil);
}

- (void)_openCashBoxImpl:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSMutableData *dataM = [NSMutableData dataWithData:[POSCommand initializePrinter]];
    [dataM appendData:[POSCommand creatCashBoxContorPulseWithM:0 andT1:30 andT2:255]];
    [self sendLabelData:dataM];
    resolve(nil);
}

- (void)_printLabelImageImpl:(NSString *)base64 printType:(NSInteger)printType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    @try {
        UIImage *img = [self imageFromBase64String:base64];
        if (!img) {
            reject(@"IMAGE_ERROR", @"Failed to decode base64 image", nil);
            return;
        }
        PrintCommand command = (PrintCommand)printType;
        NSData *labelData = [LabelImageTranster dataWithImage:img printType:command];
        [self sendLabelData:[NSMutableData dataWithData:labelData]];
        resolve(@(YES));
    }
    @catch (NSException *exception) {
        reject(@"LABEL_IMAGE_ERROR", exception.reason, nil);
    }
}

#pragma mark - Exported methods (dual Old/New Arch)

#ifdef RCT_NEW_ARCH_ENABLED
- (void)discovery:(double)connType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self _discoveryImpl:(NSInteger)connType resolve:resolve reject:reject];
}
#else
RCT_EXPORT_METHOD(discovery:(nonnull NSNumber *)connType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self _discoveryImpl:[connType integerValue] resolve:resolve reject:reject];
}
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (void)connect:(double)connType address:(NSString *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self _connectImpl:(NSInteger)connType address:address resolve:resolve reject:reject];
}
#else
RCT_EXPORT_METHOD(connect:(nonnull NSNumber *)connType address:(NSString *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self _connectImpl:[connType integerValue] address:address resolve:resolve reject:reject];
}
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (void)printBitmap:(NSString *)base64 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self _printBitmapImpl:base64 resolve:resolve reject:reject];
}
#else
RCT_EXPORT_METHOD(printBitmap:(NSString *)base64 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self _printBitmapImpl:base64 resolve:resolve reject:reject];
}
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (void)openCashBox:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self _openCashBoxImpl:resolve reject:reject];
}
#else
RCT_EXPORT_METHOD(openCashBox:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self _openCashBoxImpl:resolve reject:reject];
}
#endif

#ifdef RCT_NEW_ARCH_ENABLED
- (void)printLabelImage:(NSString *)base64 printType:(double)printType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [self _printLabelImageImpl:base64 printType:(NSInteger)printType resolve:resolve reject:reject];
}
#else
RCT_EXPORT_METHOD(printLabelImage:(NSString *)base64 printType:(NSInteger)printType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [self _printLabelImageImpl:base64 printType:printType resolve:resolve reject:reject];
}
#endif

// Methods whose signatures are identical in Old and New Arch (NSDictionary / void params)

RCT_EXPORT_METHOD(disconnect:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    BOOL disconnected = NO;
    switch (_currentConnectionType) {
        case 1:
            if ([_wifiManager printerIsConnect]) { [_wifiManager disconnect]; disconnected = YES; }
            if (_tscWifiManager.isConnect) { [_tscWifiManager disconnect]; disconnected = YES; }
            break;
        case 2:
            if ([_bleManager printerIsConnect]) { [_bleManager disconnectRootPeripheral]; disconnected = YES; }
            if (_tscBleManager.isConnecting) { [_tscBleManager disconnectRootPeripheral]; disconnected = YES; }
            break;
        default:
            reject(@"NOT_CONNECTED", @"No active connection to disconnect", nil);
            return;
    }
    if (disconnected) {
        _currentConnectionType = -1;
        resolve(@(YES));
    } else {
        reject(@"NOT_CONNECTED", @"No active connection to disconnect", nil);
    }
}

RCT_EXPORT_METHOD(printerStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    void (^statusHandler)(NSData *) = ^(NSData *status) {
        if (status.length == 0) { resolve(@(-1)); }
        else if (status.length == 1) {
            const Byte *byte = (Byte *)[status bytes];
            resolve(@((unsigned)byte[0]));
        } else { resolve(@(-2)); }
    };

    if (_currentConnectionType == 1) {
        if ([_wifiManager printerIsConnect]) [_wifiManager printerStatus:statusHandler];
        else if (_tscWifiManager.isConnect) [_tscWifiManager printerStatus:statusHandler];
        else reject(@"NOT_CONNECTED", @"WiFi printer not connected", nil);
    } else if (_currentConnectionType == 2) {
        if ([_bleManager printerIsConnect]) [_bleManager printerStatus:statusHandler];
        else if (_tscBleManager.isConnecting) [_tscBleManager printerStatus:statusHandler];
        else reject(@"NOT_CONNECTED", @"Bluetooth printer not connected", nil);
    } else {
        reject(@"NOT_CONNECTED", @"Printer not connected", nil);
    }
}

RCT_EXPORT_METHOD(isConnect:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    BOOL connected = NO;
    switch (_currentConnectionType) {
        case 1: connected = [_wifiManager printerIsConnect] || _tscWifiManager.isConnect; break;
        case 2: connected = [_bleManager printerIsConnect] || _tscBleManager.isConnecting; break;
        default: connected = NO; break;
    }
    resolve(@(connected));
}

RCT_EXPORT_METHOD(setIp:(NSString *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    if (_currentConnectionType == 1 && [_wifiManager printerIsConnect]) {
        NSArray *components = [address componentsSeparatedByString:@"."];
        if (components.count == 4) {
            [_wifiManager setIPConfigWithIP:address Mask:@"255.255.255.0" Gateway:@"192.168.1.1" DHCP:NO];
            resolve(@(YES));
        } else {
            reject(@"INVALID_IP", @"Invalid IP address format", nil);
        }
    } else {
        reject(@"NOT_CONNECTED", @"WiFi printer not connected", nil);
    }
}

RCT_EXPORT_METHOD(printTSCLabel:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSMutableData *dataM = [NSMutableData data];
        double width = [options[@"width"] doubleValue] ?: 40.0;
        double height = [options[@"height"] doubleValue] ?: 30.0;
        double gap = [options[@"gap"] doubleValue] ?: 2.0;
        int density = [options[@"density"] intValue] ?: 8;
        double speed = [options[@"speed"] doubleValue] ?: 4.0;

        [dataM appendData:[TSCCommand sizeBymmWithWidth:width andHeight:height]];
        [dataM appendData:[TSCCommand gapBymmWithWidth:gap andHeight:0]];
        [dataM appendData:[TSCCommand density:density]];
        [dataM appendData:[TSCCommand speed:speed]];
        [dataM appendData:[TSCCommand direction:0]];
        [dataM appendData:[TSCCommand cls]];

        for (NSDictionary *el in options[@"texts"] ?: @[]) {
            [dataM appendData:[TSCCommand textWithX:[el[@"x"] intValue] andY:[el[@"y"] intValue]
                andFont:el[@"font"] ?: @"3" andRotation:[el[@"rotation"] intValue]
                andX_mul:[el[@"xMul"] intValue] ?: 1 andY_mul:[el[@"yMul"] intValue] ?: 1
                andContent:el[@"content"] ?: @"" usStrEnCoding:NSUTF8StringEncoding]];
        }
        for (NSDictionary *el in options[@"barcodes"] ?: @[]) {
            [dataM appendData:[TSCCommand barcodeWithX:[el[@"x"] intValue] andY:[el[@"y"] intValue]
                andCodeType:el[@"codeType"] ?: @"128" andHeight:[el[@"height"] intValue] ?: 100
                andHunabReadable:[el[@"readable"] intValue] ?: 1 andRotation:[el[@"rotation"] intValue]
                andNarrow:[el[@"narrow"] intValue] ?: 2 andWide:[el[@"wide"] intValue] ?: 2
                andContent:el[@"content"] ?: @"" usStrEnCoding:NSUTF8StringEncoding]];
        }
        for (NSDictionary *el in options[@"qrcodes"] ?: @[]) {
            [dataM appendData:[TSCCommand qrCodeWithX:[el[@"x"] intValue] andY:[el[@"y"] intValue]
                andEccLevel:el[@"eccLevel"] ?: @"M" andCellWidth:[el[@"cellWidth"] intValue] ?: 4
                andMode:el[@"mode"] ?: @"A" andRotation:[el[@"rotation"] intValue]
                andContent:el[@"content"] ?: @"" usStrEnCoding:NSUTF8StringEncoding]];
        }
        [dataM appendData:[TSCCommand print:[options[@"copies"] intValue] ?: 1]];
        [self sendLabelData:dataM];
        resolve(@(YES));
    } @catch (NSException *e) {
        reject(@"TSC_PRINT_ERROR", e.reason, nil);
    }
}

RCT_EXPORT_METHOD(printZPLLabel:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSMutableData *dataM = [NSMutableData data];
        [dataM appendData:[ZPLCommand XA]];
        [dataM appendData:[ZPLCommand setLabelWidth:[options[@"width"] intValue] ?: 400]];
        [dataM appendData:[ZPLCommand setLabelHeight:[options[@"height"] intValue] ?: 300]];
        [dataM appendData:[ZPLCommand setDensity:[options[@"density"] intValue] ?: 8]];
        [dataM appendData:[ZPLCommand setSpeed:[options[@"speed"] intValue] ?: 4]];
        [dataM appendData:[ZPLCommand setPageCount:[options[@"copies"] intValue] ?: 1]];

        for (NSDictionary *el in options[@"texts"] ?: @[]) {
            [dataM appendData:[ZPLCommand drawTextWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                fontName:(ZPLFont)([el[@"font"] intValue] ?: FNT_26_13) rotation:(ZPLRotation)([el[@"rotation"] intValue] ?: ROTATION_0)
                hRatio:[el[@"hRatio"] intValue] ?: 1 wRatio:[el[@"wRatio"] intValue] ?: 1
                content:el[@"content"] ?: @""]];
        }
        for (NSDictionary *el in options[@"barcodes"] ?: @[]) {
            [dataM appendData:[ZPLCommand drawBarcodeWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                codeType:(ZPLBarCode)([el[@"codeType"] intValue] ?: CODE_TYPE_128)
                height:[el[@"height"] intValue] ?: 100 text:el[@"content"] ?: @""]];
        }
        for (NSDictionary *el in options[@"qrcodes"] ?: @[]) {
            [dataM appendData:[ZPLCommand drawQRCodeWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                factor:[el[@"factor"] intValue] ?: 3 text:el[@"content"] ?: @""]];
        }
        [dataM appendData:[ZPLCommand XZ]];
        [self sendLabelData:dataM];
        resolve(@(YES));
    } @catch (NSException *e) {
        reject(@"ZPL_PRINT_ERROR", e.reason, nil);
    }
}

RCT_EXPORT_METHOD(printCPCLLabel:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSMutableData *dataM = [NSMutableData data];
        [dataM appendData:[CPCLCommand initLabelWithHeight:[options[@"height"] intValue] ?: 400
                                                     count:[options[@"copies"] intValue] ?: 1]];
        for (NSDictionary *el in options[@"texts"] ?: @[]) {
            [dataM appendData:[CPCLCommand drawTextWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                rotation:(CPCLRotation)([el[@"rotation"] intValue] ?: ROTA_0)
                font:(CPCLFont)([el[@"font"] intValue] ?: FNT_3) content:el[@"content"] ?: @""]];
        }
        for (NSDictionary *el in options[@"barcodes"] ?: @[]) {
            [dataM appendData:[CPCLCommand drawBarcodeWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                codeType:(CPCLBarCode)([el[@"codeType"] intValue] ?: BC_128)
                height:[el[@"height"] intValue] ?: 100 content:el[@"content"] ?: @""]];
        }
        for (NSDictionary *el in options[@"qrcodes"] ?: @[]) {
            [dataM appendData:[CPCLCommand drawQRCodeWithx:[el[@"x"] intValue] y:[el[@"y"] intValue]
                content:el[@"content"] ?: @""]];
        }
        [dataM appendData:[CPCLCommand print]];
        [self sendLabelData:dataM];
        resolve(@(YES));
    } @catch (NSException *e) {
        reject(@"CPCL_PRINT_ERROR", e.reason, nil);
    }
}

#pragma mark - Helpers

- (UIImage *)imageFromBase64String:(NSString *)base64String {
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:base64String options:NSDataBase64DecodingIgnoreUnknownCharacters];
    return [UIImage imageWithData:imageData];
}

- (void)sendLabelData:(NSMutableData *)data {
    if (_currentConnectionType == 1) {
        if ([_wifiManager printerIsConnect]) [_wifiManager writeCommandWithData:data];
        else if (_tscWifiManager.isConnect) [_tscWifiManager writeCommandWithData:data];
    } else if (_currentConnectionType == 2) {
        if ([_bleManager printerIsConnect]) [_bleManager writeCommandWithData:data];
        else if (_tscBleManager.isConnecting) [_tscBleManager writeCommandWithData:data];
    }
}

- (void)connectBluetooth:(NSString *)address {
    CBPeripheral *target = nil;
    for (CBPeripheral *p in _discoveredPrinters) {
        if ([p.name isEqualToString:address] || [p.identifier.UUIDString isEqualToString:address]) {
            target = p; break;
        }
    }
    if (target) {
        [_bleManager connectDevice:target];
    } else if (_connectionReject && !_connectionResolveInvoked) {
        _connectionReject(@"DEVICE_NOT_FOUND", @"Bluetooth device not found", nil);
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)resetConnectionFlags {
    _connectionResolveInvoked = NO;
    _connectionResolve = nil;
    _connectionReject = nil;
}

#pragma mark - WiFi delegate

- (void)POSwifiConnectedToHost:(NSString *)host port:(UInt16)port {
    if (_connectionResolve && !_connectionResolveInvoked) {
        _connectionResolve(@(YES));
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSwifiDisconnectWithError:(NSError *)error {
    if (error) {
        if (_connectionReject && !_connectionResolveInvoked) {
            _connectionReject(@"CONNECTION_ERROR", error.localizedDescription, error);
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

#pragma mark - Bluetooth delegate

- (void)POSbleConnectPeripheral:(CBPeripheral *)peripheral {
    if (_connectionResolve && !_connectionResolveInvoked) {
        _connectionResolve(@(YES));
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSbleFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
    if (_connectionReject && !_connectionResolveInvoked) {
        _connectionReject(@"BLE_CONNECTION_FAILED", error.localizedDescription, error);
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSbleDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
    if (error && _connectionReject && !_connectionResolveInvoked) {
        _connectionReject(@"BLE_DISCONNECTED", error.localizedDescription, error);
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSbleUpdatePeripheralList:(NSArray *)peripherals RSSIList:(NSArray *)rssiList {
    [_discoveredPrinters removeAllObjects];
    [_discoveredPrinters addObjectsFromArray:peripherals];
    if (_discoveryResolve && peripherals.count > 0) {
        CBPeripheral *first = [peripherals firstObject];
        _discoveryResolve(first.name ?: first.identifier.UUIDString);
        _discoveryResolve = nil;
        _discoveryReject = nil;
    }
}

#pragma mark - TurboModule (New Architecture)

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeXprinter2SpecJSI>(params);
}
#endif

@end
