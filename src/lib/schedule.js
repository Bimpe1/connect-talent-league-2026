// Client-side view of the challenge schedule. The database (challenge_windows() + the
// submissions_gate trigger) is the source of truth; this just presents it and keeps countdowns live.

export const windowKey = (weekNumber, dayName) => `${weekNumber}-${dayName}`;

// Rows from challenge_windows() -> { "1-Monday": {opensAt, closesAt, ungated, locked, ...} }
export const indexWindows = (windows = []) =>
  Object.fromEntries(windows.map((w) => [windowKey(w.weekNumber, w.dayName), w]));

// 'open' | 'upcoming' | 'closed' | 'locked'. Unknown days are 'open' (the database still enforces).
export function challengeState(win, nowMs) {
  if (!win) return 'open';
  if (win.locked) return 'locked';
  if (win.ungated) return 'open';
  if (nowMs < win.opensAt) return 'upcoming';
  if (nowMs > win.closesAt) return 'closed';
  return 'open';
}

// Which week/day should the participant land on? The latest day that has opened.
export function currentSlot(windows = [], nowMs) {
  let slot = { week: 1, dayIndex: 0 };
  windows.forEach((w, i) => {
    if (w.opensAt <= nowMs) slot = { week: w.weekNumber, dayIndex: i % 7 };
  });
  return slot;
}

export const formatWhen = (ms, timeZone = 'Europe/London') =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone,
  }).format(ms);

export const formatTime = (ms, timeZone = 'Europe/London') =>
  new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).format(ms);

export function countdown(ms) {
  const mins = Math.max(0, Math.ceil(ms / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
