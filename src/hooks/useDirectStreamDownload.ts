import { useCallback } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, Alert } from 'react-native';
import { storageService, DownloadedVideo } from '../services/storageService';
import { SSE_BASE_URL } from '../config/env';

interface DirectDownloadOptions {
  videoId: string;
  videoTitle: string;
  format: 'mp3' | 'mp4' | 'webm';
  quality?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (filePath: string, filename: string) => void;
  onError?: (error: string) => void;
}

export const useDirectStreamDownload = () => {
  const sanitizeFileName = useCallback((name: string): string => {
    const cleaned = (name || '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.substring(0, 150) || 'download';
  }, []);

  const downloadVideo = useCallback(async (options: DirectDownloadOptions): Promise<string> => {
    const {
      videoId,
      videoTitle,
      format,
      quality,
      onProgress,
      onComplete,
      onError,
    } = options;

    try {
      console.log('🟢 Starting Direct Stream Download');
      console.log('📋 Options:', { videoId, videoTitle, format, quality });

      // Build streaming URL
      const streamUrl = new URL(`${SSE_BASE_URL}/stream`);
      streamUrl.searchParams.set('videoId', videoId);
      streamUrl.searchParams.set('format', format);
      if (quality) {
        streamUrl.searchParams.set('quality', quality);
      }

      console.log('🌐 Stream URL:', streamUrl.toString());

      // Determine download directory
      const { config, fs } = ReactNativeBlobUtil;
      const DownloadDir = Platform.OS === 'ios' 
        ? fs.dirs.DocumentDir 
        : fs.dirs.DownloadDir;

      // Create sanitized filename
      const sanitizedTitle = sanitizeFileName(videoTitle || videoId);
      const filename = `${sanitizedTitle}.${format}`;
      const filePath = `${DownloadDir}/YTDownloader/${filename}`;

      console.log('📂 Download path:', filePath);

      // Ensure download directory exists
      const downloadDir = `${DownloadDir}/YTDownloader`;
      try {
        await ReactNativeBlobUtil.fs.mkdir(downloadDir);
      } catch (e) {
        // Directory might already exist
      }

      // Configure download
      const downloadConfig: any = {
        fileCache: true,
        path: filePath,
        trusty: true, // For development with self-signed certs
      };

      // Android-specific: Use Download Manager for background downloads
      if (Platform.OS === 'android') {
        downloadConfig.addAndroidDownloads = {
          useDownloadManager: true,
          notification: true,
          title: `Downloading ${sanitizedTitle}`,
          description: 'YouTube Video Download',
          mime: format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
          mediaScannable: true,
          path: filePath,
        };
      }

      console.log('📥 Starting native download...');

      // Start the download
      const task = config(downloadConfig).fetch('GET', streamUrl.toString());

      // Track progress
      task.progress((received, total) => {
        if (total > 0) {
          const progress = (received / total) * 100;
          console.log(`📊 Progress: ${progress.toFixed(1)}% (${received}/${total} bytes)`);
          onProgress?.(progress);
        }
      });

      // Wait for completion
      const res = await task;
      const savedPath = res.path();

      console.log('✅ Download completed!');
      console.log('📂 Saved to:', savedPath);

      // Save to storage service
      const video: DownloadedVideo = {
        id: `${Date.now()}-${videoId}`,
        videoId,
        title: videoTitle || sanitizedTitle,
        format,
        filePath: savedPath,
        filename,
        downloadedAt: Date.now(),
      };

      await storageService.addDownloadedVideo(video);

      // Show success notification
      Alert.alert(
        'Download Complete',
        `${videoTitle || 'Video'} has been downloaded successfully!`,
        [{ text: 'OK' }]
      );

      // Call completion callback
      onComplete?.(savedPath, filename);

      return savedPath;

    } catch (error) {
      console.error('❌ Direct stream download failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      
      Alert.alert(
        'Download Failed',
        errorMessage,
        [{ text: 'OK' }]
      );

      onError?.(errorMessage);
      throw error;
    }
  }, [sanitizeFileName]);

  return { downloadVideo };
};