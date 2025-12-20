# React Native Logging Guide

## 🔍 **How to View Logs**

### **Method 1: Metro Bundler Terminal (Recommended)**
The terminal where you run `npm start` should show all console logs automatically.

**What you should see:**
```
LOG  [12:34:56] [YTDownloader] 🚀 App starting in development mode
LOG  [12:34:56] [YTDownloader] 📱 Console logging enabled
LOG  [12:34:57] [YTDownloader] ✅ App mounted successfully
```

### **Method 2: React Native Debugger**
1. Open the app on your device/emulator
2. Press `Ctrl+M` (Android) or `Cmd+D` (iOS)
3. Select "Debug"
4. Open Chrome DevTools at `http://localhost:8081/debugger-ui/`
5. Check the Console tab

### **Method 3: Android Logcat**
```bash
# View all React Native logs
adb logcat | grep ReactNativeJS

# Or use our custom script
./view-logs.sh android
```

### **Method 4: iOS Simulator Logs**
```bash
# View iOS logs
xcrun simctl spawn booted log stream --level=debug

# Or use our custom script
./view-logs.sh ios
```

## 📝 **Using the Logger Utility**

### **Basic Usage**
```typescript
import { logger } from '../utils/logger';

// Different log levels
logger.log('Regular log message');
logger.info('ℹ️ Information message');
logger.warn('⚠️ Warning message');
logger.error('❌ Error message');
logger.debug('🐛 Debug message');
```

### **Creating Child Loggers**
```typescript
import { logger } from '../utils/logger';

// Create a logger for a specific component
const searchLogger = logger.child('Search');

searchLogger.info('Search initiated'); 
// Output: [12:34:56] [YTDownloader:Search] Search initiated
```

### **Logging Objects**
```typescript
logger.info('User data:', { name: 'John', age: 30 });
logger.error('API Error:', error);
```

## 🎯 **Current Logging Setup**

### **App.tsx**
- ✅ Logs app startup
- ✅ Logs app mount/unmount
- ✅ Enhanced console methods in development

### **BrowseScreen.tsx**
- ✅ Logs search queries
- ✅ Logs video selections

### **API Client**
- ✅ Logs all API requests
- ✅ Logs API responses
- ✅ Logs API errors

### **Download Service**
- ✅ Logs download initiation
- ✅ Logs download progress
- ✅ Logs download completion/errors

## 🚀 **Quick Start**

### **1. Start Metro Bundler**
```bash
npm start
```
**Expected output:**
```
Welcome to Metro!
  Fast - Scalable - Integrated

[12:34:56] LOG  [YTDownloader] 🚀 App starting...
```

### **2. Run Android App**
```bash
# In a new terminal
npm run android
```

### **3. View Logs**
Logs should appear in the Metro bundler terminal (first terminal).

If you don't see logs:
```bash
# Option A: Use our log viewer script
./view-logs.sh android

# Option B: Use adb directly
adb logcat | grep -E "ReactNativeJS|YTDownloader"

# Option C: Clear cache and restart
npm start -- --reset-cache
```

## 🔧 **Troubleshooting**

### **No Logs Appearing?**

#### **1. Check Metro Bundler**
- Make sure `npm start` is running
- Look for the Metro bundler UI in terminal
- Logs appear in this terminal, not the `npm run android` terminal

#### **2. Enable Debug Mode**
- Open app on device/emulator
- Press `Ctrl+M` (Android) or `Cmd+D` (iOS)
- Enable "Debug JS Remotely"
- Check Chrome DevTools console

#### **3. Check ADB Connection**
```bash
# List connected devices
adb devices

# If no devices, restart adb
adb kill-server
adb start-server
```

#### **4. Clear Cache**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear Android build cache
cd android && ./gradlew clean && cd ..

# Reinstall app
npm run android
```

#### **5. Check LogBox**
- LogBox shows errors/warnings in the app
- Yellow box = warnings
- Red screen = errors
- All should also appear in Metro terminal

## 📊 **Log Levels**

| Level | When to Use | Example |
|-------|-------------|---------|
| `log` | General information | `logger.log('User logged in')` |
| `info` | Important events | `logger.info('✅ Download complete')` |
| `warn` | Potential issues | `logger.warn('⚠️ API slow response')` |
| `error` | Errors and exceptions | `logger.error('❌ Network failed')` |
| `debug` | Development debugging | `logger.debug('🐛 State:', state)` |

## 🎨 **Log Formatting Tips**

### **Use Emojis for Quick Scanning**
```typescript
logger.info('🚀 App started');
logger.info('🔍 Searching...');
logger.info('📥 Downloading...');
logger.info('✅ Success!');
logger.error('❌ Failed!');
logger.warn('⚠️ Warning!');
```

### **Log with Context**
```typescript
// Bad
logger.info('Error');

// Good
logger.error('❌ Download failed:', {
  videoId: video.id,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

### **Use Structured Logging**
```typescript
logger.info('API Request', {
  method: 'POST',
  url: '/search',
  query: searchQuery,
  timestamp: Date.now()
});
```

## 🔍 **Debugging Workflow**

### **1. Add Logs**
```typescript
logger.info('🔍 Starting search:', query);
```

### **2. Run App**
```bash
npm start
npm run android
```

### **3. Check Metro Terminal**
Look for your log messages in the terminal where `npm start` is running.

### **4. Filter Logs**
```bash
# In Metro terminal, logs are automatically filtered
# For more control, use:
./view-logs.sh android | grep "Search"
```

## 📱 **Platform-Specific Notes**

### **Android**
- Logs appear in Metro bundler terminal
- Also available via `adb logcat`
- Use `./view-logs.sh android` for filtered view

### **iOS**
- Logs appear in Metro bundler terminal
- Also available in Xcode console
- Use `./view-logs.sh ios` for filtered view

## ✅ **Verification**

To verify logging is working:

1. **Start Metro**: `npm start`
2. **Run App**: `npm run android`
3. **Check Metro Terminal** for:
   ```
   LOG  [YTDownloader] 🚀 App starting in development mode
   LOG  [YTDownloader] 📱 Console logging enabled
   LOG  [YTDownloader] ✅ App mounted successfully
   ```

If you see these logs, everything is working! 🎉