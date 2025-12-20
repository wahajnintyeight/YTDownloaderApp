# How to View Logs in React Native

## 🎯 **Quick Solutions**

### **Option 1: Use adb logcat (Recommended for Android)**

Open a **third terminal** and run:
```bash
npm run logs
```

Or manually:
```bash
adb logcat | grep -E "ReactNativeJS|chromium"
```

To clear old logs first:
```bash
npm run logs:clear
```

### **Option 2: Use the logs.sh script**

```bash
./logs.sh
```

This provides colored output for better readability.

### **Option 3: View all Android logs**

```bash
adb logcat -v time
```

Then filter manually by looking for `ReactNativeJS` or `chromium` tags.

## 📱 **Terminal Setup**

You should have **3 terminals open**:

### Terminal 1: Metro Bundler
```bash
npm run start
```
This runs the React Native packager.

### Terminal 2: Android App
```bash
npm run android
```
This builds and runs the app on your device/emulator.

### Terminal 3: Logs Viewer
```bash
npm run logs
# or
./logs.sh
# or
adb logcat | grep -E "ReactNativeJS|chromium"
```
This shows all console.log output from your app.

## 🔍 **Finding Specific Logs**

### Download Logs
```bash
adb logcat | grep "DOWNLOAD"
```

### Error Logs Only
```bash
adb logcat | grep "ERROR"
```

### Progress Updates
```bash
adb logcat | grep "Progress"
```

### SSE Polling
```bash
adb logcat | grep "SSE POLLING"
```

## 🐛 **Debugging Tips**

### 1. Clear Logcat Buffer
Before starting, clear old logs:
```bash
adb logcat -c
```

### 2. Check Device Connection
```bash
adb devices
```
Should show your device/emulator.

### 3. Restart Metro with Cache Clear
```bash
npm run start:reset
```

### 4. Check if App is Running
```bash
adb shell ps | grep ytdownloader
```

## 📊 **Log Levels**

Our logs use these prefixes:
- `[LOG]` - General information
- `[INFO]` - Important information
- `[WARN]` - Warnings
- `[ERROR]` - Errors
- `📥` - Download API calls
- `🔄` - SSE polling
- `📊` - Progress updates
- `✅` - Success messages
- `❌` - Error messages

## 🎨 **Colored Logs**

The `logs.sh` script provides colored output:
- 🔴 **Red** - Errors
- 🟡 **Yellow** - Warnings
- 🔵 **Cyan** - Info
- 🟣 **Magenta** - Debug
- ⚪ **White** - General logs

## 🚀 **Quick Start**

1. **Start Metro** (Terminal 1):
   ```bash
   npm run start
   ```

2. **Run Android** (Terminal 2):
   ```bash
   npm run android
   ```

3. **View Logs** (Terminal 3):
   ```bash
   npm run logs
   ```

Now you'll see all console.log output in Terminal 3!

## 💡 **Why Logs Don't Show in Metro Terminal**

React Native 0.73+ moved JavaScript logs to DevTools by default. To see them in terminal, you need to use `adb logcat` which captures logs directly from the Android device/emulator.

## 🔧 **Troubleshooting**

### No logs appearing?

1. **Check device connection**:
   ```bash
   adb devices
   ```

2. **Restart adb**:
   ```bash
   adb kill-server
   adb start-server
   ```

3. **Clear cache and restart**:
   ```bash
   npm run start:reset
   ```

4. **Rebuild app**:
   ```bash
   npm run android
   ```

### Too many logs?

Filter more specifically:
```bash
adb logcat | grep "YTDownloader"
```

### Logs are delayed?

Use `--line-buffered` with grep:
```bash
adb logcat | grep --line-buffered "ReactNativeJS"
```