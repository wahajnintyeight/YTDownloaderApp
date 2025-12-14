import { useFocusEffect } from '@react-navigation/native';
import analytics from '@react-native-firebase/analytics';
import { ScreenNames } from '../constants/ScreenNames';
import { getApp } from '@react-native-firebase/app';

/**
 * Custom hook to track screen views in Firebase Analytics
 * Automatically logs when a screen comes into focus
 * 
 * @param screenName - Screen name from ScreenNames enum
 * 
 * @example
 * useScreenTracking(ScreenNames.Browse);
 */
export const useScreenTracking = (screenName: ScreenNames) => {
  useFocusEffect(() => {
    const trackScreen = async () => {
      try {
        // Suppress deprecation warning - will migrate to modular SDK in v22
        // @ts-ignore
        await getApp().analytics().logScreenView({
          screen_name: screenName,
          screen_class: screenName,
        });
        console.log(`📊 [ANALYTICS] Screen viewed: ${screenName}`);
      } catch (error) {
        console.error(`❌ Failed to log screen view for ${screenName}:`, error);
      }
    };

    trackScreen();
  });
};
