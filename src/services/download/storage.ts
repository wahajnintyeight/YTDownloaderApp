import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
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
  console.log(
    `📦 Data size: ${(base64Data.length / 1024 / 1024).toFixed(2)} MB (base64)`,
  );

  try {
    const dataSizeMB = base64Data.length / 1024 / 1024;

    // Prefer react-native-blob-util when available (better for large base64)
    let blobFs: any | null = null;
    try {
      const blob = await import('react-native-blob-util');
      blobFs = blob?.fs || null;
    } catch {
      blobFs = null;
    }

    // Step 1: Always save to app cache
    const appCacheDir = blobFs
      ? `${blobFs.dirs.CacheDir}/Downloads`
      : `${RNFS.CachesDirectoryPath}/Downloads`;

    if (blobFs) {
      await blobFs.mkdir(appCacheDir);
    } else {
      await RNFS.mkdir(appCacheDir);
    }

    const cachePath = `${appCacheDir}/${filename}`;
    console.log(`📂 App-scoped cache path: ${cachePath}`);

    if (blobFs) {
      // Single write using blob-util
      console.log(
        `💾 [blob-util] Saving ${filename} (${dataSizeMB.toFixed(2)} MB)`,
      );
      await blobFs.writeFile(cachePath, base64Data, 'base64');
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
        const chunkSize = 1024 * 1024;
        let offset = 0;
        while (offset < base64Data.length) {
          const chunk = base64Data.slice(offset, offset + chunkSize);
          await RNFS.appendFile(cachePath, chunk, 'base64');
          offset += chunkSize;
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
      await blobFs.mkdir(userPath);
      const destPath = `${userPath}/${filename}`;
      const base64 = await blobFs.readFile(sourcePath, 'base64');
      await blobFs.writeFile(destPath, base64, 'base64');
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
