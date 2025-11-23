import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
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
import {
  getDrawerStyles,
  getSelectorStyles,
  getOptionButtonStyles,
} from './DownloadDrawer.styles';

interface DownloadDrawerProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
}

const PRIMARY_FORMATS: VideoFormat[] = ['mp4', 'mp3'];
const SECONDARY_FORMATS: VideoFormat[] = ['webm', 'mkv'];
const PRIMARY_QUALITIES: VideoQuality[] = ['360p', '480p', '720p'];
const SECONDARY_QUALITIES: VideoQuality[] = [
  '144p',
  '240p',
  '1080p',
  '1440p',
  '2160p',
  'audio_only',
];
const BITRATE_OPTIONS = ['128k', '192k', '256k', '320k'];
const DRAWER_HEIGHT = Dimensions.get('window').height * 0.85;

const DownloadDrawer: React.FC<DownloadDrawerProps> = ({
  visible,
  video,
  onClose,
}) => {
  const { theme } = useTheme();
  const { startDownload } = useDownloads();
  const { showSuccess, showError } = useDialog();
  const { downloadLocation, setDownloadLocation, isLocationSet } =
    useSettings();

  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [selectedBitrate, setSelectedBitrate] = useState('320k');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllQualities, setShowAllQualities] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragHandleScale = useRef(new Animated.Value(1)).current;
  const lastGestureY = useRef(0);

  const animationsRef = useRef<any[]>([]);
  const lastVideoQualityRef = useRef<VideoQuality>('720p');

  const drawerStyles = useMemo(() => getDrawerStyles(theme), [theme]);
  const selectorStyles = useMemo(() => getSelectorStyles(theme), [theme]);
  const optionButtonStyles = useMemo(
    () => getOptionButtonStyles(theme),
    [theme],
  );

  useEffect(() => {
    if (visible) {
      animationsRef.current = [
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
      ];

      Animated.parallel(animationsRef.current).start();

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dragHandleScale, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(dragHandleScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }, 150);
    }

    return () => {
      animationsRef.current.forEach(animation => {
        animation && 'stop' in animation && animation.stop?.();
      });
    };
  }, [visible, translateY, backdropOpacity, dragHandleScale]);

  useEffect(() => {
    if (selectedFormat === 'mp3') {
      if (selectedQuality !== 'audio_only') {
        lastVideoQualityRef.current = selectedQuality;
        setSelectedQuality('audio_only');
      }
      if (showAllQualities) {
        setShowAllQualities(false);
      }
    } else if (selectedQuality === 'audio_only') {
      setSelectedQuality(lastVideoQualityRef.current || '720p');
    }
  }, [selectedFormat, selectedQuality, showAllQualities]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          lastGestureY.current = (translateY as any)._value;

          Animated.timing(dragHandleScale, {
            toValue: 1.15,
            duration: 100,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: (_, gestureState) => {
          const newY = Math.max(
            0,
            Math.min(DRAWER_HEIGHT, lastGestureY.current + gestureState.dy),
          );

          translateY.setValue(newY);
          backdropOpacity.setValue((1 - newY / DRAWER_HEIGHT) * 0.4);
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentY = lastGestureY.current + gestureState.dy;
          const shouldClose =
            gestureState.dy > DRAWER_HEIGHT / 3 ||
            gestureState.vy > 0.8 ||
            currentY > DRAWER_HEIGHT * 0.4;

          if (shouldClose) {
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
            ]).start(() => onClose());
          } else {
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
              Animated.timing(dragHandleScale, {
                toValue: 1,
                duration: 160,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      }),
    [translateY, backdropOpacity, dragHandleScale, onClose],
  );

  const handleDownload = useCallback(async () => {
    if (!video) return;

    if (!isLocationSet) {
      setShowLocationPicker(true);
      return;
    }

    setIsDownloading(true);

    try {
      const { downloadService } = await import('../services/downloadService');
      downloadService.setDownloadPath(downloadLocation);

      const sanitizedQuality =
        selectedFormat === 'mp3'
          ? ('audio_only' as VideoQuality)
          : selectedQuality;

      await startDownload(video, selectedFormat, sanitizedQuality, {
        bitRate: selectedFormat === 'mp3' ? selectedBitrate : undefined,
      });

      onClose();

      setTimeout(() => {
        showSuccess(
          'Download Queued',
          `${video.title} has been added to the download queue.`,
        );
      }, 300);
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
    selectedBitrate,
    startDownload,
    isLocationSet,
    downloadLocation,
    onClose,
    showSuccess,
    showError,
  ]);

  const handleClose = useCallback(() => {
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
    ]).start(() => onClose());
  }, [onClose, translateY, backdropOpacity]);

  const handleLocationSelect = useCallback(
    async (path: string) => {
      try {
        await setDownloadLocation(path);
        setShowLocationPicker(false);
        setTimeout(() => handleDownload(), 100);
      } catch (error) {
        console.error('Error setting location:', error);
        showError('Error', 'Failed to set download location');
      }
    },
    [setDownloadLocation, handleDownload, showError],
  );

  const formatOptions = useMemo(
    () =>
      showAllFormats
        ? [...PRIMARY_FORMATS, ...SECONDARY_FORMATS]
        : PRIMARY_FORMATS,
    [showAllFormats],
  );

  const qualityOptions = useMemo(
    () =>
      showAllQualities
        ? [...PRIMARY_QUALITIES, ...SECONDARY_QUALITIES]
        : PRIMARY_QUALITIES,
    [showAllQualities],
  );

  const isAudioFormat = selectedFormat === 'mp3';
  const shouldShowQualitySelector = !isAudioFormat;

  // Helper button component
  const OptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        optionButtonStyles.button,
        {
          backgroundColor: isSelected
            ? theme.colors.secondary
            : theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.secondary
            : theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          optionButtonStyles.text,
          {
            color: isSelected
              ? theme.colors.background === '#FFFFFF'
                ? '#000000'
                : '#FFFFFF'
              : theme.colors.text,
            fontWeight: isSelected ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Selector section component
  const SelectorSection: React.FC<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    showExpand: boolean;
    expanded: boolean;
    onToggleExpand: () => void;
  }> = ({
    title,
    options,
    selected,
    onSelect,
    showExpand,
    expanded,
    onToggleExpand,
  }) => (
      <View style={selectorStyles.container}>
        <View style={selectorStyles.header}>
          <Text style={[selectorStyles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {showExpand && (
            <TouchableOpacity
              style={selectorStyles.expandButton}
              onPress={onToggleExpand}
            >
              <Text
                style={[
                  selectorStyles.expandText,
                  { color: theme.colors.secondary },
                ]}
              >
                {expanded ? 'Show Less' : `+${options.length - 3} More`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={selectorStyles.options}>
          {options.map(option => (
            <OptionButton
              key={option}
              label={option === 'audio_only' ? 'Audio Only' : option}
              isSelected={selected === option}
              onPress={() => onSelect(option)}
            />
          ))}
        </View>
      </View>
    );

  if (!video) return null;

  return (
    <>
      <DownloadLocationPicker
        visible={showLocationPicker}
        onSelect={handleLocationSelect}
        onCancel={() => setShowLocationPicker(false)}
      />

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={drawerStyles.modalOverlay}>
          <Animated.View
            style={[drawerStyles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              activeOpacity={1}
              onPress={handleClose}
            />
          </Animated.View>

          <Animated.View
            style={[
              drawerStyles.drawerContainer,
              { transform: [{ translateY }] },
            ]}
            {...panResponder.panHandlers}
          >
            <Animated.View
              style={[
                drawerStyles.dragHandle,
                { transform: [{ scaleX: dragHandleScale }] },
              ]}
            />

            <View style={drawerStyles.header}>
              <Text style={drawerStyles.headerTitle}>Download Video</Text>
            </View>

            <View style={drawerStyles.content}>
              <View style={drawerStyles.videoInfo}>
                <Image
                  source={{ uri: video.thumbnailUrl }}
                  style={drawerStyles.thumbnail}
                  resizeMode="cover"
                />
                <View style={drawerStyles.videoDetails}>
                  <Text style={drawerStyles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={drawerStyles.videoChannel}>
                    {video.channelName}
                  </Text>
                </View>
              </View>

              <SelectorSection
                title="Format"
                options={formatOptions}
                selected={selectedFormat}
                onSelect={setSelectedFormat as any}
                showExpand={SECONDARY_FORMATS.length > 0}
                expanded={showAllFormats}
                onToggleExpand={() => setShowAllFormats(!showAllFormats)}
              />

              {shouldShowQualitySelector && (
                <SelectorSection
                  title="Quality"
                  options={qualityOptions}
                  selected={selectedQuality}
                  onSelect={option => {
                    const chosen = option as VideoQuality;
                    lastVideoQualityRef.current = chosen;
                    setSelectedQuality(chosen);
                  }}
                  showExpand={SECONDARY_QUALITIES.length > 0}
                  expanded={showAllQualities}
                  onToggleExpand={() => setShowAllQualities(!showAllQualities)}
                />
              )}

              {selectedFormat === 'mp3' && (
                <SelectorSection
                  title="Bitrate (Audio Quality)"
                  options={BITRATE_OPTIONS}
                  selected={selectedBitrate}
                  onSelect={setSelectedBitrate}
                  showExpand={false}
                  expanded={false}
                  onToggleExpand={() => { }}
                />
              )}

              <View style={drawerStyles.bottomSection}>
                {isDownloading ? (
                  <View style={drawerStyles.loadingContainer}>
                    <LoadingAnimation type="download" visible={true} />
                    <Text
                      style={[
                        drawerStyles.loadingText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Adding to queue...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      drawerStyles.downloadButton,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                    onPress={handleDownload}
                    disabled={isDownloading}
                  >
                    <Text style={drawerStyles.downloadButtonText}>
                      {`Download ${selectedFormat.toUpperCase()} - ${isAudioFormat
                          ? selectedBitrate.toUpperCase()
                          : selectedQuality === 'audio_only'
                            ? 'Audio Only'
                            : selectedQuality.toUpperCase()
                        }`}
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
