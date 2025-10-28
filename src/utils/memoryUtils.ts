/**
 * Memory management utilities for handling large downloads
 */

export const clearLargeVariables = (...variables: any[]) => {
  variables.forEach(variable => {
    if (variable && typeof variable === 'string') {
      // Clear string references
      variable = '';
    } else if (variable && typeof variable === 'object') {
      // Clear object references
      Object.keys(variable).forEach(key => {
        delete variable[key];
      });
    }
  });
};

export const forceGarbageCollection = () => {
  // Force garbage collection if available (mainly for debugging)
  if (global.gc) {
    console.log('🗑️ Forcing garbage collection...');
    global.gc();
  }
};

export const getMemoryUsage = () => {
  // Get memory usage if available
  if (global.performance && global.performance.memory) {
    const memory = global.performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

export const logMemoryUsage = (context: string) => {
  const usage = getMemoryUsage();
  if (usage) {
    console.log(`📊 Memory Usage (${context}): ${usage.used}MB / ${usage.total}MB (limit: ${usage.limit}MB)`);
  }
};