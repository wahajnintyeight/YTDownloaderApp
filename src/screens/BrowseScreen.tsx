import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useSearch } from '../hooks/useSearch';
import { useDialog } from '../hooks/useDialog';
import SearchBar from '../components/SearchBar';
import VideoResultCard from '../components/VideoResultCard';
import LoadingAnimation from '../components/LoadingAnimation';
import DownloadDrawer from '../components/DownloadDrawer';
import AppHeader from '../components/AppHeader';
import { MainTabParamList } from '../navigation/types';

type BrowseScreenRouteProp = RouteProp<MainTabParamList, 'Browse'>;

const BrowseScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<BrowseScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { results, loading, error, hasMore, search, loadMore } = useSearch();
  const { showSuccess } = useDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'url'>('search');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // DRY: Reusable search handler
  const handleSearch = useCallback(
    async (query: string) => {
      console.log('🔍 Search initiated:', query);
      setSearchQuery(query);
      await search(query, true);
    },
    [search],
  );

  // Handle test search trigger from navigation params (DRY: reuse existing search)
  useEffect(() => {
    const params = route.params;
    if (params?.testSearch) {
      const testQuery = 'test'; // Any query works when USE_TEST_DATA is enabled
      handleSearch(testQuery);
    }
  }, [route.params, handleSearch]);

  const handleVideoPress = useCallback(
    (video: Video) => {
      console.log('📹 Video selected:', video.title);
      const viewerUrl = `https://www.youtube.com/watch?v=${video.id}`;
      navigation.navigate('VideoViewer', { video, youtubeUrl: viewerUrl });
    },
    [navigation],
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedVideo(null);
  }, []);

  const extractVideoIdFromInput = useCallback((input: string): string | null => {
    const trimmed = input.trim();
    const vMatch = trimmed.match(/[?&]v=([^&]+)/);
    if (vMatch && vMatch[1]) {
      return vMatch[1];
    }
    const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1];
    }
    const shortsMatch = trimmed.match(/shorts\/([^?&]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1];
    }
    if (trimmed.length === 11 && !trimmed.includes('http')) {
      return trimmed;
    }
    return null;
  }, []);

  const handleUrlDownload = useCallback(() => {
    const value = youtubeUrl.trim();
    if (!value) {
      return;
    }
    const videoId = extractVideoIdFromInput(value);
    if (!videoId) {
      showSuccess(
        'Invalid URL',
        'Please enter a valid YouTube URL or video ID.',
      );
      return;
    }

    const now = new Date().toISOString();
    const video: Video = {
      id: videoId,
      title: value,
      thumbnailUrl: '',
      duration: 0,
      channelName: '',
      channelId: '',
      publishedAt: now,
      viewCount: 0,
    };

    setSelectedVideo(video);
    setModalVisible(true);
  }, [youtubeUrl, extractVideoIdFromInput, showSuccess]);

  const handleTestDownload = useCallback(() => {
    // Create a test video object with the specified video ID
    const testVideo: Video = {
      id: 't9c2X-Dzijg',
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
    modeHeader: {
      marginBottom: theme.spacing.sm,
    },
    modeTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    modeSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    modeToggle: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    modeButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeButtonActive: {
      backgroundColor: theme.colors.secondary,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    modeButtonTextActive: {
      color: theme.colors.text,
    },
    urlInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    urlInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      fontSize: 16,
      minHeight: 44,
    },
    urlButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    urlButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    urlButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    urlCard: {
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    urlLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    urlHelperText: {
      marginTop: theme.spacing.sm,
      fontSize: 12,
      color: theme.colors.textSecondary,
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
    listFooter: {
      paddingVertical: 20,
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
        <View style={styles.modeHeader}>
          <Text style={[styles.modeTitle, { color: theme.colors.text }]}>
            {mode === 'search' ? 'Search videos on YouTube' : 'Download using a YouTube link'}
          </Text>
          <Text style={styles.modeSubtitle}>
            {mode === 'search'
              ? 'Type a song, channel, or keyword and pick from the results below.'
              : 'Paste a full YouTube URL or video ID for a specific, public video.'}
          </Text>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'search' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('search')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'search' && styles.modeButtonTextActive,
              ]}
            >
              Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'url' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('url')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'url' && styles.modeButtonTextActive,
              ]}
            >
              URL
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'search' ? (
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search YouTube videos"
            showSearchButton={true}
          />
        ) : (
          <View style={styles.urlCard}>
            <Text
              style={[
                styles.urlLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              YouTube URL or ID
            </Text>

            <View style={styles.urlInputContainer}>
              <TextInput
                style={styles.urlInput}
                placeholder="Paste YouTube URL or ID"
                placeholderTextColor={theme.colors.textSecondary}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.urlButton,
                pressed && styles.urlButtonPressed,
              ]}
              android_ripple={{ color: theme.colors.accent }}
              onPress={handleUrlDownload}
            >
              <Text style={styles.urlButtonText}>Download from URL</Text>
            </Pressable>

            <Text style={styles.urlHelperText}>
              Examples: https://youtube.com/watch?v=..., https://youtu.be/..., or
              just the 11-character video ID.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        {mode === 'search' ? (
          results.length > 0 ? (
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
                  <View style={styles.listFooter}>
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
          )
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
