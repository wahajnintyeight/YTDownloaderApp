import RNFS from 'react-native-fs';
import EventSource from 'react-native-sse';

export interface DownloadProgress {
  type: 'download_progress';
  downloadId: string;
  status: 'processing' | 'downloading';
  progress: number;
  message: string;
}

export interface DownloadComplete {
  type: 'download_complete';
  downloadId: string;
  status: 'completed';
  progress: number;
  message: string;
  file: {
    videoId: string;
    status: 'completed';
    filename: string;
    fileSize: number;
    mimeType: string;
    fileContent: string; // base64 encoded
  };
}

export interface DownloadError {
  type: 'download_error';
  downloadId: string;
  status: 'error';
  progress: number;
  message: string;
}

export type DownloadEvent = DownloadProgress | DownloadComplete | DownloadError;

export interface DownloadOptions {
  videoId: string;
  format: 'mp3' | 'mp4' | 'webm';
  bitRate?: string; // For audio formats like '320k'
  quality?: string; // For video formats like '720p'
}

export interface DownloadResponse {
  code: number;
  message: string;
  result: {
    downloadId: string;
    message: string;
    sseEndpoint: string;
    status: string;
  };
}

class DownloadService {
  private apiBaseUrl: string;
  private sseBaseUrl: string;
  private activeEventSources: Map<string, EventSource> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxReconnectAttempts: number = 5;
  private heartbeatTimeout: number = 30000; // 30 seconds

  constructor(
    apiBaseUrl: string = 'https://api.theprojectphoenix.top',
    sseBaseUrl: string = 'https://sse.theprojectphoenix.top'
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.sseBaseUrl = sseBaseUrl;
  }

