import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';
import {
    connect,
    discovery,
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
    TSCLabelOptions,
    ZPLLabelOptions,
    CPCLLabelOptions,
} from 'react-native-xprinter2';

const LabelPrintingExample: React.FC = () => {
    const [connectedPrinter, setConnectedPrinter] = useState<string>('');
    const [printerConnected, setPrinterConnected] = useState(false);

    const handleDiscovery = async (connType: number) => {
        try {
            const result = await discovery(connType);
            Alert.alert('Discovery Result', `Found printer: ${result}`);
            return result;
        } catch (error) {
            Alert.alert('Discovery Error', (error as Error).message);
            return null;
        }
    };

    const handleConnect = async (connType: number, address: string) => {
        try {
            const result = await connect(connType, address);
            if (result) {
                setConnectedPrinter(address);
                setPrinterConnected(true);
                Alert.alert('Success', `Connected to printer: ${address}`);
            } else {
                Alert.alert('Error', 'Failed to connect to printer');
            }
        } catch (error) {
            Alert.alert('Connection Error', (error as Error).message);
        }
    };

    const checkConnection = async () => {
        try {
            const connected = await isConnect();
            setPrinterConnected(connected);
            Alert.alert('Connection Status', connected ? 'Connected' : 'Disconnected');
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        }
    };

    const printSimpleTSCLabel = async () => {
        const options: TSCLabelOptions = {
            width: 40, // 40mm width
            height: 30, // 30mm height
            gap: 2, // 2mm gap
            density: 8,
            speed: 4,
            copies: 1,
            texts: [
                {
                    x: 10,
                    y: 10,
                    content: 'Hello World!',
                    font: '3',
                    rotation: Rotation.ROTATION_0,
                    xMul: 1,
                    yMul: 1,
                },
                {
                    x: 10,
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
                    x: 10,
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
            await printTSCLabel(options);
            Alert.alert('Success', 'TSC Label printed successfully');
        } catch (error) {
            Alert.alert('Print Error', (error as Error).message);
        }
    };

    const printSimpleZPLLabel = async () => {
        const options: ZPLLabelOptions = {
            width: 400, // 400 dots width
            height: 300, // 300 dots height
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
            await printZPLLabel(options);
            Alert.alert('Success', 'ZPL Label printed successfully');
        } catch (error) {
            Alert.alert('Print Error', (error as Error).message);
        }
    };

    const printSimpleCPCLLabel = async () => {
        const options: CPCLLabelOptions = {
            height: 400, // 400 dots height
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
            await printCPCLLabel(options);
            Alert.alert('Success', 'CPCL Label printed successfully');
        } catch (error) {
            Alert.alert('Print Error', (error as Error).message);
        }
    };

    const printImageLabel = async () => {
        // Sample base64 image (1x1 pixel black PNG)
        const sampleImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8D1gAAAABJRU5ErkJggg==';

        try {
            await printLabelImage(sampleImage, LabelPrintType.TSPL);
            Alert.alert('Success', 'Image label printed successfully');
        } catch (error) {
            Alert.alert('Print Error', (error as Error).message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Label Printing Examples</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleDiscovery(ConnectionType.WIFI)}
                >
                    <Text style={styles.buttonText}>Discover WiFi Printers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleDiscovery(ConnectionType.BLUETOOTH)}
                >
                    <Text style={styles.buttonText}>Discover Bluetooth Printers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleConnect(ConnectionType.WIFI, '192.168.1.100')}
                >
                    <Text style={styles.buttonText}>Connect to WiFi (192.168.1.100)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={checkConnection}
                >
                    <Text style={styles.buttonText}>Check Connection</Text>
                </TouchableOpacity>

                <Text style={styles.status}>
                    Status: {printerConnected ? `Connected to ${connectedPrinter}` : 'Disconnected'}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Label Printing</Text>

                <TouchableOpacity
                    style={[styles.button, styles.tscButton]}
                    onPress={printSimpleTSCLabel}
                    disabled={!printerConnected}
                >
                    <Text style={styles.buttonText}>Print TSC Label</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.zplButton]}
                    onPress={printSimpleZPLLabel}
                    disabled={!printerConnected}
                >
                    <Text style={styles.buttonText}>Print ZPL Label</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.cpclButton]}
                    onPress={printSimpleCPCLLabel}
                    disabled={!printerConnected}
                >
                    <Text style={styles.buttonText}>Print CPCL Label</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.imageButton]}
                    onPress={printImageLabel}
                    disabled={!printerConnected}
                >
                    <Text style={styles.buttonText}>Print Image Label</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        alignItems: 'center',
    },
    tscButton: {
        backgroundColor: '#34C759',
    },
    zplButton: {
        backgroundColor: '#FF9500',
    },
    cpclButton: {
        backgroundColor: '#AF52DE',
    },
    imageButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    status: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default LabelPrintingExample; 