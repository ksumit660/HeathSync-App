import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { 
  Home,
  FileText,
  Upload,
  Bluetooth,
  Calendar,
  LogOut
} from 'lucide-react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>HealthSync</Text>
        <Text style={styles.drawerSubtitle}>Patient Dashboard</Text>
      </View>
      <DrawerItem
        label="Home"
        icon={({ color, size }: { color: string; size: number }) => (
          <Home color={color} size={size} />
        )}
        onPress={() => props.navigation.navigate('index')}
      />
      <DrawerItem
        label="View Reports"
        icon={({ color, size }: { color: string; size: number }) => (
          <FileText color={color} size={size} />
        )}
        onPress={() => props.navigation.navigate('reports')}
      />
      <DrawerItem
        label="Upload Reports"
        icon={({ color, size }: { color: string; size: number }) => (
          <Upload color={color} size={size} />
        )}
        onPress={() => props.navigation.navigate('upload')}
      />
      <DrawerItem
        label="Connect Device"
        icon={({ color, size }: { color: string; size: number }) => (
          <Bluetooth color={color} size={size} />
        )}
        onPress={() => props.navigation.navigate('connect-device')}
      />
      <DrawerItem
        label="Book Appointment"
        icon={({ color, size }: { color: string; size: number }) => (
          <Calendar color={color} size={size} />
        )}
        onPress={() => props.navigation.navigate('appointment')}
      />
      <View style={styles.drawerFooter}>
        <DrawerItem
          label="Logout"
          icon={({ color, size }: { color: string; size: number }) => (
            <LogOut color={color} size={size} />
          )}
          onPress={() => router.replace('/')}
          labelStyle={{ color: '#ef4444' }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DashboardLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a237e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerActiveBackgroundColor: '#e8eaf6',
        drawerActiveTintColor: '#1a237e',
        drawerInactiveTintColor: '#1f2937',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerLabel: 'Home',
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: 'View Reports',
        }}
      />
      <Drawer.Screen
        name="upload"
        options={{
          title: 'Upload Reports',
        }}
      />
      <Drawer.Screen
        name="connect-device"
        options={{
          title: 'Connect Device',
        }}
      />
      <Drawer.Screen
        name="appointment"
        options={{
          title: 'Book Appointment',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
}); 