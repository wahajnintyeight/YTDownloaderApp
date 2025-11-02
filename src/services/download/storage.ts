import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { normalizeBase64 } from './chunks';

import {
  writeFile as safWriteFile,
  createFile,
  exists,
  unlink,
} from 'react-native-saf-x';

export async function saveFromUrl(
  url: string,
  filename: string,
  mimeType?: string | null,
  customDownloadPath?: string | null,
): Promise<string> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🌐 Starting URL save operation...`);
  console.log(`🔗 URL: ${url}`);
  console.log(`📁 Filename: ${filename}`);

  const downloadsPath =
    customDownloadPath || `${RNFS.DownloadDirectoryPath}/YTDownloader`;
  console.log(`📂 Target directory: ${downloadsPath}`);

  try {
    const isSaf = downloadsPath.startsWith('content://');

    console.log(`⬇️ Downloading file from URL...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer as any);
    const base64Data = buffer.toString('base64');

    if (isSaf) {
      const docMime = mimeType || 'application/octet-stream';
      const childUri = `${downloadsPath}/${encodeURIComponent(filename)}`;

      const fileExists = await exists(childUri);
      if (fileExists) {
        console.log(`🗑️ Deleting existing file: ${filename}`);
        await unlink(childUri);
      }

      const doc = await createFile(childUri, { mimeType: docMime });
      const targetUri = doc?.uri;
      if (!targetUri) throw new Error('Failed to create file in SAF folder');
      await safWriteFile(targetUri, base64Data, { encoding: 'base64' });
      console.log(`✅ File saved via SAF: ${targetUri}`);
      return targetUri;
    } else {
      await RNFS.mkdir(downloadsPath);
      const filePath = `${downloadsPath}/${filename}`;
      console.log(`📝 Full file path: ${filePath}`);
      await RNFS.writeFile(filePath, base64Data, 'base64');
      const stats = await RNFS.stat(filePath);
      console.log(`✅ File saved successfully!`);
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return filePath;
    }
  } catch (error) {
    console.error('❌ Failed to save file from URL', error);
    throw error;
  }
}

export async function saveFileToCacheAndExport(
  base64Data: string,
  filename: string,
  customDownloadPath?: string | null,
): Promise<string> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 💾 Starting file save operation...`);
  console.log(`📁 Filename: ${filename}`);
  // sanitize possible data URL prefix and normalize base64 prior to write
  base64Data = base64Data.startsWith('data:')
    ? base64Data.slice(base64Data.indexOf(',') + 1)
    : base64Data;
  base64Data = normalizeBase64(base64Data);
  console.log(
    `📦 Data size: ${(base64Data.length / 1024 / 1024).toFixed(2)} MB (base64)`,
  );

  try {
    const dataSizeMB = base64Data.length / 1024 / 1024;

    // Prefer react-native-blob-util when available (better for large base64)
    let blobFs: any | null = null;
    try {
      blobFs = ReactNativeBlobUtil.fs || null;
    } catch {
      throw new Error('BLOBFS NOT INITIALIZED!');
    }

    console.log(blobFs);
    // Step 1: Always save to app cache
    const appCacheDir = `${blobFs.dirs.CacheDir}/Downloads`;

    if (blobFs) {
      const cacheDirExists = await blobFs.exists(appCacheDir);
      if (!cacheDirExists) {
        await blobFs.mkdir(appCacheDir);
      }
    } else {
      throw new Error('BLOBFS NOT INITIALIZED!');
    }
    //else {
    // await RNFS.mkdir(appCacheDir);
    //}

    const cachePath = `${appCacheDir}/${filename}`;
    console.log(`📂 App-scoped cache path: ${cachePath}`);

    if (blobFs) {
      // Prefer chunked write for large payloads to avoid native base64 decode issues
      console.log(
        `💾 [blob-util] Saving ${filename} (${dataSizeMB.toFixed(2)} MB)`,
      );
      if (dataSizeMB > 50) {
        await blobFs.writeFile(cachePath, '', 'utf8');
        // Use chunk size aligned to base64 4-char quantum
        const targetChars = 1024 * 1024; // ~1MB of base64 chars
        const chunkSize = targetChars - (targetChars % 4);
        let offset = 0;
        while (offset < base64Data.length) {
          const end = Math.min(offset + chunkSize, base64Data.length);
          const chunk = base64Data.slice(offset, end);
          await blobFs.appendFile(cachePath, chunk, 'base64');
          offset = end;
        }
      } else {
        await blobFs.writeFile(cachePath, base64Data, 'base64');
      }
      const stat = await blobFs.stat(cachePath);
      const sizeMb = (Number(stat?.size || 0) / 1024 / 1024).toFixed(2);
      console.log(`✅ File saved: ${sizeMb} MB`);
    } else {
      // Fallback to RNFS (chunked for large files)
      if (dataSizeMB > 100) {
        console.warn(
          `⚠️ [RNFS] Using chunked write for ${dataSizeMB.toFixed(2)} MB...`,
        );
        await RNFS.writeFile(cachePath, '', 'base64');
        const targetChars = 1024 * 1024; // ~1MB of base64 chars
        const chunkSize = targetChars - (targetChars % 4);
        let offset = 0;
        while (offset < base64Data.length) {
          const end = Math.min(offset + chunkSize, base64Data.length);
          const chunk = base64Data.slice(offset, end);
          await RNFS.appendFile(cachePath, chunk, 'base64');
          offset = end;
        }
      } else {
        await RNFS.writeFile(cachePath, base64Data, 'base64');
      }
      const stats = await RNFS.stat(cachePath);
      console.log(`✅ File saved: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Step 2: Export to user-selected path in background
    if (customDownloadPath) {
      console.log('📤 User selected location, attempting export...');
      setTimeout(async () => {
        try {
          const exported = await exportToUserLocation(
            cachePath,
            filename,
            customDownloadPath,
          );
          console.log(`✅ Also exported to: ${exported}`);
        } catch (e) {
          console.warn('⚠️ Export failed, keeping cache copy:', e);
        }
      }, 0);
    }

    base64Data = '';
    return cachePath;
  } catch (error) {
    console.error('❌ FILE SAVE OPERATION FAILED');
    console.error('Error details:', error);
    base64Data = '';
    throw new Error('Failed to save file to device');
  }
}

