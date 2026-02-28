# GeminiQTube APK Build Guide

This guide provides comprehensive instructions for building and deploying the GeminiQTube application as an Android APK using Capacitor and Docker.

## I. Overview

The GeminiQTube project uses **Capacitor** to wrap the React web application as a native Android app. The build process is containerized using **Docker** to ensure consistency across different environments and avoid platform-specific configuration issues.

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Mobile Framework**: Capacitor 7.4.4
- **Backend**: Vercel Serverless Functions (for API calls)
- **Containerization**: Docker

### Build Process Flow

```
React App (TypeScript)
   (npm run build)
Web Build (dist/)
   (npx cap sync android)
Capacitor Android Project
   (./gradlew assembleDebug)
APK File (app-debug.apk)
```

---

## II. Prerequisites

### System Requirements

Before building the APK, ensure you have:

1. **Docker** (version 20.10+)
   - Required for containerized builds
   - Eliminates local environment setup complexity

2. **Docker Desktop** (Mac/Windows) or Docker Engine (Linux)
   - Allows running Linux containers

3. **Disk Space**: At least 15-20 GB free
   - Docker image build requires significant space
   - Android SDK and build tools are large

### Software Dependencies (handled by Docker)

The Docker image automatically installs:
- OpenJDK 21 (required for modern Android builds)
- Node.js 20 LTS
- Android SDK and build tools (version 33.0.2)
- Gradle build system

---

## III. Building the APK Locally

### Method 1: Using NPM Script (Recommended)

This is the simplest approach and handles all setup automatically.

```bash
cd /path/to/GeminiQTube
npm run gen:app
```

**What this does:**
1. Builds the Docker image (one-time process)
2. Runs the container to build the APK
3. Extracts the APK to `./output/app-debug.apk`
4. Cleans up Docker resources

**Expected output:**
```
Successfully built react-capacitor-apk
...
Built the APK successfully at /app/android/app/build/outputs/apk/debug/app-debug.apk
APK extracted to ./output
```

**Build time**: 10-15 minutes on first run (faster on subsequent runs)

---

### Method 2: Step-by-Step Manual Build

For debugging or custom configurations:

#### Step 1: Build the Docker Image

```bash
docker build -f apk.Dockerfile --platform linux/amd64 -t react-capacitor-apk .
```

**Flags:**
- `-f apk.Dockerfile`: Specifies the Dockerfile to use
- `--platform linux/amd64`: Ensures Linux x86-64 architecture (works on all OS)
- `-t react-capacitor-apk`: Names the image for easy reference

**Troubleshooting:**
- If the build fails due to network issues, rebuild with `--no-cache` flag
- On M1/M2 Mac: `--platform linux/amd64` ensures compatibility

#### Step 2: Run the Container

```bash
docker run --name my_build react-capacitor-apk
```

This executes the build inside the container. Wait for completion.

#### Step 3: Extract the APK

```bash
mkdir -p output
docker cp my_build:/app/android/app/build/outputs/apk/debug/app-debug.apk ./output/
```

#### Step 4: Clean Up

```bash
docker rm my_build
```

---

## IV. APK Configuration

### Current Configuration

The APK is configured via `src/capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'gemini-q-tube.quangdlm.com',
  appName: 'GeminiQtube',
  webDir: 'dist',
  server: {
    url: 'https://geminiqtube.vercel.app',
  },
};
```

**Key Settings:**
- **appId**: Package name (reverse domain format)
- **appName**: Display name in Android launcher
- **webDir**: Directory containing the React build (output of `npm run build`)
- **server.url**: Base URL for API calls (points to Vercel deployment)

### Customizing the APK

To build with custom settings:

#### 1. Update App Metadata

Edit `src/capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.example.myapp',  // Change package name
  appName: 'My Custom App',     // Change display name
  webDir: 'dist',
  server: {
    url: 'https://custom-api.example.com',  // Change API endpoint
  },
};
```

#### 2. Modify App Icon

Replace the icon files in `android/app/src/main/res/`:
- `mipmap-*` directories contain app icons
- Use `cordova-res` tool to generate icons

#### 3. Update App Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<!-- Add more permissions as needed -->
```

#### 4. Rebuild After Changes

After making changes, rebuild the APK:

```bash
npm run gen:app
```

---

## V. Installation on Android Device

### Method 1: USB Debugging (Recommended)

1. **Enable Developer Mode** on your Android device:
   - Go to SettingsAbout Phone
   - Tap "Build Number" 7 times until "Developer Mode Enabled" appears

2. **Enable USB Debugging**:
   - Go to SettingsDeveloper Options
   - Enable "USB Debugging"

3. **Connect via USB** to your development machine

4. **Install the APK**:
   ```bash
   adb install output/app-debug.apk
   ```

   **Note**: Android Debug Bridge (adb) comes with the Android SDK. If not in your PATH:
   ```bash
   # On Mac
   /Library/Android/sdk/platform-tools/adb install output/app-debug.apk

   # On Linux
   ~/Android/Sdk/platform-tools/adb install output/app-debug.apk

   # On Windows
   %USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe install output/app-debug.apk
   ```

5. **Verify Installation**:
   ```bash
   adb shell pm list packages | grep gemini
   ```

### Method 2: Direct APK Transfer

1. Transfer the APK file to your Android device via:
   - USB file transfer
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Email attachment
   - QR code

2. Open the APK on the device with a file manager

3. Tap to install and grant permissions

### Method 3: Android Studio

1. Open Android Studio
2. Device ManagerPhysical Device
3. Connect your device
4. Click "Install APK" and select `output/app-debug.apk`

---

## VI. Testing the APK

### Basic Functionality Tests

After installation, verify:

1. **App Launches**: Opens without crashes
2. **Navigation**: All pages accessible
3. **Search**: Video search functionality works
4. **Video Playback**: Videos load and play
5. **API Connectivity**: Confirms backend communication

### Debugging APK Issues

#### View Logs
```bash
adb logcat
```

#### Check for Crashes
```bash
adb logcat | grep "E/"
```

#### Uninstall the APK
```bash
adb uninstall gemini-q-tube.quangdlm.com
```

---

## VII. Building Release APK

The current build process generates a **debug APK** suitable for testing. For production release:

### Step 1: Update Build Configuration

In `apk.Dockerfile`, replace the build command:

```dockerfile
# Change from:
RUN ./gradlew assembleDebug

