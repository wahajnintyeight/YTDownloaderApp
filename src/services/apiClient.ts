import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SearchRequest, SearchResponse, ApiSearchResponse, Video } from '../types/video';
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
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('API Response Error:', error.response?.data || error.message);

        // Retry logic for network errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          return this.retryRequest(error.config);
        }

        return Promise.reject(error);
      }
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
      duration: 0, // Duration not provided in search results
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      viewCount: undefined, // View count not provided in search results
    }));

    return {
      videos,
      nextPageToken: apiResponse.result.nextPage,
      prevPageToken: apiResponse.result.prevPage,
      totalPages: apiResponse.result.totalPage,
    };
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

      const response: AxiosResponse<ApiSearchResponse> = await this.client.post('/search-yt-videos', requestBody);

      if (response.data.code !== 1009) {
        throw new Error(response.data.message || 'API returned error code');
      }

      return this.transformApiResponse(response.data);
    } catch (error: any) {
      console.error('Search videos error:', error);

      // Fallback to mock data if backend is not available
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log('API not available, using mock data as fallback...');
        return await mockSearchVideos(request.query);
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to search videos');
    }
  }

  async downloadVideo(
    url: string,
    format: string,
    quality: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      const response = await this.client.post('/download-yt-videos', {
        url,
        format,
        quality,
      }, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Download video error:', error);
      throw new Error(error.response?.data?.message || 'Failed to download video');
    }
  }
}

export const apiClient = new ApiClient();