export async function exportToMediaStore(
  sourcePath: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  try {
    const { saveDocuments } = await import('@react-native-documents/picker');
    const [{ uri }] = await saveDocuments({
      sourceUris: [sourcePath],
      fileName: filename,
      mimeType,
    });
    console.log(`✅ Exported to user location: ${uri}`);
    return uri;
  } catch (error) {
    console.warn('MediaStore export unavailable, keeping app cache', error);
    throw error;
  }
}

export async function exportToUserLocation(
  sourcePath: string,
  filename: string,
  userPath: string,
): Promise<string> {
  try {
    // Prefer react-native-blob-util for reading base64 when available
    let blobFs: any | null = null;
    try {
      const blob = await import('react-native-blob-util');
      blobFs = blob?.fs || null;
    } catch {
      blobFs = null;
    }

    if (userPath.startsWith('content://')) {
      const docMime = filename.endsWith('.mp3')
        ? 'audio/mpeg'
        : filename.endsWith('.mp4')
        ? 'video/mp4'
        : filename.endsWith('.webm')
        ? 'video/webm'
        : 'application/octet-stream';

      // Check file size to prevent OOM during SAF export
      const stat = blobFs ? await blobFs.stat(sourcePath) : await RNFS.stat(sourcePath);
      const sizeBytes = Number((stat as any)?.size || 0);
      const sizeMB = sizeBytes / 1024 / 1024;
      
      // For very large files, SAF export will cause OOM - fallback to filesystem Downloads
      if (sizeMB > 30) {
        console.warn(
          `⚠️ Skipping SAF export for large file (${sizeMB.toFixed(2)} MB). Falling back to Downloads folder.`,
        );
        const fallbackDir = `${RNFS.DownloadDirectoryPath}/YTDownloader`;
        try {
          await RNFS.mkdir(fallbackDir);
        } catch {}
        const destPath = `${fallbackDir}/${filename}`;
        await RNFS.copyFile(sourcePath, destPath);
        console.log(`✅ Exported large file to: ${destPath}`);
        return destPath;
      }

      const childUri = `${userPath}/${encodeURIComponent(filename)}`;

      const fileExists = await exists(childUri);
      if (fileExists) {
        console.log('🗑️ Deleting existing file in SAF target');
        await unlink(childUri);
      }

      const doc = await createFile(childUri, { mimeType: docMime });
      const targetUri = doc?.uri;
      if (!targetUri) throw new Error('Failed to create file in SAF folder');

      const base64 = blobFs
        ? await blobFs.readFile(sourcePath, 'base64')
        : await RNFS.readFile(sourcePath, 'base64');
      await safWriteFile(targetUri, base64, { encoding: 'base64' });
      console.log(`✅ Exported to SAF: ${targetUri}`);
      return targetUri;
    }

    if (blobFs) {
      const userDirExists = await blobFs.exists(userPath);
      if (!userDirExists) {
        await blobFs.mkdir(userPath);
      }
      const destPath = `${userPath}/${filename}`;
      // Prefer direct filesystem copy to avoid base64 for large files
      await RNFS.copyFile(sourcePath, destPath);
      console.log(`✅ Exported to: ${destPath}`);
      return destPath;
    } else {
      await RNFS.mkdir(userPath);
      const destPath = `${userPath}/${filename}`;
      await RNFS.copyFile(sourcePath, destPath);
      console.log(`✅ Exported to: ${destPath}`);
      return destPath;
    }
  } catch (error) {
    console.warn('Export to user location failed', error);
    throw error;
  }
}
