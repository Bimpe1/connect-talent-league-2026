// Vercel Serverless Database Client with LocalStorage Fallback

const API_BASE = '/api';

/**
 * Fetch all participants from Vercel Postgres DB (fallback to localStorage)
 */
export async function fetchParticipants(fallback = []) {
  try {
    const res = await fetch(`${API_BASE}/participants`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem('ct_participants_2026', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API /participants unavailable, using local storage cache:', err.message);
  }
  return fallback;
}

/**
 * Save / Update participant to Vercel Postgres DB
 */
export async function saveParticipant(participant) {
  try {
    const res = await fetch(`${API_BASE}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participant),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not save participant to cloud DB, kept in localStorage:', err.message);
    return null;
  }
}

/**
 * Fetch all submissions from Vercel Postgres DB
 */
export async function fetchSubmissions(fallback = []) {
  try {
    const res = await fetch(`${API_BASE}/submissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem('ct_submissions_2026', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API /submissions unavailable, using local storage cache:', err.message);
  }
  return fallback;
}

/**
 * Save / Update submission in Vercel Postgres DB
 */
export async function saveSubmission(submission) {
  try {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not save submission to cloud DB, kept in localStorage:', err.message);
    return null;
  }
}

/**
 * Fetch all registered captains
 */
export async function fetchCaptains(fallback = []) {
  try {
    const res = await fetch(`${API_BASE}/captains`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem('ct_captains_2026', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API /captains unavailable, using local storage cache:', err.message);
  }
  return fallback;
}

/**
 * Save / Register captain in Vercel Postgres DB
 */
export async function saveCaptain(captain) {
  try {
    const res = await fetch(`${API_BASE}/captains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(captain),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not save captain to cloud DB, kept in localStorage:', err.message);
    return null;
  }
}

/**
 * Fetch curriculum weeks from cloud DB
 */
export async function fetchWeeks(fallback = []) {
  try {
    const res = await fetch(`${API_BASE}/weeks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem('ct_league_weeks_2026', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API /weeks unavailable, using local storage cache:', err.message);
  }
  return fallback;
}

/**
 * Save updated curriculum week to cloud DB
 */
export async function saveWeek(weekNumber, weekData) {
  try {
    const res = await fetch(`${API_BASE}/weeks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber, weekData }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not save week to cloud DB, kept in localStorage:', err.message);
    return null;
  }
}
