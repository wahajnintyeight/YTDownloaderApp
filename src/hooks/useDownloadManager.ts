import { useState, useEffect, useCallback } from 'react';
import { storageService, DownloadedVideo } from '../services/storageService';
import { downloadService } from '../services/downloadService';
import RNFS from 'react-native-fs';

export interface UseDownloadManagerReturn {
  // Download list state
  downloadedVideos: DownloadedVideo[];
  loadingVideos: boolean;

  // Download path state
  downloadPath: string | null;
  loadingPath: boolean;

  // Actions
  refreshDownloadList: () => Promise<void>;
  removeDownloadedVideo: (id: string) => Promise<void>;
  updateDownloadPath: (path: string) => Promise<void>;
  resetDownloadPath: () => Promise<void>;
  getDefaultDownloadPath: () => string;
}

/**
 * DRY Hook: Manages all download-related state and operations
 * Centralizes storage interactions and download service coordination
 */
export const useDownloadManager = (): UseDownloadManagerReturn => {
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideo[]>(
    [],
  );
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [loadingPath, setLoadingPath] = useState(false);

  const getDefaultDownloadPath = useCallback(() => {
    return `${RNFS.DownloadDirectoryPath}/YTDownloader`;
  }, []);

  // Load download list from storage
  const refreshDownloadList = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const videos = await storageService.getDownloadedVideos();
      setDownloadedVideos(videos);
      console.log(`✅ Loaded ${videos.length} downloaded videos from storage`);
    } catch (error) {
      console.error('❌ Failed to load downloaded videos', error);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  // Load download path from storage
  const loadDownloadPath = useCallback(async () => {
    setLoadingPath(true);
    try {
      const path = await storageService.getDownloadPath();
      const resolvedPath = path || getDefaultDownloadPath();
      setDownloadPath(resolvedPath);
      console.log(`✅ Loaded download path: ${resolvedPath}`);
    } catch (error) {
      console.error('❌ Failed to load download path', error);
      setDownloadPath(getDefaultDownloadPath());
    } finally {
      setLoadingPath(false);
    }
  }, [getDefaultDownloadPath]);

  // Update download path
  const updateDownloadPath = useCallback(
    async (newPath: string) => {
      setLoadingPath(true);
      try {
        await storageService.setDownloadPath(newPath);
        downloadService.setDownloadPath(newPath);
        setDownloadPath(newPath);
        console.log(`✅ Download path updated: ${newPath}`);
      } catch (error) {
        console.error('❌ Failed to update download path', error);
        throw error;
      } finally {
        setLoadingPath(false);
      }
    },
    [],
  );

  // Reset download path to default
  const resetDownloadPath = useCallback(async () => {
    setLoadingPath(true);
    try {
      await storageService.clearDownloadPath();
      const defaultPath = getDefaultDownloadPath();
      downloadService.setDownloadPath(defaultPath);
      setDownloadPath(defaultPath);
      console.log(`✅ Download path reset to default: ${defaultPath}`);
    } catch (error) {
      console.error('❌ Failed to reset download path', error);
      throw error;
    } finally {
      setLoadingPath(false);
    }
  }, [getDefaultDownloadPath]);

  // Remove a downloaded video from the list
  const removeDownloadedVideo = useCallback(async (id: string) => {
    try {
      await storageService.removeDownloadedVideo(id);
      setDownloadedVideos(prev => prev.filter(v => v.id !== id));
      console.log(`✅ Removed downloaded video: ${id}`);
    } catch (error) {
      console.error('❌ Failed to remove downloaded video', error);
      throw error;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadDownloadPath(), refreshDownloadList()]);
    };
    initialize();
  }, [loadDownloadPath, refreshDownloadList]);

  return {
    downloadedVideos,
    loadingVideos,
    downloadPath,
    loadingPath,
    refreshDownloadList,
    removeDownloadedVideo,
    updateDownloadPath,
    resetDownloadPath,
    getDefaultDownloadPath,
  };
};
