# TrackMyLife — UI Specification

## 1. Layout Structure
- **Page grid (dashboard)**: `lg:grid-cols-[minmax(0,1fr)_320px]` with `gap-8`, padding `px-6 py-8`, max width `max-w-7xl`, centered `mx-auto`.
- **Top bar**: ProfileHeader + StatsGrid stacked vertically with `mt-4` below header.
- **Main columns**:
  - **Left**: TimeViewToggle, heatmap (year/month/week), HeatmapLegend.
  - **Right**: LogPanel (date, score buttons, note, submit, feedback, recent list).
- **Mobile**: Columns stack; heatmap precedes LogPanel.

## 2. Component Hierarchy
- **DashboardPage**
  - ProfileHeader
  - StatsGrid
  - Content grid (left/right)
    - Left
      - TimeViewToggle
      - HeatmapYear | HeatmapMonth | HeatmapWeek (conditional by viewMode)
      - HeatmapLegend
    - Right
      - LogPanel (memoized)
  - DayDetailModal (portal overlay)
- **Shared helpers**: dashboard-helpers (buildYearMonthBlocks, buildMonthGrid, buildCurrentWeek, getScoreColor, getCellStyle, getCellTooltip, computeStats).

## 3. Heatmap Design
### 3.1 Year View (HeatmapYear)
- **Layout**: 12 month blocks in horizontal `inline-flex min-w-max items-start gap-1.5`.
- **Month block**:
  - Label button (`text-[11px] font-medium text-zinc-500 hover:text-zinc-900 mb-2`) to jump to month view.
  - Grid: `grid` with `gridTemplateColumns: repeat(weekCount, 11px)`, `gridTemplateRows: repeat(7, 11px)`, `gap: 2.5px`.
  - Each column = week; each row = day (0=Sun..6=Sat).
  - Empty leading/trailing cells for days outside the month (transparent background).
- **Cell size**: 11px x 11px, rounded `[2px]`.
- **Placement**: Explicit `gridColumnStart: col+1`, `gridRowStart: row+1` (no auto-flow dependence).
- **Colors**: via `getScoreColor(score)` (10 unique colors). Empty uses muted gray with opacity rules.
- **Today**: `border border-sky-700` with `borderWidth: 1.5px`.
- **Hover**: `transition`, `hover:scale-[1.06]` for clickable cells only.
- **Cursor**: `cursor-pointer` only if cell has entry; otherwise `cursor-default`.
- **Tooltip**: `title={getCellTooltip(cell)}`.

### 3.2 Month View (HeatmapMonth)
- Grid: `inline-grid grid-cols-[repeat(7,36px)] gap-1.5`.
- Cell size: `h-9 w-9`, rounded `rounded-md`, text `[11px] font-medium`.
- Day numbers shown for in-month cells; empty cells blank.
- Today border: `border-sky-700` with `borderWidth: 1.5px`.
- Colors: `getCellStyle` (logged color, muted gray for unlogged with opacity). Text white when entry exists; text zinc-600 otherwise.
- Hover scale: `hover:scale-105` for clickable cells.

### 3.3 Week View (HeatmapWeek)
- Grid: `grid grid-cols-7 gap-3`.
- Cell size: `h-14 w-14`, `rounded-lg`, `font-mono text-sm font-semibold`.
- Shows score text when logged; blank otherwise.
- Today border: `border-sky-700` with `borderWidth: 1.5px`.
- Hover scale: `hover:scale-[1.03]` for clickable cells.

### 3.4 Colors & States
- Score colors (1→10): `[#7f0000, #c0392b, #e74c3c, #e67e22, #f39c12, #f1c40f, #90ee90, #27ae60, #1abc9c, #0d4d3d]`.
- Unlogged past: `background: var(--muted, #94a3b8)`, `opacity: 0.6`.
- Unlogged future: same muted, `opacity: 0.3`.
- Empty placeholders: `background: transparent`, `opacity: 1`.
- Today outline: `border-sky-700`, `borderWidth: 1.5px` (even when filled).

