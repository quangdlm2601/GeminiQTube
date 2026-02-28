# 1. Use an image with OpenJDK 21 pre-installed (Solves 'openjdk-21-jdk' error)
FROM eclipse-temurin:21-jdk-jammy

# 2. Install Node.js 20 LTS, Android tools, and build-essential
RUN apt-get update && \
    apt-get install -y wget unzip zip build-essential curl && \
    # Install Node.js 20 LTS using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Android SDK setup
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/33.0.2

# Install Android Command Line Tools
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools && \
    cd $ANDROID_SDK_ROOT/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip && rm cmdline-tools.zip && \
    mv cmdline-tools latest

# Accept licenses
RUN yes | sdkmanager --licenses

# Set working directory for the Node app
WORKDIR /app

# Copy package files
COPY package*.json ./

# Remove package-lock.json
RUN rm -f package-lock.json

# Install dependencies. Removed --omit=optional to ensure all necessary modules are installed.
RUN npm install --legacy-peer-deps

# Copy rest of project
COPY . .

# Build React (Vite) app - This step should now succeed
RUN npm run build

# Install Capacitor
# Build App icon for Android
# Sync build to Capacitor Android
RUN npx cap add android && \
    npx cordova-res android --type icon --skip-config --copy && \
    npx cap sync android

# COPY custom Android files to overwrite
# COPY custom/android/MainActivity.java \
#      android/app/src/main/java/quangdlm/com/MainActivity.java

# Build APK
WORKDIR /app/android
RUN ./gradlew assembleDebug

CMD ["echo", "Docker Container: APK generated at /app/android/app/build/outputs/apk/debug/app-debug.apk"]