# Design Guidelines: To-Do App with Feature Gating

## Design Approach
**System Selected**: Linear-inspired productivity design with Material Design form patterns
**Justification**: Productivity tools require clarity, efficiency, and minimal cognitive load. Linear's clean aesthetics combined with Material's robust form components create an optimal task management experience.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary Purple: 270 70% 55% (interactive elements, CTAs, active states)
- Purple Subtle: 270 60% 97% (backgrounds, hover states)
- Purple Border: 270 30% 85% (dividers, input borders)
- Neutral Dark: 270 5% 15% (primary text)
- Neutral Medium: 270 5% 50% (secondary text)
- Neutral Light: 270 5% 95% (surface backgrounds)
- White: 0 0% 100% (main background)
- Success Green: 142 70% 45% (completed tasks)
- Warning Amber: 38 90% 50% (approaching limits)
- Error Red: 0 70% 55% (validation errors)

**Dark Mode:**
- Primary Purple: 270 65% 65% (interactive elements)
- Purple Subtle: 270 40% 12% (backgrounds)
- Purple Border: 270 20% 25% (dividers)
- Neutral Light: 270 5% 90% (primary text)
- Neutral Medium: 270 5% 60% (secondary text)
- Surface Dark: 270 5% 10% (card backgrounds)
- Background Dark: 270 5% 6% (main background)

### B. Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace Font**: JetBrains Mono (for dates/time)

**Scale:**
- Hero/Empty State: text-3xl font-semibold (30px)
- Tab Headers: text-2xl font-semibold (24px)
- Section Headers: text-lg font-medium (18px)
- Task Titles: text-base font-medium (16px)
- Body/Labels: text-sm font-normal (14px)
- Metadata/Counts: text-xs font-medium (12px)

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 1, 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Card spacing: p-4 internally, gap-3 between items
- Form field spacing: gap-4 vertically
- Tab content padding: px-6 py-8

**Container Strategy:**
- Max width: max-w-6xl mx-auto (1152px)
- Mobile: px-4, Desktop: px-6
- Three-column task grid on desktop (grid-cols-3), single column mobile

### D. Component Library

**Navigation & Tabs:**
- Horizontal tab bar with pill-style active state (purple background)
- Lock icon with tooltip for gated features (Scratchpad, Calendar)
- User avatar dropdown in top-right (login/logout)
- Tab indicator: 2px bottom border + background fill for active state

**Task Cards:**
- Compact card design with subtle borders (border border-purple-200)
- Checkbox (custom styled) aligned left
- Task title (truncate with ellipsis if > 2 lines)
- Bucket badge (small pill: Work in purple, Personal in indigo variant)
- Date display in monospace font, right-aligned
- Hover state: slight purple tint background (bg-purple-50)
- Completed state: text-gray-400 line-through

**Forms & Inputs:**
- Quick Add Form: inline horizontal layout on desktop (title + bucket dropdown + date picker + submit)
- Mobile: stacked vertical layout with full-width inputs
- Input fields: border-2 with focus:ring-2 ring-purple-500
- Date picker: calendar popover with today highlight in purple
- Bucket selector: segmented control (Work/Personal toggle)
- Error states: red border + error message below in text-sm text-red-600

**Calendar View:**
- Month grid: 7-column layout (Sunday-Saturday)
- Day cells: square aspect ratio with date number top-left
- Task count badges: small pills showing Work (purple) and Personal (indigo) counts
- Current day: purple border ring
- Selected day: purple background with white text
- Click interaction: slide-in side panel (desktop) or bottom sheet (mobile) for day details

**Scratchpad:**
- Infinite scroll list with generous spacing (gap-3)
- Each item: white card with shadow-sm, quick "Send to Tasks" button (icon + text)
- Send to Tasks modal: centered dialog with bucket + date selection, shows remaining task slots (8 - current count)
- Empty state: centered illustration with "Start capturing ideas" message

**Empty States:**
- Centered layout with icon (heroicons outline), heading, description, and primary action
- Tasks empty: "No tasks yet" + "Add your first task" button
- Scratchpad (locked): Lock icon + "Sign in to unlock Scratchpad" + Google sign-in button
- Calendar (locked): Lock icon + "Sign in to view your calendar"

**Validation & Alerts:**
- Task limit warning (7/8 tasks): Amber banner at top "1 slot remaining"
- Task limit reached (8/8): Red banner "Task limit reached. Complete or delete a task to add more."
- Blank title validation: Red border on input + inline error "Task title required"
- Toast notifications: bottom-right corner (success: green, error: red)

### E. Interactive Patterns
- **Filter Chips**: All/Work/Personal with active state (purple fill, white text)
- **Date Navigation**: Previous/Today/Next buttons for date filter (Tasks tab)
- **Smooth Transitions**: 150ms ease-in-out for hover states, 200ms for modal/dialog appearances
- **Loading States**: Skeleton screens matching card layouts (pulse animation)
- **Drag Interactions**: Subtle lift on hover (shadow-md) for draggable items

### F. Authentication States
- **Logged Out**: Show only Tasks tab, purple "Sign in with Google" button in top-right
- **Logged In**: Show all tabs, user avatar with dropdown (Profile, Sync Status, Sign Out)
- **First Login Migration**: Full-screen overlay with progress indicator "Syncing your tasks..."
- **Offline Indicator**: Small banner when disconnected "Offline mode - changes will sync when online"

### Images & Iconography
**Icons**: Heroicons (outline style) via CDN for consistency
- Tasks: CheckCircleIcon
- Scratchpad: DocumentTextIcon
- Calendar: CalendarIcon
- Login: LockClosedIcon (locked state), UserCircleIcon (logged in)

**No Hero Image**: This is a utility app, not a marketing page. Open directly to functional interface.

**Design Personality**: Clean, efficient, slightly playful with purple accents. Prioritize readability and quick task entry over decorative elements.