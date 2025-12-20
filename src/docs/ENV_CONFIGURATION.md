# Environment Configuration Guide

## Overview

The application now uses centralized environment configuration for API endpoints and other environment-specific settings. This makes it easy to switch between development, staging, and production environments.

## Configuration File

All environment settings are managed in `src/config/env.ts`.

### Structure

```typescript
interface EnvConfig {
  API_BASE_URL: string;    // Base URL for REST API
  SSE_BASE_URL: string;    // Base URL for Server-Sent Events
  ENVIRONMENT: 'development' | 'staging' | 'production';
}
```

## Available Environments

### 1. Development (Local Testing)
```typescript
{
  API_BASE_URL: 'http://192.168.100.10:8881',
  SSE_BASE_URL: 'http://192.168.100.10:8885',
  ENVIRONMENT: 'development',
}
```
- Used for local development and testing
- Points to local backend servers
- Automatically selected when `__DEV__` is true

### 2. Staging (Pre-Production)
```typescript
{
  API_BASE_URL: 'https://staging-api.theprojectphoenix.top',
  SSE_BASE_URL: 'https://staging-sse.theprojectphoenix.top',
  ENVIRONMENT: 'staging',
}
```
- Used for testing before production deployment
- Points to staging servers
- Update URLs to match your staging environment

### 3. Production
```typescript
{
  API_BASE_URL: 'https://api.theprojectphoenix.top',
  SSE_BASE_URL: 'https://sse.theprojectphoenix.top',
  ENVIRONMENT: 'production',
}
```
- Used for production deployment
- Points to production servers
- Automatically selected when `__DEV__` is false

## How to Switch Environments

### Method 1: Automatic (Recommended)
The environment is automatically selected based on the build mode:
- **Development builds** (`npm run android` / `npm run ios`) → Uses `development` config
- **Production builds** (release builds) → Uses `production` config

### Method 2: Manual Override
Edit `src/config/env.ts` and change the `ACTIVE_ENV` constant:

```typescript
// Force development environment
const ACTIVE_ENV: 'development' | 'staging' | 'production' = 'development';

// Force staging environment
const ACTIVE_ENV: 'development' | 'staging' | 'production' = 'staging';

// Force production environment
const ACTIVE_ENV: 'development' | 'staging' | 'production' = 'production';
```

## Usage in Code

### Import the configuration

```typescript
import { API_BASE_URL, SSE_BASE_URL, ENVIRONMENT } from '../config/env';
```

### Use in services

```typescript
// Example: In downloadService.ts
constructor(
  apiBaseUrl: string = API_BASE_URL,
  sseBaseUrl: string = SSE_BASE_URL,
) {
  this.apiBaseUrl = apiBaseUrl;
  this.sseBaseUrl = sseBaseUrl;
}
```

### Access full config object

```typescript
import ENV from '../config/env';

console.log(ENV.API_BASE_URL);
console.log(ENV.SSE_BASE_URL);
console.log(ENV.ENVIRONMENT);
```

## Updated Services

The following services now use environment configuration:

### 1. downloadService.ts
- Uses `API_BASE_URL` for download API calls
- Uses `SSE_BASE_URL` for real-time progress updates
- Constructor accepts optional overrides for testing

### 2. apiClient.ts
- Uses `API_BASE_URL` for search and other API calls
- Automatically appends `/v2/api` suffix

## Development Workflow

### Local Development
1. Ensure your local backend is running on the configured ports
2. Update the development config in `src/config/env.ts` if needed:
   ```typescript
   const development: EnvConfig = {
     API_BASE_URL: 'http://YOUR_LOCAL_IP:8881',
     SSE_BASE_URL: 'http://YOUR_LOCAL_IP:8885',
     ENVIRONMENT: 'development',
   };
   ```
3. Run the app: `npm run android` or `npm run ios`

### Testing with Staging
1. Update the staging URLs in `src/config/env.ts`
2. Change `ACTIVE_ENV` to `'staging'`
3. Build and test the app

### Production Deployment
1. Ensure production URLs are correct in `src/config/env.ts`
2. The app will automatically use production config in release builds
3. Build release version: `npm run android --variant=release`

## Environment Logging

In development mode, the app logs the current environment configuration on startup:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 ENVIRONMENT CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: development
🌐 API Base URL: http://192.168.100.10:8881
📡 SSE Base URL: http://192.168.100.10:8885
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This helps verify you're using the correct environment.

## Best Practices

1. **Never commit sensitive credentials** - Use environment variables for secrets
2. **Keep staging URLs updated** - Ensure they match your actual staging environment
3. **Test environment switching** - Verify the app works in all environments
4. **Document URL changes** - Update this file when URLs change
5. **Use automatic selection** - Let `__DEV__` control the environment when possible

## Troubleshooting

### Issue: App connects to wrong environment
**Solution:** Check the `ACTIVE_ENV` constant in `src/config/env.ts`

### Issue: Local backend not reachable
**Solution:** 
- Verify your local IP address
- Ensure backend is running on the configured ports
- Check firewall settings
- Try using `localhost` or `127.0.0.1` if running on emulator

### Issue: Production URLs not working
**Solution:**
- Verify URLs are correct and accessible
- Check network connectivity
- Ensure backend servers are running

## Migration Notes

### Before (Hardcoded URLs)
```typescript
constructor(
  apiBaseUrl: string = 'https://api.theprojectphoenix.top',
  sseBaseUrl: string = 'https://sse.theprojectphoenix.top',
) {
  this.apiBaseUrl = 'http://192.168.100.10:8881'; // Hardcoded!
  this.sseBaseUrl = 'http://192.168.100.10:8885'; // Hardcoded!
}
```

### After (Environment Configuration)
```typescript
import { API_BASE_URL, SSE_BASE_URL } from '../config/env';

constructor(
  apiBaseUrl: string = API_BASE_URL,
  sseBaseUrl: string = SSE_BASE_URL,
) {
  this.apiBaseUrl = apiBaseUrl;
  this.sseBaseUrl = sseBaseUrl;
}
```

## Future Enhancements

Consider these improvements for production apps:

1. **react-native-config** - Use native environment variables
2. **Build variants** - Separate dev/staging/prod builds
3. **Feature flags** - Toggle features per environment
4. **Analytics** - Different tracking IDs per environment
5. **Error reporting** - Environment-specific error handling

## Related Files

- `src/config/env.ts` - Main configuration file
- `src/services/downloadService.ts` - Uses environment config
- `src/services/apiClient.ts` - Uses environment config
- `.env.example` - Example environment file (for documentation)
