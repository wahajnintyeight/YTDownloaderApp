import RNFS from 'react-native-fs';
import EventSource from 'react-native-sse';
import { AppState, AppStateStatus } from 'react-native';
import { Buffer } from 'buffer';
import {
  writeFile as safWriteFile,
  createFile,
  exists,
  unlink,
} from 'react-native-saf-x';
import { logMemoryUsage, forceGarbageCollection } from '../utils/memoryUtils';
import {
  debugDownloadCompletion,
  createCrashSafeWrapper,
} from '../utils/downloadDebug';
import { storageService, DownloadedVideo } from './storageService';
import { API_BASE_URL, SSE_BASE_URL } from '../config/env';

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
  // New URL-first contract
  downloadUrl?: string; // presigned S3 URL
  expiresIn?: number; // seconds
  expiresAt?: number; // unix seconds
  // Legacy payload (kept for backward compatibility during transition)
  fileData?: string; // base64 encoded file content
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
  videoTitle?: string; // Human-friendly title to persist and use for filename
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

// Lightweight ID generator: 5 alphanumeric pairs (2 chars each) separated by dashes
function generateLightweightId(): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const segment = (len: number) =>
    Array.from(
      { length: len },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
  return [segment(2), segment(2), segment(2), segment(2), segment(2)].join('-');
}

class DownloadService {
  private apiBaseUrl: string;
  private sseBaseUrl: string;
  private activeEventSources: Map<string, EventSource> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private maxReconnectAttempts: number = 5;
  private heartbeatTimeout: number = 30000; // 30 seconds
  // Throttle progress logs per downloadId to avoid JS thread blocking
  private lastProgressLog: Map<string, { ts: number; pct: number }> = new Map();
  // Ensure progress is monotonic per downloadId
  private lastForwardedProgress: Map<string, number> = new Map();
  // Track first progress update per downloadId to skip initial 95%
  private firstProgressReceived: Map<string, boolean> = new Map();
  // Track listener context so we can resume after backgrounding
  private listenerContext: Map<
    string,
    {
      onProgress?: (progress: number) => void;
      onComplete?: (filePath: string, filename: string) => void;
      onError?: (error: string) => void;
      localDownloadId?: string;
    }
  > = new Map();
  private pausedOnBackground: Set<string> = new Set();
  private appState: AppStateStatus = 'active';

  constructor(
    apiBaseUrl: string = API_BASE_URL,
    sseBaseUrl: string = SSE_BASE_URL,
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.sseBaseUrl = sseBaseUrl;
    // Manage SSE lifecycle with AppState to reduce background load
    AppState.addEventListener('change', this.handleAppStateChange);

    this.loadDownloadPath();
  }

