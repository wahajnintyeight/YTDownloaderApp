/**
 * YouTube Video Downloader App
 * React Native implementation without Expo
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/hooks/useTheme';
import { DownloadProvider } from './src/hooks/useDownloads';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DownloadProvider>
          <AppNavigator />
        </DownloadProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
