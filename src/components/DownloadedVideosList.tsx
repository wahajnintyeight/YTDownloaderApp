import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { DownloadedVideo } from '../services/storageService';

interface DownloadedVideosListProps {
  onVideoPress?: (video: DownloadedVideo) => void;
}

export const DownloadedVideosList: React.FC<DownloadedVideosListProps> = ({
  onVideoPress,
}) => {
  const { downloadedVideos, loadingVideos, refreshDownloadList, removeDownloadedVideo } =
    useDownloadManager();

  const handleRemoveVideo = (video: DownloadedVideo) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${video.filename}" from your downloads list?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              await removeDownloadedVideo(video.id);
              Alert.alert('Success', 'Download removed from list');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove download');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVideoItem = ({ item }: { item: DownloadedVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => onVideoPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.videoContent}>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.videoMeta}>
            {item.format.toUpperCase()} • {formatDate(item.downloadedAt)}
          </Text>
          <Text style={styles.videoPath} numberOfLines={1}>
            📁 {item.filePath}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveVideo(item)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📥</Text>
      <Text style={styles.emptyTitle}>No Downloads Yet</Text>
      <Text style={styles.emptyText}>
        Downloaded videos will appear here
      </Text>
    </View>
  );

  if (loadingVideos && downloadedVideos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading downloads...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={downloadedVideos}
      renderItem={renderVideoItem}
      keyExtractor={item => item.id}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        <RefreshControl
          refreshing={loadingVideos}
          onRefresh={refreshDownloadList}
          tintColor="#2196F3"
        />
      }
      contentContainerStyle={styles.listContainer}
      scrollEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    flexGrow: 1,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    marginRight: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  videoPath: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#f44336',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
