/**
 * Crash prevention utilities for React Native
 */

import { InteractionManager } from 'react-native';

/**
 * Safely execute a callback after interactions are complete
 * This prevents crashes during heavy operations
 */
export const safeExecute = (callback: () => void, delay: number = 0) => {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(callback, delay);
  });
};

/**
 * Safely execute an async callback with error handling
 */
export const safeExecuteAsync = async (
  callback: () => Promise<void>,
  onError?: (error: Error) => void,
  delay: number = 0
) => {
  return new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(async () => {
        try {
          await callback();
          resolve();
        } catch (error) {
          console.error('Safe execution error:', error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
          resolve();
        }
      }, delay);
    });
  });
};

/**
 * Batch state updates to prevent rapid re-renders
 */
export const batchStateUpdate = (callback: () => void) => {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    callback();
  });
};

/**
 * Check if device has enough memory for large operations
 */
export const checkMemoryAvailability = (): boolean => {
  if (global.performance && global.performance.memory) {
    const memory = global.performance.memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    
    // Return false if using more than 80% of available memory
    return (usedMB / limitMB) < 0.8;
  }
  
  // Assume memory is available if we can't check
  return true;
};

/**
 * Safely handle large data operations
 */
export const handleLargeDataOperation = async <T>(
  operation: () => Promise<T>,
  onMemoryWarning?: () => void
): Promise<T> => {
  if (!checkMemoryAvailability()) {
    console.warn('⚠️ Low memory detected, proceeding with caution...');
    onMemoryWarning?.();
  }

  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};