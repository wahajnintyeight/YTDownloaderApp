import { Video, SearchResponse } from '../types/video';

// Mock video data for testing
const mockVideos: Video[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: 212, // 3:32
    channelName: 'Rick Astley',
    channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    publishedAt: '2009-10-25T06:57:33Z',
    viewCount: 1400000000,
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
    duration: 282, // 4:42
    channelName: 'LuisFonsiVEVO',
    channelId: 'UCxlCzpKDdlW_N1XZXyGyNxw',
    publishedAt: '2017-01-12T19:06:32Z',
    viewCount: 8200000000,
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
    duration: 355, // 5:55
    channelName: 'Queen Official',
    channelId: 'UCiMhD4jzUqG-IgPzUmmytRQ',
    publishedAt: '2008-08-01T15:53:28Z',
    viewCount: 1900000000,
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Video)',
    thumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
    duration: 263, // 4:23
    channelName: 'Ed Sheeran',
    channelId: 'UC0C-w0YjGpqDXGB8IHb662A',
    publishedAt: '2017-01-30T10:52:32Z',
    viewCount: 6000000000,
  },
  {
    id: 'YQHsXMglC9A',
    title: 'Adele - Hello (Official Music Video)',
    thumbnailUrl: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg',
    duration: 367, // 6:07
    channelName: 'Adele',
    channelId: 'UComP_epzeKzvBX156r6pm1Q',
    publishedAt: '2015-10-22T15:00:07Z',
    viewCount: 3400000000,
  },
];

export const mockSearchVideos = async (query: string): Promise<SearchResponse> => {
  // Simulate network delay
  await new Promise<void>(resolve => setTimeout(resolve, 1000));
  
  // Filter videos based on query (simple mock search)
  const filteredVideos = mockVideos.filter(video =>
    video.title.toLowerCase().includes(query.toLowerCase()) ||
    video.channelName.toLowerCase().includes(query.toLowerCase())
  );
  
  return {
    videos: filteredVideos,
    nextPageToken: undefined,
  };
};