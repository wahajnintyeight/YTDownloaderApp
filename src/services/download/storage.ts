import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { normalizeBase64 } from './chunks';

import {
  writeFile as safWriteFile,
  createFile,
  exists,
  unlink,
  hasPermission,
  mkdir,
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

    // 1. Download to a temporary location first (Unified approach)
    // Using cache directory ensures we don't pollute user folders with partials
    const tempDir = `${RNFS.CachesDirectoryPath}/YTDownloader_Temp`;
    if (!(await RNFS.exists(tempDir))) await RNFS.mkdir(tempDir);
    
    const tempPath = `${tempDir}/${Date.now()}_${filename}`;
    console.log(`⬇️ Downloading to temp: ${tempPath}`);

    // RNFS.downloadFile options
    const options: RNFS.DownloadFileOptions = {
      fromUrl: url,
      toFile: tempPath,
      background: true,     // iOS: Enables background downloading
      discretionary: true,  // iOS: Allows OS to schedule optimally
      progressDivider: 5,
      begin: (res) => {
         console.log(`[Download] Starting. Size: ${res.contentLength}`);
      },
      progress: async (res) => {
        const total = res.contentLength;
        const written = res.bytesWritten;
        if (total > 0) {
          const rawPct = (written / total) * 100;
          // If SAF, we reserve last 10% for the copy phase
          const reportedPct = isSaf ? Math.min(90, rawPct * 0.9) : rawPct;
          
          onProgress?.(reportedPct);
        }
      }
    };

    const result = await RNFS.downloadFile(options).promise;

    if (result.statusCode >= 400) {
      throw new Error(`HTTP Error ${result.statusCode}`);
    }

    // 2. Move or Stream to Final Destination
    console.log(`✅ Download to temp complete. Moving to final...`);

    if (isSaf) {
       // Check permissions first
       if (!(await hasPermission(downloadsPath))) {
         throw new Error('No permission for SAF directory. Please re-select the folder in Settings.');
       }

       const docMime = mimeType || 'application/octet-stream';
       
       // Create a subfolder for organized downloads (optional, but recommended)
       // react-native-saf-x allows mkdir on tree URIs
       let targetDir = downloadsPath;
       try {
         const subfolderUri = `${downloadsPath}/YTDownloader`;
         await mkdir(subfolderUri);
         targetDir = subfolderUri;
         console.log(`📁 Created/verified YTDownloader subfolder in SAF tree`);
       } catch (mkdirError) {
         // Subfolder might already exist, or mkdir might not be needed
         console.log('Subfolder creation result:', mkdirError);
         // Continue with root tree directory
       }

       // Let react-native-saf-x create the file in the tree directory
       // Pass the directory URI + filename, and let the library handle the document URI conversion
       const filePathInTree = `${targetDir}/${encodeURIComponent(filename)}`;
       console.log(`📝 Creating SAF file in tree: ${targetDir} name: ${filename}`);

       // Check if file exists and delete it first
       try {
         if (await exists(filePathInTree)) {
           console.log('🗑️ Deleting existing file in SAF target');
           await unlink(filePathInTree);
         }
       } catch (checkError) {
         // File might not exist, which is fine
         console.log('File existence check:', checkError);
       }

       // createFile expects a URI path - it will create the file and return a document URI
       const doc = await createFile(filePathInTree, { mimeType: docMime });
       const targetUri = doc?.uri;
       
       if (!targetUri) {
         throw new Error('Failed to create SAF file. Please check folder permissions.');
       }

       console.log(`📤 Writing file to SAF location: ${targetUri}`);

       // Stream copy
       const stat = await RNFS.stat(tempPath);
       const fileSize = Number(stat.size);
       const chunkSize = 1024 * 1024; // 1 MB
       let offset = 0;

       while (offset < fileSize) {
         const len = Math.min(chunkSize, fileSize - offset);
         const chunk = await RNFS.read(tempPath, len, offset, 'base64');
         await safWriteFile(targetUri, chunk, { encoding: 'base64', append: true });
         offset += len;
         
         const pct = 90 + Math.floor((offset / fileSize) * 10);
         onProgress?.(Math.min(100, pct));
       }
       
       // Cleanup temp
       await RNFS.unlink(tempPath);
       
       console.log(`✅ Saved to SAF: ${targetUri}`);
       onProgress?.(100);
       return targetUri;

    } else {
      // Normal File System (Non-SAF)
      // Ensure dir
      if (!(await RNFS.exists(downloadsPath))) {
        await RNFS.mkdir(downloadsPath);
      }
      
      const finalPath = `${downloadsPath}/${filename}`;
      
      // Remove existing if any
      if (await RNFS.exists(finalPath)) {
        await RNFS.unlink(finalPath);
      }
      
      // Move
      await RNFS.moveFile(tempPath, finalPath);
      
      console.log(`✅ Moved to: ${finalPath}`);
      onProgress?.(100);
      return finalPath;
    }

  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('❌ Failed to save file from URL:', errorMessage, error);
    
    // Provide more helpful error messages
    if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
      throw new Error('No permission to access the selected folder. Please re-select the folder in Settings.');
    } else if (errorMessage.includes('SAF') || errorMessage.includes('content://')) {
      throw new Error('Failed to save to selected folder. Please try selecting a different folder or use the default Downloads location.');
    } else {
      throw new Error(`Failed to download file: ${errorMessage}`);
    }
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

    // Step 2: Export to user-selected path
    if (customDownloadPath) {
      console.log('📤 User selected location, attempting export...');
      try {
        // For SAF paths, we MUST export synchronously and return the exported path
        // For filesystem paths, we can export in background but should still try
        const isSaf = customDownloadPath.startsWith('content://');
        
        if (isSaf) {
          // SAF paths: Export synchronously and return the SAF URI
          // This ensures the file is actually saved to the user's selected location
          const exported = await exportToUserLocation(
            cachePath,
            filename,
            customDownloadPath,
          );
          console.log(`✅ Exported to SAF location: ${exported}`);
          
          // Clean up cache file after successful export
          try {
            if (blobFs) {
              await blobFs.unlink(cachePath);
            } else {
              await RNFS.unlink(cachePath);
            }
            console.log('🗑️ Cleaned up cache file after SAF export');
          } catch (cleanupError) {
            console.warn('Failed to cleanup cache file:', cleanupError);
          }
          
          base64Data = '';
          return exported; // Return the SAF URI, not cache path
        } else {
          // Filesystem paths: Export synchronously to ensure it completes
          const exported = await exportToUserLocation(
            cachePath,
            filename,
            customDownloadPath,
          );
          console.log(`✅ Exported to: ${exported}`);
          
          // Keep cache copy as backup, but return the exported path
          base64Data = '';
          return exported;
        }
      } catch (exportError: any) {
        console.error('❌ Export to user location failed:', exportError);
        const errorMessage = exportError?.message || 'Unknown error';
        
        // If export fails, we still have the cache copy
        // But for SAF paths, this is a critical failure
        if (customDownloadPath.startsWith('content://')) {
          // For SAF, export failure means the file isn't where the user expects
          // Throw error so user knows something went wrong
          throw new Error(
            `Failed to save to selected folder: ${errorMessage}. ` +
            `Please check folder permissions in Settings or try selecting a different folder.`
          );
        } else {
          // For filesystem paths, log warning but keep cache copy
          console.warn('⚠️ Export failed, keeping cache copy:', exportError);
          base64Data = '';
          return cachePath;
        }
      }
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
      // SAF URI - verify permissions first
      if (!(await hasPermission(userPath))) {
        throw new Error('No permission to access SAF directory. Please re-select the folder in settings.');
      }

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

      // Create a subfolder for organized downloads (optional, but recommended)
      let targetDir = userPath;
      try {
        const subfolderUri = `${userPath}/YTDownloader`;
        await mkdir(subfolderUri);
        targetDir = subfolderUri;
        console.log(`📁 Created/verified YTDownloader subfolder in SAF tree`);
      } catch (mkdirError) {
        // Subfolder might already exist, or mkdir might not be needed
        console.log('Subfolder creation result:', mkdirError);
        // Continue with root tree directory
      }

      // Let react-native-saf-x create the file in the tree directory
      // Pass the directory URI + filename, and let the library handle the document URI conversion
      const filePathInTree = `${targetDir}/${encodeURIComponent(filename)}`;
      console.log(`📝 Creating SAF file in tree: ${targetDir} name: ${filename}`);

      // Check if file exists and delete it first
      try {
        if (await exists(filePathInTree)) {
          console.log('🗑️ Deleting existing file in SAF target');
          await unlink(filePathInTree);
        }
      } catch (checkError) {
        // File might not exist, which is fine
        console.log('File existence check result:', checkError);
      }

      // createFile expects a URI path - it will create the file and return a document URI
      const doc = await createFile(filePathInTree, { mimeType: docMime });
      const targetUri = doc?.uri;
      
      if (!targetUri) {
        throw new Error('Failed to create file in SAF folder. Please check folder permissions.');
      }

      console.log(`📤 Writing file to SAF location: ${targetUri}`);

      // Read source file and write to SAF location
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
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('❌ Export to user location failed:', errorMessage, error);
    
    // Provide more helpful error messages
    if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
      throw new Error('No permission to access the selected folder. Please re-select the folder in Settings.');
    } else if (errorMessage.includes('SAF') || errorMessage.includes('content://')) {
      throw new Error('Failed to save to selected folder. Please try selecting a different folder or use the default Downloads location.');
    } else {
      throw new Error(`Failed to save file: ${errorMessage}`);
    }
  }
}
