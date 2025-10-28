import { downloadService } from '../services/downloadService';

export const testDownload = async (videoId: string = '6sc79fcCaZ8') => {
  console.log('Starting test download for video:', videoId);

  try {
    const downloadId = await downloadService.downloadVideo(
      {
        videoId,
        format: 'mp3',
        bitRate: '320k',
      },
      progress => {
        console.log(`Download progress: ${progress}%`);
      },
      (filePath, filename) => {
        console.log(`Download complete! File saved to: ${filePath}`);
        console.log(`Filename: ${filename}`);
      },
      error => {
        console.error(`Download error: ${error}`);
      },
    );

    console.log('Download initiated with ID:', downloadId);
    return downloadId;
  } catch (error) {
    console.error('Failed to start download:', error);
    throw error;
  }
};