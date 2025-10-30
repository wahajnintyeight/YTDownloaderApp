import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_PATH_KEY = 'download_path';
const DOWNLOADED_VIDEOS_KEY = 'downloaded_videos';

export interface DownloadedVideo {
  id: string; // localDownloadId
  videoId: string;
  title: string;
  format: 'mp3' | 'mp4' | 'webm';
  filePath: string;
  filename: string;
  downloadedAt: number;
  thumbnailUrl?: string;
}

class StorageService {
  async getDownloadPath(): Promise<string | null> {
    try {
      const path = await AsyncStorage.getItem(DOWNLOAD_PATH_KEY);
      console.log(`📂 Retrieved download path from storage: ${path || 'not set'}`);
      return path;
    } catch (error) {
      console.error('❌ Failed to get download path from storage', error);
      return null;
    }
  }

  async setDownloadPath(path: string): Promise<void> {
    try {
      await AsyncStorage.setItem(DOWNLOAD_PATH_KEY, path);
      console.log(`✅ Download path saved to storage: ${path}`);
    } catch (error) {
      console.error('❌ Failed to set download path in storage', error);
      throw error;
    }
  }

  async clearDownloadPath(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DOWNLOAD_PATH_KEY);
      console.log('✅ Download path cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear download path from storage', error);
    }
  }

  async getDownloadedVideos(): Promise<DownloadedVideo[]> {
    try {
      const videosJson = await AsyncStorage.getItem(DOWNLOADED_VIDEOS_KEY);
      return videosJson ? JSON.parse(videosJson) : [];
    } catch (error) {
      console.error('❌ Failed to get downloaded videos from storage', error);
      return [];
    }
  }

  async addDownloadedVideo(video: DownloadedVideo): Promise<void> {
    try {
      const videos = await this.getDownloadedVideos();
      const existingIndex = videos.findIndex(v => v.id === video.id);

      if (existingIndex !== -1) {
        // Update existing video entry
        videos[existingIndex] = video;
      } else {
        // Add new video entry
        videos.unshift(video); // Add to the top of the list
      }

      await AsyncStorage.setItem(DOWNLOADED_VIDEOS_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('❌ Failed to add downloaded video to storage', error);
    }
  }

  async removeDownloadedVideo(id: string): Promise<void> {
    try {
      const videos = await this.getDownloadedVideos();
      const filteredVideos = videos.filter(v => v.id !== id);
      await AsyncStorage.setItem(
        DOWNLOADED_VIDEOS_KEY,
        JSON.stringify(filteredVideos),
      );
    } catch (error) {
      console.error('❌ Failed to remove downloaded video from storage', error);
    }
  }
}

export const storageService = new StorageService();
