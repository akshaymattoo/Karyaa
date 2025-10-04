# TaskFlow - To-Do App with Feature Gating

## Overview
A beautiful React + TypeScript to-do application with smart task management, Google authentication via Supabase, and feature gating. Users can manage up to 8 tasks per day across Work and Personal buckets without login. Sign in unlocks Scratchpad (infinite inbox) and Calendar views.

## Project Architecture

### Frontend
- **React + TypeScript** with Vite
- **Tailwind CSS** with purple and white design system
- **Supabase Auth** for Google OAuth
- **Dual-mode persistence**: localStorage for anonymous users, Supabase for authenticated users
- **Three tabs**: Tasks (always available), Scratchpad (login-gated), Calendar (login-gated)

### Backend
- **Express.js** API server
- **Drizzle ORM** with PostgreSQL (Supabase)
- **REST API** for tasks and scratchpad CRUD operations
- **Automatic data migration** from localStorage to cloud on first login

### Database Schema
- `tasks` table: id, userId, title, bucket (work/personal), date, completed, createdAt
- `scratchpad` table: id, userId, title, createdAt

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
5. **Get Database URL:**
   - Go to Project Settings → Database
   - Copy the connection string under "Connection pooling"
   - Set as `DATABASE_URL`

### 2. Environment Variables
The following secrets are required (already configured in Replit Secrets):
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

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

### Authentication
- Google Sign-In via Supabase Auth
- Automatic localStorage migration on first login
- User dropdown with sign out option

## User Preferences
- Color scheme: Purple and white (Linear-inspired design)
- Design system: Clean, efficient, minimal cognitive load
- Typography: Inter for text, JetBrains Mono for dates
- Responsive design with mobile-first approach

## Recent Changes
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
