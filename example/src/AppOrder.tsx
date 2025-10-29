import * as React from 'react';
import { useState } from 'react';

import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  connect,
  ConnectionType,
  disconnect,
  isConnect,
  printBitmap,
} from 'react-native-xprinter2';
import order from './orderData';
import { printItemLabel } from './printItemLabel';

export default function AppOrder() {
  const [billPrinterConnected, setBillPrinterConnected] = useState(false);
  const [labelPrinterConnected, setLabelPrinterConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [billPrinterIP, setBillPrinterIP] = useState('192.168.1.100');
  const [labelPrinterIP, setLabelPrinterIP] = useState('192.168.1.199');

  const connectBillPrinter = async () => {
    setIsLoading(true);
    try {
      console.log(`Connecting to bill printer: ${billPrinterIP}`);
      const result = await connect(ConnectionType.WIFI, billPrinterIP);
      if (result) {
        setBillPrinterConnected(true);
        Alert.alert('Success', `Connected to bill printer: ${billPrinterIP}`);
      } else {
        Alert.alert('Connection Failed', 'Failed to connect to bill printer');
      }
    } catch (error) {
      console.log('Bill printer connection error:', error);
      Alert.alert('Connection Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectLabelPrinter = async () => {
    setIsLoading(true);
    try {
      console.log(`Connecting to label printer: ${labelPrinterIP}`);
      const result = await connect(ConnectionType.WIFI, labelPrinterIP);
      if (result) {
        setLabelPrinterConnected(true);
        Alert.alert('Success', `Connected to label printer: ${labelPrinterIP}`);
      } else {
        Alert.alert('Connection Failed', 'Failed to connect to label printer');
      }
    } catch (error) {
      console.log('Label printer connection error:', error);
      Alert.alert('Connection Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectBillPrinter = async () => {
    setIsLoading(true);
    try {
      const result = await disconnect();
      if (result) {
        setBillPrinterConnected(false);
        Alert.alert('Success', 'Disconnected from bill printer');
      } else {
        Alert.alert(
          'Disconnect Failed',
          'Failed to disconnect from bill printer'
        );
      }
    } catch (error) {
      console.log('Bill printer disconnect error:', error);
      Alert.alert('Disconnect Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectLabelPrinter = async () => {
    setIsLoading(true);
    try {
      const result = await disconnect();
      if (result) {
        setLabelPrinterConnected(false);
        Alert.alert('Success', 'Disconnected from label printer');
      } else {
        Alert.alert(
          'Disconnect Failed',
          'Failed to disconnect from label printer'
        );
      }
    } catch (error) {
      console.log('Label printer disconnect error:', error);
      Alert.alert('Disconnect Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const printBill = async () => {
    if (!billPrinterConnected) {
      Alert.alert('Error', 'Please connect to bill printer first');
      return;
    }

    setIsLoading(true);
    try {
      const billContent = generateBillContent(order);
      const base64Image = textToBase64Image(billContent);
      await printBitmap(base64Image);
      Alert.alert('Success', 'Bill printed successfully');
    } catch (error) {
      console.log('Bill print error:', error);
      Alert.alert('Print Error', `Bill: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const printLabels = async () => {
    if (!labelPrinterConnected) {
      Alert.alert('Error', 'Please connect to label printer first');
      return;
    }

    setIsLoading(true);
    try {
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        await printItemLabel(item, i + 1); // Truyền số thứ tự (bắt đầu từ 1)
        // Delay between prints to avoid overwhelming the printer
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      Alert.alert(
        'Success',
        `${order.items.length} labels printed successfully`
      );
    } catch (error) {
      console.log('Labels print error:', error);
      Alert.alert('Print Error', `Labels: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBillContent = (order: any): string => {
    const lines = [
      `          ${order.restaurantName}`,
      `        ${order.address}`,
      `        Phone: ${order.phone}`,
      '',
      `Bill: ${order.billNumber}`,
      `Table: ${order.table}`,
      `Check-in: ${order.checkIn}`,
      `Cashier: ${order.cashier}`,
      '',
      '--------------------------------',
      'ITEM                    QTY  PRICE',
      '--------------------------------',
    ];

    order.items.forEach((item: any) => {
      const name = item.name.padEnd(20);
      const qty = item.quantity.toString().padStart(3);
      const price = item.price.toLocaleString().padStart(8);
      lines.push(`${name} ${qty} ${price}`);

      if (item.note) {
        lines.push(`  Note: ${item.note}`);
      }
    });

    lines.push(
      '--------------------------------',
      `TOTAL: ${order.total.toLocaleString()} VNĐ`,
      `Payment: ${order.paymentMethod}`,
      '',
      `Staff: ${order.staffCode}`,
      `Print time: ${order.printTime}`,
      '',
      'Thank you for your visit!',
      'Please come again!'
    );

    return lines.join('\n');
  };

  const textToBase64Image = (text: string): string => {
    // Simplified base64 image for demo
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8D1gAAAABJRU5ErkJggg==';
  };

  const printAll = async () => {
    setIsLoading(true);
    try {
      // Disconnect from any current printer first
      const isCurrentlyConnected = await isConnect();
      if (isCurrentlyConnected) {
        console.log('Disconnecting from current printer...');
        await disconnect();
        setBillPrinterConnected(false);
        setLabelPrinterConnected(false);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Connect to bill printer first
      console.log(`Connecting to bill printer: ${billPrinterIP}`);
      const billConnected = await connect(ConnectionType.WIFI, billPrinterIP);
      if (!billConnected) {
        Alert.alert('Error', 'Failed to connect to bill printer');
        return;
      }
      setBillPrinterConnected(true);

      // Print bill
      const billContent = generateBillContent(order);
      const base64Image = textToBase64Image(billContent);
      await printBitmap(base64Image);
      console.log('Bill printed successfully');

      // Disconnect from bill printer
      await disconnect();
      setBillPrinterConnected(false);

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Connect to label printer
      console.log(`Connecting to label printer: ${labelPrinterIP}`);
      const labelConnected = await connect(ConnectionType.WIFI, labelPrinterIP);
      if (!labelConnected) {
        Alert.alert('Error', 'Failed to connect to label printer');
        return;
      }
      setLabelPrinterConnected(true);

      // Print labels
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        await printItemLabel(item, i + 1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      console.log(`${order.items.length} labels printed successfully`);

      // Disconnect from label printer
      await disconnect();
      setLabelPrinterConnected(false);

      Alert.alert('Success', 'Bill and labels printed successfully');
    } catch (error) {
      console.log('Print all error:', error);
      Alert.alert('Print Error', (error as Error).message);

      // Reset connection states in case of error
      setBillPrinterConnected(false);
      setLabelPrinterConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Order Printing Demo</Text>
          <Text style={styles.subtitle}>
            Bill & Label Printing with 2 Printers
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Order Summary</Text>

          <View style={styles.orderInfo}>
            <Text style={styles.restaurantName}>{order.restaurantName}</Text>
            <Text style={styles.orderDetails}>Bill: {order.billNumber}</Text>
            <Text style={styles.orderDetails}>Table: {order.table}</Text>
            <Text style={styles.orderDetails}>Cashier: {order.cashier}</Text>
            <Text style={styles.orderDetails}>
              Total: {order.total.toLocaleString()} VNĐ
            </Text>
            <Text style={styles.orderDetails}>Items: {order.items.length}</Text>
          </View>
        </View>

        {/* Bill Printer Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Bill Printer</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>IP Address:</Text>
            <TextInput
              style={styles.input}
              value={billPrinterIP}
              onChangeText={setBillPrinterIP}
              placeholder="192.168.1.100"
              keyboardType="numeric"
              editable={!billPrinterConnected}
            />
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: billPrinterConnected ? '#34C759' : '#FF3B30',
                },
              ]}
            />
            <Text style={styles.statusText}>
              {billPrinterConnected
                ? `Connected to ${billPrinterIP}`
                : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={connectBillPrinter}
              disabled={isLoading || billPrinterConnected}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '⏳ Connecting...' : '🔌 Connect'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={disconnectBillPrinter}
              disabled={!billPrinterConnected || isLoading}
            >
              <Text style={styles.buttonText}>❌ Disconnect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.billButton]}
            onPress={printBill}
            disabled={!billPrinterConnected || isLoading}
          >
            <Text style={styles.buttonText}>🧾 Print Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Label Printer Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Label Printer</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>IP Address:</Text>
            <TextInput
              style={styles.input}
              value={labelPrinterIP}
              onChangeText={setLabelPrinterIP}
              placeholder="192.168.1.199"
              keyboardType="numeric"
              editable={!labelPrinterConnected}
            />
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: labelPrinterConnected
                    ? '#34C759'
                    : '#FF3B30',
                },
              ]}
            />
            <Text style={styles.statusText}>
              {labelPrinterConnected
                ? `Connected to ${labelPrinterIP}`
                : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={connectLabelPrinter}
              disabled={isLoading || labelPrinterConnected}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '⏳ Connecting...' : '🔌 Connect'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={disconnectLabelPrinter}
              disabled={!labelPrinterConnected || isLoading}
            >
              <Text style={styles.buttonText}>❌ Disconnect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.labelButton]}
            onPress={printLabels}
            disabled={!labelPrinterConnected || isLoading}
          >
            <Text style={styles.buttonText}>
              🏷️ Print Labels ({order.items.length} items)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Combined Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖨️ Combined Actions</Text>

          <TouchableOpacity
            style={[styles.button, styles.bothButton]}
            onPress={printAll}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '⏳ Printing All...' : '🖨️ Print Bill + Labels'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🍽️ Items ({order.items.length})
          </Text>

          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString()} VNĐ
                </Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>
                  Quantity: {item.quantity}
                </Text>
                {item.note && (
                  <Text style={styles.itemNote}>Note: {item.note}</Text>
                )}
              </View>
            </View>
          ))}
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
  orderInfo: {
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  orderDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  billButton: {
    backgroundColor: '#28a745',
  },
  labelButton: {
    backgroundColor: '#17a2b8',
  },
  bothButton: {
    backgroundColor: '#6f42c1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  itemDetails: {
    marginTop: 5,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});
