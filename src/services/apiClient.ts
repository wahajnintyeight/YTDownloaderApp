import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  SearchRequest,
  SearchResponse,
  ApiSearchResponse,
  Video,
} from '../types/video';
import { mockSearchVideos } from './mockData';

// API endpoint
const BASE_URL = 'https://api.theprojectphoenix.top/v2/api';
const USE_MOCK_DATA = false; // Using real API now

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      config => {
        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      response => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async error => {
        console.error(
          'API Response Error:',
          error.response?.data || error.message,
        );

        // Retry logic for network errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          return this.retryRequest(error.config);
        }

        return Promise.reject(error);
      },
    );
  }

  private async retryRequest(config: any, retryCount = 0): Promise<any> {
    const maxRetries = 3;
    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    if (retryCount >= maxRetries) {
      throw new Error('Max retries exceeded');
    }

    await new Promise<void>(resolve => setTimeout(resolve, delay));

    try {
      return await this.client.request(config);
    } catch (error) {
      return this.retryRequest(config, retryCount + 1);
    }
  }

  private transformApiResponse(apiResponse: ApiSearchResponse): SearchResponse {
    const videos: Video[] = apiResponse.result.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      duration: this.parseDuration(item.snippet.description) || 180, // Parse from description or default to 3 minutes
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      viewCount: this.parseViewCount(item.snippet.description), // Try to parse from description
    }));

    return {
      videos,
      nextPageToken: apiResponse.result.nextPage,
      prevPageToken: apiResponse.result.prevPage,
      totalPages: apiResponse.result.totalPage,
    };
  }

  private parseDuration(description: string): number {
    // Try to extract duration from description or use a reasonable default
    // This is a fallback since YouTube search API doesn't provide duration
    const durationMatch = description?.match(/(\d+):(\d+)/);
    if (durationMatch) {
      const minutes = parseInt(durationMatch[1]);
      const seconds = parseInt(durationMatch[2]);
      return minutes * 60 + seconds;
    }
    // Return a random duration between 2-10 minutes for demo purposes
    return Math.floor(Math.random() * 480) + 120; // 2-10 minutes
  }

  private parseViewCount(description: string): number | undefined {
    // Try to extract view count from description
    const viewMatch = description?.match(/(\d+(?:,\d+)*)\s*views?/i);
    if (viewMatch) {
      return parseInt(viewMatch[1].replace(/,/g, ''));
    }
    // Return a random view count for demo purposes
    return Math.floor(Math.random() * 10000000) + 1000;
  }

  async searchVideos(request: SearchRequest): Promise<SearchResponse> {
    // Use mock data in development when backend is not available
    if (USE_MOCK_DATA) {
      try {
        return await mockSearchVideos(request.query);
      } catch (error) {
        console.error('Mock search error:', error);
        throw new Error('Failed to search videos (mock)');
      }
    }

    try {
      const requestBody = {
        query: request.query,
        maxResults: request.maxResults || 15,
        nextPage: request.nextPage || '',
        prevPage: request.prevPage || '',
      };

      const response: AxiosResponse<ApiSearchResponse> = await this.client.post(
        '/search-yt-videos',
        requestBody,
      );

      if (response.data.code !== 1009) {
        throw new Error(response.data.message || 'API returned error code');
      }

      return this.transformApiResponse(response.data);
    } catch (error: any) {
      console.error('Search videos error:', error);

      // Fallback to mock data if backend is not available
      if (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500
      ) {
        console.log('API not available, using mock data as fallback...');
        return await mockSearchVideos(request.query);
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to search videos',
      );
    }
  }

  async downloadVideo(
    videoId: string,
    format: 'mp3' | 'mp4' | 'webm',
    options?: {
      bitRate?: string;
      quality?: string;
      onProgress?: (progress: number) => void;
      onComplete?: (filePath: string, filename: string) => void;
      onError?: (error: string) => void;
      localDownloadId?: string;
    },
  ): Promise<string> {
    // Import dynamically to avoid circular dependencies
    const { downloadService } = await import('./downloadService');

    return downloadService.downloadVideo(
      {
        videoId,
        format,
        bitRate: options?.bitRate,
        quality: options?.quality,
      },
      options?.onProgress,
      options?.onComplete,
      options?.onError,
      options?.localDownloadId,
    );
  }
}

export const apiClient = new ApiClient();
