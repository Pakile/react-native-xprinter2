import * as React from 'react';
import { useState } from 'react';

import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  connect,
  discovery,
  printBitmap,
  printerStatus,
  isConnect,
  printTSCLabel,
  printZPLLabel,
  printCPCLLabel,
  printLabelImage,
  ConnectionType,
  LabelPrintType,
  ZPLFont,
  ZPLBarCode,
  CPCLFont,
  CPCLBarCode,
  Rotation,
} from 'react-native-xprinter2';
import type {
  TSCLabelOptions,
  ZPLLabelOptions,
  CPCLLabelOptions,
} from 'react-native-xprinter2';

export default function App() {
  const [address, setAddress] = useState('192.168.1.199');
  const [connectionType, setConnectionType] = useState<0 | 1>(1);
  const [isConnected, setIsConnected] = useState(false);
  const [printerStatusText, setPrinterStatusText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscovery = async (_type: 0 | 1 = 1) => {
    setIsLoading(true);
    try {
      const result = await discovery(_type);
      console.log('discovery', result);
      setAddress(result);
      Alert.alert('Discovery Success', `Found printer: ${result}`);
    } catch (error) {
      console.log('discovery error', error);
      Alert.alert('Discovery Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      console.log(`Attempting to connect to ${address} with type ${connectionType}`);
      
      const result = await connect(connectionType, address);
      if (result) {
        setIsConnected(true);
        Alert.alert('Success', `Connected to printer: ${address}`);
      } else {
        Alert.alert('Connection Failed', 'Failed to connect to printer');
      }
    } catch (error) {
      console.log('connect error', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('timed out')) {
        Alert.alert(
          'Connection Timeout', 
          `Không thể kết nối đến ${address}. Vui lòng kiểm tra:\n\n` +
          '• Địa chỉ IP có đúng không\n' +
          '• Máy in có bật và kết nối mạng không\n' +
          '• Thiết bị và máy in có cùng mạng WiFi không\n' +
          '• Firewall có chặn kết nối không'
        );
      } else {
        Alert.alert('Connection Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      // Note: You might need to implement a disconnect function in the native module
      setIsConnected(false);
      setPrinterStatusText('');
      Alert.alert('Success', 'Disconnected from printer');
    } catch (error) {
      console.log('disconnect error', error);
      Alert.alert('Disconnect Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await isConnect();
      setIsConnected(connected);
      Alert.alert('Connection Status', connected ? 'Connected' : 'Disconnected');
    } catch (error) {
      console.log('connection check error', error);
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatus = async () => {
    setIsLoading(true);
    try {
      const status = await printerStatus();
      console.log('status', status);
      setPrinterStatusText(JSON.stringify(status, null, 2));
      Alert.alert('Printer Status', JSON.stringify(status, null, 2));
    } catch (error) {
      console.log('status error', error);
      Alert.alert('Status Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    // Simple text printing instead of bitmap
    Alert.alert('Print', 'Printing simple text...');
    // You can implement simple text printing here
  };

  const printSimpleTSCLabel = async () => {
    const options: TSCLabelOptions = {
      width: 40,
      height: 30,
      gap: 2,
      density: 8,
      speed: 4,
      copies: 1,
      texts: [
        {
          x: 0,
          y: 10,
          content: 'Hello World!',
          font: '3',
          rotation: Rotation.ROTATION_0,
          xMul: 1,
          yMul: 1,
        },
        {
          x: 0,
          y: 50,
          content: 'TSC Label Test',
          font: '4',
          rotation: Rotation.ROTATION_0,
          xMul: 2,
          yMul: 2,
        },
      ],
      barcodes: [
        {
          x: 0,
          y: 100,
          content: '1234567890',
          codeType: '128',
          height: 80,
          rotation: Rotation.ROTATION_0,
          readable: 1,
          narrow: 2,
          wide: 2,
        },
      ],
      qrcodes: [
        {
          x: 200,
          y: 100,
          content: 'https://example.com',
          eccLevel: 'M',
          cellWidth: 4,
          mode: 'A',
          rotation: Rotation.ROTATION_0,
        },
      ],
    };

    try {
      console.log('Printing TSC label...');
      await printTSCLabel(options);
      Alert.alert('Success', 'TSC Label printed successfully');
    } catch (error) {
      console.log('TSC print error:', error);
      Alert.alert('Print Error', `TSC Label: ${(error as Error).message}`);
    }
  };

  const printSimpleZPLLabel = async () => {
    const options: ZPLLabelOptions = {
      width: 400,
      height: 300,
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
        {
          x: 50,
          y: 100,
          content: 'Sample Text',
          font: ZPLFont.FNT_18_10,
          rotation: Rotation.ROTATION_0,
          hRatio: 1,
          wRatio: 1,
        },
      ],
      barcodes: [
        {
          x: 50,
          y: 150,
          content: '1234567890',
          codeType: ZPLBarCode.CODE_TYPE_128,
          height: 50,
          rotation: Rotation.ROTATION_0,
        },
      ],
      qrcodes: [
        {
          x: 250,
          y: 150,
          content: 'https://example.com',
          factor: 3,
          rotation: Rotation.ROTATION_0,
        },
      ],
    };

    try {
      console.log('Printing ZPL label...');
      await printZPLLabel(options);
      Alert.alert('Success', 'ZPL Label printed successfully');
    } catch (error) {
      console.log('ZPL print error:', error);
      Alert.alert('Print Error', `ZPL Label: ${(error as Error).message}`);
    }
  };

  const printSimpleCPCLLabel = async () => {
    const options: CPCLLabelOptions = {
      height: 400,
      copies: 1,
      texts: [
        {
          x: 10,
          y: 10,
          content: 'CPCL Label',
          font: CPCLFont.FNT_4,
          rotation: Rotation.ROTATION_0,
        },
        {
          x: 10,
          y: 50,
          content: 'Test Print',
          font: CPCLFont.FNT_3,
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
          rotation: Rotation.ROTATION_0,
        },
      ],
      qrcodes: [
        {
          x: 200,
          y: 100,
          content: 'https://example.com',
          rotation: Rotation.ROTATION_0,
        },
      ],
    };

    try {
      console.log('Printing CPCL label...');
      await printCPCLLabel(options);
      Alert.alert('Success', 'CPCL Label printed successfully');
    } catch (error) {
      console.log('CPCL print error:', error);
      Alert.alert('Print Error', `CPCL Label: ${(error as Error).message}`);
    }
  };

  const printImageLabel = async () => {
    const sampleImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8D1gAAAABJRU5ErkJggg==';

    try {
      console.log('Printing image label...');
      await printLabelImage(sampleImage, LabelPrintType.TSPL);
      Alert.alert('Success', 'Image label printed successfully');
    } catch (error) {
      console.log('Image print error:', error);
      Alert.alert('Print Error', `Image Label: ${(error as Error).message}`);
    }
  };

  const checkPrinterCompatibility = async () => {
    Alert.alert(
      'Printer Compatibility Info',
      'Máy in của bạn có thể chỉ hỗ trợ một số định dạng nhất định:\n\n' +
      '✅ TSC/TSLP: Hầu hết máy in nhiệt\n' +
      '❓ ZPL: Chỉ máy in Zebra\n' +
      '❓ CPCL: Chỉ máy in CPCL\n' +
      '❓ Image: Tùy thuộc vào driver\n\n' +
      'Nếu in không thành công, hãy thử:\n' +
      '• Kiểm tra loại máy in\n' +
      '• Thử các thông số khác nhau\n' +
      '• Xem log để biết lỗi chi tiết'
    );
  };

  const printTestLabel = async () => {
    // Simple test label with basic text only
    const options: TSCLabelOptions = {
      width: 40,
      height: 20,
      gap: 2,
      density: 8,
      speed: 4,
      copies: 1,
      texts: [
        {
          x: 10,
          y: 10,
          content: 'TEST LABEL',
          font: '3',
          rotation: Rotation.ROTATION_0,
          xMul: 1,
          yMul: 1,
        },
        {
          x: 10,
          y: 40,
          content: new Date().toLocaleString(),
          font: '2',
          rotation: Rotation.ROTATION_0,
          xMul: 1,
          yMul: 1,
        },
      ],
    };

    try {
      console.log('Printing test label...');
      await printTSCLabel(options);
      Alert.alert('Success', 'Test label printed successfully');
    } catch (error) {
      console.log('Test print error:', error);
      Alert.alert('Print Error', `Test Label: ${(error as Error).message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>XPrinter2 Demo</Text>
          <Text style={styles.subtitle}>Printer Management & Label Printing</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
            <Text style={styles.statusText}>
              {isConnected ? `Connected to ${address}` : 'Disconnected'}
            </Text>
          </View>
          {printerStatusText ? (
            <Text style={styles.statusDetails}>{printerStatusText}</Text>
          ) : null}
        </View>

        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Connection</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Printer Address:</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter printer IP address"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleDiscovery(0)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>🔍 USB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleDiscovery(1)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>🔍 Network</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleConnect}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '⏳ Connecting...' : '🔌 Connect'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleDisconnect}
              disabled={!isConnected || isLoading}
            >
              <Text style={styles.buttonText}>❌ Disconnect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={checkConnection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>📊 Check Status</Text>
          </TouchableOpacity>
        </View>

        {/* Printer Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Printer Status</Text>
          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={handleStatus}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>📊 Get Status</Text>
          </TouchableOpacity>
        </View>

        {/* Receipt Printing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Receipt Printing</Text>
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handlePrint}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🖨️ Print Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Label Printing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Label Printing</Text>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={checkPrinterCompatibility}
          >
            <Text style={styles.buttonText}>ℹ️ Printer Compatibility</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={printTestLabel}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🧪 Test Label</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tscButton]}
            onPress={printSimpleTSCLabel}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🏷️ TSC Label</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.zplButton]}
            onPress={printSimpleZPLLabel}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🏷️ ZPL Label</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cpclButton]}
            onPress={printSimpleCPCLLabel}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🏷️ CPCL Label</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.imageButton]}
            onPress={printImageLabel}
            disabled={!isConnected || isLoading}
          >
            <Text style={styles.buttonText}>🖼️ Image Label</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusDetails: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  testButton: {
    backgroundColor: '#6f42c1',
    marginBottom: 10,
  },
  tscButton: {
    backgroundColor: '#34C759',
    marginBottom: 10,
  },
  zplButton: {
    backgroundColor: '#FF9500',
    marginBottom: 10,
  },
  cpclButton: {
    backgroundColor: '#AF52DE',
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: '#FF3B30',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});