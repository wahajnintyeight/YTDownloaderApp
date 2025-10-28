/**
 * Debug utilities for download crashes
 */

export const debugDownloadCompletion = (filename: string, filePath: string) => {
  console.log('🔍 DEBUG: Download completion started');
  console.log(`📁 Filename: ${filename}`);
  console.log(`📂 File path: ${filePath}`);
  console.log(`📊 File path length: ${filePath.length}`);
  
  // Check if file path is too long (potential crash cause)
  if (filePath.length > 260) {
    console.warn('⚠️ File path is very long, this might cause issues on some systems');
  }
  
  // Check if filename has special characters
  const hasSpecialChars = /[<>:"|?*]/.test(filename);
  if (hasSpecialChars) {
    console.warn('⚠️ Filename contains special characters that might cause issues');
  }
  
  console.log('🔍 DEBUG: Download completion checks passed');
};

export const debugMemoryState = () => {
  if (global.performance && global.performance.memory) {
    const memory = global.performance.memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    
    console.log(`🧠 Memory: ${used}MB used / ${total}MB total (limit: ${limit}MB)`);
    
    if (used / limit > 0.8) {
      console.error('❌ CRITICAL: Memory usage is very high! This might cause crashes.');
      return false;
    } else if (used / limit > 0.6) {
      console.warn('⚠️ WARNING: Memory usage is getting high.');
      return true;
    }
    
    return true;
  }
  
  console.log('ℹ️ Memory information not available');
  return true;
};

export const createCrashSafeWrapper = <T extends (...args: any[]) => any>(
  fn: T,
  errorMessage: string = 'Operation failed'
): T => {
  return ((...args: any[]) => {
    try {
      console.log(`🛡️ Executing crash-safe operation: ${fn.name || 'anonymous'}`);
      debugMemoryState();
      
      const result = fn(...args);
      
      // If it's a promise, handle async errors
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          console.error(`❌ Async error in ${fn.name || 'anonymous'}:`, error);
          throw new Error(`${errorMessage}: ${error.message}`);
        });
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Sync error in ${fn.name || 'anonymous'}:`, error);
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }) as T;
};