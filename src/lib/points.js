export const WEEK_KEYS = ['wk1', 'wk2', 'wk3', 'wk4'];
export const ATTENDANCE_BONUS = 10;

export const attendanceCount = (p) => WEEK_KEYS.filter((k) => p?.attendance?.[k]).length;

// Total League Points = approved challenge points + 10 per attended Thursday session
export const totalPoints = (p) =>
  WEEK_KEYS.reduce((sum, k) => sum + (p?.[k] || 0), 0) + attendanceCount(p) * ATTENDANCE_BONUS;

// Team score is fair per-member average, not a raw sum (small teams aren't penalised)
export const teamAverage = (members) =>
  members.length ? Math.round((members.reduce((s, m) => s + totalPoints(m), 0) / members.length) * 10) / 10 : 0;
