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
/**
 * Normalize a path for internal checks: remove file:// prefix and convert
 * backslashes to forward slashes so .split('/') works uniformly.
 */
const normalizePathForChecks = (p: string): string => {
  if (!p) return p;
  let path = p;
  if (path.startsWith('file://')) {
    path = path.replace('file://', '');
  }
  // Convert windows backslashes to forward slashes for consistent splitting
  path = path.replace(/\\/g, '/');
  return path;
};

const getPublicDownloadPath = (cachePath: string): string => {
  const normalized = normalizePathForChecks(cachePath || '');
  const filename = normalized.split('/').pop() || '';
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
  const pathsToTry: string[] = [];

  // Try public download path first (derived from cache path)
  const publicPath = getPublicDownloadPath(filePath);
  pathsToTry.push(publicPath);

  // Also try the original cache path as fallback, but normalize it for RNFS checks
  const normalizedOriginal = normalizePathForChecks(filePath);
  pathsToTry.push(normalizedOriginal);

  let lastError: any;

  for (const path of pathsToTry) {
    try {
      // Check if file exists. RNFS.exists expects a path without file:// prefix
      const exists = await RNFS.exists(path);
      if (!exists) {
        logger.info(`File not found at: ${path}, trying next location...`);
        continue;
      }

      logger.info(`Attempting to open file at: ${path}`);

      // Make sure the path passed to the viewer/linking does not contain file://
      const cleanPath = path.startsWith('file://') ? path.replace('file://', '') : path;

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
        const fileUrl = `file://${cleanPath}`;
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
 * Handles both file system paths and SAF (Storage Access Framework) URIs.
 * @param directoryPath - Absolute path or SAF URI to the directory to open.
 */
export const openDirectory = async (directoryPath: string): Promise<void> => {
  try {
    logger.info(`Attempting to open directory: ${directoryPath}`);

    if (!directoryPath) {
      throw new Error('No directory path provided');
    }

    const isSaf = directoryPath.startsWith('content://');

    if (isSaf) {
      // Handle SAF URI - try to open with file manager using Intent
      logger.info(`Opening SAF directory: ${directoryPath}`);

      if (Platform.OS === 'android') {
        try {
          const safX = require('react-native-saf-x');
          const hasAccess = await safX.hasPermission(directoryPath);

          if (!hasAccess) {
            throw new Error('No permission to access SAF directory');
          }

          // Try to open SAF directory using direct Linking with content URI
          // This works well for SAF URIs on Android
          try {
            await Linking.openURL(directoryPath);
            logger.info(`SAF directory opened via Linking: ${directoryPath}`);
            return;
          } catch (linkingError) {
            logger.warn('Direct Linking failed, trying Intent approach:', linkingError);
          }

          // Fallback: Try Intent (if available)
          try {
            const { NativeModules } = require('react-native');
            const { IntentAndroid } = NativeModules;

            if (IntentAndroid && IntentAndroid.openURL) {
              // IntentAndroid.openURL only accepts 1 argument (the URL)
              await IntentAndroid.openURL(directoryPath);
              logger.info(`SAF directory opened via Intent: ${directoryPath}`);
              return;
            }
          } catch (intentError) {
            logger.warn('Intent approach also failed:', intentError);
          }

          // Fallback: Try opening with generic file manager Intent
          try {
            // Try to open Downloads folder as fallback for SAF directories
            const downloadsUri = 'content://com.android.providers.downloads.documents/root/downloads';
            await Linking.openURL(downloadsUri);
            logger.info(`Opened Downloads folder as fallback for SAF directory`);
            return;
          } catch (fallbackError) {
            logger.warn('All open methods failed, will show path in dialog');
          }

          // If all attempts fail, verify access and return (caller will show dialog)
          try {
            await safX.listFiles(directoryPath);
            logger.info(`SAF directory access verified: ${directoryPath}`);
          } catch (listError) {
            logger.warn('Failed to list SAF directory files:', listError);
          }

          // Return successfully - caller can show dialog with path info
          return;
        } catch (safError) {
          logger.error('SAF access failed:', safError);
          throw new Error('Unable to access SAF directory. Please re-select the folder.');
        }
      } else {
        throw new Error('SAF URIs are only supported on Android');
      }
    } else {
      // Handle regular file system path
      const normalized = normalizePathForChecks(directoryPath);

      // Check existence for file system paths
      const exists = await RNFS.exists(normalized);
      if (!exists) {
        // Try to create the directory if it doesn't exist
        try {
          await RNFS.mkdir(normalized);
          logger.info(`Created directory: ${normalized}`);
        } catch (mkdirError) {
          throw new Error('Directory does not exist and could not be created');
        }
      }

      if (Platform.OS === 'android') {
        // Android 10+ blocks file:// URIs in intents due to scoped storage
        // We'll try multiple approaches to open the directory

        // Check if the path is in the Downloads folder
        const downloadsPath = RNFS.DownloadDirectoryPath;
        if (normalized.startsWith(downloadsPath)) {
          // Try to open Downloads folder using MediaStore content URI
          try {
            const downloadsUri = 'content://com.android.providers.downloads.documents/root/downloads';
            await Linking.openURL(downloadsUri);
            logger.info(`Downloads folder opened via MediaStore URI`);
            return;
          } catch (contentError) {
            logger.warn('MediaStore URI approach failed, trying Intent:', contentError);
          }

          // Try using Intent to open Downloads
          try {
            const { NativeModules } = require('react-native');
            const { IntentAndroid } = NativeModules;

            if (IntentAndroid && IntentAndroid.openURL) {
              // IntentAndroid.openURL only accepts 1 argument (the URL)
              await IntentAndroid.openURL(downloadsUri);
              logger.info(`Downloads folder opened via Intent`);
              return;
            }
          } catch (intentError) {
            logger.warn('Intent approach failed:', intentError);
          }

          // Try opening with generic file manager
          try {
            // Use a generic intent to open the file manager
            await Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download');
            logger.info(`Opened Downloads via external storage URI`);
            return;
          } catch (externalError) {
            logger.warn('External storage URI approach failed:', externalError);
          }
        }

        // If we can't open directly, try using file:// URI anyway (might work on older Android)
        try {
          const directoryUrl = `file://${normalized}`;
          await Linking.openURL(directoryUrl);
          logger.info(`Directory opened via file:// URI`);
          return;
        } catch (fileError) {
          logger.warn('file:// URI approach failed (expected on Android 10+):', fileError);
        }

        // If all attempts fail, provide helpful information
        // The caller should catch this and show it as an info dialog (not error)
        throw new Error(
          `Files are saved to:\n${normalized}\n\n` +
          `Due to Android security restrictions (scoped storage), please navigate to this folder manually in your file manager app. ` +
          `Look for the "Downloads" folder, then open "YTDownloader" subfolder.`
        );
      } else {
        // For non-Android platforms, use file:// URI
        let urlPath = normalized;
        if (Platform.OS === 'windows') {
          urlPath = normalized.replace(/\//g, '\\');
        }

        const directoryUrl = `file://${urlPath}`;
        await Linking.openURL(directoryUrl);
        logger.info(`File system directory opened successfully: ${directoryPath}`);
      }
    }
  } catch (error) {
    logger.error('Failed to open directory:', { directoryPath, error });
    throw error;
  }
};