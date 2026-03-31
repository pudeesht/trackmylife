# TrackMyLife — Project Context

## Overview

**TrackMyLife** is a **minimal daily life tracking application** where users log a subjective score (1–10) for each day, optionally add notes, and visualize their entire year as an interactive contribution-style heatmap.

**Target Audience:** Students and young adults tracking daily well-being, mood, productivity, or life quality.

**Design Philosophy:** Minimal, clean, and zero-friction. No task lists, reminders, or heavy UI. Focus on data visualization and ease of entry.

---

## Core Features (V1 MVP)

### ✅ Implemented
1. **Authentication**
   - Email/password signup and login via Supabase
   - Session-based persistent auth
   - Protected dashboard routes

2. **Daily Entry Logging**
   - Score selector: 1–10 with color-coded buttons
   - Optional note field (up to 500 chars)
   - Date picker for logging past/future entries
   - Edit existing entries by selecting date

3. **Heatmap Visualization**
   - **Year View:** 12 month blocks side by side
     - Each month shows weeks as columns (Sunday → Saturday rows)
     - First day aligns to correct weekday row
     - Empty rows at month start/end for partial weeks
     - Small visual gap between month blocks
   - **Month View:** Full calendar grid with day numbers
   - **Week View:** Current week with 7 large cells showing scores
   - All views show today with 1.5px outline
   - Click any logged cell to view full entry in modal

