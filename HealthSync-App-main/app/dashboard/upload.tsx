import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  uri: string;
  date: string;
  size: number;
}

const STORAGE_KEY = '@healthsync_reports';
const RECENT_REPORTS_KEY = '@healthsync_recent_reports';

export default function UploadReports() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedFiles();
  }, []);

  const loadSavedFiles = async () => {
    try {
      const savedFiles = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedFiles) {
        setUploads(JSON.parse(savedFiles));
      }
    } catch (error) {
      console.error('Error loading saved files:', error);
    }
    setLoading(false);
  };

  const saveFilesToStorage = async (files: UploadedFile[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files:', error);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        
        // Create a permanent copy in app's document directory
        const newFileName = `${Date.now()}-${file.name}`;
        const newFileUri = `${FileSystem.documentDirectory}${newFileName}`;
        
        await FileSystem.copyAsync({
          from: file.uri,
          to: newFileUri
        });

        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          uri: newFileUri,
          date: new Date().toISOString().split('T')[0],
          size: fileInfo.exists ? fileInfo.size || 0 : 0,
        };

        // Update uploads list
        const updatedUploads = [...uploads, newFile];
        setUploads(updatedUploads);
        await saveFilesToStorage(updatedUploads);

        // Add to recent reports
        const recentReport = {
          name: file.name,
          date: new Date().toISOString().split('T')[0],
          status: "Normal"
        };

        try {
          const existingReports = await AsyncStorage.getItem(RECENT_REPORTS_KEY);
          let recentReports = existingReports ? JSON.parse(existingReports) : [];
          
          // Add new report at the beginning and keep only last 5 reports
          recentReports = [recentReport, ...recentReports].slice(0, 5);
          
          await AsyncStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(recentReports));
        } catch (error) {
          console.error('Error updating recent reports:', error);
        }
        
        Alert.alert(
          'Success',
          'File uploaded successfully! View it in the Reports page.',
          [
            {
              text: 'View Reports',
              onPress: () => router.push('/dashboard/reports'),
            },
            {
              text: 'Upload Another',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const fileToDelete = uploads.find(file => file.id === fileId);
      if (fileToDelete) {
        await FileSystem.deleteAsync(fileToDelete.uri, { idempotent: true });
        const updatedUploads = uploads.filter(file => file.id !== fileId);
        setUploads(updatedUploads);
        await saveFilesToStorage(updatedUploads);

        // Also remove from recent reports
        const savedReports = await AsyncStorage.getItem(RECENT_REPORTS_KEY);
        if (savedReports) {
          const recentReports = JSON.parse(savedReports);
          const updatedRecentReports = recentReports.filter(
            (report: any) => report.name !== fileToDelete.name
          );
          await AsyncStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(updatedRecentReports));
        }

        Alert.alert('Success', 'File deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Reports</Text>
        <Text style={styles.subtitle}>Add and manage your health documents</Text>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.uploadCard} onPress={handleFilePick}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload" size={40} color="#0ea5e9" />
            </View>
            <Text style={styles.uploadTitle}>Select File to Upload</Text>
            <Text style={styles.uploadSubtext}>
              Supported formats: PDF, Images
            </Text>
          </TouchableOpacity>

          <View style={styles.recentUploadsContainer}>
            <Text style={styles.sectionTitle}>
              Recent Uploads ({uploads.length})
            </Text>

            {uploads.map((file) => (
              <View key={file.id} style={styles.fileCard}>
                <View style={styles.fileIconContainer}>
                  <Ionicons name="document-text" size={32} color="#0ea5e9" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileDetails}>
                    {file.date} • {formatFileSize(file.size)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteFile(file.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            
            {uploads.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={64} color="#94a3b8" />
                <Text style={styles.emptyText}>
                  No files uploaded
                </Text>
                <Text style={styles.emptySubtext}>
                  Your uploaded files will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.viewReportsButton} 
        onPress={() => router.push('/dashboard/reports')}
      >
        <Text style={styles.buttonText}>View All Reports</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  uploadCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  recentUploadsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  viewReportsButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 