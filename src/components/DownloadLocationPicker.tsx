import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import { openDocumentTree } from 'react-native-saf-x';
import { useTheme } from '../hooks/useTheme';

interface DownloadLocationPickerProps {
  visible: boolean;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

interface StorageLocation {
  name: string;
  path: string;
  description: string;
  icon: string;
}

const DownloadLocationPicker: React.FC<DownloadLocationPickerProps> = ({
  visible,
  onSelect,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [locations, setLocations] = useState<StorageLocation[]>([]);

  const handleNativeAndroidPicker = useCallback(async () => {
    try {
      // Open Android's native directory picker (SAF)
      const result = await openDocumentTree(true); // true = persist permissions
      
      if (result && result.uri) {
        // User selected a folder, return the URI
        onSelect(result.uri);
      } else {
        // User cancelled
        onCancel();
      }
    } catch (error) {
      console.error('Error opening native picker:', error);
      Alert.alert(
        'Error',
        'Failed to open folder picker. Please try again.',
        [{ text: 'OK', onPress: onCancel }]
      );
    } finally {
      // Ensure processing flag is reset
      isProcessingRef.current = false;
    }
  }, [onSelect, onCancel]);

  // Gate to avoid reopening the native picker multiple times in a row
  const hasPromptedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (visible && !hasPromptedRef.current && !isProcessingRef.current) {
        hasPromptedRef.current = true;
        isProcessingRef.current = true;
        // Defer to next tick to avoid re-entrancy during render
        const timeoutId = setTimeout(() => {
          handleNativeAndroidPicker().finally(() => {
            isProcessingRef.current = false;
          });
        }, 100);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
      if (!visible) {
        // Reset gate when modal is hidden, but wait a bit to prevent rapid re-triggers
        const timeoutId = setTimeout(() => {
          hasPromptedRef.current = false;
          isProcessingRef.current = false;
        }, 500);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }
    } else if (visible) {
      // Fallback to custom picker for non-Android platforms
      loadStorageLocations();
    }
  }, [visible, handleNativeAndroidPicker]);

  const loadStorageLocations = async () => {
    const availableLocations: StorageLocation[] = [];

    // Default Downloads folder
    availableLocations.push({
      name: 'Downloads',
      path: `${RNFS.DownloadDirectoryPath}/YTDownloader`,
      description: 'Default downloads folder',
      icon: '📥',
    });

    // Documents folder
    if (RNFS.DocumentDirectoryPath) {
      availableLocations.push({
        name: 'Documents',
        path: `${RNFS.DocumentDirectoryPath}/YTDownloader`,
        description: 'App documents folder',
        icon: '📄',
      });
    }

    // External storage (Android)
    if (Platform.OS === 'android' && RNFS.ExternalStorageDirectoryPath) {
      availableLocations.push({
        name: 'External Storage',
        path: `${RNFS.ExternalStorageDirectoryPath}/YTDownloader`,
        description: 'External SD card or storage',
        icon: '💾',
      });
    }

    // Music folder (if available)
    if (Platform.OS === 'android') {
      availableLocations.push({
        name: 'Music',
        path: `${RNFS.DownloadDirectoryPath}/../Music/YTDownloader`,
        description: 'Music library folder',
        icon: '🎵',
      });
    }

    setLocations(availableLocations);
  };

  const handleSelectLocation = async (location: StorageLocation) => {
    try {
      // Check if directory exists, create if not
      const exists = await RNFS.exists(location.path);
      if (!exists) {
        await RNFS.mkdir(location.path);
      }

      // Verify we can write to this location
      const testFile = `${location.path}/.test`;
      await RNFS.writeFile(testFile, 'test', 'utf8');
      await RNFS.unlink(testFile);

      onSelect(location.path);
    } catch (error) {
      console.error('Error selecting location:', error);
      Alert.alert(
        'Permission Error',
        'Cannot write to this location. Please choose another folder or grant storage permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: '90%',
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    locationIcon: {
      fontSize: 32,
      marginRight: theme.spacing.md,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    locationDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    locationPath: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    footer: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    infoBox: {
      backgroundColor: theme.colors.primary + '20',
      padding: theme.spacing.md,
      borderRadius: 8,
      marginBottom: theme.spacing.md,
    },
    infoText: {
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
    },
  });

  // On Android, native picker is shown immediately via useEffect
  // This modal is only shown for iOS/other platforms as fallback
  if (Platform.OS === 'android') {
    return null; // Native picker handles everything
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Download Location</Text>
            <Text style={styles.headerSubtitle}>
              Select where you want to save your downloads
            </Text>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Files will be saved in a "YTDownloader" subfolder at the
                selected location
              </Text>
            </View>

            {locations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.locationItem}
                onPress={() => handleSelectLocation(location)}
              >
                <Text style={styles.locationIcon}>{location.icon}</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationDescription}>
                    {location.description}
                  </Text>
                  <Text style={styles.locationPath} numberOfLines={1}>
                    {location.path}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DownloadLocationPicker;
