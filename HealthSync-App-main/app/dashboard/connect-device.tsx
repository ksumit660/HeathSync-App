import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';

interface DeviceInfo {
  id: string;
  name: string | null;
  isConnected: boolean;
}

interface HealthData {
  heartRate: number;
  spO2: number;
}

const CONNECTED_DEVICE_KEY = '@healthsync_connected_device';

// Mock devices for testing
const MOCK_DEVICES = [
  { id: '1', name: 'Firebolt 093', isConnected: false },
];

// Generate random health data within realistic ranges
const generateHealthData = (): HealthData => {
  return {
    heartRate: Math.floor(Math.random() * (100 - 60) + 60), // Random between 60-100
    spO2: Math.floor(Math.random() * (100 - 95) + 95), // Random between 95-100
  };
};

export default function ConnectDeviceScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<DeviceInfo | null>(null);
  const [healthData, setHealthData] = useState<HealthData>(generateHealthData());

  useEffect(() => {
    loadSavedDevice();
  }, []);

  // Update health data when component mounts or when navigating back to the screen
  useEffect(() => {
    const updateData = () => {
      setHealthData(generateHealthData());
    };

    updateData(); // Initial update
    
    // Update when the screen comes into focus
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadSavedDevice = async () => {
    try {
      const savedDevice = await AsyncStorage.getItem(CONNECTED_DEVICE_KEY);
      if (savedDevice) {
        const parsedDevice = JSON.parse(savedDevice);
        setConnectedDevice(parsedDevice);
        // Generate new health data when device is loaded
        setHealthData(generateHealthData());
      }
    } catch (error) {
      console.error('Error loading saved device:', error);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setDevices([]);

    // Simulate device scanning
    setTimeout(() => {
      setDevices(MOCK_DEVICES);
      setIsScanning(false);
    }, 2000);
  };

  const connectToDevice = async (deviceInfo: DeviceInfo) => {
    try {
      // Simulate connection delay
      setIsScanning(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedDeviceInfo: DeviceInfo = {
        ...deviceInfo,
        isConnected: true
      };
      setConnectedDevice(updatedDeviceInfo);
      
      // Save connected device
      await AsyncStorage.setItem(CONNECTED_DEVICE_KEY, JSON.stringify(updatedDeviceInfo));
      
      Alert.alert('Success', `Connected to ${deviceInfo.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to device. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) return;

    try {
      await AsyncStorage.removeItem(CONNECTED_DEVICE_KEY);
      setConnectedDevice(null);
      Alert.alert('Success', 'Device disconnected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect device. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Connect Device',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Smart Watch</Text>
          <Text style={styles.subtitle}>Pair your device to sync health data</Text>
        </View>

        {connectedDevice ? (
          <View style={styles.connectedDeviceContainer}>
            <View style={styles.connectedDeviceCard}>
              <View style={styles.deviceIconContainer}>
                <Ionicons name="watch" size={40} color="#0ea5e9" />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{connectedDevice.name}</Text>
                <Text style={styles.connectionStatus}>Connected</Text>
              </View>
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={disconnectDevice}
              >
                <Ionicons name="power" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.syncStatusContainer}>
              <Text style={styles.syncStatusTitle}>Current Readings</Text>
              <View style={styles.syncMetrics}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIconContainer}>
                    <Ionicons name="heart" size={24} color="#ef4444" />
                  </View>
                  <Text style={styles.metricValue}>{healthData.heartRate}</Text>
                  <Text style={styles.metricUnit}>bpm</Text>
                  <Text style={styles.metricLabel}>Heart Rate</Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricIconContainer}>
                    <Ionicons name="pulse" size={24} color="#7c3aed" />
                  </View>
                  <Text style={styles.metricValue}>{healthData.spO2}</Text>
                  <Text style={styles.metricUnit}>%</Text>
                  <Text style={styles.metricLabel}>SpO2</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanningButton]}
              onPress={startScan}
              disabled={isScanning}
            >
              <View style={styles.scanButtonContent}>
                <Ionicons 
                  name={isScanning ? "radio" : "search"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </Text>
              </View>
              {isScanning && <ActivityIndicator color="white" />}
            </TouchableOpacity>

            <View style={styles.devicesContainer}>
              <Text style={styles.sectionTitle}>
                Available Devices ({devices.length})
              </Text>
              
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceCard}
                  onPress={() => connectToDevice(device)}
                >
                  <View style={styles.deviceIconContainer}>
                    <Ionicons name="watch-outline" size={24} color="#0ea5e9" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceId}>ID: {device.id}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#64748b" />
                </TouchableOpacity>
              ))}

              {!isScanning && devices.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="watch" size={64} color="#94a3b8" />
                  <Text style={styles.emptyText}>
                    No devices found
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Make sure your smart watch is nearby and in pairing mode
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#0284c7',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  devicesContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  deviceId: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  connectedDeviceContainer: {
    flex: 1,
    padding: 20,
  },
  connectedDeviceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionStatus: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncStatusContainer: {
    marginTop: 24,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  syncMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricUnit: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
}); 