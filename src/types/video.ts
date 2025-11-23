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
  serverDownloadId?: string; // Server-generated download ID for SSE tracking
  video: Video;
  format: VideoFormat;
  quality: VideoQuality;
  status: DownloadStatus;
  progress: number; // 0-100
  filePath?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
  nextPage?: string;
  prevPage?: string;
}

export interface SearchResponse {
  videos: Video[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalPages?: number;
}

// API Response types (matching the actual API structure)
export interface ApiSearchResponse {
  code: number;
  message: string;
  result: {
    items: ApiVideoItem[];
    nextPage: string;
    prevPage: string;
    totalPage: number;
  };
}

export interface ApiVideoItem {
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  kind: string;
  snippet: {
    channelId: string;
    channelTitle: string;
    description: string;
    liveBroadcastContent: string;
    publishedAt: string;
    thumbnails: {
      default: { height: number; url: string; width: number };
      high: { height: number; url: string; width: number };
      medium: { height: number; url: string; width: number };
    };
    title: string;
  };
}
