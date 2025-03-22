declare module 'expo-bluetooth' {
  export interface BluetoothScanOptions {
    allowDuplicates?: boolean;
    timeoutMs?: number;
  }

  export interface PermissionResponse {
    granted: boolean;
    status: 'granted' | 'denied' | 'undetermined';
  }

  export function requestPermissionsAsync(): Promise<PermissionResponse>;
  
  export function startScanningAsync(
    options: BluetoothScanOptions,
    callback: (device: { id: string; name: string | null }) => void
  ): Promise<void>;

  export function connectToDeviceAsync(deviceId: string): Promise<void>;
  
  export function disconnectFromDeviceAsync(deviceId: string): Promise<void>;
  
  export function subscribeToCharacteristicAsync(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    listener: (data: { value: number; timestamp: number }) => void
  ): Promise<void>;
} 