import { supabase } from './supabase';
import { dataUrlToBlob, baseMime } from './media';

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;

const fail = (error) => { if (error) throw error; };

// DB row (snake_case) -> shape the UI components already use
const toSubmission = (r) => ({
  id: r.id,
  participantId: r.participant_id,
  participantName: r.participant_name,
  teamName: r.team_name,
  weekNumber: r.week_number,
  challengeDay: r.challenge_day,
  challengeTitle: r.challenge_title,
  submissionText: r.submission_text,
  mediaType: r.media_type,
  attachedVoice: r.attached_voice,
  attachedMedia: r.attached_media,
  aiScore: r.ai_score,
  aiNotes: r.ai_notes,
  status: r.status,
  submittedAt: `${new Date(r.created_at).toLocaleDateString()} ${fmtTime(r.created_at)}`,
  approvedBy: r.approved_by,
  approvedAt: fmtTime(r.approved_at),
  type: r.type,
  isAttendance: r.is_attendance,
});

const toUser = (p) => ({
  id: p.id,
  name: p.name,
  email: p.email,
  status: p.role === 'captain' ? 'approved' : p.status, // 'pending' | 'approved' | 'rejected'
  role: p.role === 'captain' ? 'captain' : p.kind, // UI uses 'captain' | 'learner' | 'volunteer'
  teamId: p.team_id,
  teamName: p.team_name,
  attendance: p.attendance,
  badges: p.badges,
});

// ---- Auth -------------------------------------------------------------
export const sendMagicLink = async ({ email, profile }) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      // Enrolment (profile given) creates the account; the Returning Sign-In tab must NOT,
      // otherwise a mistyped email would silently create a team-less account.
      shouldCreateUser: Boolean(profile),
      data: profile,
    },
  });
  if (error) {
    if (/signups? not allowed|user not found/i.test(error.message)) {
      throw new Error('We could not find an account for that email. Check the spelling, or use "Enroll as New".');
    }
    // The database trigger rejects sign-ups for a full team or a taken name; Supabase reports it generically.
    if (/database error saving new user/i.test(error.message)) {
      throw new Error('We could not create your account. Your display name may already be taken. Please choose a different name and try again.');
    }
    throw error;
  }
};

export const nameTaken = async (name) => {
  const { data, error } = await supabase.rpc('name_taken', { n: name });
  fail(error);
  return Boolean(data);
};

export const signOut = () => supabase.auth.signOut();

export const fetchMyProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  fail(error);
  return toUser(data);
};

