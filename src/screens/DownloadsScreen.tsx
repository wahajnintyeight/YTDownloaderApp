import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { Download, DownloadStatus } from '../types/video';
import { formatDuration } from '../utils/formatters';
import LoadingAnimation from '../components/LoadingAnimation';
import DownloadProgress from '../components/DownloadProgress';

const DownloadsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { downloads, cancelDownload } = useDownloads();

  const getStatusColor = (status: DownloadStatus): string => {
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
  };

  const getStatusText = (status: DownloadStatus): string => {
    switch (status) {
      case 'downloading':
        return 'Downloading...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending...';
      default:
        return 'Unknown';
    }
  };

  const renderDownloadItem = ({ item }: { item: Download }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <View style={[styles.downloadItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.downloadHeader}>
          <Image
            source={{ uri: item.video.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          
          <View style={styles.downloadInfo}>
            <Text style={[styles.videoTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.video.title}
            </Text>
            
            <Text style={[styles.channelName, { color: theme.colors.textSecondary }]}>
              {item.video.channelName}
            </Text>
            
            <View style={styles.downloadMeta}>
              <Text style={[styles.formatText, { color: theme.colors.textSecondary }]}>
                {item.format.toUpperCase()} • {item.quality === 'audio_only' ? 'Audio Only' : item.quality}
              </Text>
              
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          {(item.status === 'downloading' || item.status === 'pending') && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.error }]}
              onPress={() => cancelDownload(item.id)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {item.status === 'downloading' && (
          <DownloadProgress
            progress={item.progress}
            filename={`${item.video.title}.${item.format}`}
            visible={true}
          />
        )}

        {item.status === 'failed' && item.error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Error: {item.error}
            </Text>
          </View>
        )}

        {item.status === 'completed' && item.filePath && (
          <View style={[styles.completedContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.completedText, { color: theme.colors.success }]}>
              ✓ Downloaded to: {item.filePath.split('/').pop()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Downloads Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Start downloading videos to see them here
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
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
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    listContainer: {
      flex: 1,
    },
    downloadItem: {
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      borderRadius: 12,
      padding: theme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    downloadHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    thumbnail: {
      width: 80,
      height: 45,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    downloadInfo: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
      marginBottom: theme.spacing.xs,
    },
    channelName: {
      fontSize: 14,
      marginBottom: theme.spacing.xs,
    },
    downloadMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    formatText: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    cancelButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    errorContainer: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: 6,
    },
    errorText: {
      fontSize: 12,
      fontWeight: '500',
    },
    completedContainer: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: 6,
    },
    completedText: {
      fontSize: 12,
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
      paddingVertical: theme.spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerSubtitle}>
          {downloads.length} {downloads.length === 1 ? 'download' : 'downloads'}
        </Text>
      </View>

      <View style={styles.listContainer}>
        {downloads.length > 0 ? (
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

export default DownloadsScreen;