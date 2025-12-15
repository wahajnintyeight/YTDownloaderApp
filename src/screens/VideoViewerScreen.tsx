import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { YoutubeView, useYouTubePlayer, useYouTubeEvent } from 'react-native-youtube-bridge';
import { Download, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { Video } from '../types/video';
import DownloadDrawer from '../components/DownloadDrawer';
import VideoResultCard from '../components/VideoResultCard';
import { apiClient } from '../services/apiClient';
import { useScreenTracking } from '../hooks/useScreenTracking';
import { ScreenNames } from '../constants/ScreenNames';
import { AppBannerAd } from '../components/AppBannerAd';

interface VideoViewerParams {
  video: Video;
  youtubeUrl?: string;
}

type VideoViewerRouteProp = RouteProp<Record<string, VideoViewerParams>, string>;

const formatViewCount = (count: number | string): string => {
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
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

const VideoViewerScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<VideoViewerRouteProp>();
  const navigation = useNavigation<any>();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { video, youtubeUrl } = route.params;
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useScreenTracking(ScreenNames.VideoViewer);
  
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  const PLAYER_HEIGHT = useMemo(() => {
    if (isLandscape) {
      return SCREEN_HEIGHT - insets.top - 50;
    }
    return SCREEN_WIDTH * (9 / 16);
  }, [SCREEN_WIDTH, SCREEN_HEIGHT, isLandscape, insets.top]);

  const videoIdOrUrl = useMemo(() => {
    if (youtubeUrl && youtubeUrl.trim().length > 0) {
      return youtubeUrl.trim();
    }
    if (video.id && video.id.length === 11) {
      return `https://www.youtube.com/watch?v=${video.id}`;
    }
    return video.id;
  }, [youtubeUrl, video.id]);

  const player = useYouTubePlayer(videoIdOrUrl, {
    autoplay: false,
    controls: true,
    playsinline: true,
    rel: false,
  });

  useYouTubeEvent(player, 'ready', () => setIsReady(true));
  useYouTubeEvent(player, 'error', (error: any) => console.error('YouTube player error:', error));


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
          paddingHorizontal: theme.spacing.md,
          paddingTop: insets.top + theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          backgroundColor: theme.colors.background,
          position: isLandscape ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isLandscape ? 'rgba(0,0,0,0.5)' : theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerSpacer: {
          flex: 1,
        },
        playerContainer: {
          width: '100%',
          height: PLAYER_HEIGHT,
          backgroundColor: '#000000',
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
        // Improved video info section
        videoInfoCard: {
          backgroundColor: theme.colors.surface,
          marginHorizontal: theme.spacing.md,
          marginTop: theme.spacing.md,
          borderRadius: 16,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing.md,
        },
        titleContainer: {
          flex: 1,
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.text,
          lineHeight: 22,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: theme.spacing.xs,
          gap: theme.spacing.sm,
        },
        metaText: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        metaDot: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        downloadButton: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          alignSelf: 'flex-start',
        },
        downloadButtonText: {
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
        },
        // Related videos
        relatedSection: {
          flex: 1,
          marginTop: theme.spacing.lg,
        },
        relatedTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.text,
          paddingHorizontal: theme.spacing.md,
          marginBottom: theme.spacing.sm,
        },
        relatedList: {
          paddingHorizontal: theme.spacing.md,
        },
        relatedListContent: {
          paddingBottom: theme.spacing.xl + 80,
        },
        bannerAd: {
          backgroundColor: theme.colors.background,
        },
        // Landscape styles
        landscapeOverlay: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        },
        landscapeTitle: {
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: '#FFFFFF',
          marginRight: theme.spacing.md,
        },
        landscapeDownloadBtn: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
      }),
    [theme, isLandscape, PLAYER_HEIGHT, insets.top],
  );


  // Fetch related videos
  useEffect(() => {
    const fetchRelatedVideos = async () => {
      if (!video.id) return;
      setLoadingRelated(true);
      try {
        const searchQuery = video.channelName || video.title.split(' ').slice(0, 3).join(' ');
        const response = await apiClient.searchVideos({
          query: searchQuery,
          nextPage: '',
          prevPage: '',
        });
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

  useEffect(() => {
    setIsReady(false);
  }, [video.id]);

  const handleRelatedVideoPress = useCallback((relatedVideo: Video) => {
    navigation.replace('VideoViewer', { video: relatedVideo });
  }, [navigation]);

  // Landscape mode render
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.playerContainer}>
          <YoutubeView
            player={player}
            height={PLAYER_HEIGHT}
            width={SCREEN_WIDTH}
            style={styles.playerWrapper}
            webViewStyle={{ flex: 1 }}
            webViewProps={{
              androidLayerType: 'hardware',
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
          {!isReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          {isReady && (
            <View style={styles.landscapeOverlay}>
              <Text style={styles.landscapeTitle} numberOfLines={1}>
                {video.title}
              </Text>
              <TouchableOpacity
                style={styles.landscapeDownloadBtn}
                onPress={() => setDownloadVisible(true)}
                activeOpacity={0.8}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <DownloadDrawer
          visible={downloadVisible}
          video={video}
          onClose={() => setDownloadVisible(false)}
        />
      </View>
    );
  }


  // Portrait mode render
  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Video Player */}
      <View style={styles.playerContainer}>
        <YoutubeView
          player={player}
          height={PLAYER_HEIGHT}
          width={SCREEN_WIDTH}
          style={styles.playerWrapper}
          webViewStyle={{ flex: 1 }}
          webViewProps={{
            androidLayerType: 'hardware',
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
        />
        {!isReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.relatedSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.relatedListContent}
      >
        {/* Video Info Card - Improved Layout */}
        <View style={styles.videoInfoCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.metaRow}>
                {video.viewCount != null && (
                  <>
                    <Text style={styles.metaText}>{formatViewCount(video.viewCount)} views</Text>
                    <Text style={styles.metaDot}>•</Text>
                  </>
                )}
                <Text style={styles.metaText}>{formatDate(video.publishedAt)}</Text>
                {video.channelName && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText} numberOfLines={1}>{video.channelName}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          
          {/* Download Button */}
          <TouchableOpacity
            style={[styles.downloadButton, { marginTop: theme.spacing.md }]}
            onPress={() => setDownloadVisible(true)}
            activeOpacity={0.8}
          >
            <Download size={18} color="#FFFFFF" />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <>
            <Text style={[styles.relatedTitle, { marginTop: theme.spacing.lg }]}>
              Related Videos
            </Text>
            <View style={styles.relatedList}>
              {relatedVideos.map((item, index) => (
                <VideoResultCard
                  key={`${item.id}-${index}`}
                  video={item}
                  onPress={handleRelatedVideoPress}
                />
              ))}
            </View>
          </>
        )}
        
        {loadingRelated && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* Banner Ad */}
      <AppBannerAd style={styles.bannerAd} />

      <DownloadDrawer
        visible={downloadVisible}
        video={video}
        onClose={() => setDownloadVisible(false)}
      />
    </View>
  );
};

export default VideoViewerScreen;
