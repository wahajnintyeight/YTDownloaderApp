import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
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

const DownloadModal: React.FC<DownloadModalProps> = ({
  visible,
  video,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { startDownload } = useDownloads();
  const { showSuccess, showError } = useDialog();
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllQualities, setShowAllQualities] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!video) return;

    try {
      setIsDownloading(true);
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
    onClose,
    showSuccess,
    showError,
  ]);

  const handleClose = useCallback(() => {
    // Always allow closing the modal, even while downloading
    onClose();
  }, [onClose]);

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
              <Text style={[styles.expandButtonText, { color: theme.colors.primary }]}>
                {showAllFormats ? 'Show Less' : `+${secondaryFormatOptions.length} More`}
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
                      : isDark ? theme.colors.surface : '#F5F5F5',
                  borderColor: selectedFormat === format ? theme.colors.primary : theme.colors.border,
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
              <Text style={[styles.expandButtonText, { color: theme.colors.primary }]}>
                {showAllQualities ? 'Show Less' : `+${secondaryQualityOptions.length} More`}
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
                      : isDark ? theme.colors.surface : '#F5F5F5',
                  borderColor: selectedQuality === quality ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedQuality(quality)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color:
                      selectedQuality === quality ? '#FFFFFF' : theme.colors.text,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    closeButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    scrollContent: {
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
      borderRadius: 8,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    downloadButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
  });

  if (!video) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={() => {}} // Prevent modal close when tapping content
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Download Video</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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

            {isDownloading ? (
              <View style={styles.loadingContainer}>
                <LoadingAnimation type="download" visible={true} />
                <Text
                  style={[styles.videoChannel, { marginTop: theme.spacing.sm }]}
                >
                  Preparing download...
                </Text>
                <Text
                  style={[
                    styles.videoChannel,
                    { marginTop: theme.spacing.xs, fontSize: 12 },
                  ]}
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
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default DownloadModal;
