import { Platform, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { logger } from './logger';

let FileViewer: any;
try {
  FileViewer = require('react-native-file-viewer').default;
  logger.info('react-native-file-viewer loaded successfully', { FileViewer: !!FileViewer });
} catch (error) {
  logger.warn('react-native-file-viewer not available, will use Linking as fallback', { error });
}

/**
 * Constructs the expected public download path for a file.
 * Based on the app's export pattern: /storage/emulated/0/Download/YTDownloader/{filename}
 */
const getPublicDownloadPath = (cachePath: string): string => {
  const filename = cachePath.split('/').pop() || '';
  return `${RNFS.DownloadDirectoryPath}/YTDownloader/${filename}`;
};

/**
 * Opens a file using the native file viewer.
 * Tries the public download path first, then falls back to cache path.
 * @param filePath - Absolute path to the file to open (typically cache path).
 * @param options - Optional configuration for FileViewer.
 */
export const openFile = async (
  filePath: string,
  options?: {
    showOpenWithDialog?: boolean;
    displayName?: string;
  }
): Promise<void> => {
  const pathsToTry = [];
  
  // Try public download path first
  const publicPath = getPublicDownloadPath(filePath);
  pathsToTry.push(publicPath);
  
  // Also try the original cache path as fallback
  pathsToTry.push(filePath);

  let lastError: any;
  
  for (const path of pathsToTry) {
    try {
      // Check if file exists
      const exists = await RNFS.exists(path);
      if (!exists) {
        logger.info(`File not found at: ${path}, trying next location...`);
        continue;
      }

      logger.info(`Attempting to open file at: ${path}`);
      
      // iOS requires removing the file:// prefix
      const cleanPath = Platform.OS === 'ios' ? path.replace('file://', '') : path;

      if (FileViewer) {
        // Use react-native-file-viewer if available
        await FileViewer.open(cleanPath, {
          showOpenWithDialog: options?.showOpenWithDialog ?? true,
          displayName: options?.displayName,
        });
        logger.info(`File opened successfully with FileViewer: ${path}`);
        return; // Success!
      } else {
        // Fallback to Linking.openURL
        const fileUrl = Platform.OS === 'ios' ? `file://${cleanPath}` : `file://${cleanPath}`;
        await Linking.openURL(fileUrl);
        logger.info(`File opened successfully with Linking: ${path}`);
        return; // Success!
      }
    } catch (error) {
      logger.warn(`Failed to open file at ${path}:`, error);
      lastError = error;
      continue; // Try next path
    }
  }

  // If we get here, all paths failed
  logger.error('Failed to open file at all attempted locations', { 
    filePath, 
    attemptedPaths: pathsToTry, 
    lastError 
  });
  throw lastError || new Error('Could not open file at any location');
};

/**
 * Opens a directory in the system file explorer.
 * @param directoryPath - Absolute path to the directory to open.
 */
export const openDirectory = async (directoryPath: string): Promise<void> => {
  try {
    logger.info(`Attempting to open directory: ${directoryPath}`);
    
    // Check if directory exists
    const exists = await RNFS.exists(directoryPath);
    if (!exists) {
      throw new Error('Directory does not exist');
    }

    // Normalize path for the platform
    let normalizedPath = directoryPath;
    
    if (Platform.OS === 'windows') {
      // Windows: Convert forward slashes to backslashes and use file:// protocol
      normalizedPath = directoryPath.replace(/\//g, '\\');
    }
    
    // Use file:// protocol to open directory
    const directoryUrl = `file://${normalizedPath}`;
    
    await Linking.openURL(directoryUrl);
    logger.info(`Directory opened successfully: ${directoryPath}`);
  } catch (error) {
    logger.error('Failed to open directory:', { directoryPath, error });
    throw error;
  }
};