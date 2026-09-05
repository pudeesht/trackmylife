// What's-new / release notes.
//
// Release notes describe a deploy, so they live in code and ship with the
// change they announce — adding one is a single entry here, no database or
// admin screen. Newest first. Give every entry a unique, ever-increasing `id`
// (just bump the highest one); the dashboard uses the max id to decide whether
// to show the "new" dot, so ids must never be reused or reordered.

export type ChangelogTag = "new" | "improved" | "fixed";

export type ChangelogEntry = {
  id: number;
  date: string; // YYYY-MM-DD, for display only
  tag: ChangelogTag;
  title: string;
  description?: string;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 8,
    date: "2026-09-06",
    tag: "improved",
    title: "Your weekly priority, up front",
    description:
      "Set up to 3 priorities for the week - they now sit at the top of the dashboard in every view instead of hiding in the week tab. Each Sunday they clear for a fresh set, and you write one recap of how the week actually went instead of an update every single day.",
  },
  {
    id: 7,
    date: "2026-08-31",
    tag: "improved",
    title: "Points in your daily note",
    description:
      "Start any line with -- and it shows up as a bullet point. Write a paragraph instead if that is more your thing - the note box takes both, and your old notes are untouched.",
  },
  {
    id: 6,
    date: "2026-07-30",
    tag: "new",
    title: "Track your own metrics",
    description:
      "Create up to two custom metrics — like water, distance run, or deep-work minutes — log them each day (decimals welcome), and watch them trend alongside bedtime and Instagram.",
  },
  {
    id: 5,
    date: "2026-07-21",
    tag: "new",
    title: "Explore feed",
    description:
      "Browse public Daymaps without knowing a username. Sorted by who has been logging most this week.",
  },
  {
    id: 4,
    date: "2026-07-21",
    tag: "new",
    title: "Forgot your password?",
    description: "Reset it from the login page via an emailed recovery link.",
  },
  {
    id: 3,
    date: "2026-07-20",
    tag: "improved",
    title: "Clearer signup",
    description: "Signup now says plainly to confirm your email before logging in.",
  },
  {
    id: 2,
    date: "2026-07-18",
    tag: "new",
    title: "Public profile trends",
    description: "Public profiles now show bedtime and Instagram-time trends alongside the heatmap.",
  },
  {
    id: 1,
    date: "2026-07-15",
    tag: "improved",
    title: "Dashboard refresh",
    description: "Reworked dashboard with trend charts, a theme toggle, and daily metrics.",
  },
];

/** Highest id in the log, i.e. the newest entry. 0 when the log is empty. */
export const LATEST_CHANGELOG_ID = CHANGELOG.reduce((max, entry) => Math.max(max, entry.id), 0);
