# Karyaa — Native iOS & Android Build Guide

Karyaa uses [Capacitor](https://capacitorjs.com/) to wrap the React web app into a native iOS and Android app. This gives you a real App Store / Play Store app with access to native device features (push notifications, status bar, splash screen, back button handling).

---

## What's Already Set Up

- `capacitor.config.ts` — App ID, name, web directory, plugin configuration
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/push-notifications`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/app`
- `client/src/lib/platform.ts` — runtime detection (`isNative()`, `isIOS()`, `isAndroid()`)
- Push notifications hook updated to use native APNs/FCM on device, web push in browser
- Android back button handling
- Splash screen auto-hide on startup
- Backend endpoints for native push token registration

---

## Prerequisites (on your local machine)

| Platform | Requirements |
|----------|-------------|
| iOS | macOS, Xcode 14+, Apple Developer account |
| Android | Android Studio, JDK 17+ |

---

## One-Time Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd karyaa
npm install
```

### 2. Build the web app

```bash
npm run build
```

This creates the production frontend in `dist/public`, which is what Capacitor packages.

### 3. Add native platforms

```bash
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` folders in your project root.

### 4. Copy web assets to native

```bash
npx cap sync
```

Run this every time you change the frontend code.

---

## Firebase Setup (for Push Notifications on Android + iOS)

Capacitor Push Notifications uses **Firebase Cloud Messaging (FCM)** for Android, and can use FCM for iOS too (simplest approach).

### Steps

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Add an **Android app** with package name `com.karyaa.app`
   - Download `google-services.json`
   - Place it at `android/app/google-services.json`
3. Add an **iOS app** with bundle ID `com.karyaa.app`
   - Download `GoogleService-Info.plist`
   - Open Xcode: `npx cap open ios`
   - Drag `GoogleService-Info.plist` into the project navigator

### Get FCM Server Key

In Firebase Console → Project Settings → Cloud Messaging → **Server key**

Add it to your Replit/server environment as:
```
FCM_SERVER_KEY=your_server_key_here
```

### Apple Push Notification Service (APNs) — iOS only

In Firebase Console → Project Settings → Cloud Messaging → iOS app:
- Upload your APNs Auth Key (requires Apple Developer account)

---

## Building & Running

### iOS

```bash
npm run build && npx cap sync
npx cap open ios
```

Then press **Run** in Xcode, or archive for App Store submission.

### Android

```bash
npm run build && npx cap sync
npx cap open android
```

Then click **Run** in Android Studio, or **Build → Generate Signed APK** for Play Store.

---

## Deep Link / OAuth Redirect (Supabase Auth)

When using Google Sign-In from the native app, Supabase redirects back to your app using a custom URL scheme.

Add this to your Supabase project → Authentication → URL Configuration → Redirect URLs:
```
com.karyaa.app://login-callback/
```

Then in Capacitor (already handled via `server.androidScheme: 'https'` in `capacitor.config.ts`), ensure your Supabase client uses the correct redirect URL when signing in on native:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: isNative() ? 'com.karyaa.app://login-callback/' : window.location.origin,
  },
});
```

---

## Daily Reminder Push Notifications (Native)

The backend already has a scheduler that sends daily reminders. For native devices:

1. When the user enables notifications on the native app, their FCM/APNs token is stored in the `native_push_tokens` database table
2. The backend needs to be updated to send via FCM when sending to native tokens (requires `FCM_SERVER_KEY`)
3. The existing VAPID web push continues to work for browser users

To send via FCM from the backend, use:
```
POST https://fcm.googleapis.com/fcm/send
Authorization: key=FCM_SERVER_KEY
Content-Type: application/json

{
  "to": "<device_token>",
  "notification": {
    "title": "Karyaa Reminder",
    "body": "You have incomplete tasks today"
  }
}
```

---

## Summary of Required Environment Variables

| Variable | Used For |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side auth verification |
| `DATABASE_URL` | PostgreSQL connection |
| `VAPID_PUBLIC_KEY` | Web push (browser) |
| `VAPID_PRIVATE_KEY` | Web push (browser) |
| `VAPID_EMAIL` | Web push (browser) |
| `FCM_SERVER_KEY` | Native push (iOS + Android) |
