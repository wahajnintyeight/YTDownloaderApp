#!/bin/bash

# Clear screen
clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 React Native Logs Viewer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Filtering for: ReactNativeJS, chromium, and app logs"
echo "Press Ctrl+C to stop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clear logcat buffer first
adb logcat -c

# View logs with color coding
adb logcat -v time | grep -E "ReactNativeJS|chromium" --line-buffered | while read line; do
    if echo "$line" | grep -q "ERROR"; then
        echo -e "\033[0;31m$line\033[0m"  # Red for errors
    elif echo "$line" | grep -q "WARN"; then
        echo -e "\033[0;33m$line\033[0m"  # Yellow for warnings
    elif echo "$line" | grep -q "INFO"; then
        echo -e "\033[0;36m$line\033[0m"  # Cyan for info
    elif echo "$line" | grep -q "DEBUG"; then
        echo -e "\033[0;35m$line\033[0m"  # Magenta for debug
    else
        echo "$line"  # Default color
    fi
done