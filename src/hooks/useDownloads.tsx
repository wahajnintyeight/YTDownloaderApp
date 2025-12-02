import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useRef,
  useEffect,
  useState,
} from 'react';
import { useDialog } from './useDialog';
import {
  Download,
  Video,
  VideoFormat,
  VideoQuality,
  DownloadStatus,
} from '../types/video';
import { apiClient } from '../services/apiClient';
import { downloadService } from '../services/downloadService';
import { storageService } from '../services/storageService';
import { safeExecute, batchStateUpdate } from '../utils/crashPrevention';
import { clientDownloadQueue } from '../services/download/queueManager';
import type { DownloadJob } from '../services/download/queue';

interface DownloadState {
  downloads: Download[];
}

// Map to track server download IDs for proper cancellation
const downloadIdMap = new Map<string, string>();
// Queue cancellations if user taps cancel before serverDownloadId is available
const pendingCancelSet = new Set<string>();

type DownloadAction =
  | {
    type: 'START_DOWNLOAD';
    payload: {
      id: string;
      video: Video;
      format: VideoFormat;
      quality: VideoQuality;
    };
  }
  | {
    type: 'UPDATE_PROGRESS';
    payload: { id: string; progress: number; serverDownloadId?: string };
  }
  | { type: 'COMPLETE_DOWNLOAD'; payload: { id: string; filePath: string } }
  | { type: 'FAIL_DOWNLOAD'; payload: { id: string; error: string } }
  | { type: 'CANCEL_DOWNLOAD'; payload: { id: string } }
  | { type: 'DELETE_DOWNLOAD'; payload: { id: string } };

const buildPlaceholderVideo = (job: DownloadJob): Video => ({
  id: job.videoId,
  title: job.videoTitle || 'Video',
  thumbnailUrl: job.thumbnailUrl || '',
  channelName: '',
  duration: 0,
  formats: [],
});

const mapJobToDownload = (
  job: DownloadJob,
  video?: Video,
  quality?: VideoQuality,
): Download => {
  // Ensure we have minimal video & quality info
  const videoInfo: Video = video ?? buildPlaceholderVideo(job);
  const qualityInfo: VideoQuality = (quality ||
    (job.quality as VideoQuality) ||
    'unknown') as any;

  // Log when using placeholder data
  if (!video) {
    console.log(
      `⚠️ [MAP JOB] Using placeholder video for job ${job.id} (${job.videoTitle})`,
    );
  }
  if (!quality) {
    console.log(
      `⚠️ [MAP JOB] Using fallback quality for job ${job.id}: ${qualityInfo}`,
    );
  }
  // Map queue status to UI status
  let status: DownloadStatus;
  switch (job.status) {
    case 'queued':
      status = 'pending';
      break;
    case 'downloading':
      status = 'downloading';
      break;
    case 'completed':
      status = 'completed';
      break;
    case 'error':
      status = 'failed';
      break;
    default:
      status = 'pending';
  }

  return {
    id: job.id,
    video: videoInfo,
    format: job.format as VideoFormat,
    quality: qualityInfo,
    status,
    progress: job.progress,
    filePath: job.filePath,
    error: job.error,
    createdAt: new Date(job.createdAt),
    startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
  };
};

