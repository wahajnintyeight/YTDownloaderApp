import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { openDocumentTree } from 'react-native-saf-x';

interface DownloadSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DownloadSettingsModal: React.FC<DownloadSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    downloadPath,
    loadingPath,
    updateDownloadPath,
    resetDownloadPath,
    getDefaultDownloadPath,
  } = useDownloadManager();

  const handleChangeDownloadPath = async () => {
    try {
      if (Platform.OS === 'android') {
        // Use SAF to let user pick a directory
        const uri = await openDocumentTree(true);
        if (uri) {
          await updateDownloadPath(uri);
          Alert.alert('Success', 'Download location updated successfully');
        }
      } else {
        // For iOS, show a simple alert with default path
        Alert.alert(
          'Download Location',
          'Files will be saved to the app Documents folder',
        );
      }
    } catch (error) {
      console.error('Failed to change download path', error);
      Alert.alert('Error', 'Failed to change download location');
    }
  };

  const handleResetToDefault = async () => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset the download location to default?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetDownloadPath();
              Alert.alert('Success', 'Download location reset to default');
            } catch (error) {
              console.error('Failed to reset download path', error);
              Alert.alert('Error', 'Failed to reset download location');
            }
          },
        },
      ],
    );
  };

  const displayPath = downloadPath || 'Not set';
  const defaultPath = getDefaultDownloadPath();
  const isDefault = downloadPath === defaultPath || !downloadPath;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Download Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📂 Download Location</Text>

            <View style={styles.pathContainer}>
              <Text style={styles.pathLabel}>Current Location:</Text>
              <View style={styles.pathBox}>
                <Text style={styles.pathText} numberOfLines={3}>
                  {displayPath}
                </Text>
              </View>
              {isDefault && (
                <Text style={styles.defaultBadge}>Default Location</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleChangeDownloadPath}
              disabled={loadingPath}
            >
              {loadingPath ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>🔄 Change Location</Text>
              )}
            </TouchableOpacity>

            {!isDefault && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleResetToDefault}
                disabled={loadingPath}
              >
                {loadingPath ? (
                  <ActivityIndicator color="#666" />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    ↺ Reset to Default
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Information</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                • Downloaded videos are automatically saved to your chosen
                location
              </Text>
              <Text style={styles.infoText}>
                • The app remembers your preference
              </Text>
              <Text style={styles.infoText}>
                • You can change this location anytime
              </Text>
              {Platform.OS === 'android' && (
                <Text style={styles.infoText}>
                  • On Android, you can select any folder accessible to the app
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={onClose}
          disabled={loadingPath}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pathContainer: {
    marginBottom: 16,
  },
  pathLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  pathBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  pathText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
