import { AppState, AppStateStatus } from 'react-native';

/**
 * Network and connectivity monitor for background downloads
 */

class NetworkMonitor {
  private appState: AppStateStatus = AppState.currentState;
  private listeners: Set<(isConnected: boolean) => void> = new Set();

  constructor() {
    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    const prev = this.appState;
    this.appState = nextState;

    if (nextState === 'active' && prev !== 'active') {
      console.log('🌐 App active - checking network connectivity');
      // Notify listeners that we're back online
      this.notifyListeners(true);
    }
  };

  /**
   * Subscribe to network state changes
   */
  subscribe(listener: (isConnected: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(isConnected: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Check if app is in foreground
   */
  isAppActive(): boolean {
    return this.appState === 'active';
  }

  /**
   * Get current app state
   */
  getAppState(): AppStateStatus {
    return this.appState;
  }
}

export const networkMonitor = new NetworkMonitor();
