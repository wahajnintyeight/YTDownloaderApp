import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useSearch } from '../hooks/useSearch';
import { useDialog } from '../hooks/useDialog';
import SearchBar from '../components/SearchBar';
import VideoResultCard from '../components/VideoResultCard';
import LoadingAnimation from '../components/LoadingAnimation';
import DownloadDrawer from '../components/DownloadDrawer';
import AppHeader from '../components/AppHeader';

const BrowseScreen: React.FC = () => {
  const { theme } = useTheme();
  const { results, loading, error, hasMore, search, loadMore } = useSearch();
  const { showSuccess } = useDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = useCallback(
    async (query: string) => {
      console.log('🔍 Search initiated:', query);
      setSearchQuery(query);
      await search(query, true);
    },
    [search],
  );

  const handleVideoPress = useCallback((video: Video) => {
    console.log('📹 Video selected:', video.title);
    setSelectedVideo(video);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedVideo(null);
  }, []);

  const handleTestDownload = useCallback(() => {
    // Create a test video object with the specified video ID
    const testVideo: Video = {
      id: 'YJVmu6yttiw',
      title: 'Test Video - Sample Download',
      thumbnailUrl: 'https://img.youtube.com/vi/GT8ornYrDEs/mqdefault.jpg',
      duration: 240, // 4 minutes
      channelName: 'Test Channel',
      channelId: 'test-channel-id',
      publishedAt: new Date().toISOString(),
      viewCount: 1000000,
    };

    setSelectedVideo(testVideo);
    setModalVisible(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (searchQuery.trim()) {
      search(searchQuery, true);
    }
  }, [search, searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const renderVideoItem: ListRenderItem<Video> = useCallback(
    ({ item }) => <VideoResultCard video={item} onPress={handleVideoPress} />,
    [handleVideoPress],
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <LoadingAnimation type="search" visible={true} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Searching videos...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Text
            style={[styles.retryText, { color: theme.colors.textSecondary }]}
          >
            Pull down to retry
          </Text>
        </View>
      );
    }

    if (searchQuery && results.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No videos found for "{searchQuery}"
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}
          >
            Try a different search term
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
          Welcome to YT Downloader
        </Text>
        <Text
          style={[styles.welcomeSubtext, { color: theme.colors.textSecondary }]}
        >
          Search for YouTube videos to download
        </Text>

        {/* Temporary test button for dialogs */}
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() =>
              showSuccess(
                'Welcome!',
                'Custom dialog system is working perfectly!',
              )
            }
          >
            <Text style={styles.testButtonText}>Test Dialog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.testButton,
              {
                backgroundColor: theme.colors.secondary,
                marginTop: theme.spacing.sm,
              },
            ]}
            onPress={handleTestDownload}
          >
            <Text style={styles.testButtonText}>Test Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    listContainer: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
    },
    welcomeText: {
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    welcomeSubtext: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    retryText: {
      fontSize: 14,
      textAlign: 'center',
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    testButtonsContainer: {
      marginTop: theme.spacing.lg,
      width: '100%',
      alignItems: 'center',
    },
    testButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 8,
      minWidth: 150,
      alignItems: 'center',
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.searchSection}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search YouTube videos"
          showSearchButton={true}
        />
      </View>

      <View style={styles.listContainer}>
        {results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderVideoItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            // Performance optimizations
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={10}
            removeClippedSubviews={true}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore && loading ? (
                <View style={{ paddingVertical: 20 }}>
                  <LoadingAnimation
                    type="general"
                    visible={true}
                    size="small"
                  />
                </View>
              ) : null
            }
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      <DownloadDrawer
        visible={modalVisible}
        video={selectedVideo}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default BrowseScreen;
