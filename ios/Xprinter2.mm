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

@implementation Xprinter2{
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
        // Initialize managers
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

// Connection type constants
- (NSDictionary *)constantsToExport {
    return @{
        @"CON_USB": @0,
        @"CON_WIFI": @1,
        @"CON_BLUETOOTH": @2
    };
}

RCT_EXPORT_METHOD(connect:(nonnull NSNumber *)connType address:(NSString *)address
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    _connectionResolve = resolve;
    _connectionReject = reject;
    _currentConnectionType = [connType integerValue];

    // Disconnect existing connections
    if (_wifiManager.isConnect) {
        [_wifiManager disconnect];
    }
    if (_bleManager.isConnecting) {
        [_bleManager disconnectRootPeripheral];
    }

    switch ([connType integerValue]) {
        case 0: { // USB - Not supported on iOS
            reject(@"UNSUPPORTED", @"USB connection is not supported on iOS", nil);
            break;
        }
        case 1: { // WiFi
            [_wifiManager connectWithHost:address port:9100];
            break;
        }
        case 2: { // Bluetooth
            [self connectBluetooth:address];
            break;
        }
        default: {
            reject(@"INVALID_TYPE", @"Invalid connection type", nil);
            break;
        }
    }
}

- (void)connectBluetooth:(NSString *)address {
    // Find peripheral by name or identifier
    CBPeripheral *targetPeripheral = nil;
    for (CBPeripheral *peripheral in _discoveredPrinters) {
        if ([peripheral.name isEqualToString:address] || 
            [peripheral.identifier.UUIDString isEqualToString:address]) {
            targetPeripheral = peripheral;
            break;
        }
    }
    
    if (targetPeripheral) {
        [_bleManager connectDevice:targetPeripheral];
    } else {
        if (_connectionReject && !_connectionResolveInvoked) {
            _connectionReject(@"DEVICE_NOT_FOUND", @"Bluetooth device not found", nil);
            _connectionResolveInvoked = YES;
            [self resetConnectionFlags];
        }
    }
}

- (void)resetConnectionFlags {
    _connectionResolveInvoked = NO;
    _connectionResolve = nil;
    _connectionReject = nil;
}

// WiFi delegate methods
- (void)POSwifiConnectedToHost:(NSString *)host port:(UInt16)port {
    NSLog(@"WiFi connected success");
    if (_connectionResolve && !_connectionResolveInvoked) {
        _connectionResolve(@(YES));
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSwifiDisconnectWithError:(NSError *)error {
    NSLog(@"WiFi disconnected");
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

// Bluetooth delegate methods
- (void)POSbleConnectPeripheral:(CBPeripheral *)peripheral {
    NSLog(@"Bluetooth connected success");
    if (_connectionResolve && !_connectionResolveInvoked) {
        _connectionResolve(@(YES));
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSbleFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
    NSLog(@"Bluetooth connection failed");
    if (_connectionReject && !_connectionResolveInvoked) {
        _connectionReject(@"BLE_CONNECTION_FAILED", error.localizedDescription, error);
        _connectionResolveInvoked = YES;
        [self resetConnectionFlags];
    }
}

- (void)POSbleDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
    NSLog(@"Bluetooth disconnected");
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
        CBPeripheral *firstPeripheral = [peripherals firstObject];
        NSString *result = firstPeripheral.name ?: firstPeripheral.identifier.UUIDString;
        _discoveryResolve(result);
        _discoveryResolve = nil;
        _discoveryReject = nil;
    }
}

// Example method (should be removed in production)
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
    _discoveryResolve = resolve;
    _discoveryReject = reject;
    
    switch ([connType integerValue]) {
        case 0: { // USB - Not supported on iOS
            reject(@"UNSUPPORTED", @"USB discovery is not supported on iOS", nil);
            break;
        }
        case 1: { // WiFi
            [_wifiManager closeUdpSocket];
            if ([_wifiManager createUdpSocket]) {
                [_wifiManager sendFindCmd:^(PrinterProfile *printer) {
                    NSLog(@"Found WiFi printer: %@", printer.getIPString);
                    if (_discoveryResolve) {
                        _discoveryResolve(printer.getIPString);
                        _discoveryResolve = nil;
                        _discoveryReject = nil;
                    }
                }];
                
                // Set timeout for discovery
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
        }
        case 2: { // Bluetooth
            [_discoveredPrinters removeAllObjects];
            [_bleManager startScan];
            
            // Set timeout for Bluetooth discovery
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                [_bleManager stopScan];
                if (_discoveryReject && _discoveredPrinters.count == 0) {
                    _discoveryReject(@"NO_DEVICES", @"No Bluetooth devices found", nil);
                    _discoveryResolve = nil;
                    _discoveryReject = nil;
                }
            });
            break;
        }
        default: {
            reject(@"INVALID_TYPE", @"Invalid connection type", nil);
            break;
        }
    }
}

RCT_EXPORT_METHOD(printerStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    if (_currentConnectionType == 1) {
        // WiFi connection
        if ([_wifiManager printerIsConnect]) {
            [_wifiManager printerStatus:^(NSData *status) {
                if (status.length == 0) {
                    resolve(@(-1)); // No response
                } else if (status.length == 1) {
                    const Byte *byte = (Byte *)[status bytes];
                    unsigned statusCode = byte[0];
                    resolve(@(statusCode));
                } else {
                    resolve(@(-2)); // Invalid response
                }
            }];
        } else if (_tscWifiManager.isConnect) {
            [_tscWifiManager printerStatus:^(NSData *status) {
                if (status.length == 0) {
                    resolve(@(-1)); // No response
                } else if (status.length == 1) {
                    const Byte *byte = (Byte *)[status bytes];
                    unsigned statusCode = byte[0];
                    resolve(@(statusCode));
                } else {
                    resolve(@(-2)); // Invalid response
                }
            }];
        } else {
            reject(@"NOT_CONNECTED", @"WiFi printer not connected", nil);
        }
    } else if (_currentConnectionType == 2) {
        // Bluetooth connection
        if ([_bleManager printerIsConnect]) {
            [_bleManager printerStatus:^(NSData *status) {
                if (status.length == 0) {
                    resolve(@(-1)); // No response
                } else if (status.length == 1) {
                    const Byte *byte = (Byte *)[status bytes];
                    unsigned statusCode = byte[0];
                    resolve(@(statusCode));
                } else {
                    resolve(@(-2)); // Invalid response
                }
            }];
        } else if (_tscBleManager.isConnecting) {
            [_tscBleManager printerStatus:^(NSData *status) {
                if (status.length == 0) {
                    resolve(@(-1)); // No response
                } else if (status.length == 1) {
                    const Byte *byte = (Byte *)[status bytes];
                    unsigned statusCode = byte[0];
                    resolve(@(statusCode));
                } else {
                    resolve(@(-2)); // Invalid response
                }
            }];
        } else {
            reject(@"NOT_CONNECTED", @"Bluetooth printer not connected", nil);
        }
    } else {
        reject(@"NOT_CONNECTED", @"Printer not connected", nil);
    }
}

RCT_EXPORT_METHOD(isConnect:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    BOOL connected = NO;
    
    switch (_currentConnectionType) {
        case 1: { // WiFi
            connected = [_wifiManager printerIsConnect] || _tscWifiManager.isConnect;
            break;
        }
        case 2: { // Bluetooth
            connected = [_bleManager printerIsConnect] || _tscBleManager.isConnecting;
            break;
        }
        default: {
            connected = NO;
            break;
        }
    }
    
    resolve(@(connected));
}

RCT_EXPORT_METHOD(setIp:(NSString *)address
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    if (_currentConnectionType == 1) {
        // WiFi connection
        if ([_wifiManager printerIsConnect]) {
            // Parse IP address
            NSArray *components = [address componentsSeparatedByString:@"."];
            if (components.count == 4) {
                // Set IP configuration (this is a simplified implementation)
                [_wifiManager setIPConfigWithIP:address Mask:@"255.255.255.0" Gateway:@"192.168.1.1" DHCP:NO];
                resolve(@(YES));
            } else {
                reject(@"INVALID_IP", @"Invalid IP address format", nil);
            }
        } else {
            reject(@"NOT_CONNECTED", @"WiFi printer not connected", nil);
        }
    } else {
        reject(@"NOT_SUPPORTED", @"IP setting only supported for WiFi connections", nil);
    }
}

- (UIImage *)imageFromBase64String:(NSString *)base64String {
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:base64String options:NSDataBase64DecodingIgnoreUnknownCharacters];
    UIImage *image = [UIImage imageWithData:imageData];
    return image;
}