  async downloadVideo(
    options: DownloadOptions,
    onProgress?: (progress: number) => void,
    onComplete?: (filePath: string, filename: string) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[${timestamp}] 📥 DOWNLOAD API CALL INITIATED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Download Options:', {
      videoId: options.videoId,
      format: options.format,
      bitRate: options.bitRate || 'default',
      quality: options.quality || 'default',
    });
    console.log('🌐 API Endpoint:', `${this.apiBaseUrl}/v2/api/download-yt-videos`);

    try {
      console.log('⏳ Sending POST request to download API...');

      // Start download request
      const response = await fetch(`${this.apiBaseUrl}/v2/api/download-yt-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: options.videoId,
          format: options.format,
          bitRate: options.bitRate,
          quality: options.quality,
        }),
      });

      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`❌ API Error: HTTP ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get download ID from server response
      const responseData: any = await response.json();

      console.log('✅ Download API Response:', responseData);

      // Extract download ID from nested result object
      const downloadId = responseData.result?.downloadId || responseData.downloadId;

      console.log(`🆔 Download ID: ${downloadId}`);

      if (!downloadId) {
        console.error('❌ No download ID in response');
        console.error('Response structure:', JSON.stringify(responseData, null, 2));
        throw new Error('Server did not return a download ID');
      }

      console.log('🔄 Starting SSE EventSource listener for real-time updates...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Use proper SSE EventSource for real-time updates
      this.startSSEListener(downloadId, onProgress, onComplete, onError);

      return downloadId;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ DOWNLOAD INITIATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      onError?.(error instanceof Error ? error.message : 'Failed to start download');
      throw error;
    }
  }

  private startSSEListener(
    downloadId: string,
    onProgress?: (progress: number) => void,
    onComplete?: (filePath: string, filename: string) => void,
    onError?: (error: string) => void
  ): void {
    const sseUrl = `${this.sseBaseUrl}/events/download-${downloadId}`;
    const timestamp = new Date().toISOString();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 SSE CONNECTION ESTABLISHED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🆔 Download ID: ${downloadId}`);
    console.log(`🌐 SSE Endpoint: ${sseUrl}`);
    console.log(`📡 Connection State: CONNECTING`);
    console.log(`⏰ Connected at: ${timestamp}`);
    console.log(`💓 Heartbeat timeout: ${this.heartbeatTimeout / 1000}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Create EventSource connection (removed lineEndingCharacter option)
      const eventSource = new EventSource(sseUrl);

      // Store active connection
      this.activeEventSources.set(downloadId, eventSource);
      this.reconnectAttempts.set(downloadId, 0);

      // Setup heartbeat monitoring
      const resetHeartbeat = () => {
        // Clear existing timer
        const existingTimer = this.heartbeatTimers.get(downloadId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new heartbeat timer
        const timer = setTimeout(() => {
          const timeoutTimestamp = new Date().toISOString();
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn(`[${timeoutTimestamp}] ⚠️ HEARTBEAT TIMEOUT`);
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn(`🆔 Download ID: ${downloadId}`);
          console.warn(`⏱️ No messages received for ${this.heartbeatTimeout / 1000}s`);
          console.warn('🔄 Connection may be dead - attempting reconnect...');
          console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          // Close the dead connection
          eventSource.close();
          this.activeEventSources.delete(downloadId);
          this.heartbeatTimers.delete(downloadId);

          // Attempt reconnection
          const attempts = this.reconnectAttempts.get(downloadId) || 0;
          if (attempts < this.maxReconnectAttempts) {
            this.reconnectAttempts.set(downloadId, attempts + 1);
            const backoffDelay = Math.min(1000 * Math.pow(2, attempts), 5000);
            console.log(`🔄 Reconnecting in ${backoffDelay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})...\n`);
            
            setTimeout(() => {
              this.startSSEListener(downloadId, onProgress, onComplete, onError);
            }, backoffDelay);
          } else {
            console.error('❌ Max reconnection attempts exceeded - giving up');
            onError?.('Connection timeout - no response from server');
          }
        }, this.heartbeatTimeout);

        this.heartbeatTimers.set(downloadId, timer);
      };

      // Start heartbeat monitoring
      resetHeartbeat();

      // Handle connection open
      eventSource.addEventListener('open', () => {
        const openTimestamp = new Date().toISOString();
        console.log(`[${openTimestamp}] 🔌 SSE Connection opened successfully`);
        console.log(`📡 Connection State: OPEN`);
        console.log(`🆔 Download ID: ${downloadId}`);
        console.log(`💓 Heartbeat monitoring active\n`);

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(downloadId, 0);
        resetHeartbeat();
      });

      // Handle incoming messages
      eventSource.addEventListener('message', async (event) => {
        const messageTimestamp = new Date().toISOString();

        // Reset heartbeat on any message
        resetHeartbeat();

        try {
          const eventData = event.data || '{}';
          const data: DownloadEvent = JSON.parse(eventData);
          if(event?.data !== undefined || event?.data !== null){
            console.log(`[${messageTimestamp}] 📨 SSE Event received: ${data}`);
            console.log(`💓 Heartbeat reset`);
          }

          switch (data?.type) {
            case 'download_progress':
              console.log(`📊 Progress: ${data.progress}%`);
              console.log(`📝 Status: ${data.status}`);
              console.log(`💬 Message: ${data.message}`);
              console.log(`   └─ Download ID: ${data.downloadId}\n`);
              onProgress?.(data.progress);
              break;

            case 'download_complete':
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('✅ DOWNLOAD COMPLETE');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(`📁 Filename: ${data.file.filename}`);
              console.log(`📦 MIME Type: ${data.file.mimeType}`);
              console.log(`📊 File Size: ${(data.file.fileSize / 1024 / 1024).toFixed(2)} MB`);
              console.log(`🆔 Download ID: ${data.downloadId}`);
              console.log(`🎬 Video ID: ${data.file.videoId}`);
              console.log(`💬 Message: ${data.message}`);
              console.log('💾 Saving file to device...');

              try {
                const filePath = await this.saveFile(data.file.fileContent, data.file.filename);
                console.log(`✅ File saved successfully!`);
                console.log(`📂 File Path: ${filePath}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                onComplete?.(filePath, data.file.filename);

                // Clean up SSE connection
                this.cancelDownload(downloadId);
              } catch (error) {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ FILE SAVE ERROR');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('Error details:', error);
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                onError?.('Failed to save downloaded file');
                this.cancelDownload(downloadId);
              }
              break;

            case 'download_error':
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error('❌ DOWNLOAD ERROR FROM SERVER');
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.error(`Error Message: ${data.message}`);
              console.error(`Download ID: ${data.downloadId}`);
              console.error(`Status: ${data.status}`);
              console.error(`Progress: ${data.progress}%`);
              console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              onError?.(data.message);
              this.cancelDownload(downloadId);
              break;
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse SSE message:`, parseError);
          console.error(`Raw event data:`, event?.data);
        }
      });

      // Handle connection errors
      eventSource.addEventListener('error', (error) => {
        const errorTimestamp = new Date().toISOString();
        const attempts = this.reconnectAttempts.get(downloadId) || 0;

        console.error(`[${errorTimestamp}] ❌ SSE Connection error`);
        console.error(`🆔 Download ID: ${downloadId}`);
        console.error(`🔄 Reconnect attempt: ${attempts + 1}/${this.maxReconnectAttempts}`);
        console.error('Error details:', error);

        // Clear heartbeat timer on error
        const timer = this.heartbeatTimers.get(downloadId);
        if (timer) {
          clearTimeout(timer);
          this.heartbeatTimers.delete(downloadId);
        }

        // Increment reconnect attempts
        this.reconnectAttempts.set(downloadId, attempts + 1);

        // Check if we should give up
        if (attempts >= this.maxReconnectAttempts) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ SSE CONNECTION FAILED');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          onError?.('Connection lost - please try again');
          this.cancelDownload(downloadId);
        } else {
          // Calculate exponential backoff delay
          const backoffDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
          console.log(`🔄 Reconnecting in ${backoffDelay}ms...\n`);
        }
      });
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ SSE CONNECTION INITIALIZATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      onError?.('Failed to establish connection');
    }
  }

  private async saveFile(base64Data: string, filename: string): Promise<string> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💾 Starting file save operation...`);
    console.log(`📁 Filename: ${filename}`);
    console.log(`📦 Data size: ${(base64Data.length / 1024 / 1024).toFixed(2)} MB (base64)`);

    try {
      // Create downloads directory if it doesn't exist
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/YTDownloader`;
      console.log(`📂 Downloads directory: ${downloadsPath}`);
      console.log(`🔨 Creating directory if it doesn't exist...`);

      await RNFS.mkdir(downloadsPath);
      console.log(`✅ Directory ready`);

      // Create full file path
      const filePath = `${downloadsPath}/${filename}`;
      console.log(`📝 Full file path: ${filePath}`);
      console.log(`💾 Writing base64 data to file...`);

      // Write base64 data to file
      await RNFS.writeFile(filePath, base64Data, 'base64');

      console.log(`✅ File written successfully!`);
      console.log(`📊 Final file size: ${((await RNFS.stat(filePath)).size / 1024 / 1024).toFixed(2)} MB`);

      return filePath;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ FILE SAVE OPERATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Filename:', filename);
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw new Error('Failed to save file to device');
    }
  }

  cancelDownload(downloadId: string): void {
    const eventSource = this.activeEventSources.get(downloadId);
    const heartbeatTimer = this.heartbeatTimers.get(downloadId);
    
    if (eventSource) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛑 CANCELLING DOWNLOAD');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🆔 Download ID: ${downloadId}`);
      console.log('🔌 Closing SSE connection...');
      console.log('💓 Stopping heartbeat monitoring...');

      // Clear heartbeat timer
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
        this.heartbeatTimers.delete(downloadId);
      }

      eventSource.close();
      this.activeEventSources.delete(downloadId);
      this.reconnectAttempts.delete(downloadId);

      console.log('✅ Download cancelled and cleaned up');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 SSE CONNECTION CLOSED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }

  // Clean up all active downloads
  cleanup(): void {
    const activeCount = this.activeEventSources.size;
    if (activeCount > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧹 CLEANING UP ALL DOWNLOADS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Active SSE connections: ${activeCount}`);
      
      this.activeEventSources.forEach((eventSource, downloadId) => {
        console.log(`   └─ Closing connection: ${downloadId}`);
        
        // Clear heartbeat timer
        const timer = this.heartbeatTimers.get(downloadId);
        if (timer) {
          clearTimeout(timer);
        }
        
        eventSource.close();
      });
      
      this.activeEventSources.clear();
      this.reconnectAttempts.clear();
      this.heartbeatTimers.clear();
      
      console.log('✅ All SSE connections closed and cleaned up');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }
}

export const downloadService = new DownloadService();
