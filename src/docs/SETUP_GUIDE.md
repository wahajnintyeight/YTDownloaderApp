# YT Downloader App - Setup Guide

This guide will help you set up the complete YT Downloader application with all the download management features.

## Project Structure

```
src/
├── App.tsx                          # Main app component
├── navigation/
│   ├── index.ts                     # Navigation exports
│   ├── AppNavigator.tsx             # Main navigator
│   └── MainTabNavigator.tsx         # Tab navigator
├── screens/
│   ├── index.ts                     # Screen exports
│   └── DownloadsScreen.tsx          # Downloads screen
├── components/
│   ├── index.ts                     # Component exports
│   ├── DownloadSettingsIcon.tsx     # Settings icon
│   ├── DownloadSettingsModal.tsx    # Settings modal
│   └── DownloadedVideosList.tsx     # Videos list
├── hooks/
│   ├── index.ts                     # Hook exports
│   └── useDownloadManager.ts        # Download manager hook
├── services/
│   ├── index.ts                     # Service exports
│   ├── downloadService.ts           # Download service
│   └── storageService.ts            # Storage service
└── utils/
    ├── memoryUtils.ts               # Memory utilities
    └── downloadDebug.ts             # Debug utilities
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-fs
npm install react-native-saf-x
npm install react-native-sse
npm install buffer
```

### 2. Link Native Modules (if needed)

```bash
npx react-native link
```

### 3. Update index.js

Make sure your `index.js` or `index.ts` imports the App correctly:

```typescript
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

### 4. Verify File Structure

Ensure all files are in place:

```bash
# Check if all index files exist
ls -la src/screens/index.ts
ls -la src/components/index.ts
ls -la src/hooks/index.ts
ls -la src/services/index.ts
ls -la src/navigation/index.ts
```

## DRY Architecture Benefits

### 1. Centralized Exports
All imports use index files, making it easy to refactor:

```typescript
// ✅ Good - Using centralized exports
import { DownloadsScreen } from '../screens';
import { DownloadSettingsIcon } from '../components';
import { useDownloadManager } from '../hooks';
import { downloadService, storageService } from '../services';

// ❌ Avoid - Direct imports
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { DownloadSettingsIcon } from '../components/DownloadSettingsIcon';
```

### 2. Single Hook for All State
All download-related state is managed by one hook:

```typescript
const {
  downloadedVideos,
  downloadPath,
  refreshDownloadList,
  updateDownloadPath,
  // ... all operations
} = useDownloadManager();
```

### 3. Consistent Service Layer
All storage and download operations go through services:

```typescript
// Storage operations
await storageService.getDownloadPath();
await storageService.setDownloadPath(path);
await storageService.getDownloadedVideos();

// Download operations
await downloadService.downloadVideo(options, callbacks);
```

## Usage Examples

### Example 1: Display Downloads Screen

```typescript
import { AppNavigator } from './navigation';

export default function App() {
  return <AppNavigator />;
}
```

### Example 2: Use Download Manager in Component

```typescript
import { useDownloadManager } from '../hooks';

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
      <Button title="Refresh" onPress={refreshDownloadList} />
    </View>
  );
}
```

### Example 3: Initiate Download

```typescript
import { downloadService } from '../services';

async function handleDownload(videoId: string) {
  try {
    const downloadId = await downloadService.downloadVideo(
      {
        videoId,
        format: 'mp3',
      },
      (progress) => {
        console.log(`Progress: ${progress}%`);
      },
      (filePath, filename) => {
        console.log(`Downloaded: ${filename}`);
      },
      (error) => {
        console.error(`Error: ${error}`);
      },
    );
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

## Troubleshooting

### Issue: "Couldn't find a 'component' prop for the screen"

**Solution:** Ensure the component is properly exported from the index file.

```typescript
// ✅ Correct - in src/screens/index.ts
export { DownloadsScreen } from './DownloadsScreen';

// ✅ Correct - in src/screens/DownloadsScreen.tsx
export const DownloadsScreen: React.FC = () => { ... };
```

### Issue: "useDownloadManager is not a function"

**Solution:** Ensure the hook is exported from the index file.

```typescript
// ✅ Correct - in src/hooks/index.ts
export { useDownloadManager } from './useDownloadManager';
```

### Issue: Storage not persisting

**Solution:** Verify AsyncStorage is properly installed and linked.

```bash
npm install @react-native-async-storage/async-storage
npx react-native link @react-native-async-storage/async-storage
```

### Issue: Files not saving to correct location

**Solution:** Check that download path is being set before download starts.

```typescript
// Ensure path is set
const { downloadPath } = useDownloadManager();
console.log('Download path:', downloadPath);
```

## Performance Optimization

### 1. Lazy Load Components

```typescript
import { lazy, Suspense } from 'react';

const DownloadsScreen = lazy(() => 
  import('../screens').then(m => ({ default: m.DownloadsScreen }))
);

// Use with Suspense
<Suspense fallback={<LoadingScreen />}>
  <DownloadsScreen />
</Suspense>
```

### 2. Memoize Components

```typescript
import { memo } from 'react';

export const DownloadedVideosList = memo(({ onVideoPress }) => {
  // Component code
});
```

### 3. Use useCallback for Handlers

```typescript
const handleVideoPress = useCallback((video) => {
  // Handle press
}, []);
```

## Testing

### Test Download Manager Hook

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useDownloadManager } from '../hooks';

test('should load download list on mount', async () => {
  const { result } = renderHook(() => useDownloadManager());

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(result.current.downloadedVideos).toBeDefined();
});
```

### Test Storage Service

```typescript
import { storageService } from '../services';

test('should save and retrieve download path', async () => {
  const testPath = '/test/path';
  
  await storageService.setDownloadPath(testPath);
  const retrieved = await storageService.getDownloadPath();
  
  expect(retrieved).toBe(testPath);
});
```

## Next Steps

1. **Add More Screens**: Create additional screens and add them to the tab navigator
2. **Implement Video Playback**: Add video player functionality
3. **Add Search/Filter**: Implement search and filtering for downloads
4. **Cloud Sync**: Add cloud storage integration
5. **Analytics**: Track download statistics

## Support

For issues or questions, refer to:
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Docs](https://reactnative.dev/)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)
