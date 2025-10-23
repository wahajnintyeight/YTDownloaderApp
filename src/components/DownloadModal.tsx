import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Video, VideoFormat, VideoQuality } from '../types/video';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import LoadingAnimation from './LoadingAnimation';

interface DownloadModalProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
}

const formatOptions: VideoFormat[] = ['mp4', 'mp3', 'webm', 'mkv'];
const qualityOptions: VideoQuality[] = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'audio_only'];

const DownloadModal: React.FC<DownloadModalProps> = ({ visible, video, onClose }) => {
  const { theme } = useTheme();
  const { startDownload } = useDownloads();
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!video) return;

    try {
      setIsDownloading(true);
      const downloadId = startDownload(video, selectedFormat, selectedQuality);
      
      Alert.alert(
        'Download Started',
        `${video.title} is now downloading in ${selectedFormat.toUpperCase()} format at ${selectedQuality} quality.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Download Error', 'Failed to start download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [video, selectedFormat, selectedQuality, startDownload, onClose]);

  const handleClose = useCallback(() => {
    if (!isDownloading) {
      onClose();
    }
  }, [isDownloading, onClose]);

  const renderFormatSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>Format</Text>
      <View style={styles.optionsContainer}>
        {formatOptions.map((format) => (
          <TouchableOpacity
            key={format}
            style={[
              styles.optionButton,
              {
                backgroundColor: selectedFormat === format ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedFormat(format)}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: selectedFormat === format ? '#FFFFFF' : theme.colors.text,
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

  const renderQualitySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>Quality</Text>
      <View style={styles.optionsContainer}>
        {qualityOptions.map((quality) => (
          <TouchableOpacity
            key={quality}
            style={[
              styles.optionButton,
              {
                backgroundColor: selectedQuality === quality ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedQuality(quality)}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: selectedQuality === quality ? '#FFFFFF' : theme.colors.text,
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
    selectorTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
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

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.videoChannel, { marginTop: theme.spacing.sm }]}>
                  Starting download...
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
                  Download {selectedFormat.toUpperCase()} - {selectedQuality === 'audio_only' ? 'Audio Only' : selectedQuality}
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