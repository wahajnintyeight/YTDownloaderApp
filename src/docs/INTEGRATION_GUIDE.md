# Download Manager Integration Guide

This guide explains how to integrate the complete download management system into your app, including local storage for download lists, user location preferences, and the settings icon.

## Architecture Overview

The system follows the DRY (Don't Repeat Yourself) principle with a centralized hook-based architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ DownloadsScreen  │  │ DownloadSettings │                 │
│  │                  │  │ Icon/Modal       │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
└───────────┼────────���─────────────┼──────────────────────────┘
            │                      │
            └──────────┬───────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│         useDownloadManager Hook (DRY Layer)                 │
│  • Manages download list state                              │
│  • Manages download path state                              │
│  • Coordinates storage operations                           │
│  • Provides unified API to components                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────┐  ┌──────▼──────┐  ┌──▼──────────┐
│ Storage    │  │ Download    │  │ RNFS        │
│ Service    │  │ Service     │  │ (File I/O)  │
│            │  │             │  │             │
│ • Get/Set  │  │ • Download  │  │ • Read/Write│
│   Path     │  │ • Save      │  │ • Mkdir     │
│ • Get/Add  │  │ • Progress  │  │ • Stat      │
│   Videos   │  │ • Complete  │  │             │
└────────────┘  └─────────────┘  └─────────────┘
```

## Components

### 1. `useDownloadManager` Hook
**Location:** `src/hooks/useDownloadManager.ts`

Centralized state management for all download-related operations.

**Features:**
- Loads download list from storage on mount
- Loads user's preferred download path on mount
- Provides methods to update/reset download path
- Provides methods to manage downloaded videos list
- Handles all storage interactions

**Usage:**
```tsx
const {
  downloadedVideos,      // Array of downloaded videos
  loadingVideos,         // Loading state for videos
  downloadPath,          // Current download path
  loadingPath,           // Loading state for path
  refreshDownloadList,   // Refresh videos from storage
  removeDownloadedVideo, // Remove video from list
  updateDownloadPath,    // Update download path
  resetDownloadPath,     // Reset to default path
  getDefaultDownloadPath,// Get default path
} = useDownloadManager();
```

### 2. `DownloadSettingsModal` Component
**Location:** `src/components/DownloadSettingsModal.tsx`

Modal for managing download settings.

**Features:**
- Display current download location
- Change download location (Android SAF picker)
- Reset to default location
- Shows helpful information

**Usage:**
```tsx
import { DownloadSettingsModal } from '../components/DownloadSettingsModal';

<DownloadSettingsModal visible={isVisible} onClose={handleClose} />
```

### 3. `DownloadSettingsIcon` Component
**Location:** `src/components/DownloadSettingsIcon.tsx`

Settings icon button that opens the modal.

**Features:**
- Customizable size and color
- Integrates with DownloadSettingsModal
- Easy to place in headers/navigation

**Usage:**
```tsx
import { DownloadSettingsIcon } from '../components/DownloadSettingsIcon';

<DownloadSettingsIcon size={24} color="#333" />
```

### 4. `DownloadedVideosList` Component
**Location:** `src/components/DownloadedVideosList.tsx`

Displays list of downloaded videos with management options.

**Features:**
- Shows all downloaded videos
- Pull-to-refresh functionality
- Remove videos from list
- Tap to open/play video
- Empty state handling
- Loading state handling

**Usage:**
```tsx
import { DownloadedVideosList } from '../components/DownloadedVideosList';

<DownloadedVideosList 
  onVideoPress={(video) => {
    // Handle video tap
  }}
/>
```

### 5. `DownloadsScreen` Screen
**Location:** `src/screens/DownloadsScreen.tsx`

Complete downloads screen with all components integrated.

**Features:**
- Header with title and settings icon
- Downloads list
- Fully functional download management

**Usage:**
```tsx
import { DownloadsScreen } from '../screens/DownloadsScreen';

// In your navigation
<Stack.Screen name="Downloads" component={DownloadsScreen} />
```

## Storage Services

### `storageService`
**Location:** `src/services/storageService.ts`

Handles all AsyncStorage operations.

**Methods:**
```tsx
// Download path management
getDownloadPath(): Promise<string | null>
setDownloadPath(path: string): Promise<void>
clearDownloadPath(): Promise<void>

// Downloaded videos management
getDownloadedVideos(): Promise<DownloadedVideo[]>
addDownloadedVideo(video: DownloadedVideo): Promise<void>
removeDownloadedVideo(id: string): Promise<void>
```

### `downloadService`
**Location:** `src/services/downloadService.ts`

Handles video downloads and file operations.

**Key Features:**
- Automatically loads user's preferred download path on init
- Saves files to user's chosen location with backend-provided filename
- Automatically adds completed downloads to storage
- No per-download file picker prompts

## Integration Steps

### Step 1: Add to Your Navigation
```tsx
import { DownloadsScreen } from './screens/DownloadsScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Downloads" 
        component={DownloadsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
```

### Step 2: Use in Your Download Flow
```tsx
import { downloadService } from './services/downloadService';

// When user initiates download
const downloadId = await downloadService.downloadVideo(
  {
    videoId: 'abc123',
    format: 'mp3',
  },
  (progress) => {
    // Update progress UI
    setProgress(progress);
  },
  (filePath, filename) => {
    // Download complete - file is already saved and in storage
    console.log('Downloaded to:', filePath);
  },
  (error) => {
    // Handle error
    console.error('Download failed:', error);
  },
);
```

### Step 3: Access Download Manager in Any Component
```tsx
import { useDownloadManager } from './hooks/useDownloadManager';

function MyComponent() {
  const {
    downloadedVideos,
    downloadPath,
    refreshDownloadList,
  } = useDownloadManager();

  return (
    <View>
      <Text>Downloads: {downloadedVideos.length}</Text>
      <Text>Location: {downloadPath}</Text>
    </View>
  );
}
```

## Data Flow

### Download Completion Flow
```
1. Backend sends download_complete event via SSE
2. downloadService receives event with:
   - downloadUrl (presigned S3 URL)
   - filename (with extension)
   - format, mimeType, etc.

3. downloadService.saveFromUrl():
   - Fetches file from URL
   - Saves to user's preferred location
   - Uses backend-provided filename

4. downloadService creates DownloadedVideo object:
   - id, videoId, title, format
   - filePath, filename, downloadedAt

5. storageService.addDownloadedVideo():
   - Saves to AsyncStorage
   - Updates local state

6. useDownloadManager hook:
   - Detects storage change
   - Updates downloadedVideos state
   - UI components re-render
```

### Settings Update Flow
```
1. User taps settings icon
2. DownloadSettingsIcon opens DownloadSettingsModal
3. User selects new directory (Android SAF)
4. Modal calls useDownloadManager.updateDownloadPath()
5. Hook calls storageService.setDownloadPath()
6. Hook calls downloadService.setDownloadPath()
7. State updates, UI reflects new path
8. Future downloads use new path
```

## Storage Schema

### AsyncStorage Keys

**Download Path:**
```
Key: 'download_path'
Value: '/storage/emulated/0/Documents/MyDownloads' (or null for default)
```

**Downloaded Videos:**
```
Key: 'downloaded_videos'
Value: [
  {
    id: 'local-id-123',
    videoId: 'youtube-id',
    title: 'Song Title.mp3',
    format: 'mp3',
    filePath: '/storage/emulated/0/Documents/MyDownloads/Song Title.mp3',
    filename: 'Song Title.mp3',
    downloadedAt: 1699564800000,
    thumbnailUrl: 'https://...'
  },
  ...
]
```

## Best Practices

1. **Always use the hook**: Don't access storage directly; use `useDownloadManager`
2. **Handle loading states**: Show spinners while loading
3. **Refresh on mount**: Call `refreshDownloadList()` when screen becomes visible
4. **Error handling**: Always wrap storage operations in try-catch
5. **User feedback**: Show alerts for important operations
6. **Memory management**: Clear large objects after use

## Troubleshooting

### Downloads not appearing in list
- Check if `refreshDownloadList()` is being called
- Verify storage permissions are granted
- Check AsyncStorage for 'downloaded_videos' key

### Download path not persisting
- Verify `storageService.setDownloadPath()` is called
- Check AsyncStorage for 'download_path' key
- Ensure `downloadService.setDownloadPath()` is also called

### Files not saving to correct location
- Verify `downloadService.customDownloadPath` is set
- Check file system permissions
- Ensure directory exists before saving

## Performance Considerations

- Download list is loaded once on app start
- Subsequent updates are incremental
- Storage operations are async to prevent blocking UI
- Large file downloads use chunked writes
- Memory is cleared after file operations

## Future Enhancements

- [ ] Batch operations (delete multiple downloads)
- [ ] Search/filter downloads
- [ ] Sort options (date, name, size)
- [ ] Download statistics
- [ ] Cloud sync support
- [ ] Download scheduling
