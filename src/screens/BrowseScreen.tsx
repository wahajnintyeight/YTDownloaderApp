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
import { useRoute, RouteProp } from '@react-navigation/native';
import { Search, Link as LinkIcon, Download, Youtube, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useSearch } from '../hooks/useSearch';
import VideoResultCard from '../components/VideoResultCard';
import LoadingAnimation from '../components/LoadingAnimation';
import DownloadDrawer from '../components/DownloadDrawer';
import AppHeader from '../components/AppHeader';
import { MainTabParamList } from '../navigation/types';

type BrowseScreenRouteProp = RouteProp<MainTabParamList, 'Browse'>;

const BrowseScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const route = useRoute<BrowseScreenRouteProp>();
  const { results, loading, error, hasMore, search, loadMore } = useSearch();

  const [mode, setMode] = useState<'search' | 'url'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    await search(query, true);
  }, [search]);

  // Initialize search from params if needed
  useEffect(() => {
    if (route.params?.testSearch) {
      handleSearch('test');
    }
  }, [route.params, handleSearch]);

  const handleVideoPress = useCallback((video: Video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  }, []);

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
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Pull to retry</Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center', opacity: 0.7 }}>
          <Youtube size={64} color={theme.colors.textSecondary} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {mode === 'search' ? 'Search YouTube' : 'Paste a Link'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            {mode === 'search'
              ? 'Find videos to download'
              : 'Paste a YouTube URL to download directly'}
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
                placeholder="Search videos..."
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
                  <ArrowRight size={22} color={theme.colors.background} />
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
                  onRefresh={() => handleSearch(searchQuery)}
                  tintColor={theme.colors.primary}
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
              <Text style={styles.urlTitle}>Direct Download</Text>
              <Text style={styles.urlSubtitle}>Paste a YouTube link below</Text>

              <View style={[styles.inputWrapper, { marginTop: 24 }]}>
                <LinkIcon size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="https://youtu.be/..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  urlCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urlTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  urlSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BrowseScreen;
