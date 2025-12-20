# Chunk Assembly Fix - Base64 Decoding Issue

## Problem Identified
The base64 decoding was failing with "bad base-64" error due to two issues:
1. **Whitespace contamination**: Assembled chunks contained whitespace characters (newlines, spaces, tabs)
2. **Premature decoding**: Attempting to decode base64 in JavaScript before passing to native file writer

## Root Cause
The issue was caused by:
1. **Server-side**: JSON serialization adding newlines to long base64 strings
2. **Client-side**: Not sanitizing chunk data before storage
3. **Assembly**: Attempting to decode base64 in JavaScript (Buffer.from) instead of letting RNFS handle it natively
4. **Invalid characters**: Some non-base64 characters slipping through

## Client-Side Fixes Applied

### 1. Chunk Storage Sanitization
```typescript
private addChunk(downloadId: string, chunkIndex: number, chunkData: string): number {
  // Sanitize chunk data: remove all whitespace
  const sanitized = chunkData.replace(/\s/g, '');
  chunks[chunkIndex] = sanitized;
  // ...
}
```

### 2. Base64 Normalization Enhancement
```typescript
private normalizeBase64(input: string): string {
  // Remove all whitespace (newlines, spaces, tabs, etc.)
  let s = input.replace(/\s/g, '');
  // Convert base64url to standard
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  const padding = (4 - (s.length % 4)) % 4;
  if (padding) s = s + '='.repeat(padding);
  return s;
}
```

### 3. Assembly Validation
```typescript
private async assembleChunks(...) {
  // Verify chunk integrity
  for (let i = 0; i < chunks.length; i++) {
    if (!chunks[i]) {
      throw new Error(`Missing chunk at index ${i}`);
    }
  }

  const fullBase64 = this.normalizeBase64(chunks.join(''));
  
  // Debug logging
  if (__DEV__) {
    console.log(`📏 Assembled base64 length: ${fullBase64.length}`);
    console.log(`🔍 Length % 4: ${fullBase64.length % 4}`);
    console.log(`🔍 Has whitespace: ${/\s/.test(fullBase64)}`);
    console.log(`🔍 Last 40 chars: ${fullBase64.slice(-40)}`);
  }
  
  // Validate before decoding
  if (fullBase64.length % 4 !== 0) {
    throw new Error(`Invalid base64 length: ${fullBase64.length}`);
  }
  // ...
}
```

## Server-Side Recommendations

If you have access to the server code, add these validations:

### 1. Chunk Streaming Validation
```go
func (sse *SSEService) streamFileChunks(routeKey, downloadId, filePath, filename string, totalSize int64) {
    const chunkSize = 64 * 1024
    file, err := os.Open(filePath)
    if err != nil {
        log.Printf("❌ Failed to open file: %v", err)
        return
    }
    defer file.Close()

    totalChunks := (totalSize + chunkSize - 1) / chunkSize
    log.Printf("📦 Streaming %d bytes in %d chunks", totalSize, totalChunks)

    buffer := make([]byte, chunkSize)
    chunkIndex := 0

    for {
        n, err := file.Read(buffer)
        if n == 0 || err == io.EOF {
            break
        }
        if err != nil {
            log.Printf("❌ Read error: %v", err)
            return
        }

        chunkData := base64.StdEncoding.EncodeToString(buffer[:n])
        
        // Validation logging
        log.Printf("📦 Chunk %d: raw=%d bytes, b64=%d chars", chunkIndex, n, len(chunkData))

        sse.sseHandler.BroadcastToRoute(routeKey, map[string]interface{}{
            "downloadId":  downloadId,
            "type":        "file_chunk",
            "chunkIndex":  chunkIndex,
            "totalChunks": int(totalChunks),
            "chunkData":   chunkData,
            "rawSize":     n,
            "b64Size":     len(chunkData),
        })
        chunkIndex++
    }

    log.Printf("✅ Streamed %d chunks", chunkIndex)
}
```

### 2. Filename Sanitization
Ensure `videoTitle` is sanitized before sending:
```go
func sanitizeFilename(name string) string {
    // Remove newlines, tabs, and other control characters
    cleaned := strings.Map(func(r rune) rune {
        if r == '\n' || r == '\r' || r == '\t' {
            return -1
        }
        return r
    }, name)
    return strings.TrimSpace(cleaned)
}
```

## Testing Checklist

- [ ] Download a file and check logs for "Has whitespace: false"
- [ ] Verify "Length % 4: 0" in logs
- [ ] Confirm file saves successfully
- [ ] Test with large files (>10MB)
- [ ] Test with special characters in filename
- [ ] Verify no crashes during assembly

## Expected Behavior

After these fixes:
1. All whitespace is stripped from chunks during storage
2. Base64 normalization removes any remaining whitespace
3. Assembly validates chunk integrity before decoding
4. Detailed debug logs help identify any remaining issues
5. Clear error messages if validation fails

## Debug Output Example

```
🔧 Assembling chunks for abc123...
📦 Received: 150/150
📏 Assembled base64 length: 9830400
🔍 Length % 4: 0
🔍 Has whitespace: false
🔍 Last 40 chars: xYzAbC123...==
📊 Decoded size: 7.35 MB
✅ File saved: /storage/emulated/0/Download/YTDownloader/song.mp3
```

## Next Steps

1. Test the download with the client-side fixes
2. Monitor the debug logs for any whitespace detection
3. If issues persist, check server-side JSON serialization
4. Consider adding chunk checksums for additional validation
