import React, { useEffect } from 'react';
import { LogBox, AppState, AppStateStatus } from 'react-native';
import { AppNavigator } from './navigation';
import { downloadService } from './services';

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