const downloadReducer = (
  state: DownloadState,
  action:
    | DownloadAction
    | { type: 'SYNC_QUEUE_STATE'; payload: { downloads: Download[] } },
): DownloadState => {
  // Handle queue sync action
  if (action.type === 'SYNC_QUEUE_STATE') {
    return {
      ...state,
      downloads: (action as any).payload.downloads,
    };
  }

  switch (action.type) {
    case 'START_DOWNLOAD': {
      const newDownload: Download = {
        id: action.payload.id,
        video: action.payload.video,
        format: action.payload.format,
        quality: action.payload.quality,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
      };
      console.log(
        `📦 Reducer: Creating new download with ID: ${action.payload.id}`,
      );
      return {
        ...state,
        downloads: [...state.downloads, newDownload],
      };
    }
    case 'UPDATE_PROGRESS': {
      console.log('STATE FOR UPDATE:', state);
      const updatedDownloads = state.downloads.map(download => {
        console.log('ACTION PAYLOAD ID', action);
        if (download.id === action.payload.id) {
          // Don't update progress if download is already completed, failed, or cancelled
          if (
            download.status === 'completed' ||
            download.status === 'failed' ||
            download.status === 'cancelled'
          ) {
            return download;
          }
          console.log(
            `📦 Reducer: Updating download ${download.id} to progress ${action.payload.progress}, status: downloading`,
          );
          const nextProgress = Math.max(
            download.progress ?? 0,
            action.payload.progress,
          );
          return {
            ...download,
            progress: nextProgress,
            status: 'downloading' as DownloadStatus,
            serverDownloadId:
              action.payload.serverDownloadId || download.serverDownloadId,
          };
        }
        return download;
      });

      return {
        ...state,
        downloads: updatedDownloads,
      };
    }
    case 'COMPLETE_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? {
              ...download,
              status: 'completed' as DownloadStatus,
              filePath: action.payload.filePath,
              progress: 100,
            }
            : download,
        ),
      };
    }
    case 'FAIL_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? {
              ...download,
              status: 'failed' as DownloadStatus,
              error: action.payload.error,
            }
            : download,
        ),
      };
    }
    case 'CANCEL_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, status: 'cancelled' as DownloadStatus }
            : download,
        ),
      };
    }
    case 'DELETE_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.filter(d => d.id !== action.payload.id),
      };
    }
    default:
      return state;
  }
};

interface DownloadContextType {
  downloads: Download[];
  startDownload: (
    video: Video,
    format: VideoFormat,
    quality: VideoQuality,
    options?: { bitRate?: string },
  ) => Promise<string>;
  updateProgress: (id: string, progress: number) => void;
  completeDownload: (id: string, filePath: string) => void;
  failDownload: (id: string, error: string) => void;
  cancelDownload: (id: string) => void;
  deleteDownload: (id: string) => void;
  retryDownload: (id: string) => void;
  retryDownloadByVideoId: (videoId: string) => Promise<void>;
  moveDownloadUp: (id: string) => void;
  moveDownloadDown: (id: string) => void;
  forceCleanupAllDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined,
);

interface DownloadProviderProps {
  children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(downloadReducer, { downloads: [] });
  const { showDialog } = useDialog();
  const stateRef = useRef(state);
  const [isInitialized, setIsInitialized] = useState(false);

  // Store Video objects for each download job (jobId -> Video)
  const videoMapRef = useRef(new Map<string, Video>());

  // Store quality for each download job (jobId -> VideoQuality)
  const qualityMapRef = useRef(new Map<string, VideoQuality>());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted downloads on mount
  useEffect(() => {
    const loadPersistedDownloads = async () => {
      console.log(
        '🔍 [INIT] Starting to load persisted downloads from storage...',
      );
      try {
        const persistedVideos = await storageService.getDownloadedVideos();
        console.log(
          `📂 [STORAGE] Loaded ${persistedVideos.length} persisted downloads from storage`,
        );

        if (persistedVideos.length > 0) {
          console.log(
            '📋 [STORAGE] Persisted download IDs:',
            persistedVideos.map(pv => `${pv.id} (${pv.title})`).join(', '),
          );

          // Convert persisted videos to Download format
          const downloads: Download[] = persistedVideos.map(pv => ({
            id: pv.id,
            video: {
              id: pv.videoId,
              title: pv.title,
              thumbnailUrl: pv.thumbnailUrl || '',
              channelName: '',
              duration: 0,
              formats: [],
            },
            format: pv.format,
            quality: '720p' as VideoQuality, // Default quality for persisted downloads
            status: 'completed' as DownloadStatus,
            progress: 100,
            filePath: pv.filePath,
            createdAt: new Date(pv.downloadedAt),
          }));

          console.log(
            `✅ [STORAGE] Converted ${downloads.length} persisted videos to Download format`,
          );

          // Sync to state
          (dispatch as any)({
            type: 'SYNC_QUEUE_STATE',
            payload: { downloads },
          });

          console.log(
            '💾 [STORAGE] Initial state synced with persisted downloads',
          );
        } else {
          console.log('📭 [STORAGE] No persisted downloads found in storage');
        }
      } catch (error) {
        console.error(
          '❌ [STORAGE] Failed to load persisted downloads:',
          error,
        );
      } finally {
        setIsInitialized(true);
        console.log('✅ [INIT] Download provider initialized');
      }
    };

    loadPersistedDownloads();
  }, []);

