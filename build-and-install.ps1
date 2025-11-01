param(
  [ValidateSet("debug","release")]
  [string]$BuildType = "debug"
)

$ErrorActionPreference = "Stop"

function Write-Log($msg) {
  Write-Host $msg
}

try {
  $androidDir = Join-Path $PSScriptRoot 'android'
  $gradlew = Join-Path $androidDir 'gradlew.bat'

  if (!(Test-Path $gradlew)) {
    throw "Gradle wrapper not found: $gradlew"
  }

  if ($BuildType -eq 'release') {
    Write-Log "🔨 Building release APK..."
    & $gradlew -p $androidDir assembleRelease
    $apkPath = Join-Path $androidDir 'app/build/outputs/apk/release/app-release.apk'
  } else {
    Write-Log "🔨 Building standalone debug APK..."
    & $gradlew -p $androidDir assembleDebug -Preact.bundleInDebug=true
    $apkPath = Join-Path $androidDir 'app/build/outputs/apk/debug/app-debug.apk'
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Gradle build failed with exit code $LASTEXITCODE"
  }

  if (!(Test-Path $apkPath)) {
    throw "APK not found at: $apkPath"
  }

  Write-Log "✅ Build successful!"
  Write-Log "📱 Installing on device..."

  $adb = "adb"
  & $adb --version 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "adb not found. Ensure Android platform-tools are on PATH."
  }

  & $adb install -r "$apkPath"
  if ($LASTEXITCODE -eq 0) {
    Write-Log "🎉 App installed successfully!"
    Write-Log "📍 APK location: $apkPath"
  } else {
    throw "❌ Installation failed with exit code $LASTEXITCODE"
  }
} catch {
  Write-Error $_
  exit 1
}
