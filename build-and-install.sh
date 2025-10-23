#!/bin/bash

BUILD_TYPE=${1:-debug}

if [ "$BUILD_TYPE" = "release" ]; then
    echo "🔨 Building release APK..."
    cd android && ./gradlew assembleRelease
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
else
    echo "🔨 Building standalone debug APK..."
    cd android && ./gradlew assembleDebug -Preact.bundleInDebug=true
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
fi

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📱 Installing on device..."
    cd ..
    adb install -r $APK_PATH
    
    if [ $? -eq 0 ]; then
        echo "🎉 App installed successfully!"
        echo "📍 APK location: $APK_PATH"
        echo "🚀 You can now use the app without the development server!"
    else
        echo "❌ Installation failed"
    fi
else
    echo "❌ Build failed"
fi

echo ""
echo "Usage:"
echo "  ./build-and-install.sh        # Build standalone debug APK"
echo "  ./build-and-install.sh debug  # Build standalone debug APK"
echo "  ./build-and-install.sh release # Build optimized release APK"