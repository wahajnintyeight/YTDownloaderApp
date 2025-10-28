import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { Download, DownloadStatus } from '../types/video';
// removed unused imports
import DownloadProgress from '../components/DownloadProgress';

type DownloadItemProps = {
  item: Download;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  statusColor: string;
  statusText: string;
  theme: any;
  s: any;
};

const DownloadItem: React.FC<DownloadItemProps> = ({
  item,
  onCancel,
  onDelete,
  statusColor,
  statusText,
  theme,
  s,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    Alert.alert(
      'Remove Download',
      `Remove "${item.video.title.substring(0, 40)}${
        item.video.title.length > 40 ? '...' : ''
      }"?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
    );
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={[s.downloadItem, { backgroundColor: theme.colors.surface }]}
      >
        <View style={s.cardContent}>
          <Image
            source={{ uri: item.video.thumbnailUrl }}
            style={s.thumbnail}
            resizeMode="cover"
          />

          <View style={s.infoContainer}>
            <Text
              style={[s.videoTitle, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.video.title}
            </Text>

            <View style={s.metaRow}>
              <Text style={[s.metaText, { color: theme.colors.textSecondary }]}>
                {item.format.toUpperCase()} • {item.quality === 'audio_only' ? 'Audio' : item.quality}
              </Text>
            </View>
          </View>

          <View style={s.statusContainer}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusLabel, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {item.status === 'downloading' && (
          <View style={s.progressSection}>
            <DownloadProgress
              progress={item.progress}
              visible={true}
            />
          </View>
        )}

        {(item.status === 'downloading' || item.status === 'pending') && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.cancelButton, { borderColor: theme.colors.error }]}
              onPress={() => onCancel(item.id)}
            >
              <Text style={[s.cancelButtonText, { color: theme.colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'failed' && item.error && (
          <View style={[s.messageContainer, { backgroundColor: theme.colors.error + '15' }]}>
            <Text style={[s.messageText, { color: theme.colors.error }]}>{item.error}</Text>
          </View>
        )}

        {item.status === 'completed' && item.filePath && (
          <View style={[s.messageContainer, { backgroundColor: theme.colors.success + '15' }]}>
            <Text style={[s.messageText, { color: theme.colors.success }]}>✓ {item.filePath.split('/').pop()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const MemoDownloadItem = React.memo(DownloadItem, (prev, next) => {
  // Avoid re-render unless key fields change or progress integer changes
  const prevP = Math.round(prev.item.progress);
  const nextP = Math.round(next.item.progress);
  return (
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prevP === nextP &&
    prev.item.filePath === next.item.filePath &&
    prev.item.error === next.item.error &&
    prev.statusColor === next.statusColor &&
    prev.statusText === next.statusText &&
    prev.theme === next.theme &&
    prev.s === next.s
  );
});

const DownloadsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { downloads, cancelDownload, deleteDownload, forceCleanupAllDownloads } =
    useDownloads();
  // removed unused navigation

  const handleForceCleanup = () => {
    Alert.alert(
      'Force Cleanup',
      'This will cancel all active downloads and clear stuck connections. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: () => {
            forceCleanupAllDownloads();
            Alert.alert('Success', 'All downloads cleaned up successfully');
          },
        },
      ],
    );
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

  const renderDownloadItem = useCallback(({ item }: { item: Download }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);
    return (
      <MemoDownloadItem
        item={item}
        onCancel={cancelDownload}
        onDelete={deleteDownload}
        statusColor={statusColor}
        statusText={statusText}
        theme={theme}
        s={styles}
      />
    );
  }, [cancelDownload, deleteDownload, theme, styles, getStatusColor, getStatusText]);

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

          {activeDownloads > 0 && (
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
  );
};

export default DownloadsScreen;
