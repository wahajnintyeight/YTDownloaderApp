import RNFS from 'react-native-fs';
import EventSource from 'react-native-sse';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { createDocument, writeFile as safWriteFile } from 'react-native-saf-x';
import { logMemoryUsage, forceGarbageCollection } from '../utils/memoryUtils';
import {
  debugDownloadCompletion,
  debugMemoryState,
  createCrashSafeWrapper,
} from '../utils/downloadDebug';

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
  fileData: string; // base64 encoded file content
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  // Legacy format support
  file?: {
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
  // Throttle progress logs per downloadId to avoid JS thread blocking
  private lastProgressLog: Map<string, { ts: number; pct: number }> = new Map();
  // Track listener context so we can resume after backgrounding
  private listenerContext: Map<string, {
    onProgress?: (progress: number) => void;
    onComplete?: (filePath: string, filename: string) => void;
    onError?: (error: string) => void;
    localDownloadId?: string;
  }> = new Map();
  private pausedOnBackground: Set<string> = new Set();
  private appState: AppStateStatus = 'active';

  constructor(
    apiBaseUrl: string = 'https://api.theprojectphoenix.top',
    sseBaseUrl: string = 'https://sse.theprojectphoenix.top',
  ) {
    this.apiBaseUrl = apiBaseUrl; //'http://192.168.100.10:8881'; // ;
    this.sseBaseUrl = sseBaseUrl; //'http://192.168.100.10:8885'; // ;

    // Manage SSE lifecycle with AppState to reduce background load
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    const prev = this.appState;
    this.appState = nextState;

    if ((nextState === 'background' || nextState === 'inactive') && prev === 'active') {
      // Pause all active SSE connections
      this.activeEventSources.forEach((eventSource, downloadId) => {
        try {
          const timer = this.heartbeatTimers.get(downloadId);
          if (timer) {
            clearTimeout(timer);
            this.heartbeatTimers.delete(downloadId);
          }
          eventSource.close();
          this.activeEventSources.delete(downloadId);
          this.pausedOnBackground.add(downloadId);
        } catch (e) {
          // ignore
        }
      });
    }

    if (nextState === 'active' && (prev === 'background' || prev === 'inactive')) {
      // Resume paused SSE connections
      const ids = Array.from(this.pausedOnBackground.values());
      this.pausedOnBackground.clear();
      ids.forEach(downloadId => {
        const ctx = this.listenerContext.get(downloadId);
        if (ctx) {
          this.startSSEListener(
            downloadId,
            ctx.onProgress,
            ctx.onComplete,
            ctx.onError,
            ctx.localDownloadId,
          );
        }
      });
    }
  };

  async downloadVideo(
    options: DownloadOptions,
    onProgress?: (progress: number) => void,
    onComplete?: (filePath: string, filename: string) => void,
    onError?: (error: string) => void,
    localDownloadId?: string,
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
    console.log(
      '🌐 API Endpoint:',
      `${this.apiBaseUrl}/v2/api/download-yt-videos`,
    );

    try {
      console.log('⏳ Sending POST request to download API...');

      // Start download request
      const response = await fetch(
        `${this.apiBaseUrl}/v2/api/download-yt-videos`,
        {
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
        },
      );

      console.log(
        `📡 API Response Status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        console.error(`❌ API Error: HTTP ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get download ID from server response
      const responseData: any = await response.json();

      console.log('✅ Download API Response:', responseData);

      // Extract download ID from nested result object
      const downloadId =
        responseData.result?.downloadId || responseData.downloadId;

      console.log(`🆔 Download ID: ${downloadId}`);

      if (!downloadId) {
        console.error('❌ No download ID in response');
        console.error(
          'Response structure:',
          JSON.stringify(responseData, null, 2),
        );
        throw new Error('Server did not return a download ID');
      }

      console.log(
        '🔄 Starting SSE EventSource listener for real-time updates...',
      );
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Use proper SSE EventSource for real-time updates
      this.startSSEListener(
        downloadId,
        onProgress,
        onComplete,
        onError,
        localDownloadId,
      );

      return downloadId;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ DOWNLOAD INITIATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      onError?.(
        error instanceof Error ? error.message : 'Failed to start download',
      );
      throw error;
    }
  }

  private startSSEListener(
    downloadId: string,
    onProgress?: (progress: number) => void,
    onComplete?: (filePath: string, filename: string) => void,
    onError?: (error: string) => void,
    localDownloadId?: string,
  ): void {
    // Save context for potential resume
    this.listenerContext.set(downloadId, {
      onProgress,
      onComplete,
      onError,
      localDownloadId,
    });
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
          console.warn(
            `⏱️ No messages received for ${this.heartbeatTimeout / 1000}s`,
          );
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
            console.log(
              `🔄 Reconnecting in ${backoffDelay}ms (attempt ${attempts + 1}/${
                this.maxReconnectAttempts
              })...\n`,
            );

            setTimeout(() => {
              this.startSSEListener(
                downloadId,
                onProgress,
                onComplete,
                onError,
                localDownloadId,
              );
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
      eventSource.addEventListener('message', async event => {
        const messageTimestamp = new Date().toISOString();
        if (event?.data !== 'null' && event !== null) {
          console.log(`[${messageTimestamp}] 📨 SSE Message received`, event);
        }
        // Reset heartbeat on any message
        resetHeartbeat();

        try {
          const eventData = event.data || '{}';

          // Skip empty or heartbeat messages
          if (!eventData || eventData === '{}' || eventData.trim() === '') {
            console.log(
              `[${messageTimestamp}] 💓 Heartbeat/keepalive message received`,
            );
            return;
          }

          const data: DownloadEvent = JSON.parse(eventData);
          // console.log(`[${messageTimestamp}] 📨 SSE Event received:`, data);
          // console.log(`💓 Heartbeat reset`);

          switch (data?.type) {
            case 'download_progress': {
              // Throttle logs: only log when >=500ms since last or >=5% change
              const now = Date.now();
              const key = data.downloadId;
              const last = this.lastProgressLog.get(key) || { ts: 0, pct: -1 };
              const timeDelta = now - last.ts;
              const pctDelta = Math.abs((data.progress || 0) - (last.pct || 0));
              const shouldLog = timeDelta >= 500 || pctDelta >= 5;

              if (shouldLog) {
                this.lastProgressLog.set(key, { ts: now, pct: data.progress });
                if (__DEV__) {
                  console.log(`📊 Progress: ${data.progress}%`);
                  console.log(`📝 Status: ${data.status}`);
                  console.log(`💬 Message: ${data.message}`);
                  console.log(`🆔 Server Download ID: ${data.downloadId}`);
                  console.log(
                    `🏠 Local Download ID: ${localDownloadId || 'not provided'}`,
                  );
                }
              }

              onProgress?.(data.progress);
              break;
            }

            case 'download_complete':
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('✅ DOWNLOAD COMPLETE');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              // Handle both new format (fileData) and legacy format (file object)
              const fileContent = data.fileData || data.file?.fileContent;
              const filename =
                data.filename ||
                data.file?.filename ||
                `download_${data.downloadId}.mp3`;
              const fileSize = data.fileSize || data.file?.fileSize || 0;
              const mimeType =
                data.mimeType || data.file?.mimeType || 'audio/mpeg';

              if (!fileContent) {
                console.error('❌ No file content found in download response');
                console.error('Response data:', JSON.stringify(data, null, 2));
                onError?.('No file content received from server');
                this.cancelDownload(downloadId);
                break;
              }

              console.log(`📁 Filename: ${filename}`);
              console.log(`📦 MIME Type: ${mimeType}`);
              console.log(
                `📊 File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`,
              );
              console.log(`🆔 Download ID: ${data.downloadId}`);
              console.log(`💬 Message: ${data.message}`);
              console.log('💾 Saving file to device...');

              // Process file save asynchronously to prevent blocking main thread
              setTimeout(async () => {
                try {
                  logMemoryUsage('Before file save');
                  let filePath: string;
                  if (Platform.OS === 'android') {
                    const uri = await this.promptAndSaveFileAndroid(
                      fileContent,
                      filename,
                      mimeType,
                    );
                    if (uri) {
                      filePath = uri;
                    } else {
                      filePath = await this.saveFile(fileContent, filename);
                    }
                  } else {
                    filePath = await this.saveFile(fileContent, filename);
                  }

                  console.log(`✅ File saved successfully!`);
                  console.log(`📂 File Path: ${filePath}`);
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                  logMemoryUsage('After file save');

                  // Force garbage collection to free up memory
                  forceGarbageCollection();

                  // Debug the completion before calling callback
                  debugDownloadCompletion(filename, filePath);

                  // Use crash-safe wrapper for the completion callback
                  const safeOnComplete = createCrashSafeWrapper(
                    () => onComplete?.(filePath, filename),
                    'Download completion callback failed',
                  );

                  // Use setTimeout to ensure UI updates happen on next tick
                  setTimeout(safeOnComplete, 0);

                  // Clean up SSE connection
                  this.cancelDownload(downloadId);
                } catch (error) {
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.error('❌ FILE SAVE ERROR');
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.error('Error details:', error);
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                  // Force garbage collection even on error
                  forceGarbageCollection();

                  setTimeout(() => {
                    onError?.('Failed to save downloaded file');
                  }, 0);

                  this.cancelDownload(downloadId);
                }
              }, 0);
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
          console.error(
            `Raw event data (first 500 chars):`,
            event?.data?.substring(0, 500),
          );
          console.error(`Event data type:`, typeof event?.data);
          console.error(`Event data length:`, event?.data?.length);

          // Try to identify if this is a large binary data message
          if (event?.data && event.data.length > 10000) {
            console.warn(
              '⚠️ Received very large SSE message, this might be binary data that should be handled differently',
            );
          }
        }
      });

      // Handle connection errors
      eventSource.addEventListener('error', error => {
        const errorTimestamp = new Date().toISOString();
        const attempts = this.reconnectAttempts.get(downloadId) || 0;

        console.error(`[${errorTimestamp}] ❌ SSE Connection error`);
        console.error(`🆔 Download ID: ${downloadId}`);
        console.error(
          `🔄 Reconnect attempt: ${attempts + 1}/${this.maxReconnectAttempts}`,
        );
        console.error('Error details:', error);

        // Clear heartbeat timer on error
        const timer = this.heartbeatTimers.get(downloadId);
        if (timer) {
          clearTimeout(timer);
          this.heartbeatTimers.delete(downloadId);
        }

        // Check if we should give up
        if (attempts >= this.maxReconnectAttempts) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ SSE CONNECTION FAILED');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error(
            `Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`,
          );
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          onError?.('Connection lost - please try again');
          this.cancelDownload(downloadId);
        } else {
          // Increment reconnect attempts
          this.reconnectAttempts.set(downloadId, attempts + 1);

          // Calculate exponential backoff delay
          const backoffDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
          console.log(
            `🔄 Reconnecting in ${backoffDelay}ms (attempt ${attempts + 1}/${
              this.maxReconnectAttempts
            })...\n`,
          );

          // Attempt reconnection with delay
          setTimeout(() => {
            this.startSSEListener(
              downloadId,
              onProgress,
              onComplete,
              onError,
              localDownloadId,
            );
          }, backoffDelay);
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

  setDownloadPath(path: string) {
    this.customDownloadPath = path;
    console.log(`📂 Download path set to: ${path}`);
  }

  private customDownloadPath: string | null = null;

  private async promptAndSaveFileAndroid(
    base64Data: string,
    filename: string,
    mimeType: string,
  ): Promise<string | null> {
    const doc = await createDocument({
      title: filename,
      mimeType,
      preferCurrentFolder: true,
    } as any);
    if (!doc || !doc.uri) {
      return null;
    }
    await safWriteFile(doc.uri, base64Data, 'base64');
    return doc.uri;
  }

  private async saveFile(
    base64Data: string,
    filename: string,
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💾 Starting file save operation...`);
    console.log(`📁 Filename: ${filename}`);
    console.log(
      `📦 Data size: ${(base64Data.length / 1024 / 1024).toFixed(
        2,
      )} MB (base64)`,
    );

    try {
      // Use custom path if set, otherwise use default
      const downloadsPath =
        this.customDownloadPath || `${RNFS.DownloadDirectoryPath}/YTDownloader`;
      console.log(`📂 Downloads directory: ${downloadsPath}`);
      console.log(`🔨 Creating directory if it doesn't exist...`);

      await RNFS.mkdir(downloadsPath);
      console.log(`✅ Directory ready`);

      // Create full file path
      const filePath = `${downloadsPath}/${filename}`;
      console.log(`📝 Full file path: ${filePath}`);
      console.log(`💾 Writing base64 data to file...`);

      // Check if base64 data is too large and might cause memory issues
      const dataSizeMB = base64Data.length / 1024 / 1024;
      if (dataSizeMB > 100) {
        console.warn(
          `⚠️ Large file detected (${dataSizeMB.toFixed(
            2,
          )} MB), using chunked write...`,
        );

        // For very large files, write in chunks to prevent memory issues
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;

        // Clear the file first
        await RNFS.writeFile(filePath, '', 'base64');

        while (offset < base64Data.length) {
          const chunk = base64Data.slice(offset, offset + chunkSize);
          await RNFS.appendFile(filePath, chunk, 'base64');
          offset += chunkSize;

          // Log progress for very large files
          const progress = Math.min(100, (offset / base64Data.length) * 100);
          if (progress % 25 === 0 || progress === 100) {
            console.log(`📊 Write progress: ${progress.toFixed(0)}%`);
          }
        }
      } else {
        // For smaller files, write normally
        await RNFS.writeFile(filePath, base64Data, 'base64');
      }

      console.log(`✅ File written successfully!`);

      // Verify file was written correctly
      const stats = await RNFS.stat(filePath);
      console.log(
        `📊 Final file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      );

      // Clear base64Data from memory immediately
      base64Data = '';

      return filePath;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ FILE SAVE OPERATION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Filename:', filename);
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Clear base64Data from memory even on error
      base64Data = '';

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

  // Check if a download is stuck (no progress for too long)
  isDownloadStuck(downloadId: string): boolean {
    return (
      this.activeEventSources.has(downloadId) &&
      (this.reconnectAttempts.get(downloadId) || 0) >= this.maxReconnectAttempts
    );
  }

  // Get active download count
  getActiveDownloadCount(): number {
    return this.activeEventSources.size;
  }

  // Get download status
  getDownloadStatus(
    downloadId: string,
  ): 'active' | 'reconnecting' | 'stuck' | 'not_found' {
    if (!this.activeEventSources.has(downloadId)) {
      return 'not_found';
    }

    const attempts = this.reconnectAttempts.get(downloadId) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      return 'stuck';
    } else if (attempts > 0) {
      return 'reconnecting';
    }

    return 'active';
  }

  // Clean up all active downloads
  cleanup(): void {
    const activeCount = this.activeEventSources.size;
    if (activeCount > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧹 CLEANING UP ALL DOWNLOADS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Active SSE connections: ${activeCount}`);
      console.log(`🔄 Reconnect attempts: ${this.reconnectAttempts.size}`);
      console.log(`💓 Active heartbeat timers: ${this.heartbeatTimers.size}`);

      this.activeEventSources.forEach((eventSource, downloadId) => {
        const attempts = this.reconnectAttempts.get(downloadId) || 0;
        const status = this.getDownloadStatus(downloadId);
        console.log(
          `   └─ Closing connection: ${downloadId} (${status}, ${attempts} attempts)`,
        );

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
    } else {
      console.log('ℹ️ No active downloads to clean up');
    }
  }
}

export const downloadService = new DownloadService();
