#!/bin/bash

# Script to view React Native logs more easily
# Usage: ./view-logs.sh [android|ios]

PLATFORM=${1:-android}

echo "📱 Viewing React Native logs for $PLATFORM..."
echo "Press Ctrl+C to stop"
echo ""

if [ "$PLATFORM" = "android" ]; then
    # Android logs
    echo "🤖 Android logs (filtering for React Native):"
    adb logcat | grep -E "ReactNativeJS|YTDownloader|chromium"
elif [ "$PLATFORM" = "ios" ]; then
    # iOS logs
    echo "🍎 iOS logs:"
    xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "YTDownloaderApp"' --level=debug
else
    echo "❌ Unknown platform: $PLATFORM"
    echo "Usage: ./view-logs.sh [android|ios]"
    exit 1
fi