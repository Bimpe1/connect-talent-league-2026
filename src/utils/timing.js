// Challenge timing and open/lock schedule utilities

export const DEFAULT_SCHEDULE = {
  openTime: '09:00', // 9:00 AM
  closeTime: '21:00', // 9:00 PM
};

/**
 * Parses "HH:mm" into total minutes from midnight
 */
export function timeToMinutes(timeStr = '00:00') {
  const [h, m] = (timeStr || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
}

/**
 * Formats "HH:mm" into friendly 12h display string (e.g. "9:00 AM", "9:00 PM")
 */
export function formatTimeDisplay(timeStr = '00:00') {
  const [h, m] = (timeStr || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Calculates whether the daily challenge is currently open or locked based on captain's set hours
 */
export function getChallengeTiming(schedule = DEFAULT_SCHEDULE) {
  const openTime = schedule?.openTime || '09:00';
  const closeTime = schedule?.closeTime || '21:00';

  const now = new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const openTotal = timeToMinutes(openTime);
  const closeTotal = timeToMinutes(closeTime);

  // Check if current time is within [openTotal, closeTotal)
  const inWindow = currentTotal >= openTotal && currentTotal < closeTotal;

  if (inWindow) {
    const minutesRemaining = closeTotal - currentTotal;
    const isClosingSoon = minutesRemaining <= 60 && minutesRemaining > 0;

    return {
      isOpen: true,
      isClosingSoon,
      minutesRemaining,
      openTime,
      closeTime,
      openDisplay: formatTimeDisplay(openTime),
      closeDisplay: formatTimeDisplay(closeTime),
      status: isClosingSoon ? 'closing_soon' : 'open',
      badgeText: isClosingSoon
        ? `Closing Soon · ${minutesRemaining} min left (${formatTimeDisplay(closeTime)})`
        : `Submissions Open until ${formatTimeDisplay(closeTime)}`,
      reason: isClosingSoon
        ? `Submissions close in ${minutesRemaining} minutes at ${formatTimeDisplay(closeTime)}.`
        : `Open for submissions until ${formatTimeDisplay(closeTime)}.`
    };
  }

  // Outside window: locked until openTime
  return {
    isOpen: false,
    isClosingSoon: false,
    minutesRemaining: 0,
    openTime,
    closeTime,
    openDisplay: formatTimeDisplay(openTime),
    closeDisplay: formatTimeDisplay(closeTime),
    status: 'locked_schedule',
    badgeText: `Locked · Opens at ${formatTimeDisplay(openTime)}`,
    reason: `Submissions closed at ${formatTimeDisplay(closeTime)}. The next daily challenge opens at ${formatTimeDisplay(openTime)}.`
  };
}
