/**
 * YouTube Video Downloader App
 * React Native implementation without Expo
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/hooks/useTheme';
import { DownloadProvider } from './src/hooks/useDownloads';
import { DialogProvider } from './src/contexts/DialogContext';
import AppNavigator from './src/navigation/AppNavigator';
import { logger } from './src/utils/logger';

// Enable console logs in development
if (__DEV__) {
  // Override console methods to ensure they're visible
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  console.log = (...args) => {
    originalLog('[LOG]', ...args);
  };

  console.warn = (...args) => {
    originalWarn('[WARN]', ...args);
  };

  console.error = (...args) => {
    originalError('[ERROR]', ...args);
  };

  console.info = (...args) => {
    originalInfo('[INFO]', ...args);
  };

  logger.info('🚀 App starting in development mode');
  logger.info('📱 Console logging enabled');
}

function App(): React.JSX.Element {
  useEffect(() => {
    logger.info('✅ App mounted successfully');
    
    return () => {
      logger.info('👋 App unmounting');
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DialogProvider>
          <DownloadProvider>
            <AppNavigator />
          </DownloadProvider>
        </DialogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
