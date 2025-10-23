export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  channelName: string;
  channelId: string;
  publishedAt: string;
  viewCount?: number;
}

export type VideoFormat = 'mp4' | 'webm' | 'mp3' | 'mkv';
export type VideoQuality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'audio_only';
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export interface Download {
  id: string;
  video: Video;
  format: VideoFormat;
  quality: VideoQuality;
  status: DownloadStatus;
  progress: number; // 0-100
  filePath?: string;
  error?: string;
  createdAt: Date;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
}

export interface SearchResponse {
  videos: Video[];
  nextPageToken?: string;
}