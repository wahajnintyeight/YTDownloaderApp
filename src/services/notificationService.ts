import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

class NotificationService {
  private channelId: string = 'downloads';
  private initialized: boolean = false;
  // Handlers per download id
  private handlers: Map<string, { retry?: () => void; cancel?: () => void; open?: () => void }> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Request permissions (required for iOS 13+, recommended for Android 13+)
      await notifee.requestPermission();
      
      // Create notification channel (required for Android 8+)
      await notifee.createChannel({
        id: this.channelId,
        name: 'Downloads',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
        vibration: true,
      });
      
      this.initialized = true;
      // Listen for action presses (foreground). For background handling, set a headless task in app entry.
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          const actionId = detail.pressAction?.id ?? '';
          const notificationId = detail.notification?.id ?? '';
          const handler = this.handlers.get(notificationId);
          if (actionId.startsWith('retry') && handler?.retry) handler.retry();
          if (actionId.startsWith('cancel') && handler?.cancel) handler.cancel();
          if (actionId.startsWith('open') && handler?.open) handler.open();
        }
      });
      console.log('✅ Notifee initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Notifee:', error);
    }
  }

  async showDownloadProgress(
    id: string,
    title: string,
    progress: number, // 0-100
    body: string = 'Downloading...',
    onCancel?: () => void
  ) {
    if (!this.initialized) {
      console.warn('⚠️ Notifee not initialized yet, skipping notification');
      return;
    }

    try {
      await notifee.displayNotification({
        id,
        title,
        body: `${body} (${progress}%)`,
        android: {
          channelId: this.channelId,
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          progress: {
            max: 100,
            current: progress,
            indeterminate: false,
          },
          ongoing: true,
          onlyAlertOnce: true,
          pressAction: {
            id: `open:${id}`,
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Cancel',
              pressAction: {
                id: `cancel:${id}`,
                launchActivity: 'default',
              },
            },
          ],
        },
      });
      // Register cancel handler
      if (onCancel) this.handlers.set(id, { ...(this.handlers.get(id) ?? {}), cancel: onCancel });
    } catch (error) {
      console.error('❌ Failed to show download progress notification:', error);
    }
  }

  async showDownloadComplete(
    id: string,
    title: string,
    body: string = 'Download complete',
    onOpen?: () => void,
    onRetry?: () => void
  ) {
    if (!this.initialized) {
      console.warn('⚠️ Notifee not initialized yet, skipping notification');
      return;
    }

    try {
      const completedAt = new Date();
      const timeStr = completedAt.toLocaleString();
      await notifee.displayNotification({
        id,
        title,
        body: `${body} • ${timeStr}`,
        android: {
          channelId: this.channelId,
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          ongoing: false,
          pressAction: {
            id: `open:${id}`,
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Open',
              pressAction: { id: `open:${id}`, launchActivity: 'default' },
            },
            {
              title: 'Retry',
              pressAction: { id: `retry:${id}`, launchActivity: 'default' },
            },
          ],
        },
      });
      // Register handlers
      const existing = this.handlers.get(id) ?? {};
      this.handlers.set(id, { ...existing, open: onOpen, retry: onRetry });
    } catch (error) {
      console.error('❌ Failed to show download complete notification:', error);
    }
  }

  async showDownloadError(
    id: string,
    title: string,
    body: string = 'Download failed',
    onRetry?: () => void
  ) {
    if (!this.initialized) {
      console.warn('⚠️ Notifee not initialized yet, skipping notification');
      return;
    }

    try {
      await notifee.displayNotification({
        id,
        title,
        body,
        android: {
          channelId: this.channelId,
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          ongoing: false,
          pressAction: {
            id: `open:${id}`,
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'Retry',
              pressAction: { id: `retry:${id}`, launchActivity: 'default' },
            },
          ],
        },
      });
      if (onRetry) this.handlers.set(id, { ...(this.handlers.get(id) ?? {}), retry: onRetry });
    } catch (error) {
      console.error('❌ Failed to show download error notification:', error);
    }
  }

  async cancelNotification(id: string) {
    await notifee.cancelNotification(id);
    this.handlers.delete(id);
  }
}

export const notificationService = new NotificationService();
