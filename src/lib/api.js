import { supabase } from './supabase';

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
});

const toUser = (p) => ({
  id: p.id,
  name: p.name,
  email: p.email,
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
      // Only used when the account is created; ignored for returning users.
      data: profile,
    },
  });
  if (error) {
    // The database trigger rejects sign-ups for a full team; Supabase reports it generically.
    if (/database error saving new user/i.test(error.message)) {
      throw new Error('We could not create your account. The team you chose may have just filled up, so please refresh and pick another team.');
    }
    throw error;
  }
};

export const signOut = () => supabase.auth.signOut();

export const fetchMyProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  fail(error);
  return toUser(data);
};

// ---- Reads ------------------------------------------------------------
export const fetchLeague = async (isCaptain) => {
  const [lb, subs, cfg] = await Promise.all([
    supabase.from('leaderboard').select('*'),
    supabase.from('submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('league_config').select('weeks').eq('id', 1).maybeSingle(),
  ]);
  [lb, subs, cfg].forEach((r) => fail(r.error));

  let participants = lb.data;
  if (isCaptain) {
    // Captains also get emails (RLS blocks everyone else from the profiles table).
    const { data, error } = await supabase.from('profiles').select('id,email');
    fail(error);
    const emails = Object.fromEntries(data.map((p) => [p.id, p.email]));
    participants = participants.map((p) => ({ ...p, email: emails[p.id] }));
  }
  return {
    participants,
    submissions: subs.data.map(toSubmission),
    weeks: cfg.data?.weeks ?? null,
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
    attached_voice: s.attachedVoice,
    attached_media: s.attachedMedia,
    ai_score: aiScore,
    ai_notes: aiScore.notes,
    type: s.isTeamMission ? 'Team Mission' : s.isReflection ? 'Sunday Reflection' : 'Daily Challenge',
    status: 'pending',
  });
  fail(error);
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
