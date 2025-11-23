import React, { useRef, useEffect, useState } from 'react';
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
import RNFS from 'react-native-fs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableDownloadItemProps {
  item: Download;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onMenuPress?: (item: Download, position: { x: number; y: number }) => void;
  onPress?: (item: Download) => void;
  onLongPress?: (item: Download) => void;
  statusColor: string;
  statusText: string;
  theme: any;
  styles: any;
}

const SwipeableDownloadItem: React.FC<SwipeableDownloadItemProps> = ({
  item,
  onCancel,
  onDelete,
  onMenuPress,
  onPress,
  onLongPress,
  statusColor,
  statusText,
  theme,
  styles: s,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const menuButtonRef = useRef<TouchableOpacity>(null);
  const [sizeMB, setSizeMB] = useState<number | null>(null);
  const [avgSpeedMBps, setAvgSpeedMBps] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const computeMetrics = async () => {
      try {
        if (!item.filePath) return;
        const stat = await RNFS.stat(item.filePath);
        const bytes = Number((stat as any)?.size || 0);
        if (!bytes) return;

        const mb = bytes / 1024 / 1024;
        let speed: number | null = null;
        if (item.startedAt && item.completedAt) {
          const durSec =
            (item.completedAt.getTime() - item.startedAt.getTime()) / 1000;
          if (durSec > 0.5) {
            speed = mb / durSec;
          }
        }

        if (cancelled) return;
        setSizeMB(mb);
        setAvgSpeedMBps(speed);
      } catch {
        // Ignore stat errors (e.g., file moved/deleted)
      }
    };

    if (item.status === 'completed' && item.filePath) {
      computeMetrics();
    }

    return () => {
      cancelled = true;
    };
  }, [item.status, item.filePath, item.startedAt, item.completedAt]);

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
          style={[
            localStyles.deleteButton,
            { backgroundColor: theme.colors.error },
          ]}
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
          onPress={() => onPress?.(item)}
          onLongPress={() => onLongPress?.(item)}
          delayLongPress={500}
          style={[s.downloadItem, { backgroundColor: theme.colors.surface }]}
        >
          <View style={s.cardContent}>
            {item.video.thumbnailUrl ? (
              <Image
                source={{ uri: item.video.thumbnailUrl }}
                style={s.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[s.thumbnail, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#666', fontSize: 10 }}>No Image</Text>
              </View>
            )}

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

              {sizeMB != null && (
                <View style={s.metaRow}>
                  <Text
                    style={[s.metaText, { color: theme.colors.textSecondary }]}
                  >
                    {sizeMB.toFixed(1)} MB
                    {avgSpeedMBps != null
                      ? ` • Avg ${avgSpeedMBps.toFixed(2)} MB/s`
                      : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.statusContainer}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusLabel, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>

            <TouchableOpacity
              ref={menuButtonRef}
              style={localStyles.menuButton}
              onPress={e => {
                e.stopPropagation();
                menuButtonRef.current?.measure(
                  (x, y, width, height, pageX, pageY) => {
                    onMenuPress?.(item, { x: pageX, y: pageY + height });
                  },
                );
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={localStyles.menuDots}>
                <View
                  style={[
                    localStyles.dot,
                    { backgroundColor: theme.colors.textSecondary },
                  ]}
                />
                <View
                  style={[
                    localStyles.dot,
                    { backgroundColor: theme.colors.textSecondary },
                  ]}
                />
                <View
                  style={[
                    localStyles.dot,
                    { backgroundColor: theme.colors.textSecondary },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {item.status === 'downloading' && (
            <View style={s.progressSection}>
              <DownloadProgress
                progress={item.progress}
                visible={true}
                showPercentage={true}
              />
            </View>
          )}

          {(item.status === 'downloading' || item.status === 'pending') && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.cancelButton, { borderColor: theme.colors.error }]}
                onPress={() => onCancel(item.id)}
              >
                <Text
                  style={[s.cancelButtonText, { color: theme.colors.error }]}
                >
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
  menuButton: {
    padding: 8,
    marginLeft: 4,
  },
  menuDots: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default React.memo(SwipeableDownloadItem, (prev, next) => {
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
});
