/**
 * ConvertYT Go - Convert YouTube videos, your way
 * Modern video downloader built with React Native and TypeScript
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/hooks/useTheme';
import { DownloadProvider } from './src/hooks/useDownloads';
import { DialogProvider } from './src/contexts/DialogContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { logger } from './src/utils/logger';
import { downloadService, analyticsService } from './src/services';
import { backgroundTaskManager } from './src/utils/backgroundTask';
import Bugsnag from "@bugsnag/react-native";

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

  logger.info('📱 Console logging enabled');
}

function App(): React.JSX.Element {
  useEffect(() => {
    logger.info('✅ App mounted successfully');
    Bugsnag.notify(new Error('Test error'))
    // Initialize Firebase Analytics
    analyticsService.initialize().catch(error => {
      logger.error('Failed to initialize Firebase Analytics:', error);
    });
    
    // Initialize background task support
    backgroundTaskManager.initialize().catch(error => {
      logger.error('Failed to initialize background tasks:', error);
    });
    
    return () => {
      logger.info('👋 App unmounting');
      // Ensure all active SSE connections are closed
      downloadService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <DialogProvider>
            <DownloadProvider>
              <AppNavigator />
            </DownloadProvider>
          </DialogProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