4. **Color Gradient (10-Unique Scores)**
   - 1: #7f0000 (dark red)
   - 2: #c0392b (red)
   - 3: #e74c3c (orange-red)
   - 4: #e67e22 (orange)
   - 5: #f39c12 (amber)
   - 6: #f1c40f (yellow)
   - 7: #90ee90 (light green)
   - 8: #27ae60 (medium green)
   - 9: #1abc9c (teal)
   - 10: #0d4d3d (dark teal)
   - Unlogged past: muted gray (#94a3b8) with 60% opacity
   - Future (unlogged): same muted with 30% opacity

5. **Statistics Dashboard**
   - Days Logged (×/365)
   - Average Rating (0.0–10.0)
   - Best Streak (consecutive logged days)
   - Green Days (score ≥ 7)
   - Monospace numeric display

6. **Entry Management**
   - Recent entries list (5 most recent, clickable to modal)
   - Day detail modal with full entry, score color, and note
   - Inline feedback: save confirmation, error messages

7. **Public/Private Concept**
   - Profile header shows "Public" badge (not enforced in V1)
   - Placeholder for future sharing features

### ❌ Not in V1
- Reminders or task lists
- Social features / sharing
- Export / data download
- Dark mode
- Multi-language support
- Best / Worst days section (was removed in redesign)

---

## Tech Stack

### Frontend
- **Framework:** Next.js v16 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS v4 + PostCSS
- **Form State:** React hooks (useState, useCallback, useMemo)
- **Performance:** React.memo for memoized components (LogPanel)

### Backend & Data
- **Auth:** Supabase (email/password)
- **Database:** PostgreSQL (via Supabase)
- **API:** Supabase JS client v2
- **Security:** Row-level security (RLS) policies on `daily_entries` table
- **Schema:** `daily_entries(id, user_id, entry_date, score, note, created_at, updated_at)`
- **Unique Constraint:** `(user_id, entry_date)` for upsert behavior

### Build & Lint
- **Package Manager:** npm
- **Linter:** ESLint (with Tailwind class canonicalization)
- **Dev Server:** Next.js dev server

---

## Folder Structure

```
newprojects/
├── app/
│   ├── page.tsx                    # Home landing page (CTA + session info)
│   ├── auth/
│   │   └── page.tsx                # Login/signup form
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard container (year/month/week toggle, save logic)
│   ├── layout.tsx                  # Root layout with auth check
│   └── globals.css                 # Global CSS variables (e.g., --muted token)
│
├── components/
│   └── dashboard/
│       ├── dashboard-types.ts       # TypeScript types (DailyEntry, DayCell, YearMonthBlock, etc.)
│       ├── dashboard-helpers.ts     # Heatmap builders, color logic, stats compute
│       ├── LogPanel.tsx             # Memoized right-side form (date, score, note, save)
│       ├── HeatmapYear.tsx          # 12-month block renderer (month drilldown)
│       ├── HeatmapMonth.tsx         # Full calendar month view
│       ├── HeatmapWeek.tsx          # Current week (7 large cells)
│       ├── HeatmapLegend.tsx        # Color gradient legend (1–10)
│       ├── ProfileHeader.tsx        # Top minimal bar (initials, username, Public badge, logout)
│       ├── StatsGrid.tsx            # Top-level 4-stat display (inline, monospace)
│       ├── TimeViewToggle.tsx       # Year/Month/Week segmented toggle control
│       ├── DayDetailModal.tsx       # Fullscreen modal showing single entry details
│       ├── RecentEntriesList.tsx    # Right sidebar list (5 most recent, score chips)
│       └── BestWorstSection.tsx     # (Exists but unused in current layout)
│
├── lib/
│   └── supabase/
│       └── client.ts                # Supabase JS client init
│
├── supabase/
│   └── day3_daily_entries.sql       # Migration: daily_entries table + RLS policies
│
├── .env.local.example               # Template for Supabase keys
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind v4 config
├── postcss.config.js                # PostCSS config
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies and scripts
└── README.md                         # Quick start guide
```

---

## UI/UX Vision & Design Preferences

### Layout
- **Two-column grid:** Left = heatmap area, Right = 320px log panel
- **Responsive:** Stacks on mobile, side-by-side on desktop (lg breakpoint)

### Visual Language
- **Palette:** Zinc grays (#111827–#fafafa), plus score colors
- **Spacing:** Generous (gap-8 between columns, mt-4 between sections)
- **Borders:** Minimal, only where needed (1px zinc-200 on panels, 1.5px on today cell)
- **Shadows:** Subtle (shadow-sm on cards only)
- **Typography:** System fonts, sans-serif; monospace for numbers

### Component Behavior
- **Heatmap cells:** 11px × 11px, 2.5px gap; ~50ms hover scale(1.06)
- **Logo buttons:** Colored background, dark text for light scores (≤5), white for dark (6–10)
- **Modals:** Fixed overlay, dismiss with button
- **Forms:** Inline validation, brief feedback messages (text-emerald-700 success, text-red-600 error)

### Constraints
- **No modals on load.** Session check happens in bg; user sees page before any popups.
- **No auto-save.** Explicit save button; one-click updates past entries.
- **No animations beyond hover.** Smooth transitions on color/opacity; no spinning loaders.
- **Minimal text.** Labels uppercase and small (text-xs, tracking-wide); help text concise.

---

## Data Model

### `daily_entries` Table
```sql
CREATE TABLE daily_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX daily_entries_user_date_idx ON daily_entries(user_id, entry_date);
-- RLS: Allow users to read/write only their own entries
```

### Frontend Types (TypeScript)
- **DailyEntry:** `{id, user_id, entry_date, score, note, created_at, updated_at}`
- **DayCell:** `{dateKey, date, col, row, dayNumber, isEmpty, isInCurrentYear, isFuture, isToday, entry?}`
- **YearMonthBlock:** `{label, monthIndex, weekCount, cells[]}`
- **DashboardStats:** `{daysLogged, averageRating, bestStreak, greenDays}`
- **ViewMode:** `"year" | "month" | "week"`

---

## Current Progress & Status

### ✅ Completed
- [x] Project bootstrap (Next.js, Supabase, Tailwind, TypeScript)
- [x] Auth flow (login/signup/logout, protected routes)
- [x] Database schema, RLS policies, upsert logic
- [x] Year-grid rendering with column-major week mapping
- [x] Heatmap bug fix (explicit grid placement to fix cell ordering)
- [x] Month-block redesign (12 separate month grids instead of 1 giant 53-column grid)
- [x] 10-color gradient (unique color per score 1–10)
- [x] Input lag fix (memoized LogPanel component)
- [x] Heatmap legend (gradient display)
- [x] Month/week view toggle
- [x] Entry modal with rich detail display
- [x] Recent entries list with score chips
- [x] Stats dashboard (inline, monospace)
- [x] Responsive two-column layout
- [x] Lint passing

### 🔄 In Progress / Next Steps
- **Future enhancements:** Public/private profile toggles, streak tracking UI, export data
- **Testing:** Integration tests, e2e tests for auth flow
- **Performance:** Monitor heatmap render time with large entry counts
- **Documentation:** Inline code comments, deployment guide

### ⚠️ Known Limitations
- **No offline support.** All data is live from Supabase.
- **No caching layer.** Every page load fetches fresh entries. (Could add SWR/TanStack Query.)
- **Mobile experience.** Heatmap is readable on mobile but tight; consider larger cells on small screens.
- **Timezone handling.** Uses browser timezone; no timezone picker yet.

---

## Development Notes

### Key Helpers & Utilities

**`dashboard-helpers.ts`**
- `toDateKey(date)` — Format date as `YYYY-MM-DD` with timezone awareness
- `buildYearMonthBlocks(year, entries, today)` — Generate 12 month blocks with week/day grid layout
- `getScoreColor(score)` — Return hex color for score 1–10
- `getCellStyle(cell)` — Compute CSS style (background, opacity) for cell
- `getCellTooltip(cell)` — Format hover text with date, score, note preview
- `computeStats(entries, year)` — Calculate avg, streak, green days for a year
- `getRecentEntries(entries)` — Sort and slice last 5 entries

**Component Memoization**
- `LogPanel` is wrapped in `React.memo()` to prevent re-render on heatmap state changes
- Score/note changes are isolated and only update the form, not the heatmap

### Color & Styling Decisions
- **Score colors:** Intentional gradient from dark red (1) → dark teal (10) to match feelings
- **Muted unlogged:** Consistent gray for visual consistency; opacity varies (60% past, 30% future)
- **Today outline:** Sky-700 (bright blue) at 1.5px to be noticeable without overwhelming

### Common Patterns
- **Upsert on save:** `supabase.from("daily_entries").upsert({...}, {onConflict: "user_id,entry_date"})`
- **Optimistic updates:** After save, refetch entire entry list to sync state
- **Error display:** Brief messages in red text below buttons; non-blocking
- **Loading state:** Disable buttons, show "Saving..." text

---

## Deployment & Environment

### Required Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Build & Run
```bash
npm install
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
```

### Supabase Setup
1. Create a new Supabase project
2. Run migration: `supabase/day3_daily_entries.sql`
3. Enable RLS policies (all policies are in migration file)
4. Copy API keys to `.env.local`

---

## Future-AI Context

If you're an AI assistant reading this in a future conversation:
1. **This is a V1 MVP.** Core features work; no edge cases hardened yet.
2. **Design is intentional.** Minimal UI, no overengineering; ask before adding features.
3. **Heatmap is sacred.** All design decisions revolve around making it clear and readable.
4. **Auth works but basic.** No 2FA, social login, or password reset yet.
5. **Timezone handling:** Be careful with date parsing; always use the `toDateKey()` helper.
6. **Performance:** Month blocks are efficient; watch out for large heatmaps (100+ entries).
7. **User is learning.** Transparency and iterative feedback are valued over polish.

---

## Summary

TrackMyLife is a **minimal, focused daily tracker** with a **LeetCode-style contribution heatmap** as its centerpiece. The stack is **modern and simple** (Next.js + Supabase), and the design is **clean and intentional**. All core MVP features are working; the next phase is likely testing, mobile refinement, and social features.

**Last Updated:** April 1, 2026
