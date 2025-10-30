import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useDialog } from '../hooks/useDialog';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { showDialog } = useDialog();
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
        const { openDocumentTree } = await import('react-native-saf-x');
        const detail = await openDocumentTree(true);
        if (detail && typeof detail.uri === 'string') {
          await updateDownloadPath(detail.uri);
          showDialog({
            type: 'success',
            title: 'Success',
            message: 'Download location updated successfully',
            buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
            dismissible: true,
          });
        }
      } else {
        showDialog({
          type: 'info',
          title: 'Download Location',
          message: 'Files will be saved to the app Documents folder',
          buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
          dismissible: true,
        });
      }
    } catch (error) {
      console.error('Failed to change download path', error);
      showDialog({
        type: 'error',
        title: 'Error',
        message: 'Failed to change download location',
        buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
        dismissible: true,
      });
    }
  };

  const handleResetToDefault = async () => {
    showDialog({
      type: 'warning',
      title: 'Reset to Default',
      message: 'Are you sure you want to reset the download location to default?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
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
                buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
                dismissible: true,
              });
            } catch (error) {
              console.error('Failed to reset download path', error);
              showDialog({
                type: 'error',
                title: 'Error',
                message: 'Failed to reset download location',
                buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
                dismissible: true,
              });
            }
          },
        },
      ],
      dismissible: true,
    });
  };

  const displayPath = downloadPath || 'Not set';
  const defaultPath = getDefaultDownloadPath();
  const isDefault = downloadPath === defaultPath || !downloadPath;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    pathContainer: {
      marginBottom: theme.spacing.sm,
    },
    pathLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      fontWeight: '500',
    },
    pathBox: {
      backgroundColor: isDark ? '#0f0f0f' : theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    pathText: {
      fontSize: 13,
      color: theme.colors.text,
      fontFamily: 'monospace',
    },
    defaultBadge: {
      fontSize: 12,
      color: theme.colors.success,
      fontWeight: '500',
    },
    button: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 6,
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    infoBox: {
      backgroundColor: isDark ? '#0a0f14' : '#eef6ff',
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      padding: theme.spacing.sm,
      borderRadius: 4,
    },
    infoText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 18,
    },
  }), [theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top || 16 }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download location</Text>

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

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleChangeDownloadPath}
            disabled={loadingPath}
          >
            {loadingPath ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Change location</Text>
            )}
          </TouchableOpacity>

          {!isDefault && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleResetToDefault}
              disabled={loadingPath}
            >
              {loadingPath ? (
                <ActivityIndicator color={theme.colors.textSecondary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Reset to default</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • Downloaded videos are automatically saved to your chosen location
            </Text>
            <Text style={styles.infoText}>• The app remembers your preference</Text>
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
    </View>
  );
};
