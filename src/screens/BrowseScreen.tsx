import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import VideoResultCard from '../components/VideoResultCard';
import LoadingAnimation from '../components/LoadingAnimation';

const BrowseScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { results, loading, error, search, clearResults } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    await search(query);
  }, [search]);

  const handleVideoPress = useCallback((video: Video) => {
    setSelectedVideo(video);
    // TODO: Open download modal
    console.log('Selected video:', video.title);
  }, []);

  const handleRefresh = useCallback(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  }, [search, searchQuery]);

  const renderVideoItem: ListRenderItem<Video> = useCallback(({ item }) => (
    <VideoResultCard video={item} onPress={handleVideoPress} />
  ), [handleVideoPress]);

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <LoadingAnimation type="search" visible={true} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
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
          <Text style={[styles.retryText, { color: theme.colors.textSecondary }]}>
            Pull down to retry
          </Text>
        </View>
      );
    }

    if (searchQuery && results.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No videos found for "{searchQuery}"
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
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
        <Text style={[styles.welcomeSubtext, { color: theme.colors.textSecondary }]}>
          Search for YouTube videos to download
        </Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
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
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
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
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>YT Downloader</Text>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search YouTube videos"
        />
      </View>

      <View style={styles.listContainer}>
        {results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
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
            getItemLayout={(data, index) => ({
              length: 100, // Approximate item height
              offset: 100 * index,
              index,
            })}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

export default BrowseScreen;