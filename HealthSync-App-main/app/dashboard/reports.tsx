import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { usePathname } from 'expo-router';
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

export default function Reports() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Load files whenever the reports page becomes active
    if (pathname === '/dashboard/reports') {
      loadUploadedFiles();
    }
  }, [pathname]);

  const loadUploadedFiles = async () => {
    try {
      const savedFiles = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedFiles) {
        setUploadedFiles(JSON.parse(savedFiles));
      }
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
    setLoading(false);
  };

  const shareUploadedFile = async (file: UploadedFile) => {
    try {
      await Sharing.shareAsync(file.uri, {
        mimeType: file.type,
        dialogTitle: `Share ${file.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
      console.error(error);
    }
  };

  const previewFile = (file: UploadedFile) => {
    setSelectedFile(file);
    setPreviewVisible(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteFile = async (file: UploadedFile) => {
    try {
      await FileSystem.deleteAsync(file.uri, { idempotent: true });
      const updatedFiles = uploadedFiles.filter(f => f.id !== file.id);
      setUploadedFiles(updatedFiles);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));

      // Also remove from recent reports
      const savedReports = await AsyncStorage.getItem(RECENT_REPORTS_KEY);
      if (savedReports) {
        const recentReports = JSON.parse(savedReports);
        const updatedRecentReports = recentReports.filter(
          (report: any) => report.name !== file.name
        );
        await AsyncStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(updatedRecentReports));
      }

      Alert.alert('Success', 'File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file. Please try again.');
    }
  };

  const confirmDelete = (file: UploadedFile) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => deleteFile(file),
          style: 'destructive'
        }
      ]
    );
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
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>View and manage your health reports</Text>
      </View>
      
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file) => (
              <TouchableOpacity 
                key={file.id} 
                style={styles.fileCard}
                onPress={() => previewFile(file)}
              >
                <View style={styles.fileIconContainer}>
                  <Ionicons name="document-text" size={32} color="#0ea5e9" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileDetails}>
                    {file.date} • {formatFileSize(file.size)}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      shareUploadedFile(file);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      confirmDelete(file);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyText}>
                No reports found
              </Text>
              <Text style={styles.emptySubtext}>
                Upload your health reports to keep them organized
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={previewVisible}
        onRequestClose={() => setPreviewVisible(false)}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="document-text" size={24} color="#0ea5e9" />
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedFile?.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {selectedFile && (
            <WebView
              source={{ uri: selectedFile.uri }}
              style={styles.webview}
              onError={() => {
                Alert.alert('Error', 'Unable to preview this file type');
                setPreviewVisible(false);
              }}
            />
          )}
        </View>
      </Modal>
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
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#0ea5e9',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 40,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#64748b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  webview: {
    flex: 1,
  },
}); 