# To:
RUN ./gradlew assembleRelease
```

### Step 2: Generate Signing Key (one-time)

```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Step 3: Configure Gradle Signing

Add to `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword 'YOUR_KEYSTORE_PASSWORD'
        keyAlias 'my-key-alias'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
```

### Step 4: Build Release APK

```bash
npm run gen:app
```

The release APK will be available at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 5: Upload to Play Store

1. Create a Google Play Developer account
2. Set up app listing and store details
3. Submit the signed APK to Play Store Console
4. Go through review process

---

## VIII. Docker Build Details

### Dockerfile Overview

The `apk.Dockerfile` contains the following stages:

1. **Base Image Setup**
   - Uses `eclipse-temurin:21-jdk-jammy` (Java 21)

2. **Dependency Installation**
   - Node.js 20 LTS
   - Android SDK tools
   - Build essentials

3. **Android SDK Configuration**
   - Sets `ANDROID_SDK_ROOT`
   - Installs command-line tools
   - Accepts licenses

4. **React Build**
   - Installs npm dependencies
   - Runs `npm run build` (Vite)
   - Generates production-ready web assets

5. **Capacitor Setup**
   - Adds Android platform to Capacitor
   - Syncs web build to Android project
   - Generates app icons

6. **Gradle Build**
   - Compiles Android project
   - Generates APK

### Environment Variables in Docker

```dockerfile
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools
```

### Customizing the Docker Build

To modify the build process, edit `apk.Dockerfile`:

**Change Android Build Tools Version:**
```dockerfile
ENV PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/34.0.0  # Change version
```

**Add Additional Dependencies:**
```dockerfile
RUN apt-get install -y YOUR_PACKAGE_NAME
```

**Use Different Base Image:**
```dockerfile
FROM ubuntu:22.04  # Replace eclipse-temurin
```

---

## IX. Troubleshooting

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Docker build fails: "Cannot pull base image" | Network connectivity | Check internet connection, retry build |
| "openjdk-21-jdk not found" | Java version mismatch | Rebuild Docker image (won't use cache) |
| APK installation fails | Device not detected | Enable USB debugging, check ADB drivers |
| "Insufficient space on device" | Storage full | Free up space on device or APK too large |
| App crashes on launch | API endpoint unreachable | Verify `capacitor.config.ts` server URL |
| White screen after launch | React build failed | Check `npm run build` output for errors |
| WebView issues | Capacitor Android version mismatch | Update `@capacitor/android` in `package.json` |

### Debugging Build Failures

#### 1. Enable Verbose Docker Output
```bash
docker build -f apk.Dockerfile --verbose --platform linux/amd64 -t react-capacitor-apk .
```

#### 2. Interactive Container Debugging
```bash
# Run container with shell instead of building
docker run -it --entrypoint /bin/bash react-capacitor-apk

# Inside container, check environment
echo $ANDROID_SDK_ROOT
java -version
node --version
```

#### 3. Check Build Logs
```bash
# Extract logs from stopped container
docker logs my_build
```

#### 4. Verify APK Integrity
```bash
# Check if APK exists in output directory
ls -lh output/app-debug.apk

# Inspect APK contents
unzip -l output/app-debug.apk
```

---

## X. Performance Optimization

### Reducing APK Size

1. **Enable R8 Code Minification** in `android/app/build.gradle`:
   ```gradle
   release {
       minifyEnabled true
       proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
   }
   ```

2. **Remove Unused Dependencies** from `package.json`

3. **Split APK by Architecture** (for Play Store):
   ```gradle
   splits {
       abi {
           enable true
           include 'armeabi-v7a', 'arm64-v8a'
       }
   }
   ```

### Build Time Optimization

1. **Use Layer Caching**: Docker caches intermediate layers; don't change earlier lines unnecessarily

2. **Parallel Gradle Build**:
   ```bash
   # In apk.Dockerfile
   ENV org.gradle.parallel=true
   ENV org.gradle.workers.max=4
   ```

---

## XI. Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build APK

on:
  push:
    branches: [main, develop]

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build APK with Docker
        run: npm run gen:app

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: output/app-debug.apk
```

---

## XII. Next Steps

After successfully building and installing the APK:

1. **Test on Multiple Devices**: Ensure compatibility across Android versions
2. **Optimize Performance**: Monitor app startup time and memory usage
3. **Prepare for Release**: Implement proper error handling and crash reporting
4. **Set Up Distribution**: Configure Play Store, Firebase App Distribution, or alternative app stores
5. **Monitor Crashes**: Integrate Firebase Crashlytics or similar service

---

## XIII. References

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Gradle Build System](https://gradle.org/)
- [React Documentation](https://react.dev)
