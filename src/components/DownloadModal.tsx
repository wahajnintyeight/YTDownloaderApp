import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Download, X, FileVideo, Music, Film, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Video, VideoFormat, VideoQuality } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { useDialog } from '../hooks/useDialog';
import LoadingAnimation from './LoadingAnimation';

interface DownloadModalProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
}

const formatOptions: Array<{ value: VideoFormat; label: string; icon: any }> = [
  { value: 'mp4', label: 'MP4', icon: FileVideo },
  { value: 'mp3', label: 'MP3', icon: Music },
  { value: 'webm', label: 'WebM', icon: Film },
];

const qualityGroups = {
  common: ['360p', '480p', '720p'] as VideoQuality[],
  advanced: ['144p', '240p', '1080p', '1440p', '2160p', 'audio_only'] as VideoQuality[],
};

const DownloadModal: React.FC<DownloadModalProps> = ({
  visible,
  video,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { startDownload } = useDownloads();
  const { showSuccess, showError } = useDialog();
  const { width, height } = useWindowDimensions();

  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isLandscape = width > height;
  const isSmallScreen = width < 380;
  const isLargeScreen = width > 500;

  const handleDownload = useCallback(async () => {
    if (!video) return;
    try {
      setIsDownloading(true);
      await startDownload(video, selectedFormat, selectedQuality);
      showSuccess(
        'Download Started',
        `${video.title} is downloading in ${selectedFormat.toUpperCase()} at ${selectedQuality}.`,
        onClose,
      );
    } catch (error) {
      console.error('Download error:', error);
      showError('Download Error', 'Failed to start download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [video, selectedFormat, selectedQuality, startDownload, onClose, showSuccess, showError]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const styles = getStyles(theme, isDark, width, height, isLandscape, isSmallScreen, isLargeScreen);

  if (!video) return null;

  const allQualities = showAdvanced
    ? [...qualityGroups.common, ...qualityGroups.advanced]
    : qualityGroups.common;

  const maxHeight = isLandscape ? '95%' : '85%';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={[styles.container, { maxHeight }]}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <LinearGradient
            colors={isDark ? ['#2A2A2A', '#1F1F1F'] : ['#FFFFFF', '#F8F8F8']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Download size={24} color={theme.colors.primary} strokeWidth={2.5} />
              <Text style={styles.headerTitle}>Download Options</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!isLandscape || height < 500}
          >
            {/* Video Preview Card */}
            <View style={styles.videoCard}>
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.thumbnailOverlay}
              >
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.videoChannel} numberOfLines={1}>
                  {video.channelName}
                </Text>
              </LinearGradient>
            </View>

            {/* Format Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Format</Text>
              <View style={styles.formatGrid}>
                {formatOptions.map(({ value, label, icon: Icon }) => {
                  const isSelected = selectedFormat === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.formatCard,
                        isSelected && styles.formatCardSelected,
                      ]}
                      onPress={() => setSelectedFormat(value)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Check size={14} color="#FFF" strokeWidth={3} />
                        </View>
                      )}
                      <Icon
                        size={isSmallScreen ? 24 : 28}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.formatLabel,
                          isSelected && styles.formatLabelSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quality Selector */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quality</Text>
                {qualityGroups.advanced.length > 0 && (
                  <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}>
                    <Text style={styles.advancedToggle}>
                      {showAdvanced ? 'Show Less' : `+${qualityGroups.advanced.length} More`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.qualityGrid}>
                {allQualities.map((quality) => {
                  const isSelected = selectedQuality === quality;
                  return (
                    <TouchableOpacity
                      key={quality}
                      style={[
                        styles.qualityChip,
                        isSelected && styles.qualityChipSelected,
                      ]}
                      onPress={() => setSelectedQuality(quality)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.qualityText,
                          isSelected && styles.qualityTextSelected,
                        ]}
                      >
                        {quality === 'audio_only' ? 'Audio' : quality}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Download Button */}
            {isDownloading ? (
              <View style={styles.loadingContainer}>
                <LoadingAnimation type="download" visible={true} />
                <Text style={styles.loadingText}>Preparing download...</Text>
                <Text style={styles.loadingSubtext}>This may take a moment</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.downloadGradient}
                >
                  <Download size={20} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.downloadText} numberOfLines={1}>
                    Download {selectedFormat.toUpperCase()} • {selectedQuality === 'audio_only' ? 'Audio' : selectedQuality}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (
  theme: any,
  isDark: boolean,
  width: number,
  height: number,
  isLandscape: boolean,
  isSmallScreen: boolean,
  isLargeScreen: boolean,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerTitle: {
      fontSize: isSmallScreen ? 18 : 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: isSmallScreen ? 16 : 20,
      paddingBottom: isLandscape ? 20 : 40,
    },
    videoCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: isSmallScreen ? 16 : 24,
      height: isSmallScreen ? 140 : isLandscape ? 120 : 180,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: isSmallScreen ? 12 : 16,
      justifyContent: 'flex-end',
    },
    videoTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '700',
      color: '#FFF',
      marginBottom: 4,
    },
    videoChannel: {
      fontSize: isSmallScreen ? 12 : 14,
      color: 'rgba(255,255,255,0.9)',
    },
    section: {
      marginBottom: isSmallScreen ? 16 : 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: isSmallScreen ? 8 : 12,
    },
    advancedToggle: {
      fontSize: isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    formatGrid: {
      flexDirection: 'row',
      gap: isSmallScreen ? 8 : 12,
    },
    formatCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? 12 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      position: 'relative',
      minHeight: isSmallScreen ? 100 : 120,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    formatCardSelected: {
      backgroundColor: isDark ? theme.colors.surface : '#F0F4FF',
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    checkBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formatLabel: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    formatLabelSelected: {
      color: theme.colors.primary,
    },
    qualityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isSmallScreen ? 8 : 10,
    },
    qualityChip: {
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: isSmallScreen ? 8 : 10,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: '30%',
      alignItems: 'center',
    },
    qualityChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    qualityText: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    qualityTextSelected: {
      color: '#FFF',
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: isSmallScreen ? 20 : 32,
    },
    loadingText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 12,
    },
    loadingSubtext: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    downloadButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: isSmallScreen ? 4 : 8,
      marginBottom: 8,
    },
    downloadGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isSmallScreen ? 12 : 16,
      gap: 10,
    },
    downloadText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '700',
      color: '#FFF',
    },
  });

export default DownloadModal;