  // Subscribe to queue state changes and sync with local state
  useEffect(() => {
    if (!isInitialized) return; // Wait for persisted downloads to load first

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 500; // Update every 500ms max for better performance

    const unsubscribe = clientDownloadQueue.subscribe(queueState => {
      const now = Date.now();

      // Determine if we should bypass throttle to ensure UI updates immediately for critical state changes
      // (e.g. completion, start, error) instead of getting stuck at 100% due to throttle.
      const uiActive = stateRef.current.downloads.find(
        d => d.status === 'downloading',
      );
      const queueActive = queueState.activeDownload;

      let shouldBypassThrottle = false;

      if (uiActive && !queueActive) {
        // Download finished (or stopped/failed) -> Bypass to show completion immediately
        shouldBypassThrottle = true;
      } else if (!uiActive && queueActive) {
        // Download started -> Bypass to show start immediately
        shouldBypassThrottle = true;
      } else if (uiActive && queueActive && uiActive.id !== queueActive.id) {
        // Active download changed -> Bypass
        shouldBypassThrottle = true;
      } else if (
        uiActive &&
        queueActive &&
        uiActive.status !== queueActive.status
      ) {
        // Status changed -> Bypass
        shouldBypassThrottle = true;
      }

      // Throttle updates to reduce re-renders, unless it's a critical state change
      if (!shouldBypassThrottle && now - lastUpdateTime < UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTime = now;

      // Map queue state to Download[] format
      const downloads: Download[] = [];

      // Add active download and start stall monitor
      if (queueState.activeDownload) {
        const job = queueState.activeDownload;
        const video = videoMapRef.current.get(job.id);
        const quality = qualityMapRef.current.get(job.id);

        // Always add to downloads, even if video/quality not in maps (will use placeholder)
        downloads.push(mapJobToDownload(job, video, quality));

        // Start stall monitor for active download
        if (job.status === 'downloading') {
          ensureStallMonitor(job.id);
        }
      }

      // Add queued downloads
      queueState.queuedDownloads.forEach(job => {
        const video = videoMapRef.current.get(job.id);
        const quality = qualityMapRef.current.get(job.id);

        // Always add to downloads, even if video/quality not in maps (will use placeholder)
        downloads.push(mapJobToDownload(job, video, quality));
      });

      // Add completed/failed downloads from queue (recent session)
      const completedArray = Array.from(queueState.completedDownloads.values())
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 10);

      completedArray.forEach(job => {
        const video = videoMapRef.current.get(job.id);
        const quality = qualityMapRef.current.get(job.id);

        // Always add to downloads, even if video/quality not in maps (will use placeholder)
        downloads.push(mapJobToDownload(job, video, quality));
      });

      // Merge with persisted downloads (from storage)
      const currentDownloads = stateRef.current.downloads;
      const persistedDownloads = currentDownloads.filter(
        d => d.status === 'completed' && !downloads.some(qd => qd.id === d.id),
      );

      console.log(
        `🔄 [QUEUE SYNC] Active: ${queueState.activeDownload ? 1 : 0
        }, Queued: ${queueState.queuedDownloads.length
        }, Completed in session: ${completedArray.length}`,
      );
      console.log(
        `📂 [MERGE] Persisted from storage: ${persistedDownloads.length} downloads`,
      );
      console.log(
        `🔀 [MERGE] Merging: ${downloads.length} from queue + ${persistedDownloads.length
        } persisted = ${downloads.length + persistedDownloads.length} total`,
      );

      // Combine: active/queued first, then persisted completed
      const mergedDownloads = [...downloads, ...persistedDownloads];

      // Quick comparison: only update for significant changes
      const needsUpdate =
        mergedDownloads.length !== currentDownloads.length ||
        mergedDownloads.some((d, i) => {
          const curr = currentDownloads[i];
          if (!curr) return true;
          // Only update for significant changes (5% progress or status change)
          return (
            d.id !== curr.id ||
            d.status !== curr.status ||
            Math.abs(d.progress - curr.progress) >= 5
          );
        });

      if (needsUpdate) {
        console.log(
          `✅ [MERGE] State updated with ${mergedDownloads.length} total downloads`,
        );
        console.log(
          `📋 [MERGE] Download IDs in final state:`,
          mergedDownloads.map(d => `${d.id} (${d.status})`).join(', '),
        );
        stateRef.current = { downloads: mergedDownloads };
        (dispatch as any)({
          type: 'SYNC_QUEUE_STATE',
          payload: { downloads: mergedDownloads },
        });
      } else {
        console.log(`⏭️ [MERGE] No significant changes, skipping state update`);
      }
    });

    return unsubscribe;
  }, [ensureStallMonitor, isInitialized]);

