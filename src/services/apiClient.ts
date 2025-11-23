import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  SearchRequest,
  SearchResponse,
  ApiSearchResponse,
  Video,
} from '../types/video';
import { mockSearchVideos } from './mockData';
import { API_BASE_URL } from '../config/env';
import { clientDownloadQueue } from './download/queueManager';
import type { DownloadJob } from './download/queue';

// API endpoint
const BASE_URL = `${API_BASE_URL}/v2/api`;
const USE_MOCK_DATA = false; // Using real API now
const USE_TEST_DATA = false; // Use test data for load testing

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
    // Use test data for load testing (multiple downloads, queuing, load testing)
    if (USE_TEST_DATA) {
      const testData: ApiSearchResponse = {
        code: 1009,
        message: 'Data Fetched Successfully',
        result: {
          items: [
            {
              etag: 'X-Tt7kkUpdTmiwDeGNhebtwKKHE',
              id: {
                kind: 'youtube#video',
                videoId: 'COx8HzGsCgM',
              },
              kind: 'youtube#searchResult',
              snippet: {
                channelId: 'UCBEm6Lb_3461POqnplWYn7g',
                channelTitle: 'Calb',
                description:
                  'After announcing their retirement, Daft Punk retreat to their interdimensional ship to travel through space, time, and reality.',
                liveBroadcastContent: 'none',
                publishedAt: '2021-08-03T21:00:11Z',
                thumbnails: {
                  default: {
                    height: 90,
                    url: 'https://i.ytimg.com/vi/COx8HzGsCgM/default.jpg',
                    width: 120,
                  },
                  high: {
                    height: 360,
                    url: 'https://i.ytimg.com/vi/COx8HzGsCgM/hqdefault.jpg',
                    width: 480,
                  },
                  medium: {
                    height: 180,
                    url: 'https://i.ytimg.com/vi/COx8HzGsCgM/mqdefault.jpg',
                    width: 320,
                  },
                },
                title:
                  'The Michael Jackson x Daft Punk Album: Thriller Access Memories',
              },
            },
            {
              etag: 'KhuCQ3WFqTeSC2foq7iQwjxVQzY',
              id: {
                kind: 'youtube#video',
                videoId: 'guWjfEOHMPg',
              },
              kind: 'youtube#searchResult',
              snippet: {
                channelId: 'UCKTmTHt1eywYxg4U1kRljbg',
                channelTitle: 'kastet 780',
                description: 'источник: https://youtu.be/COx8HzGsCgM.',
                liveBroadcastContent: 'none',
                publishedAt: '2022-02-23T11:09:14Z',
                thumbnails: {
                  default: {
                    height: 90,
                    url: 'https://i.ytimg.com/vi/guWjfEOHMPg/default.jpg',
                    width: 120,
                  },
                  high: {
                    height: 360,
                    url: 'https://i.ytimg.com/vi/guWjfEOHMPg/hqdefault.jpg',
                    width: 480,
                  },
                  medium: {
                    height: 180,
                    url: 'https://i.ytimg.com/vi/guWjfEOHMPg/mqdefault.jpg',
                    width: 320,
                  },
                },
                title:
                  'Thriller Access Memories: A Daft Punk &amp; Michael Jackson',
              },
            },
            {
              etag: 'd8bM4juYj6FCaoR1Vjn0Nw2QPPc',
              id: {
                kind: 'youtube#video',
                videoId: '6dBMIv4zXS0',
              },
              kind: 'youtube#searchResult',
              snippet: {
                channelId: 'UCtEASYTE2sOSTeTWtB_A0VA',
                channelTitle: 'a.l.1751',
                description:
                  'Original Video : https://youtube.com/watch?v=COx8HzGsCgM&si=EnSIkaIECMiOmarE.',
                liveBroadcastContent: 'none',
                publishedAt: '2023-01-18T10:00:45Z',
                thumbnails: {
                  default: {
                    height: 90,
                    url: 'https://i.ytimg.com/vi/6dBMIv4zXS0/default.jpg',
                    width: 120,
                  },
                  high: {
                    height: 360,
                    url: 'https://i.ytimg.com/vi/6dBMIv4zXS0/hqdefault.jpg',
                    width: 480,
                  },
                  medium: {
                    height: 180,
                    url: 'https://i.ytimg.com/vi/6dBMIv4zXS0/mqdefault.jpg',
                    width: 320,
                  },
                },
                title:
                  'Thriller by Moroder - Daft Punk ft. Michael Jackson (Thriller Access Memories 03/09)',
              },
            },
            {
              etag: 'D-q-ugr9vYq2sA8J6pX684q8nMw',
              id: {
                kind: 'youtube#video',
                videoId: 'RK44mALi5aU',
              },
              kind: 'youtube#searchResult',
              snippet: {
                channelId: 'UCBEm6Lb_3461POqnplWYn7g',
                channelTitle: 'Calb',
                description:
                  'This is from my full length mashup album of Michael Jackson and Daft Punk. It\'s called Thriller Access Memories and it\'s available ...',
                liveBroadcastContent: 'none',
                publishedAt: '2021-08-15T21:15:47Z',
                thumbnails: {
                  default: {
                    height: 90,
                    url: 'https://i.ytimg.com/vi/RK44mALi5aU/default.jpg',
                    width: 120,
                  },
                  high: {
                    height: 360,
                    url: 'https://i.ytimg.com/vi/RK44mALi5aU/hqdefault.jpg',
                    width: 480,
                  },
                  medium: {
                    height: 180,
                    url: 'https://i.ytimg.com/vi/RK44mALi5aU/mqdefault.jpg',
                    width: 320,
                  },
                },
                title: 'I Feel Human Nature',
              },
            },
          ],
          nextPage: 'CAQQAA',
          prevPage: '',
          totalPage: 1000000,
        },
      };
      
      console.log('🧪 Using test data for search results (load testing mode)');
      return this.transformApiResponse(testData);
    }

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
    videoTitle: string,
    options?: {
      bitRate?: string;
      quality?: string;
      onProgress?: (progress: number) => void;
      onComplete?: (filePath: string, filename: string) => void;
      onError?: (error: string) => void;
      localDownloadId?: string;
    },
  ): Promise<string> {
    const id = options?.localDownloadId || `${Date.now()}`;
    const job: DownloadJob = {
      id,
      videoId,
      format,
      bitRate: options?.bitRate,
      quality: options?.quality,
      videoTitle,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };

    return clientDownloadQueue.enqueueWithCallbacks(job, {
      onProgress: options?.onProgress,
      onComplete: options?.onComplete,
      onError: options?.onError,
    });
  }
}

export const apiClient = new ApiClient();
