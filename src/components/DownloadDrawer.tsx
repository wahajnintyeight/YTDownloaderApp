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
  useWindowDimensions,
  PanResponder,
  Easing,
  ScrollView,
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

// <CHANGE> Drawer takes half the screen space
const getDrawerHeight = (screenHeight: number): number => {
  // Always use 50% of screen height
  return screenHeight * 0.5;
};

const DownloadDrawer: React.FC<DownloadDrawerProps> = ({
  visible,
  video,
  onClose,
}) => {
  // ALL HOOKS MUST BE CALLED FIRST, IN THE SAME ORDER EVERY RENDER
  const { theme } = useTheme();
  const { startDownload } = useDownloads();
  const { showSuccess, showError } = useDialog();
  const { downloadLocation, setDownloadLocation, isLocationSet } =
    useSettings();
  const { width, height } = useWindowDimensions();

  // ALL useState hooks must come before useMemo/useCallback
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [selectedBitrate, setSelectedBitrate] = useState('320k');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllQualities, setShowAllQualities] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Calculate responsive values AFTER all hooks
  const isLandscape = width > height;
  const isSmallScreen = width < 380;
  const isTablet = width >= 600; // Tablets are typically 600px+ width
  
  // Recalculate drawer height on rotation - useMemo AFTER useState
  const DRAWER_HEIGHT = useMemo(() => getDrawerHeight(height), [height]);
  
  // Responsive thumbnail dimensions based on screen size and orientation
  const thumbnailAspectRatio = 16 / 9;
  const thumbnailMaxWidth = isTablet 
    ? (isLandscape ? width * 0.25 : width * 0.35)
    : (isLandscape ? width * 0.3 : width * 0.4);
  const thumbnailWidth = Math.min(thumbnailMaxWidth, isSmallScreen ? 140 : isTablet ? 250 : 200);
  const thumbnailHeight = thumbnailWidth / thumbnailAspectRatio;

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
        onStartShouldSetPanResponder: () => true, // Always capture on start
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Capture if dragging down and vertical movement is dominant
          return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderTerminationRequest: () => false, // Don't allow termination
        onPanResponderGrant: () => {
          lastGestureY.current = (translateY as any)._value;

          Animated.timing(dragHandleScale, {
            toValue: 1.15,
            duration: 100,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: (_, gestureState) => {
          // Allow both up and down, but prefer downward for closing
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
    [translateY, backdropOpacity, dragHandleScale, onClose, DRAWER_HEIGHT],
  );

  const handleDownload = useCallback(async (skipLocationCheck = false) => {
    if (!video) return;

    if (!skipLocationCheck && !isLocationSet) {
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
  }, [onClose, translateY, backdropOpacity, DRAWER_HEIGHT]);

  const handleLocationSelect = useCallback(
    async (path: string) => {
      try {
        await setDownloadLocation(path);
        setShowLocationPicker(false);
        // Wait a bit longer to ensure state is updated, then skip location check
        setTimeout(() => {
          handleDownload(true); // Pass true to skip location check
        }, 300);
      } catch (error) {
        console.error('Error setting location:', error);
        showError('Error', 'Failed to set download location');
        setShowLocationPicker(false);
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

  // <CHANGE> Tab-style button component with better space utilization and tablet support
  const OptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ label, isSelected, onPress }) => {
    // Calculate dynamic width based on screen size, orientation, and label length
    const baseWidth = isSmallScreen ? 60 : isTablet ? 90 : 70;
    const labelLength = label.length;
    const dynamicWidth = Math.max(baseWidth, labelLength * (isSmallScreen ? 8 : isTablet ? 11 : 9));
    
    // Responsive max width based on device type and orientation
    const getMaxWidth = () => {
      if (isTablet) {
        return isLandscape ? '24%' : '30%'; // More columns on tablets
      }
      return isSmallScreen ? '48%' : '32%';
    };
    
    return (
      <TouchableOpacity
        style={[
          optionButtonStyles.button,
          {
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.background,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
            paddingVertical: isSmallScreen ? 10 : isTablet ? 14 : 12,
            paddingHorizontal: isSmallScreen ? 14 : isTablet ? 20 : 16,
            minWidth: dynamicWidth,
            flex: isSmallScreen ? 0 : isTablet ? 0 : 1,
            maxWidth: getMaxWidth(),
            shadowColor: isSelected ? theme.colors.primary : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.25 : 0,
            shadowRadius: 4,
            elevation: isSelected ? 2 : 0,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            optionButtonStyles.text,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text,
              fontWeight: isSelected ? '700' : '600',
              fontSize: isSmallScreen ? 13 : isTablet ? 16 : 14,
              letterSpacing: 0.2,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // <CHANGE> Tab-based selector section with better space utilization
  const SelectorSection: React.FC<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    showExpand: boolean;
    expanded: boolean;
    onToggleExpand: () => void;
    allOptions?: string[]; // All available options for count calculation
  }> = ({
    title,
    options,
    selected,
    onSelect,
    showExpand,
    expanded,
    onToggleExpand,
    allOptions,
  }) => {
    const totalOptions = allOptions || options;
    const hiddenCount = totalOptions.length - options.length;
    
    return (
      <View style={[selectorStyles.container, { 
        marginBottom: isSmallScreen ? 20 : isTablet ? 28 : 24,
        paddingVertical: isSmallScreen ? 12 : isTablet ? 20 : 16,
        paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }]}>
        <View style={[selectorStyles.header, { marginBottom: isSmallScreen ? 12 : isTablet ? 18 : 16 }]}>
          <Text style={[selectorStyles.title, { 
            color: theme.colors.text, 
            fontSize: isSmallScreen ? 15 : isTablet ? 20 : 17,
            fontWeight: '700',
            letterSpacing: 0.3,
          }]}>
            {title}
          </Text>
          {showExpand && hiddenCount > 0 && (
            <TouchableOpacity
              style={[selectorStyles.expandButton, {
                paddingHorizontal: isSmallScreen ? 10 : 12,
                paddingVertical: isSmallScreen ? 6 : 8,
              }]}
              onPress={onToggleExpand}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  selectorStyles.expandText,
                  { color: theme.colors.primary, fontSize: isSmallScreen ? 13 : 14, fontWeight: '600' },
                ]}
              >
                {expanded ? 'Less' : `+${hiddenCount}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[selectorStyles.options, { 
          gap: isSmallScreen ? 10 : isTablet ? 14 : 12,
          flexWrap: 'wrap',
        }]}>
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
  };

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
              { 
                transform: [{ translateY }],
                height: DRAWER_HEIGHT,
                maxHeight: DRAWER_HEIGHT,
                overflow: 'hidden', // Keep content within drawer bounds
              },
            ]}
          >
            {/* Draggable header area - handle + header */}
            <View {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  drawerStyles.dragHandle,
                  { transform: [{ scaleX: dragHandleScale }] },
                  { marginTop: isSmallScreen ? 6 : 8 },
                ]}
              />

              <View style={[drawerStyles.header, { 
                paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20, 
                paddingVertical: isSmallScreen ? 12 : isTablet ? 18 : 16 
              }]}>
                <Text style={[drawerStyles.headerTitle, { 
                  fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20 
                }]}>Download Video</Text>
              </View>
            </View>

            <ScrollView
              style={[drawerStyles.content, { flex: 1 }]}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              bounces={false}
              overScrollMode="never"
              contentContainerStyle={{ 
                paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20, 
                paddingBottom: isSmallScreen ? 40 : isTablet ? 60 : 50,
                paddingTop: isSmallScreen ? 8 : isTablet ? 16 : 12,
              }}
            >
              <View style={[drawerStyles.videoInfo, { 
                marginBottom: isSmallScreen ? 20 : isTablet ? 28 : 24, 
                minHeight: thumbnailHeight,
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                padding: isSmallScreen ? 12 : isTablet ? 20 : 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                overflow: 'hidden', // Ensure content stays within bounds
              }]}>
                <Image
                  source={{ uri: video.thumbnailUrl }}
                  style={[drawerStyles.thumbnail, { 
                    height: thumbnailHeight, 
                    width: thumbnailWidth,
                    borderRadius: 12,
                    flexShrink: 0, // Prevent thumbnail from shrinking
                  }]}
                  resizeMode="cover"
                />
                <View style={[drawerStyles.videoDetails, { 
                  marginLeft: isSmallScreen ? 12 : isTablet ? 20 : 16, 
                  flex: 1,
                  minWidth: 0, // Allow text to shrink properly
                }]}>
                  <Text style={[drawerStyles.videoTitle, { 
                    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
                    fontWeight: '700',
                    lineHeight: isSmallScreen ? 20 : isTablet ? 26 : 22,
                    marginBottom: isSmallScreen ? 6 : isTablet ? 10 : 8,
                  }]} numberOfLines={isTablet ? 4 : 3}>
                    {video.title}
                  </Text>
                  <Text style={[drawerStyles.videoChannel, { 
                    fontSize: isSmallScreen ? 12 : isTablet ? 15 : 14,
                    opacity: 0.8,
                  }]} numberOfLines={1}>
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
                allOptions={[...PRIMARY_FORMATS, ...SECONDARY_FORMATS]}
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
                  allOptions={[...PRIMARY_QUALITIES, ...SECONDARY_QUALITIES]}
                />
              )}

              {/* Bitrate selection hidden for now */}
              {false && selectedFormat === 'mp3' && (
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

              <View style={[drawerStyles.bottomSection, { 
                marginTop: isSmallScreen ? 16 : isTablet ? 24 : 20,
                paddingTop: isSmallScreen ? 12 : isTablet ? 20 : 16,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }]}>
                {isDownloading ? (
                  <View style={drawerStyles.loadingContainer}>
                    <LoadingAnimation type="download" visible={true} />
                    <Text
                      style={[
                        drawerStyles.loadingText,
                        { 
                          color: theme.colors.textSecondary, 
                          fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16, 
                          marginTop: 12 
                        },
                      ]}
                    >
                      Adding to queue...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      drawerStyles.downloadButton,
                      { 
                        backgroundColor: theme.colors.primary, 
                        paddingVertical: isSmallScreen ? 16 : isTablet ? 20 : 18,
                        borderRadius: 16,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                      },
                    ]}
                    onPress={() => handleDownload()}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    <Text style={[drawerStyles.downloadButtonText, { 
                      fontSize: isSmallScreen ? 15 : isTablet ? 19 : 17,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }]}>
                      {`Download ${selectedFormat.toUpperCase()}${!isAudioFormat && selectedQuality !== 'audio_only' ? ` • ${selectedQuality.toUpperCase()}` : ''}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default React.memo(DownloadDrawer);