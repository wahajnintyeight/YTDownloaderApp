import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { useTheme } from '../hooks/useTheme';
import { useDialog } from '../hooks/useDialog';
import { useScreenTracking } from '../hooks/useScreenTracking';
import { ScreenNames } from '../constants/ScreenNames';
import { FolderIcon, ExternalLinkIcon, ChevronLeftIcon, SearchIcon } from '../components/icons/ModernIcons';
import { openDirectory, DirectoryOpenResult } from '../utils/openFile';
import { getSettingsScreenStyles } from './SettingsScreen.styles';
import RNFS from 'react-native-fs';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { showDialog } = useDialog();
  const { width, height } = useWindowDimensions();
  const {
    downloadPath,
    loadingPath,
    updateDownloadPath,
    resetDownloadPath,
    getDefaultDownloadPath,
  } = useDownloadManager();

  // Track screen view in Firebase Analytics
  useScreenTracking(ScreenNames.Settings);

  const handleChangeDownloadPath = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const { openDocumentTree } = await import('react-native-saf-x');
        const detail = await openDocumentTree(true);
        if (detail && typeof detail.uri === 'string') {
          // Verify we have permission to the selected folder
          const { hasPermission } = await import('react-native-saf-x');
          const hasAccess = await hasPermission(detail.uri);
          
          if (!hasAccess) {
            showDialog({
              type: 'error',
              title: 'Permission Required',
              message: 'Please grant permission to access the selected folder. Try selecting the folder again.',
              buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
              dismissible: true,
            });
            return;
          }

          await updateDownloadPath(detail.uri);
          showDialog({
            type: 'success',
            title: 'Success',
            message: 'Download location updated successfully. Your downloads will be saved to the selected folder.',
            buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
            dismissible: true,
          });
        } else {
          // User cancelled folder selection
          console.log('User cancelled folder selection');
        }
      } else {
        showDialog({
          type: 'info',
          title: 'Download Location',
          message: 'Files will be saved to the app Documents folder',
          buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
          dismissible: true,
        });
      }
    } catch (error: any) {
      console.error('Failed to change download path', error);
      const errorMessage = error?.message || 'Failed to change download location';
      showDialog({
        type: 'error',
        title: 'Error',
        message: errorMessage.includes('permission') || errorMessage.includes('Permission')
          ? 'Permission denied. Please try selecting the folder again and grant access when prompted.'
          : errorMessage,
        buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
        dismissible: true,
      });
    }
  }, [updateDownloadPath, showDialog]);

  const handleResetToDefault = useCallback(async () => {
    showDialog({
      type: 'warning',
      title: 'Reset to Default',
      message: 'Are you sure you want to reset the download location to default?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => { } },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDownloadPath();
              showDialog({
                type: 'success',
                title: 'Success',
                message: 'Download location reset to default',
                buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
                dismissible: true,
              });
            } catch (error) {
              console.error('Failed to reset download path', error);
              showDialog({
                type: 'error',
                title: 'Error',
                message: 'Failed to reset download location',
                buttons: [{ text: 'OK', style: 'default', onPress: () => { } }],
                dismissible: true,
              });
            }
          },
        },
      ],
      dismissible: true,
    });
  }, [resetDownloadPath, showDialog]);

  const handleOpenDirectory = useCallback(async () => {
    try {
      const dir = downloadPath || getDefaultDownloadPath();
      const isSaf = dir.startsWith('content://');

      console.log(`📂 Opening configured download directory: ${dir}`);

      if (!isSaf) {
        // File system path - use RNFS
        const exists = await RNFS.exists(dir);
        if (!exists) {
          await RNFS.mkdir(dir);
        }
        try {
          await openDirectory(dir);
          // If openDirectory succeeds, it means we opened the directory
          return;
        } catch (openError: any) {
          // If openDirectory fails with a path message, show it as info (not error)
          const errorMessage = openError?.message || String(openError);
          if (errorMessage.includes('Files are saved to:') || errorMessage.includes('Due to Android security')) {
            // This is expected on Android - show as info dialog
            showDialog({
              type: 'info',
              title: 'Download Location',
              message: errorMessage,
              buttons: [
                { text: 'OK', style: 'default', onPress: () => { } },
              ],
              dismissible: true,
            });
            return;
          }
          // Otherwise, throw to show error dialog
          throw openError;
        }
      }

      // SAF: Check permission and verify access
      try {
        const { hasPermission } = await import('react-native-saf-x');
        const ok = await hasPermission(dir);
        if (!ok) {
          // Re-persist if needed
          showDialog({
            type: 'warning',
            title: 'Permission Required',
            message: 'Please re-select the download folder to refresh permissions.',
            buttons: [
              { text: 'Cancel', style: 'cancel', onPress: () => { } },
              { text: 'Select Folder', style: 'default', onPress: handleChangeDownloadPath },
            ],
            dismissible: true,
          });
          return;
        }
        // Try to open the directory using openDirectory helper
        const result = await openDirectory(dir) as DirectoryOpenResult | void;

        // Check if we got a result object (means directory couldn't be opened automatically)
        if (result && typeof result === 'object' && 'success' in result) {
          if (!result.success) {
            // Show appropriate dialog based on result type
            if (result.infoMessage) {
              showDialog({
                type: 'info',
                title: 'Folder Location',
                message: result.infoMessage,
                buttons: [
                  { text: 'OK', style: 'default', onPress: () => { } },
                ],
                dismissible: true,
              });
            } else if (result.errorMessage) {
              showDialog({
                type: 'error',
                title: 'Error',
                message: result.errorMessage,
                buttons: [
                  { text: 'Cancel', style: 'cancel', onPress: () => { } },
                  { text: 'Change Location', style: 'default', onPress: handleChangeDownloadPath },
                ],
                dismissible: true,
              });
            }
          }
          // If success is true, directory was opened successfully
          return;
        }
        // If result is undefined/void, directory was opened successfully
        return;
      } catch (safError: any) {
        // Only log as error if it's not an informational message
        const isInfoMessage = safError?.isInfoMessage || safError?.message?.startsWith('📂');
        if (!isInfoMessage) {
          console.error('SAF operation failed:', safError);
          showDialog({
            type: 'error',
            title: 'Cannot Access Folder',
            message: 'Unable to access the selected folder. Please choose a different location.',
            buttons: [
              { text: 'Cancel', style: 'cancel', onPress: () => { } },
              { text: 'Change Location', style: 'default', onPress: handleChangeDownloadPath },
            ],
            dismissible: true,
          });
        } else {
          // Re-throw informational messages to be handled by outer catch
          throw safError;
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to open download directory. Please check your download location settings.';

      // Check if this is an informational message (not a real error)
      const isInfoMessage = error?.isInfoMessage || errorMessage.startsWith('📂');

      // Only log as error if it's not an informational message
      if (!isInfoMessage) {
        console.error('Failed to open directory:', error);
      }

      if (isInfoMessage) {
        // Show as informational dialog with just OK button
        showDialog({
          type: 'info',
          title: 'Folder Location',
          message: errorMessage,
          buttons: [
            { text: 'OK', style: 'default' as const, onPress: () => { } },
          ],
          dismissible: true,
        });
      } else {
        // Show as error dialog with Cancel and Change Location buttons
        showDialog({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          buttons: [
            { text: 'Cancel', style: 'cancel' as const, onPress: () => { } },
            { text: 'Change Location', style: 'default' as const, onPress: handleChangeDownloadPath },
          ],
          dismissible: true,
        });
      }
    }
  }, [downloadPath, getDefaultDownloadPath, showDialog, handleChangeDownloadPath]);

  const displayPath = downloadPath || 'Not set';
  const defaultPath = getDefaultDownloadPath();
  const isDefault = downloadPath === defaultPath || !downloadPath;

  const styles = useMemo(() => getSettingsScreenStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <ChevronLeftIcon
                size={20}
                color={theme.colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>
                Manage your download preferences
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FolderIcon
                size={20}
                color={theme.colors.secondary}
                strokeWidth={2}
              />
              <Text style={styles.sectionTitle}>Download Location</Text>
            </View>

            <View style={styles.pathContainer}>
              <Text style={styles.pathLabel}>Current location</Text>
              <View style={styles.pathBox}>
                <Text style={styles.pathText} numberOfLines={3}>
                  {displayPath}
                </Text>
              </View>
              {isDefault && (
                <Text style={styles.defaultBadge}>Default location</Text>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleChangeDownloadPath}
                disabled={loadingPath}
              >
                {loadingPath ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <FolderIcon size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.buttonText}>Change Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleOpenDirectory}
                disabled={loadingPath}
              >
                <ExternalLinkIcon
                  size={16}
                  color={theme.colors.secondary}
                  strokeWidth={2}
                />
                <Text style={[styles.secondaryButtonText, { color: theme.colors.secondary }]}>
                  Open Directory
                </Text>
              </TouchableOpacity>

              {!isDefault && (
                <TouchableOpacity
                  style={[styles.button, styles.tertiaryButton]}
                  onPress={handleResetToDefault}
                  disabled={loadingPath}
                >
                  {loadingPath ? (
                    <ActivityIndicator color={theme.colors.textSecondary} size="small" />
                  ) : (
                    <Text style={styles.tertiaryButtonText}>Reset to Default</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>



        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
