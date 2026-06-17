import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  discovery(connType: number): Promise<string>;
  connect(connType: number, address: string): Promise<boolean>;
  disconnect(): Promise<boolean>;
  printBitmap(base64: string): Promise<void>;
  openCashBox(): Promise<void>;
  printerStatus(): Promise<number>;
  isConnect(): Promise<boolean>;
  setIp(address: string): Promise<boolean>;
  printTSCLabel(options: Object): Promise<boolean>;
  printZPLLabel(options: Object): Promise<boolean>;
  printCPCLLabel(options: Object): Promise<boolean>;
  printLabelImage(base64: string, printType: number): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Xprinter2');