  // Throttle map to limit progress updates per download (id -> { pct, ts })
  const lastProgressRef = useRef(
    new Map<string, { pct: number; ts: number }>(),
  );
  // Monitor timers per download to detect stalls
  const stallTimersRef = useRef(
    new Map<string, ReturnType<typeof setInterval>>(),
  );

  // Stall monitor is simplified since queue handles flow better
  // Only monitor active downloads, not queued ones
  const ensureStallMonitor = (id: string) => {
    if (stallTimersRef.current.has(id)) return;

    const interval = setInterval(() => {
      const entry = lastProgressRef.current.get(id);
      const downloads = stateRef.current.downloads;
      const d = downloads.find(x => x.id === id);

      if (!d) {
        clearInterval(interval);
        stallTimersRef.current.delete(id);
        return;
      }

      // Only monitor actively downloading items, not queued
      if (d.status !== 'downloading') {
        return;
      }

      const lastTs = entry?.ts ?? 0;
      const since = Date.now() - lastTs;

      // If we're receiving chunk-based progress, don't show stall warning
      try {
        const serverId = downloadIdMap.get(id);
        if (serverId && downloadService.isUsingChunkProgress(serverId)) {
          return;
        }
      } catch { }

      if (since >= 35000) {
        // Prevent repeated prompts
        lastProgressRef.current.set(id, {
          pct: entry?.pct ?? 0,
          ts: Date.now(),
        });

        showDialog({
          type: 'warning',
          title: 'Download taking longer than usual',
          message: 'This download seems stuck. Do you want to retry?',
          size: 'large',
          buttons: [
            {
              text: 'Keep Waiting',
              style: 'cancel',
              onPress: () => { },
            },
            {
              text: 'Retry',
              style: 'default',
              onPress: async () => {
                try {
                  const current = stateRef.current.downloads.find(
                    x => x.id === id,
                  );
                  if (!current) return;

                  // Cancel and retry
                  cancelDownload(id);
                  await startDownload(
                    current.video,
                    current.format,
                    current.quality,
                  );
                } catch (err) {
                  console.error('Failed to retry download:', err);
                }
              },
            },
            {
              text: 'Cancel Download',
              style: 'destructive',
              onPress: () => cancelDownload(id),
            },
          ],
          dismissible: true,
        });
      }
    }, 5000);

    stallTimersRef.current.set(id, interval);
  };

