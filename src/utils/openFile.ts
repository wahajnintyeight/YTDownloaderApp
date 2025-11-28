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
 * Get MIME type from file extension
 */
const getMimeTypeFromPath = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Video
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
    // Audio
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    wav: 'audio/wav',
    wma: 'audio/x-ms-wma',
    flac: 'audio/flac',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

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

      // Handle SAF URIs differently - they need content:// URI format
      const isSafUri = path.startsWith('content://');
      
      // On Android, use native intent system with proper MIME type for better app selection
      if (Platform.OS === 'android') {
        const mimeType = getMimeTypeFromPath(path);
        logger.info(`Opening file on Android with MIME type: ${mimeType}`, { path, mimeType, isSafUri });
        
        // For SAF URIs, use content:// URI directly
        if (isSafUri) {
          try {
            // For SAF URIs, we need to create an intent with the content URI and MIME type
            const { NativeModules } = require('react-native');
            const { IntentAndroid } = NativeModules;
            
            if (IntentAndroid && IntentAndroid.openURL) {
              // Try opening the SAF URI directly - Android should handle MIME type from URI
              await IntentAndroid.openURL(path);
              logger.info(`SAF URI opened successfully: ${path}`);
              return;
            }
          } catch (safError) {
            logger.warn('Failed to open SAF URI with Intent, trying Linking:', safError);
            // Fall through to Linking
          }
          
          // Fallback: Try Linking with SAF URI
          try {
            await Linking.openURL(path);
            logger.info(`SAF URI opened successfully with Linking: ${path}`);
            return;
          } catch (linkingError) {
            logger.warn('Failed to open SAF URI with Linking:', linkingError);
            throw new Error('Unable to open SAF file. Please check file permissions.');
          }
        }
        
        // For regular filesystem paths, try using native Android Intent with MIME type
        // This ensures media apps (VLC, MX Player, etc.) appear in the "Open with" dialog
        try {
          // Try using react-native-blob-util's Android intent system if available
          const ReactNativeBlobUtil = require('react-native-blob-util').default;
          
          // Check if the method exists (it might be named differently)
          if (ReactNativeBlobUtil.android) {
            // Try different possible method names
            if (typeof ReactNativeBlobUtil.android.actionViewIntent === 'function') {
              await ReactNativeBlobUtil.android.actionViewIntent(cleanPath, mimeType);
              logger.info(`File opened successfully with Android intent: ${path}`);
              return; // Success!
            } else if (typeof ReactNativeBlobUtil.android.viewIntent === 'function') {
              await ReactNativeBlobUtil.android.viewIntent(cleanPath, mimeType);
              logger.info(`File opened successfully with Android viewIntent: ${path}`);
              return; // Success!
            }
          }
        } catch (blobError) {
          logger.warn('Failed to open with react-native-blob-util, trying native Intent:', blobError);
        }
        
        // Note: react-native-blob-util might not have actionViewIntent method
        // We'll proceed to FileViewer which should handle MIME types better
      }
      
      if (FileViewer) {
        // Use react-native-file-viewer as fallback
        const mimeType = getMimeTypeFromPath(path);
        logger.info(`Using FileViewer with MIME type: ${mimeType}`);
        
        await FileViewer.open(cleanPath, {
          showOpenWithDialog: options?.showOpenWithDialog ?? true,
          displayName: options?.displayName,
        });
        logger.info(`File opened successfully with FileViewer: ${path}`);
        return; // Success!
      } else {
        // Last resort: Fallback to Linking.openURL
        const mimeType = getMimeTypeFromPath(path);
        logger.warn(`Using Linking.openURL fallback (MIME type: ${mimeType})`);
        const fileUrl = isSafUri ? path : `file://${cleanPath}`;
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
 * Result type for directory opening operations
 */
export interface DirectoryOpenResult {
  success: boolean;
  infoMessage?: string; // If success is false and this is set, show as info dialog
  errorMessage?: string; // If success is false and this is set, show as error dialog
}

/**
 * Opens a directory in the system file explorer.
 * Handles both file system paths and SAF (Storage Access Framework) URIs.
 * @param directoryPath - Absolute path or SAF URI to the directory to open.
 * @returns Result object indicating success or providing message for dialog
 */
export const openDirectory = async (directoryPath: string): Promise<DirectoryOpenResult | void> => {
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

          // NOTE: Opening SAF directories programmatically is problematic on Android
          // Linking.openURL() shows browsers/messages instead of file managers
          // We'll show an informative dialog with the folder path instead
          
          // Extract a readable folder name from the URI
          const uriParts = directoryPath.split('/');
          const folderName = uriParts[uriParts.length - 1] || 'selected folder';
          
          // Verify we have access to this directory and count files
          let fileCount = 0;
          try {
            const files = await safX.listFiles(directoryPath);
            fileCount = files?.length || 0;
            logger.info(`SAF directory access verified: ${directoryPath} (${fileCount} items)`);
          } catch (listError) {
            logger.warn('Failed to list SAF directory files:', listError);
          }
          
          // Extract a more readable path (remove the long content:// prefix)
          const readablePath = directoryPath.replace(/content:\/\/[^/]+\/[^/]+\//, '');
          
          // For SAF directories, we can't automatically open them in file managers
          // Return result instead of throwing to avoid error logging
          const infoMessage = 
            `📂 Folder Location\n\n` +
            `Folder: ${folderName}\n` +
            (fileCount > 0 ? `Files: ${fileCount} items\n\n` : '\n') +
            `Due to Android security restrictions, we cannot automatically open this folder in your file manager.\n\n` +
            `Please navigate to this folder manually:\n` +
            `1. Open your file manager app\n` +
            `2. Navigate to: ${readablePath || folderName}\n\n` +
            `Your downloads are saved to this location.`;
          
          // Return result instead of throwing - this prevents error logging
          logger.info(`Cannot auto-open SAF directory, returning info message for dialog`);
          return {
            success: false,
            infoMessage,
          };
        } catch (safError: any) {
          logger.error('SAF access failed:', safError);
          return {
            success: false,
            errorMessage: 'Unable to access SAF directory. Please re-select the folder.',
          };
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
        } catch {
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

            const downloadsUri = 'content://com.android.providers.downloads.documents/root/downloads';
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
  } catch (error: any) {
    logger.error('Failed to open directory:', { directoryPath, error });
    return {
      success: false,
      errorMessage: error?.message || 'Failed to open directory',
    };
  }
};