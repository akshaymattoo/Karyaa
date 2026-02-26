# Karyaa - Progressive Web App To-Do

## Overview
A beautiful React + TypeScript Progressive Web App (PWA) with smart task management, Google authentication via Supabase, and push notifications. Users can manage up to 8 tasks per day across Work and Personal buckets without login. Sign in unlocks Scratchpad (infinite inbox), Calendar views, and push notification settings.

## Project Architecture

### Frontend
- **React + TypeScript** with Vite
- **Tailwind CSS** with purple and white design system
- **Supabase Auth** for Google OAuth
- **Dual-mode persistence**: localStorage for anonymous users, Supabase for authenticated users
- **Five tabs**: Tasks (always available), Scratchpad (login-gated), Calendar (login-gated), Weekly Planner (login-gated), Settings (via avatar dropdown)
- **PWA Support**: Service worker for offline functionality and installability
- **Push Notifications**: Web Push API with VAPID authentication

### Backend
- **Express.js** API server
- **Drizzle ORM** with PostgreSQL (Supabase)
- **REST API** for tasks and scratchpad CRUD operations
- **Automatic data migration** from localStorage to cloud on first login

### Database Schema
- `tasks` table: id, userId, title, bucket (work/personal), date, completed, createdAt, updatedAt
- `scratchpad` table: id, userId, title, createdAt
- `push_subscriptions` table: id, userId, endpoint, p256dh, auth, createdAt
- `user_settings` table: id, userId, reminderTime, reminderEnabled, lastReminderSent, createdAt, updatedAt
- `weekly_activities` table: id, userId, weekStart, title, targetCount, category, createdAt, updatedAt (activities are week-specific)
- `weekly_completions` table: id, activityId, userId, date, createdAt

## Setup Instructions

### 1. Supabase Configuration
You need to set up a Supabase project and configure Google OAuth:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. **Enable Google OAuth:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials (Client ID and Secret)
   - Add authorized redirect URLs (Supabase will show you what to add)
