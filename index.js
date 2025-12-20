import Bugsnag from "@bugsnag/react-native";
import BugsnagPerformance from "@bugsnag/react-native-performance";
BugsnagPerformance.start({
  apiKey: 'b6e420a2f8a726d1e44f2adb99fde9fe',
  enabledBreadcrumbTypes: [
    "state",
    "request",
    "process",
    "log",
    "navigation",
    "user",
  ]
})

import 'react-native-reanimated';
/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { clientDownloadQueue } from './src/services/download/queueManager';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const actionId = detail?.pressAction?.id || '';
  const notificationId = detail?.notification?.id || '';
  if (type === EventType.ACTION_PRESS) {
    if (actionId.startsWith('cancel:')) {
      try {
        await notifee.cancelNotification(notificationId);
      } catch { }
      try {
        if (notificationId) {
          clientDownloadQueue.cancelDownload(notificationId);
        }
      } catch { }
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
