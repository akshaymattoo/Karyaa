# PWA and Push Notifications Setup

This app is now a Progressive Web App (PWA) with push notification support. Here's how to set it up and use it.

## What's a PWA?

A Progressive Web App can be installed on your device like a native app, works offline, and supports push notifications. Users can:
- Install the app on their home screen (mobile/desktop)
- Use it offline after the first visit
- Receive push notifications

## Setting Up Push Notifications

To enable push notifications, you need to configure VAPID keys. VAPID keys are used to securely send push notifications.

### Generating VAPID Keys

You can generate VAPID keys using the `web-push` library:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SX...

Private Key:
kSMWrkU3rN_xB6J7G6YhKcj8LViTxqX0...
=======================================
```

### Adding VAPID Keys to Replit Secrets

Add these three secrets to your Replit project:

1. `VAPID_PUBLIC_KEY` - The public key from above
2. `VAPID_PRIVATE_KEY` - The private key from above
3. `VAPID_EMAIL` - A contact email (e.g., `mailto:your-email@example.com`)

### How to Add Secrets in Replit

1. Click on the "Tools" icon in the sidebar
2. Select "Secrets"
3. Add each of the three keys mentioned above
4. Restart your application

## Using Push Notifications

Once VAPID keys are configured:

1. Sign in to the app (push notifications require authentication)
2. Go to the "Settings" tab
3. Click "Enable" to allow notifications
4. Click "Send Test Notification" to test

## PWA Features

### Offline Support

The app uses a runtime caching strategy with different approaches for different content types:

**Navigation requests (pages):**
- Network first with cache fallback
- When online: Fresh HTML is fetched and cached
- When offline: Cached HTML is served

**Static assets (JavaScript, CSS, images, fonts):**
- Cache first
- Cached versions are served immediately for faster loading
- Assets are cached when first fetched online

**API requests:**
- Network only (no caching to avoid stale data)
- Returns error response when offline

**Important**: You must visit the app online at least once before offline functionality is available. This allows the service worker to cache all necessary assets.

### Installing the App

On desktop browsers (Chrome, Edge, etc.):
- Look for an install icon in the address bar
- Click "Install" to add the app to your desktop

On mobile browsers:
- Open the browser menu
- Look for "Add to Home Screen" or "Install App"
- The app will appear on your home screen like a native app

## Sending Push Notifications from Code

You can send push notifications programmatically using the backend API:

```javascript
POST /api/push/send
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "title": "Task Reminder",
  "body": "You have 3 tasks due today!"
}
```

This will send a notification to all devices where the user has enabled notifications.

## Troubleshooting

### Notifications Not Working

1. Check that VAPID keys are set up correctly in Replit Secrets
2. Make sure you've granted notification permission in your browser
3. Check the browser console for error messages
4. Try the "Send Test Notification" button in Settings

### App Not Working Offline

**Important**: The app must be visited online at least once before it will work offline. This is because the service worker uses a runtime caching strategy that caches assets as they're loaded.

1. **First visit must be online**: Visit the app while connected to the internet
2. **Assets are cached automatically**: As you use the app, all JavaScript, CSS, and other assets are cached
3. **Subsequent visits work offline**: After the first online visit, the app will work offline
4. **Service worker status**: Check browser DevTools > Application > Service Workers to verify the service worker is active

This is standard behavior for PWAs using runtime caching strategies.

### Can't Install the App

1. The app must be served over HTTPS (Replit does this automatically)
2. The manifest.json must be valid
3. The service worker must be registered successfully

## PWA Manifest

The app's manifest is located at `/manifest.json` and includes:
- App name and description
- Theme colors (purple primary theme)
- Icon specifications
- Display mode (standalone)

You can customize the manifest to change the app's appearance when installed.