// ---- Reads ------------------------------------------------------------
export const fetchLeague = async (isCaptain) => {
  const t0 = Date.now();
  const [lb, subs, cfg, wins, now] = await Promise.all([
    supabase.from('leaderboard').select('*'),
    supabase.from('submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('league_config').select('weeks,schedule').eq('id', 1).maybeSingle(),
    supabase.rpc('challenge_windows'),
    supabase.rpc('server_now'),
  ]);
  [lb, subs, cfg, wins, now].forEach((r) => fail(r.error));
  // Offset between the server clock and this device's clock (so countdowns can't be fooled by a wrong phone clock)
  const serverOffsetMs = new Date(now.data).getTime() - (t0 + Date.now()) / 2;

  let participants = lb.data;
  let registrations = [];
  if (isCaptain) {
    // Captains also see every sign-up with its email and approval status (RLS blocks everyone else).
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,kind,team_id,team_name,status,created_at')
      .eq('role', 'participant')
      .order('created_at', { ascending: true });
    fail(error);
    registrations = data.map((p) => ({
      id: p.id, name: p.name, email: p.email, role: p.kind, teamId: p.team_id, teamName: p.team_name,
      status: p.status, createdAt: p.created_at,
    }));
    const emails = Object.fromEntries(registrations.map((r) => [r.id, r.email]));
    participants = participants.map((p) => ({ ...p, email: emails[p.id] }));
  }
  return {
    participants,
    registrations,
    submissions: subs.data.map(toSubmission),
    weeks: cfg.data?.weeks ?? null,
    schedule: cfg.data?.schedule ?? null,
    serverOffsetMs,
    windows: wins.data.map((w) => ({
      weekNumber: w.week_number,
      dayName: w.day_name,
      dayDate: w.day_date,
      opensAt: new Date(w.opens_at).getTime(),
      closesAt: new Date(w.closes_at).getTime(),
      ungated: w.ungated,
      locked: w.locked,
    })),
  };
};

export const fetchTeamCounts = async () => {
  const { data } = await supabase.rpc('team_counts');
  return Object.fromEntries((data || []).map((r) => [r.team_id, Number(r.n)]));
};

// ---- Writes -----------------------------------------------------------
export const insertSubmission = async (userId, s, aiScore) => {
  const { error } = await supabase.from('submissions').insert({
    participant_id: userId,
    participant_name: '', // overwritten by DB trigger
    week_number: s.weekNumber,
    challenge_day: s.challengeDay,
    challenge_title: s.challengeTitle,
    submission_text: s.submissionText,
    media_type: s.mediaType,
    attached_voice: s.attachedVoice ?? null,
    attached_media: s.attachedMedia ?? null,
    ai_score: aiScore,
    ai_notes: aiScore.notes,
    is_attendance: !!s.isAttendance,
    type: s.isAttendance ? 'In-Person Attendance' : s.isTeamMission ? 'Team Mission' : s.isReflection ? 'Sunday Reflection' : 'Daily Challenge',
    status: 'pending',
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error(s.isAttendance
        ? 'You have already claimed attendance for this week.'
        : 'You have already submitted this challenge.');
    }
    throw error;
  }
};

export const approveSubmission = async (id) => {
  const { error } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', id);
  fail(error);
};

export const adjustSubmissionScore = async (sub, total) => {
  const { error } = await supabase
    .from('submissions')
    .update({ ai_score: { ...sub.aiScore, total } })
    .eq('id', sub.id);
  fail(error);
};

export const updateProfile = async (id, patch) => {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  fail(error);
};

export const saveWeeks = async (weeks) => {
  const { error } = await supabase.from('league_config').update({ weeks }).eq('id', 1);
  fail(error);
};

export const saveSchedule = async (schedule) => {
  const { error } = await supabase.from('league_config').update({ schedule }).eq('id', 1);
  fail(error);
};

// ---- Evidence files (Supabase Storage, private bucket, one folder per user) -------------------
const BUCKET = 'evidence';
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3' };

async function uploadBlob(userId, blob, mime) {
  const type = baseMime(mime || blob.type);
  const path = `${userId}/${crypto.randomUUID()}.${EXT[type] || 'bin'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error(`Could not upload your file: ${error.message}`);
  return path;
}

// Uploads a participant's photo/drawing and voice note, returning the small JSON refs stored on the row.
export async function uploadAttachments(userId, { attachedMedia, attachedVoice }) {
  let media = null;
  let voice = null;
  if (attachedMedia?.dataUrl) {
    const blob = await dataUrlToBlob(attachedMedia.dataUrl);
    media = { path: await uploadBlob(userId, blob, blob.type), type: attachedMedia.type, name: attachedMedia.name };
  }
  if (attachedVoice?.blob) {
    voice = {
      path: await uploadBlob(userId, attachedVoice.blob, attachedVoice.mime),
      duration: attachedVoice.duration,
      transcript: attachedVoice.transcript || '',
      mime: attachedVoice.mime,
    };
  } else if (attachedVoice?.transcript) {
    voice = { duration: attachedVoice.duration, transcript: attachedVoice.transcript }; // transcript only
  }
  return { attachedMedia: media, attachedVoice: voice };
}

export async function getEvidenceUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  fail(error);
  return data.signedUrl;
}

// Captain approves or rejects a new sign-up (rejecting frees their team place and display name).
export const setRegistrationStatus = async (id, status) => {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  fail(error);
};

// After a facilitator approves someone, ask the server to send them the "you're approved" email. The server checks
// that the caller really is a facilitator and that the person really is approved; the browser supplies no email text.
export const notifyApproved = async (participantId) => {
  const { data } = await supabase.auth.getSession();
  const res = await fetch('/api/notify-approved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify({ participantId }),
  });
  if (!res.ok) {
    let msg = 'The approval email could not be sent.';
    try { msg = (await res.json()).error || msg; } catch { /* keep the default */ }
    throw new Error(msg);
  }
};