RCT_EXPORT_METHOD(printBitmap:(NSString *)base64)
{
    UIImage *img = [self imageFromBase64String:base64];
    if (!img) {
        NSLog(@"Failed to decode base64 image");
        return;
    }

    NSMutableData *dataM = [NSMutableData dataWithData:[POSCommand initializePrinter]];
    [dataM appendData:[POSCommand selectAlignment:1]]; // Center alignment
    [dataM appendData:[POSCommand printRasteBmpWithM:RasterNolmorWH andImage:img andType:Dithering]];
    [dataM appendData:[POSCommand printAndFeedForwardWhitN:6]];
    [dataM appendData:[POSCommand selectCutPageModelAndCutpage:1]];
    
    [self sendLabelData:dataM];
}

RCT_EXPORT_METHOD(openCashBox)
{
    NSMutableData *dataM = [NSMutableData dataWithData:[POSCommand initializePrinter]];
    [dataM appendData:[POSCommand creatCashBoxContorPulseWithM:0 andT1:30 andT2:255]];
    
    [self sendLabelData:dataM];
}

// MARK: - Label Printing Methods

RCT_EXPORT_METHOD(printTSCLabel:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSMutableData *dataM = [NSMutableData data];
        
        // Basic setup
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
        
        // Add text elements
        NSArray *textElements = options[@"texts"];
        if (textElements) {
            for (NSDictionary *textElement in textElements) {
                int x = [textElement[@"x"] intValue];
                int y = [textElement[@"y"] intValue];
                NSString *font = textElement[@"font"] ?: @"3";
                int rotation = [textElement[@"rotation"] intValue];
                int xMul = [textElement[@"xMul"] intValue] ?: 1;
                int yMul = [textElement[@"yMul"] intValue] ?: 1;
                NSString *content = textElement[@"content"] ?: @"";
                
                [dataM appendData:[TSCCommand textWithX:x andY:y andFont:font andRotation:rotation andX_mul:xMul andY_mul:yMul andContent:content usStrEnCoding:NSUTF8StringEncoding]];
            }
        }
        
        // Add barcode elements
        NSArray *barcodeElements = options[@"barcodes"];
        if (barcodeElements) {
            for (NSDictionary *barcodeElement in barcodeElements) {
                int x = [barcodeElement[@"x"] intValue];
                int y = [barcodeElement[@"y"] intValue];
                NSString *codeType = barcodeElement[@"codeType"] ?: @"128";
                int height = [barcodeElement[@"height"] intValue] ?: 100;
                int readable = [barcodeElement[@"readable"] intValue] ?: 1;
                int rotation = [barcodeElement[@"rotation"] intValue];
                int narrow = [barcodeElement[@"narrow"] intValue] ?: 2;
                int wide = [barcodeElement[@"wide"] intValue] ?: 2;
                NSString *content = barcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[TSCCommand barcodeWithX:x andY:y andCodeType:codeType andHeight:height andHunabReadable:readable andRotation:rotation andNarrow:narrow andWide:wide andContent:content usStrEnCoding:NSUTF8StringEncoding]];
            }
        }
        
        // Add QR code elements
        NSArray *qrcodeElements = options[@"qrcodes"];
        if (qrcodeElements) {
            for (NSDictionary *qrcodeElement in qrcodeElements) {
                int x = [qrcodeElement[@"x"] intValue];
                int y = [qrcodeElement[@"y"] intValue];
                NSString *eccLevel = qrcodeElement[@"eccLevel"] ?: @"M";
                int cellWidth = [qrcodeElement[@"cellWidth"] intValue] ?: 4;
                NSString *mode = qrcodeElement[@"mode"] ?: @"A";
                int rotation = [qrcodeElement[@"rotation"] intValue];
                NSString *content = qrcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[TSCCommand qrCodeWithX:x andY:y andEccLevel:eccLevel andCellWidth:cellWidth andMode:mode andRotation:rotation andContent:content usStrEnCoding:NSUTF8StringEncoding]];
            }
        }
        
        int copies = [options[@"copies"] intValue] ?: 1;
        [dataM appendData:[TSCCommand print:copies]];
        
        [self sendLabelData:dataM];
        resolve(@(YES));
    }
    @catch (NSException *exception) {
        reject(@"TSC_PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printZPLLabel:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSMutableData *dataM = [NSMutableData data];
        
        // Start ZPL command
        [dataM appendData:[ZPLCommand XA]];
        
        // Basic setup
        int width = [options[@"width"] intValue] ?: 400;
        int height = [options[@"height"] intValue] ?: 300;
        int density = [options[@"density"] intValue] ?: 8;
        int speed = [options[@"speed"] intValue] ?: 4;
        int copies = [options[@"copies"] intValue] ?: 1;
        
        [dataM appendData:[ZPLCommand setLabelWidth:width]];
        [dataM appendData:[ZPLCommand setLabelHeight:height]];
        [dataM appendData:[ZPLCommand setDensity:density]];
        [dataM appendData:[ZPLCommand setSpeed:speed]];
        [dataM appendData:[ZPLCommand setPageCount:copies]];
        
        // Add text elements
        NSArray *textElements = options[@"texts"];
        if (textElements) {
            for (NSDictionary *textElement in textElements) {
                int x = [textElement[@"x"] intValue];
                int y = [textElement[@"y"] intValue];
                ZPLFont fontName = (ZPLFont)([textElement[@"font"] intValue] ?: FNT_26_13);
                ZPLRotation rotation = (ZPLRotation)([textElement[@"rotation"] intValue] ?: ROTATION_0);
                int hRatio = [textElement[@"hRatio"] intValue] ?: 1;
                int wRatio = [textElement[@"wRatio"] intValue] ?: 1;
                NSString *content = textElement[@"content"] ?: @"";
                
                [dataM appendData:[ZPLCommand drawTextWithx:x y:y fontName:fontName rotation:rotation hRatio:hRatio wRatio:wRatio content:content]];
            }
        }
        
        // Add barcode elements
        NSArray *barcodeElements = options[@"barcodes"];
        if (barcodeElements) {
            for (NSDictionary *barcodeElement in barcodeElements) {
                int x = [barcodeElement[@"x"] intValue];
                int y = [barcodeElement[@"y"] intValue];
                ZPLBarCode codeType = (ZPLBarCode)([barcodeElement[@"codeType"] intValue] ?: CODE_TYPE_128);
                int height = [barcodeElement[@"height"] intValue] ?: 100;
                NSString *content = barcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[ZPLCommand drawBarcodeWithx:x y:y codeType:codeType height:height text:content]];
            }
        }
        
        // Add QR code elements
        NSArray *qrcodeElements = options[@"qrcodes"];
        if (qrcodeElements) {
            for (NSDictionary *qrcodeElement in qrcodeElements) {
                int x = [qrcodeElement[@"x"] intValue];
                int y = [qrcodeElement[@"y"] intValue];
                int factor = [qrcodeElement[@"factor"] intValue] ?: 3;
                NSString *content = qrcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[ZPLCommand drawQRCodeWithx:x y:y factor:factor text:content]];
            }
        }
        
        // End ZPL command
        [dataM appendData:[ZPLCommand XZ]];
        
        [self sendLabelData:dataM];
        resolve(@(YES));
    }
    @catch (NSException *exception) {
        reject(@"ZPL_PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printCPCLLabel:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSMutableData *dataM = [NSMutableData data];
        
        // Basic setup
        int height = [options[@"height"] intValue] ?: 400;
        int copies = [options[@"copies"] intValue] ?: 1;
        int density = [options[@"density"] intValue] ?: 8;
        
        [dataM appendData:[CPCLCommand initLabelWithHeight:height count:copies]];
        
        // Add text elements
        NSArray *textElements = options[@"texts"];
        if (textElements) {
            for (NSDictionary *textElement in textElements) {
                int x = [textElement[@"x"] intValue];
                int y = [textElement[@"y"] intValue];
                CPCLFont font = (CPCLFont)([textElement[@"font"] intValue] ?: FNT_3);
                CPCLRotation rotation = (CPCLRotation)([textElement[@"rotation"] intValue] ?: ROTA_0);
                NSString *content = textElement[@"content"] ?: @"";
                
                [dataM appendData:[CPCLCommand drawTextWithx:x y:y rotation:rotation font:font content:content]];
            }
        }
        
        // Add barcode elements
        NSArray *barcodeElements = options[@"barcodes"];
        if (barcodeElements) {
            for (NSDictionary *barcodeElement in barcodeElements) {
                int x = [barcodeElement[@"x"] intValue];
                int y = [barcodeElement[@"y"] intValue];
                CPCLBarCode codeType = (CPCLBarCode)([barcodeElement[@"codeType"] intValue] ?: BC_128);
                int height = [barcodeElement[@"height"] intValue] ?: 100;
                NSString *content = barcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[CPCLCommand drawBarcodeWithx:x y:y codeType:codeType height:height content:content]];
            }
        }
        
        // Add QR code elements
        NSArray *qrcodeElements = options[@"qrcodes"];
        if (qrcodeElements) {
            for (NSDictionary *qrcodeElement in qrcodeElements) {
                int x = [qrcodeElement[@"x"] intValue];
                int y = [qrcodeElement[@"y"] intValue];
                NSString *content = qrcodeElement[@"content"] ?: @"";
                
                [dataM appendData:[CPCLCommand drawQRCodeWithx:x y:y content:content]];
            }
        }
        
        [dataM appendData:[CPCLCommand print]];
        
        [self sendLabelData:dataM];
        resolve(@(YES));
    }
    @catch (NSException *exception) {
        reject(@"CPCL_PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printLabelImage:(NSString *)base64
                  printType:(NSInteger)printType
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
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

- (void)sendLabelData:(NSMutableData *)data {
    if (_currentConnectionType == 1) {
        // WiFi connection
        if ([_wifiManager printerIsConnect]) {
            [_wifiManager writeCommandWithData:data];
        } else if (_tscWifiManager.isConnect) {
            [_tscWifiManager writeCommandWithData:data];
        } else {
            NSLog(@"No WiFi printer connected for label printing");
        }
    } else if (_currentConnectionType == 2) {
        // Bluetooth connection
        if ([_bleManager printerIsConnect]) {
            [_bleManager writeCommandWithData:data];
        } else if (_tscBleManager.isConnecting) {
            [_tscBleManager writeCommandWithData:data];
        } else {
            NSLog(@"No Bluetooth printer connected for label printing");
        }
    } else {
        NSLog(@"No printer connected for label printing");
    }
}

RCT_EXPORT_METHOD(disconnect:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    BOOL disconnected = NO;
    
    switch (_currentConnectionType) {
        case 1: { // WiFi
            if ([_wifiManager printerIsConnect]) {
                [_wifiManager disconnect];
                disconnected = YES;
            }
            if (_tscWifiManager.isConnect) {
                [_tscWifiManager disconnect];
                disconnected = YES;
            }
            break;
        }
        case 2: { // Bluetooth
            if ([_bleManager printerIsConnect]) {
                [_bleManager disconnectRootPeripheral];
                disconnected = YES;
            }
            if (_tscBleManager.isConnecting) {
                [_tscBleManager disconnectRootPeripheral];
                disconnected = YES;
            }
            break;
        }
        default: {
            reject(@"NOT_CONNECTED", @"No active connection to disconnect", nil);
            return;
        }
    }
    
    if (disconnected) {
        _currentConnectionType = -1;
        resolve(@(YES));
    } else {
        reject(@"NOT_CONNECTED", @"No active connection to disconnect", nil);
    }
}

@end
