import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { useScreenTracking } from '../hooks/useScreenTracking';
import { ScreenNames } from '../constants/ScreenNames';
import { Download, DownloadStatus } from '../types/video';
import SwipeableDownloadItem from '../components/SwipeableDownloadItem';
import DownloadItemMenu from '../components/DownloadItemMenu';
import LottieAnimation from '../components/LottieAnimation';
import { useDialog } from '../hooks/useDialog';
import { SettingsIcon } from '../components/icons/ModernIcons';
import { useEffect, useState } from 'react';
import { getDownloadsScreenStyles } from './DownloadsScreen.styles';
import { openDirectory } from '../utils/openFile';
import RNFS from 'react-native-fs';
import { AppBannerAd } from '../components/AppBannerAd';

// Removed DownloadItem component - now using SwipeableDownloadItem

const DownloadsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const isLandscape = width > height;
  const {
    downloads,
    cancelDownload,
    deleteDownload,
    retryDownloadByVideoId,
    forceCleanupAllDownloads,
  } = useDownloads();
  const { downloadPath, loadingPath } = useDownloadManager();
  const { showDialog } = useDialog();

  // Track screen view in Firebase Analytics
  useScreenTracking(ScreenNames.Downloads);

  // Debug: Log when downloadPath changes
  useEffect(() => {
    console.log(`📂 [DOWNLOADS SCREEN] downloadPath state changed:`, downloadPath);
    console.log(`📂 [DOWNLOADS SCREEN] loadingPath:`, loadingPath);
  }, [downloadPath, loadingPath]);

  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<Download | null>(null);

  // Filter downloads by status
  const activeDownloadsList = useMemo(
    () => downloads.filter(d => d.status === 'downloading'),
    [downloads],
  );

  const queuedDownloadsList = useMemo(
    () => downloads.filter(d => d.status === 'pending'),
    [downloads],
  );

  const completedDownloadsList = useMemo(
    () =>
      downloads.filter(d =>
        ['completed', 'failed', 'cancelled'].includes(d.status),
      ),
    [downloads],
  );

  // Log when screen mounts and when downloads data changes
  useEffect(() => {
    console.log('📱 [DOWNLOADS SCREEN] Screen mounted/updated');
    console.log(`📊 [DOWNLOADS SCREEN] Total downloads: ${downloads.length}`);
    console.log(`📋 [DOWNLOADS SCREEN] Download breakdown:`, {
      active: activeDownloadsList.length,
      queued: queuedDownloadsList.length,
      completed: completedDownloadsList.length,
    });
    if (downloads.length > 0) {
      console.log(
        `📝 [DOWNLOADS SCREEN] Download list:`,
        downloads
          .map(d => `${d.id} - ${d.video.title} (${d.status})`)
          .join('\n  '),
      );
    }
  }, [
    downloads,
    activeDownloadsList,
    queuedDownloadsList,
    completedDownloadsList,
  ]);

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

  // Build sections for SectionList
  const sections = useMemo(() => {
    const result = [];

    if (activeDownloadsList.length > 0) {
      result.push({
        title: 'Active Downloads',
        data: activeDownloadsList,
      });
    }

    if (queuedDownloadsList.length > 0) {
      result.push({
        title: `Queue (${queuedDownloadsList.length})`,
        data: queuedDownloadsList,
      });
    }

    if (completedDownloadsList.length > 0) {
      result.push({
        title: 'Completed',
        data: completedDownloadsList,
      });
    }

    return result;
  }, [activeDownloadsList, queuedDownloadsList, completedDownloadsList]);

  const totalActiveDownloads =
    activeDownloadsList.length + queuedDownloadsList.length;

  const getStatusColor = useCallback(
    (status: DownloadStatus): string => {
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
    },
    [
      theme.colors.primary,
      theme.colors.success,
      theme.colors.error,
      theme.colors.textSecondary,
    ],
  );

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

  const styles = useMemo(() => getDownloadsScreenStyles(theme), [theme]);

  // When user taps a completed download, open its directory (not the file)
  // Move handlePress below handleOpenDirectory to avoid use-before-declare error


  const handleOpenDirectory = useCallback(
    async () => {
      try {
        // Use the stored download path from settings instead of trying to extract from file paths
        console.log('📂 Download path from hook:', downloadPath);
        
        // If downloadPath is null (not loaded yet), try reading directly from storage
        let directoryToOpen = downloadPath;
        if (!directoryToOpen) {
          try {
            const { storageService } = await import('../services/storageService');
            directoryToOpen = await storageService.getDownloadPath();
            console.log('📂 Loaded download path directly from storage:', directoryToOpen);
          } catch (error) {
            console.warn('Failed to load path from storage, using default', error);
          }
        }
        
        // Fallback to default if still null
        directoryToOpen = directoryToOpen || `${RNFS.DownloadDirectoryPath}/YTDownloader`;
        const isSaf = directoryToOpen.startsWith('content://');

        console.log(`📂 Opening configured download directory: ${directoryToOpen}`);

        // Only check existence for filesystem paths, not SAF URIs
        if (!isSaf) {
          const exists = await RNFS.exists(directoryToOpen);
          if (!exists) {
            showDialog({
              type: 'warning',
              title: 'Directory Not Found',
              message: 'The configured download directory does not exist. Please check your download location in Settings.',
              buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
              dismissible: true,
            });
            return;
          }
        }

        // Open the configured download directory (openDirectory handles both SAF and filesystem)
        await openDirectory(directoryToOpen);
      } catch (error) {
        console.error('Failed to open directory:', error);
        showDialog({
          type: 'error',
          title: 'Error',
          message: 'Failed to open download directory. Please check your download location in Settings.',
          buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
          dismissible: true,
        });
      }
    },
    [downloadPath, showDialog],
  );

  // Now define handlePress after handleOpenDirectory
  const handlePress = useCallback(
    (item: Download) => {
      if (item.status === 'completed') {
        handleOpenDirectory();
      }
    },
    [handleOpenDirectory],
  );

  const handleMenuPress = useCallback(
    (item: Download, position: { x: number; y: number }) => {
      setSelectedItem(item);
      setMenuPosition(position);
      setMenuVisible(true);
    },
    [],
  );

  const handleRetry = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await retryDownloadByVideoId(selectedItem.video.id);
      showDialog({
        type: 'success',
        title: 'Download Restarted',
        message:
          'The download has been restarted. Previous entries have been removed.',
        buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
        dismissible: true,
      });
    } catch (error) {
      console.error('Retry failed:', error);
      showDialog({
        type: 'error',
        title: 'Retry Failed',
        message: 'Failed to restart the download. Please try again.',
        buttons: [{ text: 'OK', style: 'default', onPress: () => {} }],
        dismissible: true,
      });
    }
  }, [selectedItem, retryDownloadByVideoId, showDialog]);

  const getMenuItems = useCallback(() => {
    if (!selectedItem) return [];

    const items = [];

    // Add Retry option for failed downloads
    if (selectedItem.status === 'failed') {
      items.push({
        label: 'Retry Download',
        onPress: handleRetry,
      });
    }

    // Add Open Directory option for completed downloads
    if (selectedItem.status === 'completed') {
      items.push({
        label: 'Open Directory',
        onPress: () => handleOpenDirectory(),
      });
    }

    // Always add Delete option
    items.push({
      label: 'Delete',
      onPress: () => deleteDownload(selectedItem.id),
      destructive: true,
    });

    return items;
  }, [selectedItem, handleRetry, handleOpenDirectory, deleteDownload]);

  const renderDownloadItem = useCallback(
    ({ item }: { item: Download }) => {
      const statusColor = getStatusColor(item.status);
      const statusText = getStatusText(item.status);
      return (
        <SwipeableDownloadItem
          item={item}
          onCancel={cancelDownload}
          onDelete={deleteDownload}
          onMenuPress={handleMenuPress}
          onPress={handlePress}
          statusColor={statusColor}
          statusText={statusText}
          theme={theme}
          styles={styles}
        />
      );
    },
    [
      cancelDownload,
      deleteDownload,
      handleMenuPress,
      handlePress,
      theme,
      styles,
      getStatusColor,
      getStatusText,
    ],
  );

  const keyExtractor = useCallback((item: Download) => item.id, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={[
            styles.sectionHeaderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {section.title}
        </Text>
      </View>
    ),
    [theme, styles],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LottieAnimation 
        type="empty" 
        visible={true}
        size={180}
        loop={true}
        autoPlay={true}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Downloads Yet
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
      >
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
                {totalActiveDownloads > 0 &&
                  ` • ${totalActiveDownloads} active`}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}
            >
              {totalActiveDownloads > 0 && (
                <TouchableOpacity
                  style={[
                    styles.cleanupButton,
                    { borderColor: theme.colors.error },
                  ]}
                  onPress={handleForceCleanup}
                >
                  <Text
                    style={[
                      styles.cleanupButtonText,
                      { color: theme.colors.error },
                    ]}
                  >
                    Cleanup
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                accessibilityLabel="Open settings"
                onPress={() => navigation.navigate('Settings' as never)}
                style={{ paddingHorizontal: 8, paddingVertical: 6 }}
              >
                <SettingsIcon
                  size={20}
                  color={theme.colors.text}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.listContainer}>
          {sections.length > 0 ? (
            <SectionList
              sections={sections}
              renderItem={renderDownloadItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              initialNumToRender={5}
              windowSize={5}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={200}
              removeClippedSubviews
              stickySectionHeadersEnabled={false}
            />
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Dropdown Menu */}
        <DownloadItemMenu
          visible={menuVisible}
          items={getMenuItems()}
          onClose={() => setMenuVisible(false)}
          theme={theme}
          position={menuPosition}
        />

        {/* Banner Ad */}
        <AppBannerAd />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default DownloadsScreen;
