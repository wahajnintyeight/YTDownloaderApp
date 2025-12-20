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
import * as Sentry from '@sentry/react-native';
import envConfigs from './src/config/env';

Sentry.init({
  dsn: 'https://afe0e2c8517edc4e11e2de81bf48ab3a@o4507803860205568.ingest.de.sentry.io/4510568042201168',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,
  tracesSampleRate: 1.0,
  environment: envConfigs.ENVIRONMENT,
  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(App);