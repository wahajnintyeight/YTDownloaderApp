/**
 * SAF (Storage Access Framework) specific storage utilities
 * Handles content:// URIs for user-selected directories on Android
 */

import { logger } from '../../utils/logger';

let safX: any;
try {
  safX = require('react-native-saf-x');
  logger.info('react-native-saf-x loaded successfully');
} catch (error) {
  logger.warn('react-native-saf-x not available', { error });
}

/**
 * Creates a document in a SAF tree and returns its content URI
 * @param treeUri - The SAF tree URI (from openDocumentTree)
 * @param filename - The desired filename
 * @param mimeType - The MIME type of the file
 * @returns The content URI of the created document
 */
export async function openSafTarget(
  treeUri: string,
  filename: string,
  mimeType: string
): Promise<string> {
  if (!safX) {
    throw new Error('react-native-saf-x is not available');
  }

  try {
    logger.info(`Creating SAF document: ${filename} in tree: ${treeUri}`);

    const childUri = `${treeUri}/${encodeURIComponent(filename)}`;

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

    logger.info(`SAF document created successfully: ${uri}`);
    return uri; // content://...
  } catch (error) {
    logger.error('Failed to create SAF document:', { treeUri, filename, mimeType, error });
    throw error;
  }
}

/**
 * Appends base64 data to a SAF document
 * @param uri - The content URI of the document
 * @param base64Chunk - The base64 data to append
 */
export async function safAppendBase64(uri: string, base64Chunk: string): Promise<void> {
  if (!safX) {
    throw new Error('react-native-saf-x is not available');
  }

  try {
    await safX.writeFile(uri, base64Chunk, {
      encoding: 'base64',
      append: true,
    });
  } catch (error) {
    logger.error('Failed to append to SAF document:', { uri, error });
    throw error;
  }
}

/**
 * Writes base64 data to a SAF document (overwrites existing content)
 * @param uri - The content URI of the document
 * @param base64Data - The base64 data to write
 */
export async function safWriteBase64(uri: string, base64Data: string): Promise<void> {
  if (!safX) {
    throw new Error('react-native-saf-x is not available');
  }

  try {
    await safX.writeFile(uri, base64Data, {
      encoding: 'base64',
      append: false,
    });
  } catch (error) {
    logger.error('Failed to write to SAF document:', { uri, error });
    throw error;
  }
}

/**
 * Checks if a path is a SAF URI
 * @param path - The path to check
 * @returns True if the path is a SAF URI
 */
export function isSafUri(path: string): boolean {
  return path.startsWith('content://');
}

/**
 * Gets the display name from a SAF document URI
 * @param uri - The SAF document URI
 * @returns The display name of the document
 */
export async function getSafDocumentName(uri: string): Promise<string | null> {
  if (!safX) {
    return null;
  }

  try {
    const doc = await safX.stat(uri);
    return doc?.name || null;
  } catch (error) {
    logger.warn('Failed to get SAF document name:', { uri, error });
    return null;
  }
}