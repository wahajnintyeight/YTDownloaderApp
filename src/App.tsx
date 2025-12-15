import React, { useEffect } from 'react';
import { LogBox, AppState, AppStateStatus } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { AppNavigator } from './navigation';
import { downloadService } from './services';
import { isAdsEnabled } from './config/adsConfig';

// Suppress known warnings
LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
  'Non-serializable values were found in the navigation state',
]);

/**
 * Main App Component
 * DRY principle: Centralized app initialization and lifecycle management
 */
const App: React.FC = () => {
  const appStateRef = React.useRef<AppStateStatus>('active');

  useEffect(() => {
    console.log('✅ App mounted successfully');

    // Initialize Mobile Ads SDK
    if (isAdsEnabled()) {
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('📢 AdMob initialized:', adapterStatuses);
        })
        .catch(error => {
          console.error('❌ AdMob initialization failed:', error);
        });
    } else {
      console.log('📢 AdMob disabled (ADS_ENABLED=false in env config)');
    }

    // Handle app state changes
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      console.log('👋 App unmounting');
      subscription.remove();
      downloadService.cleanup();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appStateRef.current = nextAppState;
    console.log(`📱 App state changed to: ${nextAppState}`);
  };

  return <AppNavigator />;
};

export default App;
