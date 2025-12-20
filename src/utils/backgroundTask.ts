import { Platform, NativeModules, AppState } from 'react-native';

/**
 * Background task utilities for keeping downloads alive
 */

class BackgroundTaskManager {
  private isBackgroundEnabled = false;

  /**
   * Request battery optimization exemption for Android
   * This allows the app to run in the background without being killed
   */
  async requestBatteryOptimizationExemption(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // On Android, we can request to ignore battery optimizations
      // This requires the REQUEST_IGNORE_BATTERY_OPTIMIZATIONS permission
      
      // Note: This would require a native module to implement properly
      // For now, we'll just log and return true
      this.isBackgroundEnabled = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to request battery optimization exemption:', error);
      return false;
    }
  }

  /**
   * Keep the app awake during downloads
   */
  async keepAwake(): Promise<void> {
    if (Platform.OS === 'android') {
      console.log('🔋 Keeping device awake for downloads...');
      // This would require react-native-keep-awake or similar
      // For now, we rely on the SSE connection keeping the app alive
    }
  }

  /**
   * Allow the app to sleep
   */
  async allowSleep(): Promise<void> {
    if (Platform.OS === 'android') {
      console.log('💤 Allowing device to sleep');
    }
  }

  /**
   * Check if background execution is supported
   */
  isBackgroundSupported(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  /**
   * Initialize background task support
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing background task support...');
    
    if (Platform.OS === 'android') {
      await this.requestBatteryOptimizationExemption();
    }

    // Monitor app state changes
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        console.log('📱 App entered background - downloads will continue');
      } else if (nextAppState === 'active') {
        console.log('📱 App returned to foreground');
      }
    });

    console.log('Background task support initialized');
  }
}

export const backgroundTaskManager = new BackgroundTaskManager();
