import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Download, Video, VideoFormat, VideoQuality, DownloadStatus } from '../types/video';
import { apiClient } from '../services/apiClient';

interface DownloadState {
  downloads: Download[];
}

type DownloadAction =
  | { type: 'START_DOWNLOAD'; payload: { video: Video; format: VideoFormat; quality: VideoQuality } }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'COMPLETE_DOWNLOAD'; payload: { id: string; filePath: string } }
  | { type: 'FAIL_DOWNLOAD'; payload: { id: string; error: string } }
  | { type: 'CANCEL_DOWNLOAD'; payload: { id: string } };

const downloadReducer = (state: DownloadState, action: DownloadAction): DownloadState => {
  switch (action.type) {
    case 'START_DOWNLOAD': {
      const newDownload: Download = {
        id: Date.now().toString(),
        video: action.payload.video,
        format: action.payload.format,
        quality: action.payload.quality,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
      };
      return {
        ...state,
        downloads: [...state.downloads, newDownload],
      };
    }
    case 'UPDATE_PROGRESS': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, progress: action.payload.progress, status: 'downloading' as DownloadStatus }
            : download
        ),
      };
    }
    case 'COMPLETE_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, status: 'completed' as DownloadStatus, filePath: action.payload.filePath, progress: 100 }
            : download
        ),
      };
    }
    case 'FAIL_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, status: 'failed' as DownloadStatus, error: action.payload.error }
            : download
        ),
      };
    }
    case 'CANCEL_DOWNLOAD': {
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload.id
            ? { ...download, status: 'cancelled' as DownloadStatus }
            : download
        ),
      };
    }
    default:
      return state;
  }
};

interface DownloadContextType {
  downloads: Download[];
  startDownload: (video: Video, format: VideoFormat, quality: VideoQuality) => Promise<string>;
  updateProgress: (id: string, progress: number) => void;
  completeDownload: (id: string, filePath: string) => void;
  failDownload: (id: string, error: string) => void;
  cancelDownload: (id: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

interface DownloadProviderProps {
  children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(downloadReducer, { downloads: [] });

  const startDownload = async (video: Video, format: VideoFormat, quality: VideoQuality): Promise<string> => {
    const downloadId = Date.now().toString();
    dispatch({ type: 'START_DOWNLOAD', payload: { video, format, quality } });

    try {
      // Determine bitRate or quality based on format
      const options: any = {};
      if (format === 'mp3') {
        options.bitRate = '320k'; // Default high quality for audio
      } else {
        options.quality = quality === 'audio_only' ? '720p' : quality;
      }

      await apiClient.downloadVideo(video.id, format as 'mp3' | 'mp4' | 'webm', {
        ...options,
        onProgress: (progress) => {
          updateProgress(downloadId, progress);
        },
        onComplete: (filePath, filename) => {
          completeDownload(downloadId, filePath);
        },
        onError: (error) => {
          failDownload(downloadId, error);
        },
      });

      return downloadId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      failDownload(downloadId, errorMessage);
      throw error;
    }
  };

  const updateProgress = (id: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } });
  };

  const completeDownload = (id: string, filePath: string) => {
    dispatch({ type: 'COMPLETE_DOWNLOAD', payload: { id, filePath } });
  };

  const failDownload = (id: string, error: string) => {
    dispatch({ type: 'FAIL_DOWNLOAD', payload: { id, error } });
  };

  const cancelDownload = (id: string) => {
    dispatch({ type: 'CANCEL_DOWNLOAD', payload: { id } });
  };

  const contextValue: DownloadContextType = {
    downloads: state.downloads,
    startDownload,
    updateProgress,
    completeDownload,
    failDownload,
    cancelDownload,
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