  private async loadDownloadPath() {
    const path = await storageService.getDownloadPath();
    if (path) {
      this.customDownloadPath = path;
    }
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    const prev = this.appState;
    this.appState = nextState;

    if (
      (nextState === 'background' || nextState === 'inactive') &&
      prev === 'active'
    ) {
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
        } catch {}
      });
    }

    if (
      nextState === 'active' &&
      (prev === 'background' || prev === 'inactive')
    ) {
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
      videoTitle: options.videoTitle,
    });
    console.log(
      '🌐 API Endpoint:',
      `${this.apiBaseUrl}/v2/api/download-yt-videos`,
    );

    try {
      // Generate client-side ID to correlate API and SSE
      const downloadId = generateLightweightId();
      console.log(`🆔 Generated client downloadId: ${downloadId}`);

      console.log(
        '🔄 Starting SSE EventSource listener for real-time updates...',
      );
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Start SSE immediately to avoid missing early events
      this.startSSEListener(
        downloadId,
        onProgress,
        onComplete,
        onError,
        localDownloadId,
      );
      // Initialize monotonic progress tracker
      this.lastForwardedProgress.set(downloadId, 0);

      console.log(
        '⏳ Sending POST request to download API with client downloadId...',
      );

      // Fire the download request including client-provided downloadId
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
            videoTitle: options.videoTitle,
            downloadId,
          }),
        },
      );

      console.log(
        `📡 API Response Status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        console.error(`❌ API Error: HTTP ${response.status}`);
        // Close SSE started earlier since API failed
        this.cancelDownload(downloadId);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read response for logging and optional verification
      const responseData: any = await response.json();
      console.log('✅ Download API Response:', responseData);

      const serverDownloadId =
        responseData.result?.downloadId || responseData.downloadId;
      if (serverDownloadId && serverDownloadId !== downloadId) {
        console.warn(
          `⚠️ Server returned different downloadId (${serverDownloadId}) than client (${downloadId}). Proceeding with client ID.`,
        );
      }

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

    // Helpers: filename sanitization and extension inference
    const sanitizeFileName = (name: string): string => {
      const cleaned = (name || '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned.substring(0, 150) || 'download';
    };

    const inferExtension = (fmt?: string, mime?: string | null): string => {
      if (mime) {
        if (mime.includes('audio/mpeg')) return '.mp3';
        if (mime.includes('audio/mp4') || mime.includes('video/mp4'))
          return '.mp4';
        if (mime.includes('audio/webm') || mime.includes('video/webm'))
          return '.webm';
      }
      if (fmt === 'mp3') return '.mp3';
      if (fmt === 'mp4') return '.mp4';
      if (fmt === 'webm') return '.webm';
      return '';
    };

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
        console.log(`[${messageTimestamp}] 📨 SSE Message received`, event);
        if (event?.data !== 'null' && event !== null) {
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
                    `🏠 Local Download ID: ${
                      localDownloadId || 'not provided'
                    }`,
                  );
                }
              }

              // Skip first progress if it's 95% (SSE quirk)
              const isFirstProgress = !this.firstProgressReceived.get(key);
              if (isFirstProgress && data.progress === 95) {
                if (__DEV__) {
                  console.log(`⏭️ Skipping initial 95% progress for ${key}`);
                }
                this.firstProgressReceived.set(key, true);
                break;
              }
              this.firstProgressReceived.set(key, true);

              // Enforce monotonic progress: do not allow decreases
              const prevForwarded = this.lastForwardedProgress.get(key) ?? 0;
              if (
                typeof data.progress === 'number' &&
                data.progress < prevForwarded
              ) {
                if (__DEV__) {
                  console.log(
                    `⏭️ Ignoring regressive progress for ${key}: ${data.progress}% < ${prevForwarded}%`,
                  );
                }
                break;
              }
              this.lastForwardedProgress.set(key, data.progress);
              onProgress?.(data.progress);
              break;
            }

            case 'download_complete':
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('✅ DOWNLOAD COMPLETE');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              // URL-first path (preferred)
              const url = (data as any).downloadUrl;
              const urlMime = data.mimeType || data.file?.mimeType;
              const urlExpiresAt = (data as any).expiresAt;
              const urlExpiresIn = (data as any).expiresIn;

              if (url) {
                console.log(`🌐 Download URL: ${url}`);
                if (urlMime) console.log(`📦 MIME Type: ${urlMime}`);
                if (typeof urlExpiresIn === 'number') {
                  console.log(`⏳ Expires in: ${urlExpiresIn}s`);
                }
                if (typeof urlExpiresAt === 'number') {
                  console.log(`🕒 Expires at (unix): ${urlExpiresAt}`);
                }

                // Resolve the URL to a file on disk and hide URL from UI
                setTimeout(async () => {
                  try {
                    // Determine desired filename: videoTitle + extension, fallback to server filename
                    const providedTitle = (data as any).videoTitle as
                      | string
                      | undefined;
                    const serverFilename =
                      data.filename ||
                      data.file?.filename ||
                      `download_${data.downloadId}`;
                    const baseTitle = sanitizeFileName(
                      providedTitle || serverFilename,
                    );
                    const ext =
                      inferExtension((data as any).format, urlMime) ||
                      (serverFilename?.includes('.')
                        ? serverFilename.substring(
                            serverFilename.lastIndexOf('.'),
                          )
                        : '');
                    const desiredFilename = ext
                      ? `${baseTitle}${ext}`
                      : baseTitle;

                    const savedPath = await this.saveFromUrl(
                      url,
                      desiredFilename,
                      urlMime,
                    );
                    const resolvedTitle = (data as any).videoTitle || baseTitle;
                    const video: DownloadedVideo = {
                      id: localDownloadId || downloadId,
                      videoId: (data as any).videoId || '',
                      title: resolvedTitle,
                      format: (data as any).format || 'mp3',
                      filePath: savedPath,
                      filename: desiredFilename,
                      downloadedAt: Date.now(),
                    };
                    await storageService.addDownloadedVideo(video);

                    const safeOnComplete = createCrashSafeWrapper(
                      () => onComplete?.(savedPath, desiredFilename),
                      'Download completion callback (URL-save) failed',
                    );
                    setTimeout(safeOnComplete, 0);
                  } catch (e) {
                    console.error('❌ Failed saving from URL', e);
                    onError?.('Failed to save downloaded file');
                  } finally {
                    this.cancelDownload(downloadId);
                  }
                }, 0);
                break;
              }

              // Legacy base64 fallback
              const fileContent = data.fileData || data.file?.fileContent;
              const fileSize = data.fileSize || data.file?.fileSize || 0;
              const mimeType =
                data.mimeType || data.file?.mimeType || 'audio/mpeg';
              const providedTitle = (data as any).videoTitle as
                | string
                | undefined;
              const serverFilename =
                data.filename ||
                data.file?.filename ||
                `download_${data.downloadId}.mp3`;
              const baseTitle = sanitizeFileName(
                providedTitle || serverFilename,
              );
              const ext =
                inferExtension((data as any).format, mimeType) ||
                (serverFilename?.includes('.')
                  ? serverFilename.substring(serverFilename.lastIndexOf('.'))
                  : '.mp3');
              const filename = `${baseTitle}${ext}`;

              if (!fileContent) {
                console.error(
                  '❌ No downloadUrl or file content found in response',
                );
                console.error('Response data:', JSON.stringify(data, null, 2));
                onError?.('No downloadable content received from server');
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
              console.log('💾 Saving file to device (legacy payload)...');

              setTimeout(async () => {
                try {
                  logMemoryUsage('Before file save');
                  let filePath: string;
                  filePath = await this.saveFile(fileContent, filename);

                  console.log(`✅ File saved successfully!`);
                  console.log(`📂 File Path: ${filePath}`);
                  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                  logMemoryUsage('After file save');
                  forceGarbageCollection();
                  debugDownloadCompletion(filename, filePath);

                  const safeOnComplete = createCrashSafeWrapper(
                    () => onComplete?.(filePath, filename),
                    'Download completion callback failed',
                  );
                  setTimeout(safeOnComplete, 0);
                  this.cancelDownload(downloadId);
                } catch (error) {
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.error('❌ FILE SAVE ERROR');
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                  console.error('Error details:', error);
                  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

  private async saveFromUrl(
    url: string,
    filename: string,
    mimeType?: string | null,
  ): Promise<string> {
    // DRY: centralized URL download and save logic
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🌐 Starting URL save operation...`);
    console.log(`🔗 URL: ${url}`);
    console.log(`📁 Filename: ${filename}`);

    // Use user's preferred download path or default
    const downloadsPath =
      this.customDownloadPath || `${RNFS.DownloadDirectoryPath}/YTDownloader`;
    console.log(`📂 Target directory: ${downloadsPath}`);

    try {
      const isSaf = downloadsPath.startsWith('content://');

      // Fetch the file from URL
      console.log(`⬇️ Downloading file from URL...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Convert response to base64 for RNFS write
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as any);
      const base64Data = buffer.toString('base64');

      // Write file to disk (SAF vs RNFS)
      if (isSaf) {
        // SAF path: use persisted tree URI to create file non-interactively
        const docMime = mimeType || 'application/octet-stream';
        // Create a child file under the persisted tree URI
        const childUri = `${downloadsPath}/${encodeURIComponent(filename)}`;

        // Check if file exists and delete it
        const fileExists = await exists(childUri);
        if (fileExists) {
          console.log(`🗑️ Deleting existing file: ${filename}`);
          await unlink(childUri);
        }

        const doc = await createFile(childUri, { mimeType: docMime });
        const targetUri = doc?.uri;
        if (!targetUri) throw new Error('Failed to create file in SAF folder');
        await safWriteFile(targetUri, base64Data, { encoding: 'base64' });
        console.log(`✅ File saved via SAF: ${targetUri}`);
        return targetUri; // Return the content URI
      } else {
        // Ensure directory exists
        await RNFS.mkdir(downloadsPath);
        console.log(`✅ Directory ready`);

        // Construct full file path with backend-provided filename (includes extension)
        const filePath = `${downloadsPath}/${filename}`;
        console.log(`📝 Full file path: ${filePath}`);

        await RNFS.writeFile(filePath, base64Data, 'base64');

        // Verify file was written
        const stats = await RNFS.stat(filePath);
        console.log(`✅ File saved successfully!`);
        console.log(
          `📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        );
        return filePath;
      }
    } catch (error) {
      console.error('❌ Failed to save file from URL', error);
      throw error;
    }
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
      const isSaf = downloadsPath.startsWith('content://');
      console.log(`📂 Downloads directory: ${downloadsPath}`);

      // Check if base64 data is too large and might cause memory issues
      const dataSizeMB = base64Data.length / 1024 / 1024;
      // SAF: use persisted tree URI to create file non-interactively
      if (isSaf) {
        const defaultMime = filename.endsWith('.mp3')
          ? 'audio/mpeg'
          : filename.endsWith('.mp4')
          ? 'video/mp4'
          : 'application/octet-stream';
        // Create a child file under the persisted tree URI
        const childUri = `${downloadsPath}/${encodeURIComponent(filename)}`;

        // Check if file exists and delete it
        const fileExists = await exists(childUri);
        if (fileExists) {
          console.log(`🗑️ Deleting existing file: ${filename}`);
          await unlink(childUri);
        }

        const doc = await createFile(childUri, { mimeType: defaultMime });
        const targetUri = doc?.uri;
        if (!targetUri) throw new Error('Failed to create file in SAF folder');
        await safWriteFile(targetUri, base64Data, { encoding: 'base64' });
        console.log(`✅ File saved via SAF: ${targetUri}`);
        base64Data = '';
        return targetUri;
      }

      // RNFS path: ensure directory
      await RNFS.mkdir(downloadsPath);
      const filePath = `${downloadsPath}/${filename}`;

      if (dataSizeMB > 100) {
        console.warn(
          `⚠️ Large file detected (${dataSizeMB.toFixed(
            2,
          )} MB), using chunked write...`,
        );
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;
        // Clear/create the file first
        await RNFS.writeFile(filePath, '', 'base64');
        while (offset < base64Data.length) {
          const chunk = base64Data.slice(offset, offset + chunkSize);
          await RNFS.appendFile(filePath, chunk, 'base64');
          offset += chunkSize;
          const progress = Math.min(100, (offset / base64Data.length) * 100);
          if (progress % 25 === 0 || progress === 100) {
            console.log(`📊 Write progress: ${progress.toFixed(0)}%`);
          }
        }
      } else {
        await RNFS.writeFile(filePath, base64Data, 'base64');
      }

      const stats = await RNFS.stat(filePath);
      console.log(
        `📊 Final file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      );
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
      this.lastForwardedProgress.delete(downloadId);
      this.firstProgressReceived.delete(downloadId);
      this.lastProgressLog.delete(downloadId);
      this.listenerContext.delete(downloadId);

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
      this.lastForwardedProgress.clear();
      this.firstProgressReceived.clear();
      this.lastProgressLog.clear();
      this.listenerContext.clear();

      console.log('✅ All SSE connections closed and cleaned up');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('ℹ️ No active downloads to clean up');
    }
  }
}

export const downloadService = new DownloadService();
