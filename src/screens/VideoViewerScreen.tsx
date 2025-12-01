import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useTheme } from '../hooks/useTheme';
import { Video } from '../types/video';
import DownloadModal from '../components/DownloadModal';

interface VideoViewerParams {
  video: Video;
  youtubeUrl?: string;
}

type VideoViewerRouteProp = RouteProp<Record<string, VideoViewerParams>, string>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_HEIGHT = SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio

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
  const { video, youtubeUrl } = route.params;
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        backButton: {
          paddingVertical: theme.spacing.xs,
          paddingRight: theme.spacing.md,
        },
        backButtonText: {
          fontSize: 18,
          color: theme.colors.text,
        },
        headerTitle: {
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
        },
        playerContainer: {
          width: SCREEN_WIDTH,
          height: PLAYER_HEIGHT,
          backgroundColor: '#000000',
          overflow: 'hidden',
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
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        title: {
          fontSize: 18,
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
          paddingVertical: theme.spacing.md,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'stretch',
        },
        downloadButtonText: {
          color: '#FFFFFF',
          fontSize: 15,
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
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {video.title}
        </Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.playerContainer}>
          <Animated.View style={[styles.playerWrapper, { opacity: fadeAnim }]}>
            <YoutubeIframe
              height={PLAYER_HEIGHT}
              width={SCREEN_WIDTH}
              videoId={videoId}
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
        </View>

        {/* Video Info */}
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

          {/* Download Button */}
          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
            ]}
            android_ripple={{ color: theme.colors.accent }}
            onPress={() => setDownloadVisible(true)}
          >
            <Text style={styles.downloadButtonText}>⬇️  Download Video</Text>
          </Pressable>

        </View>
      </ScrollView>

      <DownloadModal
        visible={downloadVisible}
        video={video}
        onClose={() => setDownloadVisible(false)}
      />
    </View>
  );
};

export default VideoViewerScreen;
