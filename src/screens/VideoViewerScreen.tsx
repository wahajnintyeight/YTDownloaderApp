import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Download } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { Video } from '../types/video';
import DownloadDrawer from '../components/DownloadDrawer';
import VideoResultCard from '../components/VideoResultCard';
import { apiClient } from '../services/apiClient';

interface VideoViewerParams {
  video: Video;
  youtubeUrl?: string;
}

type VideoViewerRouteProp = RouteProp<Record<string, VideoViewerParams>, string>;

// Helper functions for formatting
const formatViewCount = (count: number | string): string => {
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const formatDuration = (duration: string | number): string => {
  const durationStr = String(duration);
  // Handle ISO 8601 duration
  if (durationStr.startsWith('PT')) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const seconds = match[3] ? parseInt(match[3], 10) : 0;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  // Handle numeric seconds
  const totalSeconds = typeof duration === 'number' ? duration : parseInt(durationStr, 10);
  if (!isNaN(totalSeconds)) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return durationStr;
};

const VideoViewerScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<VideoViewerRouteProp>();
  const navigation = useNavigation<any>();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { video, youtubeUrl } = route.params;
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Related videos state
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Animated header for scroll-away effect
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  
  // Detect landscape mode
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  const isTablet = SCREEN_WIDTH >= 600;
  
  // Responsive player height that updates on rotation
  // Header is absolute and can slide away, so we can use more space
  const PLAYER_HEIGHT = useMemo(() => {
    if (isLandscape) {
      // Landscape: maximize player (header slides away, so use full height)
      return SCREEN_HEIGHT;
    }
    // Portrait: maintain 16:9 ratio
    return SCREEN_WIDTH * (9 / 16);
  }, [SCREEN_WIDTH, SCREEN_HEIGHT, isLandscape]);

  // Extract video ID from URL or use video.id directly
  const videoId = useMemo(() => {
    if (youtubeUrl && youtubeUrl.trim().length > 0) {
      const url = youtubeUrl.trim();
      // Handle various YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^#&?]{11})/,
        /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    return video.id;
  }, [youtubeUrl, video.id]);

  const onStateChange = useCallback((state: string) => {
    // Handle state changes if needed
    if (state === 'ended') {
      // Video ended
    }
  }, []);

  const onReady = useCallback(() => {
    setIsReady(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handle scroll to show/hide header
  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Only animate if scroll difference is significant (avoid jitter)
    if (Math.abs(scrollDifference) > 5) {
      if (scrollDifference > 0 && currentScrollY > 50) {
        // Scrolling down - hide header
        if (scrollDirection.current !== 'down') {
          scrollDirection.current = 'down';
          Animated.spring(headerTranslateY, {
            toValue: -100,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      } else if (scrollDifference < 0) {
        // Scrolling up - show header
        if (scrollDirection.current !== 'up') {
          scrollDirection.current = 'up';
          Animated.spring(headerTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      }
    }
    
    lastScrollY.current = currentScrollY;
  }, [headerTranslateY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        safeArea: {
          flex: 1,
        },
        header: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: isLandscape ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: isLandscape ? theme.spacing.xs : theme.spacing.md,
          borderBottomWidth: isLandscape ? 0 : 1,
          borderBottomColor: theme.colors.border,
          minHeight: isLandscape ? 40 : 56,
          backgroundColor: theme.colors.background,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        backButton: {
          paddingVertical: theme.spacing.xs,
          paddingRight: theme.spacing.md,
          paddingLeft: isLandscape ? 0 : undefined,
        },
        backButtonText: {
          fontSize: isLandscape ? 24 : 18,
          color: theme.colors.text,
          fontWeight: '300',
        },
        headerTitle: {
          flex: 1,
          fontSize: isLandscape ? 14 : 16,
          fontWeight: '600',
          color: theme.colors.text,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },
        downloadButtonCompact: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        playerContainer: {
          width: '100%',
          height: PLAYER_HEIGHT,
          backgroundColor: '#000000',
          overflow: 'hidden',
        },
        landscapeContent: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        landscapeTitle: {
          flex: 1,
          fontSize: 12,
          fontWeight: '600',
          color: '#FFFFFF',
          marginRight: theme.spacing.sm,
        },
        playerWrapper: {
          flex: 1,
          backgroundColor: '#000000',
        },
        loadingOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000',
        },
        content: {
          flex: 1,
          paddingHorizontal: isLandscape ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: isLandscape ? theme.spacing.sm : theme.spacing.md,
        },
        title: {
          fontSize: isLandscape ? 16 : 18,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        },
        channel: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.sm,
        },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        },
        metaText: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        downloadButton: {
          marginTop: theme.spacing.md,
          paddingVertical: isLandscape ? theme.spacing.sm : theme.spacing.md,
          paddingHorizontal: isLandscape ? theme.spacing.md : theme.spacing.lg,
          borderRadius: 8,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          flexDirection: 'row',
          gap: theme.spacing.xs,
        },
        downloadButtonText: {
          color: '#FFFFFF',
          fontSize: isLandscape ? 13 : 15,
          fontWeight: '600',
        },
        downloadButtonPressed: {
          opacity: 0.9,
          transform: [{ scale: 0.97 }],
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing.md,
        },
        statsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        },
        statItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        channelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        },
        channelAvatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: theme.spacing.sm,
        },
        channelInitial: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
        },
        channelInfo: {
          flex: 1,
        },
        channelName: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
        },
        channelMeta: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          marginTop: 2,
        },
        description: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          lineHeight: 20,
        },
        relatedSection: {
          marginTop: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        relatedTitle: {
          fontSize: isLandscape ? 16 : 18,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
          paddingHorizontal: isLandscape ? theme.spacing.md : theme.spacing.lg,
        },
        relatedList: {
          paddingHorizontal: isLandscape ? theme.spacing.md : theme.spacing.lg,
        },
        relatedListContent: {
          paddingBottom: theme.spacing.xl,
        },
      }),
    [theme, isLandscape, isTablet, PLAYER_HEIGHT],
  );

  // Fetch related videos when video changes
  useEffect(() => {
    const fetchRelatedVideos = async () => {
      if (!video.id) return;
      
      setLoadingRelated(true);
      try {
        // Search using video title or channel name to get related videos
        const searchQuery = video.channelName || video.title.split(' ').slice(0, 3).join(' ');
        const response = await apiClient.searchVideos({
          query: searchQuery,
          nextPage: '',
          prevPage: '',
        });
        
        // Filter out the current video and limit to 10 results
        const filtered = response.videos
          .filter(v => v.id !== video.id)
          .slice(0, 10);
        
        setRelatedVideos(filtered);
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
        setRelatedVideos([]);
      } finally {
        setLoadingRelated(false);
      }
    };
    
    fetchRelatedVideos();
  }, [video.id, video.channelName, video.title]);

  // Reset header position when component mounts or video changes
  React.useEffect(() => {
    headerTranslateY.setValue(0);
    lastScrollY.current = 0;
    scrollDirection.current = 'up';
  }, [video.id, headerTranslateY]);

  // Handle related video press
  const handleRelatedVideoPress = useCallback((relatedVideo: Video) => {
    navigation.replace('VideoViewer', { video: relatedVideo });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={isLandscape ? ['top'] : ['top', 'bottom']}>
      <View style={styles.container}>
        {/* Animated header that slides away on scroll */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>{'‹'}</Text>
          </TouchableOpacity>
          {!isLandscape && (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {video.title}
            </Text>
          )}
          {isLandscape && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.downloadButtonCompact}
                onPress={() => setDownloadVisible(true)}
                activeOpacity={0.8}
              >
                <Download size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLandscape ? { paddingBottom: 0 } : undefined}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
        {/* Video Player */}
        <View style={styles.playerContainer}>
          <Animated.View style={[styles.playerWrapper, { opacity: fadeAnim }]}>
            <YoutubeIframe
              height={PLAYER_HEIGHT}
              width={SCREEN_WIDTH}
              videoId={videoId}
              webViewStyle={{ flex: 1 }}
              play={false}
              onChangeState={onStateChange}
              onReady={onReady}
              webViewProps={{
                androidLayerType: 'hardware',
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
              }}
            />
          </Animated.View>
          {!isReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          {/* Landscape overlay with video info */}
          {isLandscape && isReady && (
            <View style={styles.landscapeContent}>
              <Text style={styles.landscapeTitle} numberOfLines={1}>
                {video.title}
              </Text>
              <TouchableOpacity
                style={styles.downloadButtonCompact}
                onPress={() => setDownloadVisible(true)}
                activeOpacity={0.8}
              >
                <Download size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Video Info - Compact in landscape */}
        {!isLandscape && (
          <View style={styles.content}>
            <Text style={styles.title}>
              {video.title}
            </Text>

            <View style={styles.statsContainer}>
              {video.viewCount != null && (
                <Text style={styles.metaText}>{formatViewCount(video.viewCount)} views</Text>
              )}
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>
                {formatDate(video.publishedAt)}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Channel Info */}
            <View style={styles.channelRow}>
              <View style={styles.channelAvatar}>
                <Text style={styles.channelInitial}>
                  {video.channelName?.charAt(0).toUpperCase() || 'Y'}
                </Text>
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName} numberOfLines={1}>
                  {video.channelName}
                </Text>
                {video.duration && (
                  <Text style={styles.channelMeta}>
                    Duration: {formatDuration(video.duration)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Download Button - only in portrait */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => setDownloadVisible(true)}
              activeOpacity={0.8}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Related Videos Section */}
        {relatedVideos.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Videos</Text>
            <View style={styles.relatedList}>
              {relatedVideos.map((item, index) => (
                <VideoResultCard
                  key={`${item.id}-${index}`}
                  video={item}
                  onPress={handleRelatedVideoPress}
                />
              ))}
              {loadingRelated && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <DownloadDrawer
        visible={downloadVisible}
        video={video}
        onClose={() => setDownloadVisible(false)}
      />
    </View>
    </SafeAreaView>
  );
};

export default VideoViewerScreen;
