import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDirectStreamDownload } from '../hooks/useDirectStreamDownload';

interface Props {
  videoId: string;
  videoTitle: string;
  format?: 'mp3' | 'mp4';
  quality?: string;
}

export const DirectStreamDownloadButton: React.FC<Props> = ({
  videoId,
  videoTitle,
  format = 'mp4',
  quality,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { downloadVideo } = useDirectStreamDownload();

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      await downloadVideo({
        videoId,
        videoTitle,
        format,
        quality,
        onProgress: (progress) => {
          setProgress(progress);
        },
        onComplete: (filePath, filename) => {
          console.log('✅ Download completed:', { filePath, filename });
          setIsDownloading(false);
          setProgress(0);
        },
        onError: (error) => {
          console.error('❌ Download failed:', error);
          setIsDownloading(false);
          setProgress(0);
        },
      });
    } catch (error) {
      console.error('❌ Download error:', error);
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isDownloading && styles.buttonDisabled,
        ]}
        onPress={handleDownload}
        disabled={isDownloading}
      >
        <Text style={styles.buttonText}>
          {isDownloading 
            ? `Downloading... ${progress.toFixed(0)}%`
            : `Download ${format.toUpperCase()}`
          }
        </Text>
      </TouchableOpacity>
      
      {isDownloading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});