import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { Download, DownloadStatus } from '../types/video';
import SwipeableDownloadItem from '../components/SwipeableDownloadItem';
import { useDialog } from '../hooks/useDialog';
import { SettingsIcon } from '../components/icons/ModernIcons';

// Removed DownloadItem component - now using SwipeableDownloadItem

const DownloadsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { downloads, cancelDownload, deleteDownload, forceCleanupAllDownloads } =
    useDownloads();
  const { showDialog } = useDialog();
  // removed unused navigation

  const handleForceCleanup = () => {
    showDialog({
      type: 'warning',
      title: 'Force Cleanup',
      message:
        'This will cancel all active downloads and clear stuck connections. Continue?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: () => {
            forceCleanupAllDownloads();
            showDialog({
              type: 'success',
              title: 'Success',
              message: 'All downloads cleaned up successfully',
              buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
              dismissible: true,
            });
          },
        },
      ],
      dismissible: true,
    });
  };

  const activeDownloads = downloads.filter(
    d => d.status === 'pending' || d.status === 'downloading',
  ).length;

  const getStatusColor = useCallback((status: DownloadStatus): string => {
    switch (status) {
      case 'downloading':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.textSecondary;
      case 'pending':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  }, [theme.colors.primary, theme.colors.success, theme.colors.error, theme.colors.textSecondary]);

  const getStatusText = useCallback((status: DownloadStatus): string => {
    switch (status) {
      case 'downloading':
        return 'Downloading';
      case 'completed':
        return 'Done';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    cleanupButton: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    cleanupButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
    },
    downloadItem: {
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      borderRadius: 10,
      overflow: 'hidden',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 0.5,
      },
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    thumbnail: {
      width: 56,
      height: 32,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      marginBottom: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 11,
      fontWeight: '500',
    },
    statusContainer: {
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusLabel: {
      fontSize: 10,
      fontWeight: '600',
    },
    progressSection: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    cancelButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 4,
      paddingVertical: 6,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 11,
      fontWeight: '600',
    },
    messageContainer: {
      marginHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: 4,
    },
    messageText: {
      fontSize: 11,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    listContent: {
      paddingVertical: theme.spacing.xs,
    },
  }), [theme]);

  const renderDownloadItem = useCallback(
    ({ item }: { item: Download }) => {
      const statusColor = getStatusColor(item.status);
      const statusText = getStatusText(item.status);
      return (
        <SwipeableDownloadItem
          item={item}
          onCancel={cancelDownload}
          onDelete={deleteDownload}
          statusColor={statusColor}
          statusText={statusText}
          theme={theme}
          styles={styles}
        />
      );
    },
    [cancelDownload, deleteDownload, theme, styles, getStatusColor, getStatusText],
  );

  const keyExtractor = useCallback((item: Download) => item.id, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Downloads Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Start downloading videos to see them here
      </Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />

        <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Downloads</Text>
            <Text style={styles.headerSubtitle}>
              {downloads.length} {downloads.length === 1 ? 'item' : 'items'}
              {activeDownloads > 0 && ` • ${activeDownloads} active`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            {activeDownloads > 0 && (
              <TouchableOpacity
                style={[styles.cleanupButton, { borderColor: theme.colors.error }]}
                onPress={handleForceCleanup}
              >
                <Text style={[styles.cleanupButtonText, { color: theme.colors.error }]}>Cleanup</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              accessibilityLabel="Open settings"
              onPress={() => navigation.navigate('Settings' as never)}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <SettingsIcon size={20} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        {downloads.length > 0 ? (
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={keyExtractor}
            extraData={downloads}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            initialNumToRender={8}
            windowSize={10}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
          />
        ) : (
          renderEmptyState()
        )}
      </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default DownloadsScreen;
