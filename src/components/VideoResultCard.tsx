import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Video } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { formatDuration, formatViewCount } from '../utils/formatters';

interface VideoResultCardProps {
  video: Video;
  onPress: (video: Video) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 16;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = (THUMBNAIL_WIDTH * 9) / 16; // 16:9 aspect ratio

const VideoResultCard: React.FC<VideoResultCardProps> = ({ video, onPress }) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    onPress(video);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    thumbnailContainer: {
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.colors.border,
      marginRight: theme.spacing.sm,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
    },
    placeholderText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    durationOverlay: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
    },
    durationText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      lineHeight: 20,
      marginBottom: theme.spacing.xs,
    },
    channelName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    metaContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    publishedAt: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {!imageError && video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            onError={handleImageError}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>VIDEO</Text>
          </View>
        )}

      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        
        <Text style={styles.channelName} numberOfLines={1}>
          {video.channelName}
        </Text>
        
        <View style={styles.metaContainer}>
          {video.viewCount && (
            <Text style={styles.viewCount}>
              {formatViewCount(video.viewCount)} views
            </Text>
          )}
          <Text style={styles.publishedAt}>
            {new Date(video.publishedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(VideoResultCard);