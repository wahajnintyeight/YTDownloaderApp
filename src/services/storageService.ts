import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_PATH_KEY = 'download_path';
const DOWNLOADED_VIDEOS_KEY = 'downloaded_videos';
const DOWNLOAD_QUEUE_KEY = 'download_queue';

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

export interface PersistedDownloadQueue {
  activeDownload: any | null;
  queue: any[];
}

class StorageService {
  async getDownloadPath(): Promise<string | null> {
    try {
      const path = await AsyncStorage.getItem(DOWNLOAD_PATH_KEY);
      console.log(
        `📂 Retrieved download path from storage: ${path || 'not set'}`,
      );
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
      const videos = videosJson ? JSON.parse(videosJson) : [];
      return videos;
    } catch (error) {
      console.error(
        '❌ [STORAGE SERVICE] Failed to get downloaded videos from storage',
        error,
      );
      return [];
    }
  }

  async addDownloadedVideo(video: DownloadedVideo): Promise<void> {
    try {
      console.log(`💾 [STORAGE SERVICE] Adding video to storage:`, {
        id: video.id,
        title: video.title,
        format: video.format,
        filename: video.filename,
      });

      const videos = await this.getDownloadedVideos();
      console.log(
        `📋 [STORAGE SERVICE] Current videos in storage: ${videos.length}`,
      );

      const existingIndex = videos.findIndex(v => v.id === video.id);

      if (existingIndex !== -1) {
        // Update existing video entry
        console.log(
          `🔄 [STORAGE SERVICE] Updating existing video at index ${existingIndex}`,
        );
        videos[existingIndex] = video;
      } else {
        // Add new video entry
        console.log(`➕ [STORAGE SERVICE] Adding new video to storage`);
        videos.unshift(video); // Add to the top of the list
      }

      const jsonData = JSON.stringify(videos);
      console.log(
        `💾 [STORAGE SERVICE] Saving ${videos.length} videos to AsyncStorage (${jsonData.length} bytes)`,
      );
      await AsyncStorage.setItem(DOWNLOADED_VIDEOS_KEY, jsonData);
      console.log(`✅ [STORAGE SERVICE] Successfully saved to AsyncStorage`);

      // Verify the save
      const verification = await AsyncStorage.getItem(DOWNLOADED_VIDEOS_KEY);
      console.log(
        `🔍 [STORAGE SERVICE] Verification: Data exists in storage = ${
          verification !== null
        }`,
      );
    } catch (error) {
      console.error(
        '❌ [STORAGE SERVICE] Failed to add downloaded video to storage',
        error,
      );
      throw error; // Re-throw to let caller know it failed
    }
  }

  async removeDownloadedVideo(id: string): Promise<void> {
    try {
      console.log(`🗑️ [STORAGE SERVICE] Removing video from storage: ${id}`);
      const videos = await this.getDownloadedVideos();
      const filteredVideos = videos.filter(v => v.id !== id);
      console.log(
        `📋 [STORAGE SERVICE] Videos before: ${videos.length}, after: ${filteredVideos.length}`,
      );
      await AsyncStorage.setItem(
        DOWNLOADED_VIDEOS_KEY,
        JSON.stringify(filteredVideos),
      );
      console.log(
        `✅ [STORAGE SERVICE] Successfully removed video from storage`,
      );
    } catch (error) {
      console.error(
        '❌ [STORAGE SERVICE] Failed to remove downloaded video from storage',
        error,
      );
    }
  }

  async saveDownloadQueue(queue: PersistedDownloadQueue): Promise<void> {
    try {
      const queueJson = JSON.stringify(queue);
      await AsyncStorage.setItem(DOWNLOAD_QUEUE_KEY, queueJson);
    } catch (error) {
      console.error('❌ Failed to save download queue to storage', error);
    }
  }

  async loadDownloadQueue(): Promise<PersistedDownloadQueue | null> {
    try {
      const queueJson = await AsyncStorage.getItem(DOWNLOAD_QUEUE_KEY);
      if (queueJson) {
        return JSON.parse(queueJson) as PersistedDownloadQueue;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load download queue from storage', error);
      return null;
    }
  }
}

export const storageService = new StorageService();

// Debug function to test storage (can be called from console or test button)
export const testStorage = async () => {
  console.log('🧪 [STORAGE TEST] Starting storage test...');

  try {
    // Test write
    const testVideo: DownloadedVideo = {
      id: 'test-' + Date.now(),
      videoId: 'test-video-123',
      title: 'Test Video for Storage',
      format: 'mp4',
      filePath: '/test/path/video.mp4',
      filename: 'test-video.mp4',
      downloadedAt: Date.now(),
    };

    console.log('📝 [STORAGE TEST] Writing test video...');
    await storageService.addDownloadedVideo(testVideo);

    // Test read
    console.log('📖 [STORAGE TEST] Reading back from storage...');
    const videos = await storageService.getDownloadedVideos();

    console.log('✅ [STORAGE TEST] Test complete!');
    console.log(`📊 [STORAGE TEST] Found ${videos.length} videos in storage`);
    console.log('📋 [STORAGE TEST] Videos:', videos);

    return videos;
  } catch (error) {
    console.error('❌ [STORAGE TEST] Test failed:', error);
    throw error;
  }
};
