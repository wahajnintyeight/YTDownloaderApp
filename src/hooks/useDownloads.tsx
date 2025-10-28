import React, { createContext, useContext, useReducer, ReactNode, useRef } from 'react';
import {
  Download,
  Video,
  VideoFormat,
  VideoQuality,
  DownloadStatus,
} from '../types/video';
import { apiClient } from '../services/apiClient';
import { downloadService } from '../services/downloadService';
import { safeExecute, batchStateUpdate } from '../utils/crashPrevention';

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

const downloadReducer = (
  state: DownloadState,
  action: DownloadAction,
): DownloadState => {
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
          console.log(
            `📦 Reducer: Updating download ${download.id} to progress ${action.payload.progress}, status: downloading`,
          );
          return {
            ...download,
            progress: action.payload.progress,
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
  ) => Promise<string>;
  updateProgress: (id: string, progress: number) => void;
  completeDownload: (id: string, filePath: string) => void;
  failDownload: (id: string, error: string) => void;
  cancelDownload: (id: string) => void;
  deleteDownload: (id: string) => void;
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

  // Throttle map to limit progress updates per download (id -> { pct, ts })
  const lastProgressRef = useRef(new Map<string, { pct: number; ts: number }>());

  const startDownload = async (
    video: Video,
    format: VideoFormat,
    quality: VideoQuality,
  ): Promise<string> => {
    const localDownloadId = Date.now().toString();
    console.log(`🚀 Starting download with local ID: ${localDownloadId}`);
    dispatch({
      type: 'START_DOWNLOAD',
      payload: { id: localDownloadId, video, format, quality },
    });

    try {
      // Determine bitRate or quality based on format
      const options: any = {};
      if (format === 'mp3') {
        options.bitRate = '320k'; // Default high quality for audio
      } else {
        options.quality = quality === 'audio_only' ? '720p' : quality;
      }

      // Start download and get server download ID
      const serverDownloadId = await apiClient.downloadVideo(
        video.id,
        format as 'mp3' | 'mp4' | 'webm',
        {
          ...options,
          localDownloadId: localDownloadId,
          onProgress: progress => {
            updateProgress(localDownloadId, progress);
          },
          onComplete: (filePath, filename) => {
            // Use safe execution to prevent crashes during state updates
            safeExecute(() => {
              batchStateUpdate(() => {
                try {
                  completeDownload(localDownloadId, filePath);
                  console.log(
                    `✅ Download completed successfully: ${filename}`,
                  );
                } catch (error) {
                  console.error(
                    'Error updating download completion state:',
                    error,
                  );
                  failDownload(
                    localDownloadId,
                    'Failed to update download status',
                  );
                }
              });
            }, 100); // Small delay to ensure file operations are complete

            // Clean up mapping when complete
            downloadIdMap.delete(localDownloadId);
          },
          onError: error => {
            safeExecute(() => {
              batchStateUpdate(() => {
                failDownload(localDownloadId, error);
              });
            });
            // Clean up mapping on error
            downloadIdMap.delete(localDownloadId);
          },
        },
      );

      // Store mapping between local ID and server ID for cancellation
      if (serverDownloadId) {
        downloadIdMap.set(localDownloadId, serverDownloadId);
        console.log(
          `📋 Download ID mapping: ${localDownloadId} -> ${serverDownloadId}`,
        );

        // If user requested cancel before mapping was ready, cancel now
        if (pendingCancelSet.has(localDownloadId)) {
          console.log(
            `⏱️ Pending cancel found for ${localDownloadId}, cancelling SSE now...`,
          );
          try {
            downloadService.cancelDownload(serverDownloadId);
          } finally {
            pendingCancelSet.delete(localDownloadId);
            // Update local state to cancelled
            dispatch({ type: 'CANCEL_DOWNLOAD', payload: { id: localDownloadId } });
          }
        }
      }

      return localDownloadId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Download failed';
      failDownload(localDownloadId, errorMessage);
      downloadIdMap.delete(localDownloadId);
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

    lastProgressRef.current.set(id, { pct: progress, ts: now });
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
  };

  const failDownload = (id: string, error: string) => {
    dispatch({ type: 'FAIL_DOWNLOAD', payload: { id, error } });
  };

  const cancelDownload = (id: string) => {
    console.log(`🛑 Cancelling download: ${id}`);

    // Get server download ID for proper cancellation
    const serverDownloadId = downloadIdMap.get(id);

    if (serverDownloadId) {
      console.log(
        `🔌 Cancelling SSE connection for server ID: ${serverDownloadId}`,
      );
      // Cancel the actual SSE connection
      downloadService.cancelDownload(serverDownloadId);
      // Clean up mapping
      downloadIdMap.delete(id);
    } else {
      console.warn(
        `⚠️ No server download ID yet for local ID: ${id}. Queuing cancel...`,
      );
      pendingCancelSet.add(id);
    }

    // Update local state
    dispatch({ type: 'CANCEL_DOWNLOAD', payload: { id } });
  };

  const deleteDownload = (id: string) => {
    // Ensure SSE is cancelled if active
    cancelDownload(id);
    // Remove from list entirely
    dispatch({ type: 'DELETE_DOWNLOAD', payload: { id } });
    // Clean any bookkeeping
    pendingCancelSet.delete(id);
    downloadIdMap.delete(id);
  };

  // Cleanup function for stuck downloads
  const forceCleanupAllDownloads = () => {
    console.log('🧹 Force cleaning up all downloads...');

    // Cancel all active SSE connections
    downloadService.cleanup();

    // Clear all mappings
    downloadIdMap.clear();

    // Cancel all pending/downloading items in state
    const activeDownloads = state.downloads.filter(
      d => d.status === 'pending' || d.status === 'downloading',
    );

    activeDownloads.forEach(download => {
      dispatch({ type: 'CANCEL_DOWNLOAD', payload: { id: download.id } });
    });

    console.log(`✅ Cleaned up ${activeDownloads.length} active downloads`);
  };

  const contextValue: DownloadContextType = {
    downloads: state.downloads,
    startDownload,
    updateProgress,
    completeDownload,
    failDownload,
    cancelDownload,
    deleteDownload,
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
