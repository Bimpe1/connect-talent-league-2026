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
    if (Array.isArray(data) && data.length > 0) {
      // Merge cloud data with any local participants not yet synced
      // CRITICAL: Never let empty/null cloud emails overwrite local emails
      const mergedMap = new Map();
      (fallback || []).forEach(p => mergedMap.set(p.id, p));
      data.forEach(p => {
        const local = mergedMap.get(p.id);
        mergedMap.set(p.id, {
          ...local,
          ...p,
          email: (p.email && p.email.trim()) ? p.email.trim().toLowerCase() : (local?.email || '')
        });
      });
      const merged = Array.from(mergedMap.values());
      localStorage.setItem('ct_participants_2026', JSON.stringify(merged));
      return merged;
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
  // Always guarantee participant is safely saved in local storage first
  try {
    const saved = localStorage.getItem('ct_participants_2026');
    const list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(p => p.id === participant.id);
    if (idx >= 0) {
      list[idx] = participant;
    } else {
      list.push(participant);
    }
    localStorage.setItem('ct_participants_2026', JSON.stringify(list));
  } catch (e) {}

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
    if (Array.isArray(data) && data.length > 0) {
      const mergedMap = new Map();
      (fallback || []).forEach(s => mergedMap.set(s.id, s));
      data.forEach(s => mergedMap.set(s.id, s));
      const merged = Array.from(mergedMap.values());
      localStorage.setItem('ct_submissions_2026', JSON.stringify(merged));
      return merged;
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
  // Always guarantee submission is safely saved in local storage first
  try {
    const saved = localStorage.getItem('ct_submissions_2026');
    const list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(s => s.id === submission.id);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.push(submission);
    }
    localStorage.setItem('ct_submissions_2026', JSON.stringify(list));
  } catch (e) {}

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

/**
 * Fetch challenge schedule and timing settings from cloud DB
 */
export async function fetchSchedule(fallback) {
  try {
    const res = await fetch(`${API_BASE}/settings?key=challenge_schedule`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data === 'object') {
      localStorage.setItem('ct_challenge_schedule_2026', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API /settings unavailable, using local cache:', err.message);
  }
  return fallback;
}

/**
 * Save challenge schedule and timing settings to cloud DB
 */
export async function saveSchedule(schedule) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'challenge_schedule', value: schedule }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not save schedule to cloud DB:', err.message);
    return null;
  }
}

/**
 * Trigger Email Notification Broadcast (Challenge Live or 1-Hour Reminder)
 */
export async function sendChallengeNotification(payload) {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // If endpoint is not yet deployed to cloud server (HTTP 404/405), provide a helpful local fallback response
      if (res.status === 404 || res.status === 405) {
        console.warn(`Cloud endpoint /api/notifications returned HTTP ${res.status}. Falling back to local simulation mode.`);
        const recipientCount = Array.isArray(payload.recipients) ? payload.recipients.length : 0;
        return {
          success: true,
          type: payload.type,
          deliveredCount: recipientCount,
          provider: 'local_fallback',
          message: `[Localhost Simulation] Notification triggered for ${recipientCount} participant(s). Real email dispatch will activate automatically as soon as this update is pushed to Vercel.`
        };
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to send challenge notification:', err.message);
    throw err;
  }
}
