# React Native XPrinter2

A React Native library for XPrinter thermal printers with comprehensive support for both POS receipt printing and Label printing.

## Features

### POS Receipt Printing
- 🖨️ Support for XPrinter thermal printers
- 📱 Cross-platform (iOS & Android)
- 🔌 Multiple connection types:
  - USB connection
  - WiFi/Network connection  
  - Bluetooth connection (Android)
- 🖼️ Print bitmap images (base64)
- 💰 Cash drawer control
- 📊 Printer status monitoring
- 🌐 Network printer discovery

### Label Printing (NEW!)
- ✅ **TSC/TSPL Commands** - Full support for TSC label printers
- ✅ **ZPL Commands** - Complete Zebra Programming Language support
- ✅ **CPCL Commands** - Intermec/Honeywell Common Printer Control Language
- ✅ **Multiple Elements** - Text, Barcodes (1D/2D), QR Codes, Images
- ✅ **Flexible Layout** - Precise positioning with rotation support
- ✅ **Label Configuration** - Size, gap, density, speed settings
- ✅ **Image to Label** - Convert images to label format

## Installation

```sh
npm install react-native-xprinter2
```

### iOS Setup

1. Add the following to your `Podfile`:

```ruby
pod 'react-native-xprinter2', :path => '../node_modules/react-native-xprinter2'
```

2. Run:

```sh
cd ios && pod install
```

3. Add the following permissions to your `Info.plist` for Bluetooth support:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs access to Bluetooth to connect to printers</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs access to Bluetooth to connect to printers</string>
```

### Android Setup

For Android, the library includes the necessary printer SDK and should work out of the box after installation.

## Usage

### Basic POS Printing

```javascript
import {
  discovery,
  connect,
  printBitmap,
  openCashBox,
  printerStatus,
  isConnect,
  setIp,
  ConnectionType,
} from 'react-native-xprinter2';

// Discovery printers
const discoverPrinters = async () => {
  try {
    // Use ConnectionType constants for better type safety
    const result = await discovery(ConnectionType.WIFI); // WiFi discovery
    console.log('Found printer:', result);
    return result;
  } catch (error) {
    console.error('Discovery failed:', error);
  }
};

