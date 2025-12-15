/**
 * Environment Configuration
 *
 * Centralized configuration for API endpoints and other environment-specific settings.
 * Update these values based on your deployment environment.
 */

interface EnvConfig {
  API_BASE_URL: string;
  SSE_BASE_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ADS_ENABLED: boolean;
}

// Development configuration (local/testing)
const development: EnvConfig = {
  API_BASE_URL: 'http://192.168.100.10:8881',
  SSE_BASE_URL: 'http://192.168.100.10:8885',
  ENVIRONMENT: 'development',
  ADS_ENABLED: false,
};

// Production configuration
const production: EnvConfig = {
  API_BASE_URL: 'https://api.theprojectphoenix.top',
  SSE_BASE_URL: 'https://sse.theprojectphoenix.top',
  ENVIRONMENT: 'production',
  ADS_ENABLED: false,
};

// Staging configuration (optional)
const staging: EnvConfig = {
  API_BASE_URL: 'https://staging-api.theprojectphoenix.top',
  SSE_BASE_URL: 'https://staging-sse.theprojectphoenix.top',
  ENVIRONMENT: 'staging',
  ADS_ENABLED: true,
};

/**
 * Select the active environment configuration
 *
 * Change this to switch between environments:
 * - 'development' for local testing
 * - 'staging' for staging environment
 * - 'production' for production deployment
 */
const ACTIVE_ENV: 'development' | 'staging' | 'production' = 'production';
// ? 'development'
// : 'production';

// Export the active configuration
const envConfigs = {
  development,
  staging,
  production,
};

export const ENV = envConfigs[ACTIVE_ENV];

// Export individual values for convenience
export const API_BASE_URL = ENV.API_BASE_URL;
export const SSE_BASE_URL = ENV.SSE_BASE_URL;
export const ENVIRONMENT = ENV.ENVIRONMENT;
export const ADS_ENABLED = ENV.ADS_ENABLED;

// Log current environment on app start (only in development)
if (__DEV__) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌍 ENVIRONMENT CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Environment: ${ENVIRONMENT}`);
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log(`📡 SSE Base URL: ${SSE_BASE_URL}`);
  console.log(`📢 Ads Enabled: ${ADS_ENABLED}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export default ENV;