  const startDownload = async (
    video: Video,
    format: VideoFormat,
    quality: VideoQuality,
    options?: { bitRate?: string },
  ): Promise<string> => {
    const localDownloadId = Date.now().toString();
    console.log(`🚀 Queueing download with ID: ${localDownloadId}`);
    console.log(`📹 Video: ${video.title}`);
    console.log(`🎬 Format: ${format}, Quality: ${quality}`);

    // Store video and quality for later mapping
    videoMapRef.current.set(localDownloadId, video);

    const sanitizedQuality: VideoQuality =
      format === 'mp3' ? 'audio_only' : quality;
    qualityMapRef.current.set(localDownloadId, sanitizedQuality);

    // Initialize progress tracking
    lastProgressRef.current.set(localDownloadId, { pct: 0, ts: Date.now() });

    // Determine bitRate or quality based on format
    let bitRate: string | undefined;
    let qualityStr: string | undefined;

    if (format === 'mp3') {
      bitRate = options?.bitRate || '320k'; // Default high quality for audio
      qualityStr = '144p'; // Quietly send 144p for API compatibility
    } else {
      qualityStr = sanitizedQuality === 'audio_only' ? '720p' : sanitizedQuality;
    }

    // Create download job
    const job: DownloadJob = {
      id: localDownloadId,
      videoId: video.id,
      format: format as 'mp3' | 'mp4' | 'webm',
      bitRate,
      quality: qualityStr,
      videoTitle: video.title,
      thumbnailUrl: video.thumbnailUrl,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };

    try {
      // Enqueue the download with callbacks
      const serverDownloadId = await clientDownloadQueue.enqueueWithCallbacks(
        job,
        {
          onProgress: progress => {
            // Throttled progress updates
            const now = Date.now();
            const last = lastProgressRef.current.get(localDownloadId);
            const lastPct = last?.pct ?? -1;
            const lastTs = last?.ts ?? 0;

            const pctDelta = Math.abs(progress - lastPct);
            const timeDelta = now - lastTs;

            if (pctDelta >= 1 || timeDelta >= 120) {
              if (progress > lastPct) {
                lastProgressRef.current.set(localDownloadId, {
                  pct: progress,
                  ts: now,
                });
              }

              if (__DEV__ && (pctDelta >= 5 || timeDelta >= 500)) {
                console.log(
                  `🔄 Progress ID=${localDownloadId} -> ${progress}%`,
                );
              }
            }
          },
          onComplete: (filePath, filename) => {
            safeExecute(() => {
              batchStateUpdate(() => {
                console.log(`✅ Download completed: ${filename}`);
                console.log(`📂 Saved to: ${filePath}`);

                // Clean up tracking
                lastProgressRef.current.delete(localDownloadId);
                const timer = stallTimersRef.current.get(localDownloadId);
                if (timer) {
                  clearInterval(timer);
                  stallTimersRef.current.delete(localDownloadId);
                }
              });
            }, 100);
          },
          onError: error => {
            safeExecute(() => {
              batchStateUpdate(() => {
                console.error(`❌ Download failed: ${error}`);

                // Clean up tracking
                lastProgressRef.current.delete(localDownloadId);
                const timer = stallTimersRef.current.get(localDownloadId);
                if (timer) {
                  clearInterval(timer);
                  stallTimersRef.current.delete(localDownloadId);
                }
              });
            });
          },
        },
      );

      // Store server download ID mapping
      if (serverDownloadId) {
        downloadIdMap.set(localDownloadId, serverDownloadId);
        console.log(
          `📋 Download ID mapping: ${localDownloadId} -> ${serverDownloadId}`,
        );
      }

      console.log(
        `✅ Download queued successfully. Position in queue will be shown in UI.`,
      );
      return localDownloadId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to queue download';
      console.error(`❌ Failed to queue download: ${errorMessage}`);

      // Clean up
      videoMapRef.current.delete(localDownloadId);
      qualityMapRef.current.delete(localDownloadId);
      lastProgressRef.current.delete(localDownloadId);

      throw error;
    }
  };

