import NativeXprinter2 from './NativeXprinter2';

export const ConnectionType = {
  USB: 0,
  WIFI: 1,
  BLUETOOTH: 2,
} as const;

export type ConnectionTypeValue =
  (typeof ConnectionType)[keyof typeof ConnectionType];

export const LabelPrintType = {
  TSPL: 0,
  ZPL: 1,
  CPCL: 2,
} as const;

export type LabelPrintTypeValue =
  (typeof LabelPrintType)[keyof typeof LabelPrintType];

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

export enum Rotation {
  ROTATION_0 = 0,
  ROTATION_90 = 1,
  ROTATION_180 = 2,
  ROTATION_270 = 3,
}

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

export interface TSCLabelOptions {
  width?: number;
  height?: number;
  gap?: number;
  density?: number;
  speed?: number;
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

export interface ZPLLabelOptions {
  width?: number;
  height?: number;
  density?: number;
  speed?: number;
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

export interface CPCLLabelOptions {
  height?: number;
  copies?: number;
  texts?: LabelTextElement[];
  barcodes?: LabelBarcodeElement[];
  qrcodes?: LabelQRCodeElement[];
}

export function discovery(connType: ConnectionTypeValue): Promise<string> {
  return NativeXprinter2.discovery(connType);
}

export function connect(
  connType: ConnectionTypeValue,
  address: string
): Promise<boolean> {
  return NativeXprinter2.connect(connType, address);
}

export function disconnect(): Promise<boolean> {
  return NativeXprinter2.disconnect();
}

export function printBitmap(base64: string): Promise<void> {
  return NativeXprinter2.printBitmap(base64);
}

export function openCashBox(): Promise<void> {
  return NativeXprinter2.openCashBox();
}

export function printerStatus(): Promise<number> {
  return NativeXprinter2.printerStatus();
}

export function isConnect(): Promise<boolean> {
  return NativeXprinter2.isConnect();
}

export function setIp(address: string): Promise<boolean> {
  return NativeXprinter2.setIp(address);
}

export function printTSCLabel(options: TSCLabelOptions): Promise<boolean> {
  return NativeXprinter2.printTSCLabel(options as Object);
}

export function printZPLLabel(options: ZPLLabelOptions): Promise<boolean> {
  return NativeXprinter2.printZPLLabel(options as Object);
}

export function printCPCLLabel(options: CPCLLabelOptions): Promise<boolean> {
  return NativeXprinter2.printCPCLLabel(options as Object);
}

export function printLabelImage(
  base64: string,
  printType: LabelPrintTypeValue
): Promise<boolean> {
  return NativeXprinter2.printLabelImage(base64, printType);
}

export { ConnectionType as CON_TYPE };
export { LabelPrintType as LABEL_TYPE };
