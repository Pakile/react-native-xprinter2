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

export function multiply(a: number, b: number): Promise<number> {
  return Xprinter2.multiply(a, b);
}

export function discovery(connType: number): Promise<string> {
  return Xprinter2.discovery(connType);
}

export function connect(connType: number, address: string): Promise<boolean> {
  return Xprinter2.connect(connType, address);
}

export function printBitmap(base64: string) {
  return Xprinter2.printBitmap(base64);
}

export function openCashBox() {
  return Xprinter2.openCashBox();
}

export function printerStatus(): Promise<number> {
  return Xprinter2.printerStatus();
}

export function isConnect(): Promise<boolean> {
  return Xprinter2.isConnect();
}

export function setIp(ipAddress: String): Promise<boolean> {
  return Xprinter2.setIp(ipAddress);
}

