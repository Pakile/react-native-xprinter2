import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-xprinter2' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const Xprinter2 = NativeModules.Xprinter2
  ? NativeModules.Xprinter2
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// Connection type constants
export const ConnectionType = {
  USB: 0,
  WIFI: 1,
  BLUETOOTH: 2,
} as const;

export type ConnectionTypeValue = typeof ConnectionType[keyof typeof ConnectionType];

// Label Print Types
export const LabelPrintType = {
  TSPL: 0,
  ZPL: 1,
  CPCL: 2,
} as const;

export type LabelPrintTypeValue = typeof LabelPrintType[keyof typeof LabelPrintType];

// ZPL Font Types
export enum ZPLFont {
  FNT_9_5 = 0,
  FNT_11_7 = 1,
  FNT_18_10 = 2,
  FNT_42_20 = 3,
  FNT_26_13 = 4,
  FNT_60_40 = 5,
  FNT_34_22 = 6,
  FNT_24_24 = 7,
  FNT_20_18 = 8,
  FNT_28_24 = 9,
  FNT_35_31 = 10,
  FNT_40_35 = 11,
  FNT_48_42 = 12,
  FNT_59_53 = 13,
  FNT_80_71 = 14,
  FNT_15_12 = 15,
}

// ZPL Barcode Types
export enum ZPLBarCode {
  CODE_TYPE_11 = 0,
  CODE_TYPE_25 = 1,
  CODE_TYPE_39 = 2,
  CODE_TYPE_EAN8 = 3,
  CODE_TYPE_UPCE = 4,
  CODE_TYPE_93 = 5,
  CODE_TYPE_128 = 6,
  CODE_TYPE_EAN13 = 7,
  CODE_TYPE_CODA = 8,
  CODE_TYPE_MSI = 9,
  CODE_TYPE_PLESSEY = 10,
  CODE_TYPE_UPCEAN = 11,
  CODE_TYPE_UPCA = 12,
}

// CPCL Font Types
export enum CPCLFont {
  FNT_0 = 0,
  FNT_1 = 1,
  FNT_2 = 2,
  FNT_3 = 3,
  FNT_4 = 4,
  FNT_5 = 5,
  FNT_6 = 6,
  FNT_7 = 7,
  FNT_24 = 24,
  FNT_55 = 55,
}

// CPCL Barcode Types
export enum CPCLBarCode {
  BC_128 = 0,
  BC_UPCA = 1,
  BC_UPCE = 2,
  BC_EAN13 = 3,
  BC_EAN8 = 4,
  BC_39 = 5,
  BC_93 = 6,
  BC_CODABAR = 7,
}

// Rotation Types
export enum Rotation {
  ROTATION_0 = 0,
  ROTATION_90 = 1,
  ROTATION_180 = 2,
  ROTATION_270 = 3,
}

// Label Element Interfaces
export interface LabelTextElement {
  x: number;
  y: number;
  content: string;
  font?: number | string;
  rotation?: Rotation;
  xMul?: number;
  yMul?: number;
  hRatio?: number;
  wRatio?: number;
}

export interface LabelBarcodeElement {
  x: number;
  y: number;
  content: string;
  codeType?: number | string;
  height?: number;
  rotation?: Rotation;
  readable?: number;
  narrow?: number;
  wide?: number;
}

export interface LabelQRCodeElement {
  x: number;
  y: number;
  content: string;
  eccLevel?: string;
  cellWidth?: number;
  mode?: string;
  rotation?: Rotation;
  factor?: number;
}

// Label Options Interfaces
export interface TSCLabelOptions {
  width?: number; // mm
  height?: number; // mm
  gap?: number; // mm
  density?: number; // 0-15
  speed?: number; // inches per second
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

export interface ZPLLabelOptions {
  width?: number; // dots
  height?: number; // dots
  density?: number; // 0-30
  speed?: number; // 1-14
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

export interface CPCLLabelOptions {
  height?: number; // dots
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

/**
 * Discover available printers
 * @param connType Connection type (0 = USB, 1 = WiFi, 2 = Bluetooth)
 * @returns Promise that resolves to printer address/name
 */
export function discovery(connType: ConnectionTypeValue): Promise<string> {
  return Xprinter2.discovery(connType);
}

/**
 * Connect to a specific printer
 * @param connType Connection type (0 = USB, 1 = WiFi, 2 = Bluetooth)
 * @param address Printer address (IP address for WiFi, device name for others)
 * @returns Promise that resolves to connection success status
 */
export function connect(connType: ConnectionTypeValue, address: string): Promise<boolean> {
  return Xprinter2.connect(connType, address);
}

/**
 * Disconnect from the current printer
 * @returns Promise that resolves to disconnection success status
 */
export function disconnect(): Promise<boolean> {
  return Xprinter2.disconnect();
}

/**
 * Print a bitmap image
 * @param base64 Base64 encoded image data
 * @returns Promise that resolves when print is complete
 */
export function printBitmap(base64: string): Promise<void> {
  return Xprinter2.printBitmap(base64);
}

/**
 * Open the connected cash drawer
 * @returns Promise that resolves when command is sent
 */
export function openCashBox(): Promise<void> {
  return Xprinter2.openCashBox();
}

/**
 * Get current printer status
 * @returns Promise that resolves to status code
 * Status codes:
 * - 0x12 (18): Ready
 * - 0x16 (22): Cover opened
 * - 0x32 (50): Paper end
 * - 0x36 (54): Cover opened & Paper end
 * - -1: No response
 * - -2: Invalid response
 */
export function printerStatus(): Promise<number> {
  return Xprinter2.printerStatus();
}

/**
 * Check if printer is currently connected
 * @returns Promise that resolves to connection status
 */
export function isConnect(): Promise<boolean> {
  return Xprinter2.isConnect();
}

/**
 * Set printer IP address (WiFi only)
 * @param address IP address string
 * @returns Promise that resolves to success status
 */
export function setIp(address: string): Promise<boolean> {
  return Xprinter2.setIp(address);
}

// MARK: - Label Printing Functions

/**
 * Print a TSC/TSPL format label
 * @param options TSC label configuration options
 * @returns Promise that resolves when print is complete
 */
export function printTSCLabel(options: TSCLabelOptions): Promise<boolean> {
  return Xprinter2.printTSCLabel(options);
}

/**
 * Print a ZPL format label
 * @param options ZPL label configuration options
 * @returns Promise that resolves when print is complete
 */
export function printZPLLabel(options: ZPLLabelOptions): Promise<boolean> {
  return Xprinter2.printZPLLabel(options);
}

/**
 * Print a CPCL format label
 * @param options CPCL label configuration options
 * @returns Promise that resolves when print is complete
 */
export function printCPCLLabel(options: CPCLLabelOptions): Promise<boolean> {
  return Xprinter2.printCPCLLabel(options);
}

/**
 * Print an image as a label using specified print type
 * @param base64 Base64 encoded image data
 * @param printType Label print type (0 = TSPL, 1 = ZPL, 2 = CPCL)
 * @returns Promise that resolves when print is complete
 */
export function printLabelImage(base64: string, printType: LabelPrintTypeValue): Promise<boolean> {
  return Xprinter2.printLabelImage(base64, printType);
}

// Export connection type constants for convenience
export { ConnectionType as CON_TYPE };

// Export label printing constants
export { LabelPrintType as LABEL_TYPE };
