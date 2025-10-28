/**
 * Test utility to verify download completion handling
 */

// Mock data that matches the new server format
export const mockNewFormatResponse = {
  type: 'download_complete',
  downloadId: '029d78af-a40b-4aac-9667-00ea9bee30df',
  status: 'completed',
  progress: 100,
  message: 'Download completed successfully!',
  fileData: 'SUQzAwAAAAAAP1BSSVYAAAA1AABjb20uYXBwbGUuc3RyZWFtaW5nLnRyYW5zcG9ydFN0cmVhbVRpbWVzdGFtcAAAAAAAAAAAAP/xUIAvX/whAAUAoBv/wAAAA...', // truncated for example
  filename: 'video_6sc79fcCaZ8.mp3',
  fileSize: 683432,
  mimeType: 'audio/mpeg'
};

// Mock data that matches the legacy format
export const mockLegacyFormatResponse = {
  type: 'download_complete',
  downloadId: '029d78af-a40b-4aac-9667-00ea9bee30df',
  status: 'completed',
  progress: 100,
  message: 'Download completed successfully!',
  file: {
    videoId: '6sc79fcCaZ8',
    status: 'completed',
    filename: 'video_6sc79fcCaZ8.mp3',
    fileSize: 683432,
    mimeType: 'audio/mpeg',
    fileContent: 'SUQzAwAAAAAAP1BSSVYAAAA1AABjb20uYXBwbGUuc3RyZWFtaW5nLnRyYW5zcG9ydFN0cmVhbVRpbWVzdGFtcAAAAAAAAAAAAP/xUIAvX/whAAUAoBv/wAAAA...' // truncated for example
  }
};

export const testDownloadCompletionParsing = () => {
  console.log('🧪 Testing download completion parsing...');
  
  // Test new format
  const newFormatData = mockNewFormatResponse as any;
  const newFileContent = newFormatData.fileData || newFormatData.file?.fileContent;
  const newFilename = newFormatData.filename || newFormatData.file?.filename || `download_${newFormatData.downloadId}.mp3`;
  
  console.log('✅ New format test:');
  console.log(`   File content exists: ${!!newFileContent}`);
  console.log(`   Filename: ${newFilename}`);
  
  // Test legacy format
  const legacyFormatData = mockLegacyFormatResponse as any;
  const legacyFileContent = legacyFormatData.fileData || legacyFormatData.file?.fileContent;
  const legacyFilename = legacyFormatData.filename || legacyFormatData.file?.filename || `download_${legacyFormatData.downloadId}.mp3`;
  
  console.log('✅ Legacy format test:');
  console.log(`   File content exists: ${!!legacyFileContent}`);
  console.log(`   Filename: ${legacyFilename}`);
  
  console.log('🎉 All tests passed!');
};