4. **Get API credentials:**
   - Go to Project Settings → API
   - Copy **Project URL** → Set as `VITE_SUPABASE_URL`
   - Copy **anon/public key** → Set as `VITE_SUPABASE_ANON_KEY`
   - Copy **service_role key** → Set as `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client)
5. **Get Database URL:**
   - Go to Project Settings → Database
   - Copy the connection string under "Connection pooling"
   - Set as `DATABASE_URL`

### 2. Environment Variables
The following secrets are required:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key for secure server-side auth verification

### 3. Push Notifications Setup (Optional)
To enable push notifications, generate VAPID keys and add them to Replit Secrets:
```bash
npx web-push generate-vapid-keys
```
Then add these secrets:
- `VAPID_PUBLIC_KEY` - VAPID public key
- `VAPID_PRIVATE_KEY` - VAPID private key
- `VAPID_EMAIL` - Contact email (e.g., mailto:admin@karyaa.app)

See `PWA_SETUP.md` for detailed setup instructions.

## Features

### Tasks Tab (Always Available)
- Quick add form with title, bucket selector (Work/Personal), and date picker
- 8-task per day hard cap with validation
- Banner shows remaining task slots for the selected date
- Filter by All/Work/Personal
- Date navigation (previous day, today, next day)
- Three-column layout showing Work and Personal buckets
- Task completion toggle
- Delete tasks

### Scratchpad Tab (Login Required)
- Infinite inbox for capturing ideas
- "Send to Tasks" action that prompts for bucket + date
- Respects 8-task per day limit when sending to tasks
- Shows remaining slots for the selected date
- Auto-deletes from scratchpad when sent to tasks

### Calendar Tab (Login Required)
- Month view with per-day task counts
- Work and Personal count badges on each day
- Click day to view/edit/complete/delete tasks
- Side panel with task management

### Weekly Planner Tab (Login Required)
- Define weekly activities (e.g., "Eat blueberries", "Strength training 3x/week")
- **Week-specific activities**: Each week has its own independent set of activities
- Set target frequency for each activity (1-7 times per week)
- Categorize activities (Health, Fitness, Nutrition, Learning, Wellness, Other)
- Week view showing all 7 days with completion checkboxes
- Click to toggle completion for any day
- Progress bar showing completion vs target for the week
- Navigate between weeks (previous/next/current week)
- **Copy from Previous Week**: Empty weeks offer option to copy activities from previous week
- Edit and delete activities (changes only affect current week)
- Mobile-responsive layout

### Settings Tab (Login Required)
- Push notification management
- Enable/disable notifications with one click
- Test notification button to verify setup
- Permission status display
- Daily reminder settings
  - Set preferred notification time in your local timezone (default: 5:00 PM)
  - Times automatically convert to UTC for storage
  - Enable/disable daily reminders
  - Automatically sends notification if incomplete tasks exist at the set time
  - Displays your current timezone for reference

### Authentication
- Google Sign-In via Supabase Auth
- Automatic localStorage migration on first login
- User dropdown with sign out option

### PWA Features
- **Offline Support**: Network-first caching strategy with offline fallback
- **Installable**: Add to home screen on mobile and desktop
- **Push Notifications**: Receive notifications even when app is closed
- **Service Worker**: Automatic background sync and caching

## User Preferences
- Color scheme: Purple and white (Linear-inspired design)
- Design system: Clean, efficient, minimal cognitive load
- Typography: Inter for text, JetBrains Mono for dates
- Responsive design with mobile-first approach

## Native App (Capacitor)

Karyaa is configured for native iOS and Android builds via Capacitor. See `CAPACITOR_SETUP.md` for the full build guide.

- **App ID**: `com.karyaa.app`
- **Web directory**: `dist/public` (Vite build output)
- **Installed plugins**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/push-notifications`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`
- `client/src/lib/platform.ts` — runtime detection helpers (`isNative()`, `isIOS()`, `isAndroid()`)
- `usePushNotifications.ts` — detects native vs. web and uses the appropriate push system
- `App.tsx` — `CapacitorInit` component handles splash screen hide and Android back button
- `native_push_tokens` DB table — stores FCM/APNs tokens from native devices
- Backend endpoints: `POST /api/push/native/register` and `POST /api/push/native/unregister`

**To build locally:**
```bash
npm run build
npx cap add ios    # first time only
npx cap add android  # first time only
npx cap sync
npx cap open ios     # opens Xcode
npx cap open android # opens Android Studio
```

**FCM Server Key** (`FCM_SERVER_KEY`) is needed as an environment variable to send push notifications to native devices.

## Recent Changes
- 2026-01-09: Made weekly activities week-specific
  - Added weekStart column to weekly_activities table for week isolation
  - Each week now has its own independent set of activities
  - Changes to activities in one week don't affect other weeks
  - Added "Copy from Previous Week" feature for empty weeks
  - Duplicate prevention: copying only works if target week is empty
  - Backend validation prevents weekStart modification on updates
- 2026-01-04: Added Weekly Planner tab
  - New database tables: weekly_activities, weekly_completions
  - Define recurring activities with target frequency per week
  - Track daily completion with visual week grid
  - Progress bar shows completion rate
  - Categories: Health, Fitness, Nutrition, Learning, Wellness, Other
  - Week navigation (previous/next/current)
- 2025-11-08: UI/UX improvements and bug fixes
  - Moved Settings from separate tab to user profile dropdown menu
  - Created SettingsDialog component for better UX
  - Fixed push notification error with proper null checks for service worker registration
  - Settings now accessible via avatar dropdown: Avatar → Settings
- 2025-11-08: Added daily reminder notification system
  - Created user_settings table for storing notification preferences
  - Added lastReminderSent timestamp to prevent duplicate reminders on server restarts
  - Implemented scheduled task that checks every minute for users needing reminders
  - Database-backed duplicate prevention ensures users receive at most one reminder per day
  - Added API endpoints for managing reminder time preferences with validation
  - Updated Settings UI with daily reminder time picker and enable/disable toggle
  - Reminders sent only if user has incomplete tasks for the day
  - Only updates lastReminderSent timestamp when at least one push notification succeeds
- 2025-11-03: Converted to Progressive Web App (PWA)
  - Added manifest.json for installability
  - Implemented service worker with offline support
  - Added push notification system with VAPID authentication
  - Created Settings tab for notification management
  - Added push_subscriptions table to database
  - Implemented notification API endpoints
- 2025-10-04: Changed task limit from 8 tasks total to 8 tasks per day
  - Backend validation now checks limit per date
  - Frontend task counter shows remaining slots for selected date
  - Scratchpad "Send to Tasks" respects per-day limit
  - Migration logic enforces per-day limits when migrating from localStorage
- 2025-10-04: Initial implementation with all MVP features
- Schema defined with tasks and scratchpad tables
- Full frontend built with exceptional visual quality
- Backend API implemented with Supabase integration
- Dual-mode persistence with automatic migration logic
