// Download method configuration
export type DownloadMethod = 'sse' | 'direct-stream';

export interface DownloadConfig {
  // Primary download method
  method: DownloadMethod;
  
  // Fallback method if primary fails
  fallbackMethod?: DownloadMethod;
  
  // Auto-switch based on file size (optional)
  autoSwitchThreshold?: number; // MB - switch to direct-stream for files larger than this
  
  // Debug settings
  enableDebugLogs: boolean;
  enableMethodSwitchLogs: boolean;
}

// Default configuration - change this to switch methods globally
export const downloadConfig: DownloadConfig = {
  // 🔧 TOGGLE THIS TO SWITCH METHODS:
  method: 'direct-stream', // Change to 'sse' for basic SSE method
  
  fallbackMethod: 'sse', // Fallback to SSE if direct-stream fails
  autoSwitchThreshold: 50, // Auto-switch to direct-stream for files >50MB
  enableDebugLogs: true,
  enableMethodSwitchLogs: true,
};

// Environment-based overrides (optional)
export const getDownloadConfig = (): DownloadConfig => {
  const config = { ...downloadConfig };
  
  // Override from environment variables if needed
  if (process.env.DOWNLOAD_METHOD) {
    config.method = process.env.DOWNLOAD_METHOD as DownloadMethod;
  }
  
  if (process.env.DOWNLOAD_FALLBACK_METHOD) {
    config.fallbackMethod = process.env.DOWNLOAD_FALLBACK_METHOD as DownloadMethod;
  }
  
  if (process.env.AUTO_SWITCH_THRESHOLD) {
    config.autoSwitchThreshold = parseInt(process.env.AUTO_SWITCH_THRESHOLD, 10);
  }
  
  return config;
};