### 3.5 Legend (HeatmapLegend)
- Horizontal bar: labels `1` and `10` flanking 10 thin chips `h-3 w-2 rounded-[1px]` using the score palette.

## 4. Interaction Behavior
- **Month label click (Year view)**: calls `onMonthClick(monthIndex)` → switch to month view and set active month.
- **Cell click**: only if `cell.entry` exists; opens DayDetailModal with that entry.
- **Hover on cells**: shows native tooltip (date + score + note preview up to 70 chars). Non-interactive empty cells can be title-empty.
- **Toggle buttons (TimeViewToggle)**: switch `viewMode` among year/month/week.
- **LogPanel score buttons**: set score state; show ring when selected.
- **LogPanel date change**: loads existing entry for that date if present, updates note/score accordingly.
- **Save**: upsert entry; show inline success (emerald) or error (red). Disable button during save/loading.
- **Modal close**: via Close button; modal overlay covers viewport with `bg-black/40`.

## 5. Styling Rules (Tailwind)
- **Panels**: `rounded-xl border border-zinc-200 bg-white shadow-sm` (LogPanel), minimal borders elsewhere.
- **Typography**: Labels `text-xs uppercase tracking-wide text-zinc-500`; headings `text-base font-semibold text-zinc-900`; body `text-sm text-zinc-600`.
- **Spacing**: Primary gaps `gap-8` columns, `mt-4` between stacked sections, `mt-6` for major blocks.
- **Buttons (score)**: `h-9 rounded-md text-sm font-semibold transition`; ring on selected `ring-2 ring-zinc-900 ring-offset-1`; text color dark for scores ≤5, white otherwise.
- **Inputs**: `rounded-md border border-zinc-300 px-2.5 py-2 text-sm outline-none ring-sky-500 focus:ring`.
- **Heatmap cells**: sizes noted above; transitions on scale only for interactive cells.
- **Legend**: compact chips `w-2` to fit 10 colors inline.
- **Shadows**: `shadow-sm` only on cards/panels; avoid heavy shadows elsewhere.
- **Muted token**: `--muted: #94a3b8` defined in globals.

## 6. Accessibility & Feedback
- **Focusable controls**: buttons/inputs use native focus; add `ring-sky-500` on focus (in inputs) and rely on ring styles for selected score.
- **ARIA labels**: Heatmap cells use `aria-label={getCellTooltip(cell)}` for screen readers.
- **Disabled states**: Save button disabled during save/loading, `disabled:cursor-not-allowed disabled:opacity-70`.
- **Tooltips**: Use native `title` for quick hint; note previews truncated to 70 chars.

## 7. Performance Considerations
- **Memoization**: LogPanel wrapped in `React.memo` to avoid re-rendering heatmaps on note input.
- **Explicit placement**: Heatmap uses `gridColumnStart`/`gridRowStart` to bypass auto-flow cost and ensure correctness.
- **Data fetch**: Limit entries to 500; use memoized helpers for computed grids.

## 8. Responsive Behavior
- **Mobile**: Columns stack; heatmap retains horizontal scroll where needed (`overflow-x-auto`).
- **Desktop**: Two-column layout with fixed right width (320px) and flexible left area.

## 9. Future Extensions (optional guidelines)
- **Public badge toggle**: Add a small switch in ProfileHeader; keep consistent sizing and typography.
- **Caching layer**: SWR/TanStack Query for entries; avoid blocking UI during fetch.
- **Timezone selector**: If added, place in ProfileHeader as a light inline control.

## 10. Implementation Checklist
- Ensure all heatmap cells use `getScoreColor` + `getCellStyle` for consistency.
- Keep today outline applied regardless of entry state.
- Preserve hover scale only on clickable (has entry) cells.
- Maintain 11px cell size and 2.5px gap for year blocks.
- Use the exact score palette across buttons, legend, and cells.
