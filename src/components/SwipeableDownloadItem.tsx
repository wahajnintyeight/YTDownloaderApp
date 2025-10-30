import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Download, DownloadStatus } from '../types/video';
import DownloadProgress from './DownloadProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableDownloadItemProps {
  item: Download;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  statusColor: string;
  statusText: string;
  theme: any;
  styles: any;
}

const SwipeableDownloadItem: React.FC<SwipeableDownloadItemProps> = ({
  item,
  onCancel,
  onDelete,
  statusColor,
  statusText,
  theme,
  styles: s,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    // Close the swipeable with animation
    swipeableRef.current?.close();
    // Small delay to let the close animation finish
    setTimeout(() => {
      onDelete(item.id);
    }, 200);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          localStyles.deleteAction,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[localStyles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Text style={localStyles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const onSwipeableOpen = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      // Auto-delete when swiped far enough
      handleDelete();
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={onSwipeableOpen}
      rightThreshold={DELETE_THRESHOLD}
      friction={2}
      overshootFriction={8}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[s.downloadItem, { backgroundColor: theme.colors.surface }]}
        >
          <View style={s.cardContent}>
            <Image
              source={{ uri: item.video.thumbnailUrl }}
              style={s.thumbnail}
              resizeMode="cover"
            />

            <View style={s.infoContainer}>
              <Text
                style={[s.videoTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {item.video.title}
              </Text>

              <View style={s.metaRow}>
                <Text
                  style={[s.metaText, { color: theme.colors.textSecondary }]}
                >
                  {item.format.toUpperCase()} •{' '}
                  {item.quality === 'audio_only' ? 'Audio' : item.quality}
                </Text>
              </View>
            </View>

            <View style={s.statusContainer}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusLabel, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          {item.status === 'downloading' && (
            <View style={s.progressSection}>
              <DownloadProgress progress={item.progress} visible={true} />
            </View>
          )}

          {(item.status === 'downloading' || item.status === 'pending') && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.cancelButton, { borderColor: theme.colors.error }]}
                onPress={() => onCancel(item.id)}
              >
                <Text style={[s.cancelButtonText, { color: theme.colors.error }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'failed' && item.error && (
            <View
              style={[
                s.messageContainer,
                { backgroundColor: theme.colors.error + '15' },
              ]}
            >
              <Text style={[s.messageText, { color: theme.colors.error }]}>
                {item.error}
              </Text>
            </View>
          )}

          {item.status === 'completed' && item.filePath && (
            <View
              style={[
                s.messageContainer,
                { backgroundColor: theme.colors.success + '15' },
              ]}
            >
              <Text style={[s.messageText, { color: theme.colors.success }]}>
                ✓ {item.filePath.split('/').pop()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
};

const localStyles = StyleSheet.create({
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '90%',
    borderRadius: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(
  SwipeableDownloadItem,
  (prev, next) => {
    // Avoid re-render unless key fields change or progress integer changes
    const prevP = Math.round(prev.item.progress);
    const nextP = Math.round(next.item.progress);
    return (
      prev.item.id === next.item.id &&
      prev.item.status === next.item.status &&
      prevP === nextP &&
      prev.item.filePath === next.item.filePath &&
      prev.item.error === next.item.error &&
      prev.statusColor === next.statusColor &&
      prev.statusText === next.statusText
    );
  },
);
