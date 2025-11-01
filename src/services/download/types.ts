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
  downloadUrl?: string;
  expiresIn?: number;
  expiresAt?: number;
  fileData?: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  file?: {
    videoId: string;
    status: 'completed';
    filename: string;
    fileSize: number;
    mimeType: string;
    fileContent: string;
  };
}

export interface DownloadError {
  type: 'download_error';
  downloadId: string;
  status: 'error';
  progress: number;
  message: string;
}

export interface FileChunkEvent {
  type: 'file_chunk';
  downloadId: string;
  chunkData: string;
  chunkIndex: number;
  totalChunks: number;
}

export type DownloadEvent =
  | DownloadProgress
  | DownloadComplete
  | DownloadError
  | FileChunkEvent;

export interface DownloadOptions {
  videoId: string;
  format: 'mp3' | 'mp4' | 'webm';
  bitRate?: string;
  quality?: string;
  videoTitle?: string;
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
