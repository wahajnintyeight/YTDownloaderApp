export interface DownloadJob {
  id: string;
  videoId: string;
  // 🔧 NEW: Force specific download method for this job
  forceMethod?: 'sse' | 'direct-stream';
  format: 'mp3' | 'mp4' | 'webm';
  bitRate?: string;
  quality?: string;
  videoTitle: string;
  thumbnailUrl?: string;
  status: 'queued' | 'downloading' | 'completed' | 'error';
  progress: number;
  filePath?: string;
  filename?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface DownloadQueueState {
  activeDownload: DownloadJob | null;
  queuedDownloads: DownloadJob[];
  completedDownloads: Map<string, DownloadJob>;
}
