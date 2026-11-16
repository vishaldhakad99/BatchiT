# BatchiT Android Capacitor Integration Guide

This guide describes how to convert the **BatchiT** React client into a native Android APK using **Capacitor**.

The Android application connects directly to the same Node.js/Express backend (`/api`) and persistent MongoDB database.

---

## 1. Prerequisites

- **Node.js**: v18+ or v20+
- **Android Studio**: Iguana (2023.2.1) or Ladybug (2024.2+)
- **Android SDK**: API Level 34+ (Android 14) or API 33 (Android 13)
- **Java JDK**: OpenJDK 17 or 21

---

## 2. Installation & Build Steps

### Step 1: Build the React Web Client
```bash
cd client
npm run build
```
This outputs the optimized production build into `client/dist`.

### Step 2: Install Capacitor CLI & Core
Inside the `mobile/` or root directory:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/push-notifications
```

### Step 3: Initialize Capacitor Android Platform
```bash
npx cap add android
```

### Step 4: Sync Web Assets to Android Project
```bash
npx cap copy
npx cap sync
```

### Step 5: Open in Android Studio
```bash
npx cap open android
```

---

## 3. Required Android Permissions (`AndroidManifest.xml`)

Ensure the following permissions are present in `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Network & Internet Access -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera Access for Snaps & Video Calling -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Microphone Access for Voice Calling & Audio Snaps -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Photo Gallery Read/Write -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <!-- Push Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
</manifest>
```

---

## 4. Connecting Android to the Backend

In development mode:
- If testing on an Android Emulator: Point the API URL to `http://10.0.2.2:5000` (which routes to your host machine's `localhost:5000`).
- If testing on a physical Android phone: Point the API URL to your local IP address (e.g., `http://192.168.1.X:5000`) or your deployed production domain (e.g., `https://api.batchit.app`).

---

## 5. Generating Release APK / Android App Bundle (.aab)

In Android Studio:
1. Navigate to **Build** > **Generate Signed Bundle / APK**.
2. Select **Android App Bundle** (for Google Play Store) or **APK** (for direct installation).
3. Select or create your keystore.
4. Build variant: `release`.
5. The generated file will be located in `android/app/release/app-release.aab` or `app-release.apk`.
