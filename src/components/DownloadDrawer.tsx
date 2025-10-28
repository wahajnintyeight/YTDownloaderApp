import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
} from 'react-native';
import { Video, VideoFormat, VideoQuality } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { useDialog } from '../hooks/useDialog';
import { useSettings } from '../contexts/SettingsContext';
import LoadingAnimation from './LoadingAnimation';
import DownloadLocationPicker from './DownloadLocationPicker';

interface DownloadDrawerProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
}

// Primary options (most commonly used)
const primaryFormatOptions: VideoFormat[] = ['mp4', 'mp3'];
const secondaryFormatOptions: VideoFormat[] = ['webm', 'mkv'];

const primaryQualityOptions: VideoQuality[] = ['360p', '480p', '720p'];
const secondaryQualityOptions: VideoQuality[] = [
  '144p',
  '240p',
  '1080p',
  '1440p',
  '2160p',
  'audio_only',
];

const { height: screenHeight } = Dimensions.get('window');
const DRAWER_HEIGHT = screenHeight * 0.85;

const DownloadDrawer: React.FC<DownloadDrawerProps> = ({
  visible,
  video,
  onClose,
}) => {
  const { theme } = useTheme();
  const { startDownload } = useDownloads();
  const { showSuccess, showError } = useDialog();
  const { downloadLocation, setDownloadLocation, isLocationSet } = useSettings();
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllQualities, setShowAllQualities] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragHandleScale = useRef(new Animated.Value(1)).current;
  const drawerScale = useRef(new Animated.Value(1)).current;
  const lastGestureY = useRef(0);

  useEffect(() => {
    if (visible) {
      // Show drawer with smooth bottom-to-top animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(drawerScale, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Quick drag handle animation
      setTimeout(() => {
        Animated.timing(dragHandleScale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(dragHandleScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      }, 150);
    } else {
      // Hide drawer with smooth top-to-bottom animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: DRAWER_HEIGHT,
          damping: 20,
          mass: 0.8,
          stiffness: 150,
          overshootClamping: true,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dragHandleScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to vertical gestures
      return (
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 5
      );
    },
    onPanResponderGrant: () => {
      // Store the current position when gesture starts
      lastGestureY.current = (translateY as any)._value;

      // Quick scale up drag handle to indicate interaction
      Animated.timing(dragHandleScale, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (_, gestureState) => {
      // Calculate new position
      const newY = lastGestureY.current + gestureState.dy;

      // Clamp the value - don't allow dragging above the initial position
      const clampedY = Math.max(0, Math.min(DRAWER_HEIGHT, newY));

      // Update drawer position in real-time
      translateY.setValue(clampedY);

      // Update backdrop opacity based on drawer position
      const progress = 1 - clampedY / DRAWER_HEIGHT;
      backdropOpacity.setValue(progress * 0.4);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentY = lastGestureY.current + gestureState.dy;
      const velocity = gestureState.vy;
      const dragDistance = gestureState.dy;

      // Determine if drawer should close based on:
      // 1. Drag distance (more than 1/3 of drawer height)
      // 2. Velocity (fast downward swipe)
      const shouldClose =
        dragDistance > DRAWER_HEIGHT / 3 ||
        velocity > 0.8 ||
        currentY > DRAWER_HEIGHT * 0.4;

      if (shouldClose) {
        // Close drawer with smooth top-to-bottom animation
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: DRAWER_HEIGHT,
            damping: 20,
            mass: 0.8,
            stiffness: 150,
            overshootClamping: true,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dragHandleScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      } else {
        // Snap back to open position with smooth animation
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.4,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(drawerScale, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dragHandleScale, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const handleDownload = useCallback(async () => {
    if (!video) return;

    // Check if download location is set, if not show picker
    if (!isLocationSet) {
      setShowLocationPicker(true);
      return;
    }

    try {
      setIsDownloading(true);
      
      // Set the download path in the service
      const { downloadService } = await import('../services/downloadService');
      downloadService.setDownloadPath(downloadLocation);
      
      const downloadId = await startDownload(
        video,
        selectedFormat,
        selectedQuality,
      );

      showSuccess(
        'Download Started',
        `${
          video.title
        } is now downloading in ${selectedFormat.toUpperCase()} format at ${selectedQuality} quality.`,
        onClose,
      );
    } catch (error) {
      console.error('Download error:', error);
      showError(
        'Download Error',
        'Failed to start download. Please try again.',
      );
    } finally {
      setIsDownloading(false);
    }
  }, [
    video,
    selectedFormat,
    selectedQuality,
    startDownload,
    isLocationSet,
    downloadLocation,
    onClose,
    showSuccess,
    showError,
  ]);

  const handleClose = useCallback(() => {
    // Always allow closing the drawer, even while downloading
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: DRAWER_HEIGHT,
        damping: 20,
        mass: 0.8,
        stiffness: 150,
        overshootClamping: true,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(dragHandleScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, translateY, backdropOpacity, dragHandleScale]);

  const renderFormatSelector = () => {
    const allFormats = showAllFormats
      ? [...primaryFormatOptions, ...secondaryFormatOptions]
      : primaryFormatOptions;

    return (
      <View style={styles.selectorContainer}>
        <View style={styles.selectorHeader}>
          <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>
            Format
          </Text>
          {secondaryFormatOptions.length > 0 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowAllFormats(!showAllFormats)}
            >
              <Text
                style={[
                  styles.expandButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                {showAllFormats
                  ? 'Show Less'
                  : `+${secondaryFormatOptions.length} More`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.optionsContainer}>
          {allFormats.map(format => (
            <TouchableOpacity
              key={format}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    selectedFormat === format
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    selectedFormat === format
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedFormat(format)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color:
                      selectedFormat === format ? '#FFFFFF' : theme.colors.text,
                    fontWeight: selectedFormat === format ? '600' : '400',
                  },
                ]}
              >
                {format.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderQualitySelector = () => {
    const allQualities = showAllQualities
      ? [...primaryQualityOptions, ...secondaryQualityOptions]
      : primaryQualityOptions;

    return (
      <View style={styles.selectorContainer}>
        <View style={styles.selectorHeader}>
          <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>
            Quality
          </Text>
          {secondaryQualityOptions.length > 0 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowAllQualities(!showAllQualities)}
            >
              <Text
                style={[
                  styles.expandButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                {showAllQualities
                  ? 'Show Less'
                  : `+${secondaryQualityOptions.length} More`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.optionsContainer}>
          {allQualities.map(quality => (
            <TouchableOpacity
              key={quality}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    selectedQuality === quality
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    selectedQuality === quality
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedQuality(quality)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color:
                      selectedQuality === quality
                        ? '#FFFFFF'
                        : theme.colors.text,
                    fontWeight: selectedQuality === quality ? '600' : '400',
                  },
                ]}
              >
                {quality === 'audio_only' ? 'Audio Only' : quality}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'black',
    },
    drawerContainer: {
      height: DRAWER_HEIGHT,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    dragHandle: {
      width: 36,
      height: 4,
      backgroundColor: theme.colors.textSecondary,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
      opacity: 0.4,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    videoInfo: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    thumbnail: {
      width: 120,
      height: 68,
      borderRadius: 8,
      marginRight: theme.spacing.md,
    },
    videoDetails: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    videoChannel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    selectorContainer: {
      marginBottom: theme.spacing.lg,
    },
    selectorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    selectorTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    expandButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    expandButtonText: {
      fontSize: 12,
      fontWeight: '500',
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    optionButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
    },
    optionText: {
      fontSize: 14,
    },
    downloadButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    downloadButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSection: {
      marginTop: 'auto',
      paddingTop: theme.spacing.md,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    loadingText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
    },
  });

  const handleLocationSelect = async (path: string) => {
    try {
      await setDownloadLocation(path);
      setShowLocationPicker(false);
      // Retry the download after location is set
      setTimeout(() => handleDownload(), 100);
    } catch (error) {
      console.error('Error setting location:', error);
      showError('Error', 'Failed to set download location');
    }
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
  };

  if (!video) return null;

  return (
    <>
      <DownloadLocationPicker
        visible={showLocationPicker}
        onSelect={handleLocationSelect}
        onCancel={handleLocationCancel}
      />
      
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.dragHandle,
              {
                transform: [
                  { scaleX: dragHandleScale },
                  { scaleY: dragHandleScale },
                ],
              },
            ]}
          />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Download Video</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.videoInfo}>
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.videoDetails}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.videoChannel}>{video.channelName}</Text>
              </View>
            </View>

            {renderFormatSelector()}
            {renderQualitySelector()}

            <View style={styles.bottomSection}>
              {isDownloading ? (
                <View style={styles.loadingContainer}>
                  <LoadingAnimation type="download" visible={true} />
                  <Text style={styles.loadingText}>Preparing download...</Text>
                  <Text
                    style={[styles.loadingText, { fontSize: 12, marginTop: 4 }]}
                  >
                    This may take a few moments
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloading && styles.downloadButtonDisabled,
                  ]}
                  onPress={handleDownload}
                  disabled={isDownloading}
                >
                  <Text style={styles.downloadButtonText}>
                    Download {selectedFormat.toUpperCase()} -{' '}
                    {selectedQuality === 'audio_only'
                      ? 'Audio Only'
                      : selectedQuality}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
    </>
  );
};

export default React.memo(DownloadDrawer);
