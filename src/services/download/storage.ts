import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { normalizeBase64 } from './chunks';
import { Platform } from 'react-native';

import {
  writeFile as safWriteFile,
  createFile,
  exists,
  unlink,
  hasPermission,
} from 'react-native-saf-x';

export async function saveFromUrl(
  url: string,
  filename: string,
  mimeType?: string | null,
  customDownloadPath?: string | null,
  onProgress?: (progress: number) => void,
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

    if (isSaf) {
      // SAF path: download to temp file first, then stream to SAF in chunks
      console.log(`⬇️ Downloading to temp cache (SAF Mode)...`);
      const tempPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${filename}`;
      try {
        const downloadRes = await RNFS.downloadFile({
          fromUrl: url,
          toFile: tempPath,
          background: true,
          discretionary: true,
          progressDivider: 1,
          progress: (p) => {
            const total = p.contentLength || 0;
            const written = p.bytesWritten || 0;
            if (total > 0) {
              const pct = Math.max(0, Math.min(100, Math.floor((written / total) * 90)));
              onProgress?.(pct);
            }
          },
        }).promise;
        if (downloadRes.statusCode && downloadRes.statusCode >= 400) {
          throw new Error(`HTTP ${downloadRes.statusCode}`);
        }

        // Permission check for SAF directory
        const ok = await hasPermission(downloadsPath);
        if (!ok) throw new Error('No permission for this SAF directory');

        const docMime = mimeType || 'application/octet-stream';
        const childUri = `${downloadsPath}/${encodeURIComponent(filename)}`;

        // Ensure no stale file exists
        try {
          const fileExists = await exists(childUri);
          if (fileExists) {
            await unlink(childUri);
          }
        } catch {}

        const doc = await createFile(childUri, { mimeType: docMime });
        const targetUri = doc?.uri;
        if (!targetUri) throw new Error('Failed to create file in SAF folder');

        // Stream copy in 1MB chunks (base64)
        const stat = await RNFS.stat(tempPath);
        const fileSize = Number((stat as any)?.size || 0);
        const chunkSize = 1024 * 1024; // 1 MB
        let offset = 0;
        console.log('🔄 Streaming from cache to SAF...');
        while (offset < fileSize) {
          const len = Math.min(chunkSize, fileSize - offset);
          const chunkB64 = await RNFS.read(tempPath, len, offset, 'base64');
          await safWriteFile(targetUri, chunkB64, { encoding: 'base64', append: true });
          offset += len;

          // Update progress for copy phase (90% -> 100%)
          const pct = 90 + Math.floor((offset / fileSize) * 10);
          onProgress?.(Math.min(100, pct));
        }

        console.log(`✅ File saved via SAF: ${targetUri}`);
        return targetUri;
      } finally {
        // Cleanup temp file
        try {
          await RNFS.unlink(tempPath);
        } catch {}
      }
    } else {
      // Non-SAF path. On Android, prefer DownloadManager to leverage native notifications and background behavior
      if (Platform.OS === 'android') {
        const blob = (await import('react-native-blob-util')).default as typeof ReactNativeBlobUtil;
        const downloadDir = blob.fs.dirs.DownloadDir;
        const desiredBase = downloadsPath.startsWith(downloadDir)
          ? downloadsPath
          : `${downloadDir}/YTDownloader`;

        try {
          await RNFS.mkdir(desiredBase);
        } catch {}

        const destPath = `${desiredBase}/${filename}`;
        console.log(`📝 Using Android DownloadManager -> ${destPath}`);

        await blob
          .config({
            addAndroidDownloads: {
              useDownloadManager: true,
              notification: true,
              title: filename,
              description: 'Downloading...',
              mime: mimeType || 'application/octet-stream',
              mediaScannable: true,
              path: destPath,
            },
          })
          .fetch('GET', url);

        // DownloadManager shows its own notification; we just return the path
        onProgress?.(100);
        return destPath;
      }

      // iOS (and other) fallback: RNFS with Notifee progress
      await RNFS.mkdir(downloadsPath);
      const filePath = `${downloadsPath}/${filename}`;
      console.log(`📝 Full file path: ${filePath}`);

      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        background: true,
        discretionary: true,
        progressDivider: 1,
        progress: (p) => {
          const total = p.contentLength || 0;
          const written = p.bytesWritten || 0;
          if (total > 0) {
            const pct = Math.max(0, Math.min(100, Math.floor((written / total) * 100)));
            onProgress?.(pct);
          }
        },
      }).promise;

      if (result.statusCode >= 400) {
        throw new Error(`HTTP ${result.statusCode}`);
      }

      const stats = await RNFS.stat(filePath);
      console.log(`✅ File saved successfully!`);
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      onProgress?.(100);
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
      blobFs = (blob as any)?.fs || null;
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
