/**
 * Streaming Sink abstraction for handling both SAF and filesystem downloads
 * Avoids memory issues by writing chunks directly instead of buffering
 */

import RNFS from 'react-native-fs';
import { logger } from '../../utils/logger';

let safX: any;
try {
  safX = require('react-native-saf-x');
  logger.info('react-native-saf-x loaded for Sink');
} catch (error) {
  logger.warn('react-native-saf-x not available for Sink', { error });
}

export interface Sink {
  writeBase64: (b64: string) => Promise<void>;
  finalize: () => Promise<string>;
}

/**
 * Creates a streaming sink for writing download chunks
 * @param baseDir - Base directory (SAF URI or filesystem path)
 * @param filename - Target filename
 * @param mimeType - MIME type of the file
 * @returns Sink interface for writing chunks
 */
export async function createSink(
  baseDir: string,
  filename: string,
  mimeType: string
): Promise<Sink> {
  if (baseDir.startsWith('content://')) {
    // SAF path
    if (!safX) {
      throw new Error('react-native-saf-x is required for SAF downloads');
    }

    logger.info(`Creating SAF sink: ${filename} in ${baseDir}`);
    
    // Check permission
    const ok = await safX.hasPermission(baseDir);
    if (!ok) {
      throw new Error('No SAF permission for selected folder');
    }

    const childUri = `${baseDir}/${encodeURIComponent(filename)}`;

    try {
      const alreadyExists = await safX.exists(childUri);
      if (alreadyExists) {
        logger.info(`Deleting existing SAF document before overwrite: ${childUri}`);
        await safX.unlink(childUri);
      }
    } catch (existsError) {
      logger.warn('Failed to verify existing SAF document before create', {
        uri: childUri,
        error: existsError,
      });
    }

    const doc = await safX.createFile(childUri, { mimeType });
    const uri = doc?.uri ?? childUri;

    if (!uri) {
      throw new Error('Failed to resolve SAF document URI after creation');
    }

    logger.info(`SAF document ready for streaming: ${uri}`);

    return {
      writeBase64: async (b64: string) => {
        await safX.writeFile(uri, b64, {
          encoding: 'base64',
          append: true,
          mimeType,
        });
      },
      finalize: async () => {
        logger.info(`SAF sink finalized: ${uri}`);
        return uri;
      },
    };
  } else {
    // Filesystem path
    const finalDir = baseDir || `${RNFS.DownloadDirectoryPath}/YTDownloader`;
    const partPath = `${RNFS.CachesDirectoryPath}/${Date.now()}-${filename}.part`;
    
    logger.info(`Creating filesystem sink: ${filename} -> ${partPath}`);
    
    // Create empty temp file
    await RNFS.writeFile(partPath, '', 'utf8');

    return {
      writeBase64: async (b64: string) => {
        await RNFS.appendFile(partPath, b64, 'base64');
      },
      finalize: async () => {
        try {
          // Ensure final directory exists
          await RNFS.mkdir(finalDir);
        } catch (mkdirError) {
          // Directory might already exist
        }
        
        const finalPath = `${finalDir}/${filename}`;
        await RNFS.moveFile(partPath, finalPath);
        
        logger.info(`Filesystem sink finalized: ${finalPath}`);
        return finalPath;
      },
    };
  }
}

/**
 * Checks if a path is a SAF URI
 */
export function isSafUri(path: string): boolean {
  return path.startsWith('content://');
}