  const updateProgress = (id: string, progress: number) => {
    const now = Date.now();
    const last = lastProgressRef.current.get(id);
    const lastPct = last?.pct ?? -1;
    const lastTs = last?.ts ?? 0;

    // Emit only if progress changed by >= 1% or at least 120ms elapsed
    const pctDelta = Math.abs(progress - lastPct);
    const timeDelta = now - lastTs;
    if (pctDelta < 1 && timeDelta < 120) {
      return;
    }

    if (progress > lastPct) {
      lastProgressRef.current.set(id, { pct: progress, ts: now });
    }
    ensureStallMonitor(id);
    if (__DEV__) {
      // Reduce noisy logs in development
      if (pctDelta >= 5 || timeDelta >= 500) {
        console.log(`🔄 Throttled progress ID=${id} -> ${progress}%`);
      }
    }
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } });
  };

  const completeDownload = (id: string, filePath: string) => {
    dispatch({ type: 'COMPLETE_DOWNLOAD', payload: { id, filePath } });
    // Cleanup monitors
    const t = stallTimersRef.current.get(id);
    if (t) {
      clearInterval(t);
      stallTimersRef.current.delete(id);
    }
    lastProgressRef.current.delete(id);
  };

  const failDownload = (id: string, error: string) => {
    dispatch({ type: 'FAIL_DOWNLOAD', payload: { id, error } });
    const t = stallTimersRef.current.get(id);
    if (t) {
      clearInterval(t);
      stallTimersRef.current.delete(id);
    }
    lastProgressRef.current.delete(id);
  };

  const cancelDownload = (id: string) => {
    console.log(`🛑 Cancelling download: ${id}`);

    // Cancel through queue manager
    clientDownloadQueue.cancelDownload(id);

    // Clean up local tracking
    const t = stallTimersRef.current.get(id);
    if (t) {
      clearInterval(t);
      stallTimersRef.current.delete(id);
    }
    lastProgressRef.current.delete(id);
    downloadIdMap.delete(id);
    pendingCancelSet.delete(id);
  };

  const deleteDownload = async (id: string) => {
    console.log(`🗑️ Deleting download: ${id}`);

    // Cancel first (if active or queued)
    cancelDownload(id);

    // Remove from storage
    try {
      await storageService.removeDownloadedVideo(id);
      console.log(`💾 Removed download from storage: ${id}`);
    } catch (error) {
      console.error('❌ Failed to remove download from storage:', error);
    }

    // Clean up video and quality maps
    videoMapRef.current.delete(id);
    qualityMapRef.current.delete(id);

    // Remove from local state
    dispatch({ type: 'DELETE_DOWNLOAD', payload: { id } });
  };

  // Cleanup function for stuck downloads
  const forceCleanupAllDownloads = () => {
    console.log('🧹 Force cleaning up all downloads...');

    // Get current queue state
    const queueState = clientDownloadQueue.getState();

    // Cancel active download
    if (queueState.activeDownload) {
      clientDownloadQueue.cancelDownload(queueState.activeDownload.id);
    }

    // Cancel all queued downloads
    queueState.queuedDownloads.forEach(job => {
      clientDownloadQueue.cancelDownload(job.id);
    });

    // Clear completed downloads
    clientDownloadQueue.clearCompleted();

    // Cancel all active SSE connections
    downloadService.cleanup();

    // Clear all mappings
    downloadIdMap.clear();
    pendingCancelSet.clear();
    lastProgressRef.current.clear();
    stallTimersRef.current.forEach(timer => clearInterval(timer));
    stallTimersRef.current.clear();
    videoMapRef.current.clear();
    qualityMapRef.current.clear();

    console.log(`✅ Cleaned up all downloads and queue`);
  };

  const retryDownload = (id: string) => {
    console.log(`🔄 Retrying download: ${id}`);
    clientDownloadQueue.retryDownload(id);
  };

  const moveDownloadUp = (id: string) => {
    console.log(`⬆️ Moving download up in queue: ${id}`);
    clientDownloadQueue.moveUp(id);
  };

  const moveDownloadDown = (id: string) => {
    console.log(`⬇️ Moving download down in queue: ${id}`);
    clientDownloadQueue.moveDown(id);
  };

  const retryDownloadByVideoId = async (videoId: string): Promise<void> => {
    console.log(`🔄 Retrying download for video ID: ${videoId}`);

    // Find all downloads with matching video ID
    const matchingDownloads = state.downloads.filter(
      d => d.video.id === videoId,
    );

    if (matchingDownloads.length === 0) {
      console.warn(`⚠️ No downloads found for video ID: ${videoId}`);
      return;
    }

    // Get the video info from the first match
    const { video, format, quality } = matchingDownloads[0];

    console.log(
      `📹 Found ${matchingDownloads.length} download(s) for: ${video.title}`,
    );
    console.log(`🗑️ Removing old downloads...`);

    // Delete all matching downloads (removes duplicates)
    matchingDownloads.forEach(download => {
      deleteDownload(download.id);
    });

    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`🚀 Starting fresh download...`);

    // Start a new download
    await startDownload(video, format, quality);

    console.log(`✅ Retry initiated successfully`);
  };

  const contextValue: DownloadContextType = {
    downloads: state.downloads,
    startDownload,
    updateProgress,
    completeDownload,
    failDownload,
    cancelDownload,
    deleteDownload,
    retryDownload,
    retryDownloadByVideoId,
    moveDownloadUp,
    moveDownloadDown,
    forceCleanupAllDownloads,
  };

  return (
    <DownloadContext.Provider value={contextValue}>
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownloads = (): DownloadContextType => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadProvider');
  }
  return context;
};
