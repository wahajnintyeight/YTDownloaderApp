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
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Search, Link as LinkIcon, Download, Youtube, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useSearch } from '../hooks/useSearch';
import { useScreenTracking } from '../hooks/useScreenTracking';
import { ScreenNames } from '../constants/ScreenNames';
import VideoResultCard from '../components/VideoResultCard';
import LoadingAnimation from '../components/LoadingAnimation';
import DownloadDrawer from '../components/DownloadDrawer';
import AppHeader from '../components/AppHeader';
import { AppBannerAd } from '../components/AppBannerAd';
import { MainTabParamList } from '../navigation/types';

type BrowseScreenRouteProp = RouteProp<MainTabParamList, 'Browse'>;

const BrowseScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const route = useRoute<BrowseScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { results, loading, error, hasMore, search, loadMore } = useSearch();

  // Track screen view in Firebase Analytics
  useScreenTracking(ScreenNames.Browse);

  // All hooks must be called unconditionally at the top

  const [mode, setMode] = useState<'search' | 'url'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      // Don't search with empty query, just return silently
      return;
    }
    setSearchQuery(trimmedQuery);
    await search(trimmedQuery, true);
  }, [search]);

  // Initialize search from params if needed
  useEffect(() => {
    if (route.params?.testSearch) {
      handleSearch('test');
    }
  }, [route.params, handleSearch]);

  const handleVideoPress = useCallback((video: Video) => {
    // Navigate to VideoViewerScreen instead of opening drawer directly
    try {
      navigation.navigate('VideoViewer', { video });
    } catch (error) {
      console.error('Failed to navigate to VideoViewer:', error);
      // Fallback to drawer if navigation fails
      setSelectedVideo(video);
      setModalVisible(true);
    }
  }, [navigation]);

  const extractVideoIdFromInput = useCallback((input: string): string | null => {
    const trimmed = input.trim();
    const vMatch = trimmed.match(/[?&]v=([^&]+)/);
    if (vMatch && vMatch[1]) return vMatch[1];
    const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];
    const shortsMatch = trimmed.match(/shorts\/([^?&]+)/);
    if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
    if (trimmed.length === 11 && !trimmed.includes('http')) return trimmed;
    return null;
  }, []);

  const handleUrlDownload = useCallback(() => {
    const value = youtubeUrl.trim();
    if (!value) return;

    const videoId = extractVideoIdFromInput(value);
    if (!videoId) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube URL or video ID.');
      return;
    }

    const video: Video = {
      id: videoId,
      title: value,
      thumbnailUrl: '',
      duration: 0,
      channelName: '',
      channelId: '',
      publishedAt: new Date().toISOString(),
      viewCount: 0,
    };

    setSelectedVideo(video);
    setModalVisible(true);
  }, [youtubeUrl, extractVideoIdFromInput]);

  const renderVideoItem: ListRenderItem<Video> = useCallback(
    ({ item }) => <VideoResultCard video={item} onPress={handleVideoPress} />,
    [handleVideoPress],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <LoadingAnimation type="search" visible={true} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Oops! Something went wrong</Text>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Text style={[styles.errorHint, { color: theme.colors.textSecondary }]}>Pull down to retry</Text>
        </View>
      ) : (
        <View style={styles.emptyStateContent}>
          <Youtube size={72} color={theme.colors.primary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {mode === 'search' ? 'Discover & Download' : 'Quick Download'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            {mode === 'search'
              ? 'Search for your favorite videos and download them in your preferred quality'
              : 'Paste any YouTube URL to download instantly'}
          </Text>
        </View>
      )}
    </View>
  );

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'search' && styles.activeTab]}
            onPress={() => setMode('search')}
            activeOpacity={0.7}
          >
            <Search size={18} color={mode === 'search' ? theme.colors.background : theme.colors.textSecondary} />
            <Text style={[styles.tabText, mode === 'search' && styles.activeTabText]}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'url' && styles.activeTab]}
            onPress={() => setMode('url')}
            activeOpacity={0.7}
          >
            <LinkIcon size={18} color={mode === 'url' ? theme.colors.background : theme.colors.textSecondary} />
            <Text style={[styles.tabText, mode === 'url' && styles.activeTabText]}>Paste URL</Text>
          </TouchableOpacity>
        </View>

        {mode === 'search' ? (
          <View style={styles.searchSection}>
            <View style={styles.inputWrapper}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Search for videos, channels, playlists..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearch(searchQuery)}
                  style={styles.goButton}
                  activeOpacity={0.8}
                >
                  <ArrowRight size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={results}
              renderItem={renderVideoItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={loading && results.length > 0}
                  onRefresh={() => {
                    // Only refresh if there's a valid search query
                    if (searchQuery.trim()) {
                      handleSearch(searchQuery);
                    }
                    // If no query, do nothing (prevent error)
                  }}
                  tintColor={theme.colors.primary}
                  enabled={searchQuery.trim().length > 0 || results.length > 0}
                />
              }
              onEndReached={() => {
                if (hasMore && !loading) loadMore();
              }}
            />
          </View>
        ) : (
          <View style={styles.urlSection}>
            <LinearGradient
              colors={isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F0F0F0', '#FFFFFF']}
              style={styles.urlCard}
            >
              <View style={styles.urlHeader}>
                <LinkIcon size={28} color={theme.colors.primary} strokeWidth={2} />
                <Text style={styles.urlTitle}>Direct Download</Text>
                <Text style={styles.urlSubtitle}>
                  Enter any YouTube URL or video ID to download instantly
                </Text>
              </View>

              <View style={styles.urlInputSection}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  YouTube URL or Video ID
                </Text>
                <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                  <LinkIcon size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="https://youtu.be/... or paste video ID"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={youtubeUrl}
                    onChangeText={setYoutubeUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleUrlDownload}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Download size={20} color="#FFF" />
                  <Text style={styles.downloadButtonText}>Download Video</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>

      <DownloadDrawer
        visible={modalVisible}
        video={selectedVideo}
        onClose={() => setModalVisible(false)}
      />

      {/* Banner Ad at bottom */}
      <AppBannerAd style={styles.bannerAd} />
    </View>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTab: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: theme.colors.background,
  },
  searchSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  urlSection: {
    flex: 1,
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    opacity: 0.85,
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  urlCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urlHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  urlTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  urlSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  urlInputSection: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  downloadButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerAd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
  },
});

export default BrowseScreen;
