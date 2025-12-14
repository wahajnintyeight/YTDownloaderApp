/**
 * Firebase Analytics Service
 * 
 * Provides analytics tracking for the app including:
 * - Automatic event tracking (app opens, screen views)
 * - Custom event tracking (downloads, user actions)
 * - User property tracking
 * - Conversion tracking
 */

import analytics from '@react-native-firebase/analytics';
import { logger } from '../utils/logger';

class AnalyticsService {
  private initialized: boolean = false;

  /**
   * Initialize Firebase Analytics
   * Should be called once when app starts
   */
  async initialize(): Promise<void> {
    try {
      // Enable analytics collection (disabled by default in some regions)
      await analytics().setAnalyticsCollectionEnabled(true);
      
      this.initialized = true;
      logger.info('✅ Firebase Analytics initialized');
      
      // Log app open event
      await this.logAppOpen();
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase Analytics:', error);
      this.initialized = false;
    }
  }

  /**
   * Log app open event
   */
  private async logAppOpen(): Promise<void> {
    try {
      await analytics().logEvent('app_open', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log app_open event:', error);
    }
  }

  /**
   * Log screen view
   * @param screenName - Name of the screen
   * @param screenClass - Class of the screen (optional)
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      logger.debug(`📊 Screen view logged: ${screenName}`);
    } catch (error) {
      logger.error(`Failed to log screen view: ${screenName}`, error);
    }
  }

  /**
   * Log video download event
   * @param videoId - YouTube video ID
   * @param format - Download format (mp4, mp3, etc.)
   * @param quality - Video quality (if applicable)
   */
  async logVideoDownload(videoId: string, format: string, quality?: string): Promise<void> {
    try {
      await analytics().logEvent('video_download', {
        video_id: videoId,
        format: format,
        quality: quality || 'unknown',
        timestamp: new Date().toISOString(),
      });
      logger.debug(`📊 Video download logged: ${videoId} (${format})`);
    } catch (error) {
      logger.error('Failed to log video download:', error);
    }
  }

  /**
   * Log download started event
   * @param videoId - YouTube video ID
   */
  async logDownloadStarted(videoId: string): Promise<void> {
    try {
      await analytics().logEvent('download_started', {
        video_id: videoId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log download started:', error);
    }
  }

  /**
   * Log download completed event
   * @param videoId - YouTube video ID
   * @param duration - Download duration in seconds
   * @param fileSize - File size in bytes
   */
  async logDownloadCompleted(
    videoId: string,
    duration: number,
    fileSize: number
  ): Promise<void> {
    try {
      await analytics().logEvent('download_completed', {
        video_id: videoId,
        duration_seconds: duration,
        file_size_bytes: fileSize,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log download completed:', error);
    }
  }

  /**
   * Log download failed event
   * @param videoId - YouTube video ID
   * @param error - Error message
   */
  async logDownloadFailed(videoId: string, error: string): Promise<void> {
    try {
      await analytics().logEvent('download_failed', {
        video_id: videoId,
        error_message: error,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log download failed:', error);
    }
  }

  /**
   * Log search event
   * @param searchTerm - Search query
   */
  async logSearch(searchTerm: string): Promise<void> {
    try {
      await analytics().logEvent('search', {
        search_term: searchTerm,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log search:', error);
    }
  }

  /**
   * Log ad view event (for when AdMob is integrated)
   * @param adType - Type of ad (banner, rewarded, interstitial)
   * @param adUnitId - Ad unit ID
   */
  async logAdView(adType: 'banner' | 'rewarded' | 'interstitial', adUnitId: string): Promise<void> {
    try {
      await analytics().logEvent('ad_view', {
        ad_type: adType,
        ad_unit_id: adUnitId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log ad view:', error);
    }
  }

  /**
   * Log rewarded ad completed event
   * @param rewardType - Type of reward
   * @param rewardAmount - Amount of reward
   */
  async logRewardedAdCompleted(rewardType: string, rewardAmount: number): Promise<void> {
    try {
      await analytics().logEvent('rewarded_ad_completed', {
        reward_type: rewardType,
        reward_amount: rewardAmount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log rewarded ad completed:', error);
    }
  }

  /**
   * Set user property
   * @param name - Property name
   * @param value - Property value
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await analytics().setUserProperty(name, value);
      logger.debug(`📊 User property set: ${name} = ${value}`);
    } catch (error) {
      logger.error(`Failed to set user property: ${name}`, error);
    }
  }

  /**
   * Set user ID (for user tracking)
   * @param userId - User identifier
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await analytics().setUserId(userId);
      logger.debug(`📊 User ID set: ${userId || 'null'}`);
    } catch (error) {
      logger.error('Failed to set user ID:', error);
    }
  }

  /**
   * Log custom event
   * @param eventName - Name of the event
   * @param parameters - Event parameters (optional)
   */
  async logEvent(eventName: string, parameters?: { [key: string]: any }): Promise<void> {
    try {
      await analytics().logEvent(eventName, parameters || {});
      logger.debug(`📊 Custom event logged: ${eventName}`, parameters);
    } catch (error) {
      logger.error(`Failed to log event: ${eventName}`, error);
    }
  }

  /**
   * Reset analytics data (useful for testing)
   */
  async resetAnalyticsData(): Promise<void> {
    try {
      await analytics().resetAnalyticsData();
      logger.info('📊 Analytics data reset');
    } catch (error) {
      logger.error('Failed to reset analytics data:', error);
    }
  }

  /**
   * Check if analytics is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Enable/disable analytics collection
   * @param enabled - Whether to enable analytics
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(enabled);
      logger.info(`📊 Analytics collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Failed to set analytics collection enabled:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