// Connect to printer
const connectToPrinter = async (connectionType, address) => {
  try {
    const result = await connect(connectionType, address);
    console.log('Connected:', result);
    return result;
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

// Print bitmap image
const printImage = async (base64Image) => {
  try {
    await printBitmap(base64Image);
    console.log('Print successful');
  } catch (error) {
    console.error('Print failed:', error);
  }
};

// Open cash drawer
const openDrawer = async () => {
  try {
    await openCashBox();
    console.log('Cash drawer opened');
  } catch (error) {
    console.error('Failed to open cash drawer:', error);
  }
};

// Check printer status
const checkStatus = async () => {
  try {
    const status = await printerStatus();
    console.log('Printer status:', status);
  } catch (error) {
    console.error('Status check failed:', error);
  }
};
```

### Label Printing

#### TSC/TSPL Label Printing

```javascript
import {
  printTSCLabel,
  Rotation,
  TSCLabelOptions,
} from 'react-native-xprinter2';

const options: TSCLabelOptions = {
  width: 40,      // 40mm width
  height: 30,     // 30mm height
  gap: 2,         // 2mm gap between labels
  density: 8,     // Print density
  speed: 4,       // Print speed
  copies: 1,      // Number of copies
  texts: [
    {
      x: 10,
      y: 10,
      content: 'Product Name',
      font: '3',
      rotation: Rotation.ROTATION_0,
      xMul: 2,
      yMul: 2,
    },
  ],
  barcodes: [
    {
      x: 10,
      y: 100,
      content: '1234567890',
      codeType: '128',
      height: 80,
      readable: 1,
    },
  ],
  qrcodes: [
    {
      x: 200,
      y: 100,
      content: 'https://example.com',
      eccLevel: 'M',
      cellWidth: 4,
    },
  ],
};

await printTSCLabel(options);
```

#### ZPL Label Printing

```javascript
import {
  printZPLLabel,
  ZPLFont,
  ZPLBarCode,
  Rotation,
} from 'react-native-xprinter2';

const options: ZPLLabelOptions = {
  width: 400,     // 400 dots width
  height: 300,    // 300 dots height
  density: 8,
  speed: 4,
  copies: 1,
  texts: [
    {
      x: 50,
      y: 50,
      content: 'ZPL Label',
      font: ZPLFont.FNT_26_13,
      rotation: Rotation.ROTATION_0,
      hRatio: 2,
      wRatio: 2,
    },
  ],
  barcodes: [
    {
      x: 50,
      y: 150,
      content: '1234567890',
      codeType: ZPLBarCode.CODE_TYPE_128,
      height: 50,
    },
  ],
  qrcodes: [
    {
      x: 250,
      y: 150,
      content: 'QR Code Data',
      factor: 3,
    },
  ],
};

await printZPLLabel(options);
```

#### CPCL Label Printing

```javascript
import {
  printCPCLLabel,
  CPCLFont,
  CPCLBarCode,
} from 'react-native-xprinter2';

const options: CPCLLabelOptions = {
  height: 400,    // 400 dots height
  copies: 1,
  texts: [
    {
      x: 10,
      y: 10,
      content: 'CPCL Label',
      font: CPCLFont.FNT_4,
      rotation: Rotation.ROTATION_0,
    },
  ],
  barcodes: [
    {
      x: 10,
      y: 100,
      content: '1234567890',
      codeType: CPCLBarCode.BC_128,
      height: 80,
    },
  ],
  qrcodes: [
    {
      x: 200,
      y: 100,
      content: 'QR Data',
    },
  ],
};

await printCPCLLabel(options);
```

#### Print Image as Label

```javascript
import { printLabelImage, LabelPrintType } from 'react-native-xprinter2';

// Convert image to TSPL format and print
await printLabelImage(base64ImageString, LabelPrintType.TSPL);

// Convert image to ZPL format and print
await printLabelImage(base64ImageString, LabelPrintType.ZPL);

// Convert image to CPCL format and print
await printLabelImage(base64ImageString, LabelPrintType.CPCL);
```

## API Reference

### Connection Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `discovery()` | Discover available printers | `connType: ConnectionType` | `Promise<string>` |
| `connect()` | Connect to printer | `connType: ConnectionType, address: string` | `Promise<boolean>` |
| `isConnect()` | Check connection status | - | `Promise<boolean>` |
| `printerStatus()` | Get printer status | - | `Promise<number>` |
| `setIp()` | Set printer IP (WiFi only) | `address: string` | `Promise<boolean>` |

### POS Printing Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `printBitmap()` | Print bitmap image | `base64: string` | `Promise<void>` |
| `openCashBox()` | Open cash drawer | - | `Promise<void>` |

### Label Printing Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `printTSCLabel()` | Print TSC/TSPL label | `options: TSCLabelOptions` | `Promise<boolean>` |
| `printZPLLabel()` | Print ZPL label | `options: ZPLLabelOptions` | `Promise<boolean>` |
| `printCPCLLabel()` | Print CPCL label | `options: CPCLLabelOptions` | `Promise<boolean>` |
| `printLabelImage()` | Print image as label | `base64: string, printType: LabelPrintType` | `Promise<boolean>` |

### Types and Enums

#### Connection Types
```javascript
enum ConnectionType {
  USB = 0,
  WIFI = 1,
  BLUETOOTH = 2,
}
```

#### Label Print Types
```javascript
enum LabelPrintType {
  TSPL = 0,  // TSC Printer Language
  ZPL = 1,   // Zebra Programming Language
  CPCL = 2,  // Common Printer Control Language
}
```

#### Font Types
```javascript
// ZPL Fonts
enum ZPLFont {
  FNT_9_5 = 0,
  FNT_26_13 = 4,
  FNT_60_40 = 5,
  // ... more fonts
}

// CPCL Fonts
enum CPCLFont {
  FNT_0 = 0,
  FNT_3 = 3,
  FNT_4 = 4,
  // ... more fonts
}
```

#### Barcode Types
```javascript
// ZPL Barcodes
enum ZPLBarCode {
  CODE_TYPE_128 = 6,
  CODE_TYPE_EAN13 = 7,
  CODE_TYPE_UPCA = 12,
  // ... more codes
}

// CPCL Barcodes
enum CPCLBarCode {
  BC_128 = 0,
  BC_EAN13 = 3,
  BC_39 = 5,
  // ... more codes
}
```

#### Rotation
```javascript
enum Rotation {
  ROTATION_0 = 0,
  ROTATION_90 = 1,
  ROTATION_180 = 2,
  ROTATION_270 = 3,
}
```

### Label Options

#### TSCLabelOptions
```javascript
interface TSCLabelOptions {
  width?: number;        // Label width in mm
  height?: number;       // Label height in mm
  gap?: number;          // Gap between labels in mm
  density?: number;      // Print density (0-15)
  speed?: number;        // Print speed in inches/second
  copies?: number;       // Number of copies
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}
```

#### Element Interfaces
```javascript
interface LabelTextElement {
  x: number;             // X coordinate
  y: number;             // Y coordinate
  content: string;       // Text content
  font?: number | string; // Font type
  rotation?: Rotation;   // Text rotation
  xMul?: number;         // Horizontal multiplier
  yMul?: number;         // Vertical multiplier
  hRatio?: number;       // Height ratio (ZPL)
  wRatio?: number;       // Width ratio (ZPL)
}

interface LabelBarcodeElement {
  x: number;             // X coordinate
  y: number;             // Y coordinate
  content: string;       // Barcode data
  codeType?: number | string; // Barcode type
  height?: number;       // Barcode height
  rotation?: Rotation;   // Barcode rotation
  readable?: number;     // Human readable (0-3)
  narrow?: number;       // Narrow bar width
  wide?: number;         // Wide bar width
}

interface LabelQRCodeElement {
  x: number;             // X coordinate
  y: number;             // Y coordinate
  content: string;       // QR code data
  eccLevel?: string;     // Error correction level
  cellWidth?: number;    // Cell width
  mode?: string;         // QR mode
  rotation?: Rotation;   // QR rotation
  factor?: number;       // Scale factor
}
```

## Printer Status Codes

| Code | Status |
|------|--------|
| 18 (0x12) | Ready |
| 22 (0x16) | Cover opened |
| 50 (0x32) | Paper end |
| 54 (0x36) | Cover opened & Paper end |
| -1 | No response |
| -2 | Invalid response |

## Supported Printers

### POS Printers
- XP-58IIH, XP-58IIL, XP-58IIIK
- XP-80IIH, XP-80IIL, XP-80IIIK
- XP-N160I, XP-N160II
- And other XPrinter POS models

### Label Printers
- **TSC Compatible**: XP-DT108B, XP-DT426B, XP-460B
- **ZPL Compatible**: Zebra-compatible XPrinter models
- **CPCL Compatible**: Intermec/Honeywell compatible models

## Example App

See the [example](./example) directory for a complete implementation with:
- Connection management
- POS receipt printing
- Label printing with all formats
- Image to label conversion
- Error handling

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with ❤️ for the React Native community
