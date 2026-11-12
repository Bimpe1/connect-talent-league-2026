import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import EnrollmentView from './components/EnrollmentView';
import ParticipantView from './components/ParticipantView';
import LeaderboardView from './components/LeaderboardView';
import BadgesView from './components/BadgesView';
import CaptainDashboard from './components/CaptainDashboard';
import WhatsAppTemplatesModal from './components/WhatsAppTemplatesModal';
import SecurityModal from './components/SecurityModal';
import { WEEKS as DEFAULT_WEEKS } from './data/curriculum';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as api from './lib/api';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // profile of the signed-in user
  const [currentTab, setCurrentTab] = useState('challenges'); // 'challenges', 'leaderboard', 'badges', 'captain'
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [weeks, setWeeks] = useState(DEFAULT_WEEKS);
  const [signinRequest, setSigninRequest] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);

  const isCaptain = currentUser?.role === 'captain';

  const showError = (err, fallback = 'Something went wrong. Please try again.') => {
    console.error(err);
    setSecurityAlert({ message: err?.message || fallback, time: new Date().toLocaleTimeString() });
  };

  // Pull the latest shared league data. RLS decides what each user is allowed to see.
  const refresh = useCallback(async (user = currentUser) => {
    if (!user) return;
    try {
      const data = await api.fetchLeague(user.role === 'captain');
      setParticipants(data.participants);
      setSubmissions(data.submissions);
      setWeeks(data.weeks || DEFAULT_WEEKS);
      // keep the signed-in user's own badges/attendance fresh
      const me = data.participants.find(p => p.id === user.id);
      if (me) setCurrentUser(u => (u ? { ...u, badges: me.badges, attendance: me.attendance } : u));
    } catch (err) {
      showError(err);
    }
  }, [currentUser]);

  // Restore / react to the Supabase session (magic-link redirect lands here too)
  useEffect(() => {
    if (!isSupabaseConfigured) { setBooting(false); return; }

    const loadUser = async (session) => {
      if (!session) {
        setCurrentUser(null);
        setBooting(false);
        return;
      }
      try {
        const user = await api.fetchMyProfile(session.user.id);
        setCurrentUser(user);
        setCurrentTab(user.role === 'captain' ? 'captain' : 'challenges');
        await refresh(user);
      } catch (err) {
        showError(err);
      } finally {
        setBooting(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => loadUser(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadUser(session);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep data fresh when switching tabs or returning to the window (cheap alternative to realtime)
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currentTab]);
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  // UI-level role guard (the real enforcement is Row Level Security in the database)
  useEffect(() => {
    if (!isCaptain && currentTab === 'captain') setCurrentTab('challenges');
    if (isCaptain && (currentTab === 'challenges' || currentTab === 'badges')) setCurrentTab('captain');
  }, [isCaptain, currentTab]);

  const handleLogout = async () => {
    await api.signOut();
    setCurrentUser(null);
    setParticipants([]);
    setSubmissions([]);
    setCurrentTab('challenges');
    setSecurityAlert(null);
  };

  // Run a captain-only write, then reload shared data
  const captainAction = async (fn) => {
    if (!isCaptain) {
      triggerSecurityViolation('Only verified Captains can do that.');
      return;
    }
    try { await fn(); await refresh(); } catch (err) { showError(err); }
  };

  const handleUpdateChallenge = ({ weekNumber, dayIndex, updatedChallenge, updatedCriticalFocus }) =>
    captainAction(async () => {
      const next = weeks.map(w => {
        if (w.weekNumber !== weekNumber) return w;
        const challenges = [...w.challenges];
        challenges[dayIndex] = updatedChallenge;
        return { ...w, challenges, criticalFocus: updatedCriticalFocus || w.criticalFocus };
      });
      await api.saveWeeks(next);
    });

  const handleResetChallenges = () => captainAction(() => api.saveWeeks(null));

  // Simulated AI evaluation engine based on the Connect Talent 4-part rubric
  const evaluateRubricWithAi = (text) => {
    const lower = text.toLowerCase();
    const attempt = 5;
    const reason = lower.includes('because') || lower.includes('so') || lower.includes('reason') || lower.includes('decided') || lower.includes('since') ? 5 : 0;
    const evidence = lower.includes('checked') || lower.includes('tested') || lower.includes('buddy') || lower.includes('showed') || lower.includes('asked') ? 5 : 0;
    const conclusion = lower.includes('next') || lower.includes('change') || lower.includes('learned') || lower.includes('improve') || lower.includes('will') ? 5 : 5;
    const total = attempt + reason + evidence + conclusion;

    let notes = "Good attempt with clear effort.";
    if (reason === 5 && evidence === 5) {
      notes = "Strong reasoning and evidence of testing with a buddy.";
    } else if (evidence === 0) {
      notes = "Consider checking with a buddy or neighbor for full evidence points.";
    }

    return { attempt, reason, evidence, conclusion, total, notes };
  };

  // Participant Submit Challenge
  const handleSubmitChallenge = async (payload) => {
    if (!currentUser || isCaptain) {
      triggerSecurityViolation('Only enrolled participants can submit challenge evidence.');
      return;
    }
    try {
      await api.insertSubmission(currentUser.id, payload, evaluateRubricWithAi(payload.submissionText));
      await refresh();
    } catch (err) {
      showError(err, 'Could not save your submission. Please try again.');
    }
  };

  const handleApproveSubmission = (id) => captainAction(() => api.approveSubmission(id));

  const handleAdjustScore = (id, newScore) => {
    const val = Number(newScore);
    if (newScore === '' || !Number.isInteger(val) || val < 0 || val > 20) return;
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;
    return captainAction(() => api.adjustSubmissionScore(sub, val));
  };

  const handleToggleAttendance = (participantId, sessionKey) => {
    const p = participants.find(x => x.id === participantId);
    if (!p) return;
    return captainAction(() =>
      api.updateProfile(participantId, { attendance: { ...p.attendance, [sessionKey]: !p.attendance[sessionKey] } })
    );
  };

  const handleAwardBadge = (participantId, badgeId) => {
    const p = participants.find(x => x.id === participantId);
    if (!p || p.badges.includes(badgeId)) return;
    return captainAction(() => api.updateProfile(participantId, { badges: [...p.badges, badgeId] }));
  };

  const triggerSecurityViolation = (msg) => {
    setSecurityAlert({ message: msg, time: new Date().toLocaleTimeString() });
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafbfc]">
        <div className="max-w-md bg-white border border-amber-200 rounded-2xl p-6 text-sm text-slate-700 space-y-2 shadow-sm">
          <h1 className="font-bold text-slate-900 text-base">Supabase isn't configured</h1>
          <p>Copy <code>.env.example</code> to <code>.env.local</code>, add your project URL and anon key, then restart the dev server. See <code>supabase/README.md</code>.</p>
        </div>
      </div>
    );
  }

  if (booting) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Loading…</div>;
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Light & Breezy Header with STACKED Title and NO participant switcher */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCaptainLogin={() => setSigninRequest(n => n + 1)}
        pendingCount={pendingCount}
      />

      {/* Security Alert Toast */}
      {securityAlert && (
        <div className="max-w-3xl mx-auto px-6 mt-4 w-full">
          <div className="bg-rose-50 text-rose-800 text-xs sm:text-sm p-3.5 rounded-2xl flex justify-between items-center border border-rose-200">
            <span>{securityAlert.message}</span>
            <button onClick={() => setSecurityAlert(null)} className="font-bold ml-2">Dismiss</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 w-full flex-1">
        {/* If no user is logged in, show clean Enrollment / Sign In view */}
        {!currentUser ? (
          <EnrollmentView
            signinRequest={signinRequest}
            onOpenCaptainLogin={() => setSigninRequest(n => n + 1)}
            onOpenCaptainLogin={() => setSigninRequest(n => n + 1)}
          />
        ) : (
          /* User is Enrolled / Logged in */
          <>
            {/* Participant Challenges View (ONLY visible to the signed-in participant) */}
            {currentTab === 'challenges' && currentUser.role !== 'captain' && (
              <ParticipantView
                currentUser={currentUser}
                submissions={submissions}
                weeks={weeks}
                onSubmitChallenge={handleSubmitChallenge}
              />
            )}

            {/* Leaderboard View (Clean rankings of all registered participants) */}
            {currentTab === 'leaderboard' && (
              <LeaderboardView
                participants={participants}
              />
            )}

            {/* Badges View (Current participant's earned badges) */}
            {currentTab === 'badges' && (
              <BadgesView
                currentUser={currentUser}
                participants={participants}
              />
            )}

            {/* Captain Operations Portal (ONLY accessible to Captain) */}
            {currentTab === 'captain' && currentUser.role === 'captain' && (
              <CaptainDashboard
                currentUser={currentUser}
                submissions={submissions}
                participants={participants}
                weeks={weeks}
                onUpdateChallenge={handleUpdateChallenge}
                onResetChallenges={handleResetChallenges}
                onApproveSubmission={handleApproveSubmission}
                onAdjustScore={handleAdjustScore}
                onToggleAttendance={handleToggleAttendance}
                onAwardBadge={handleAwardBadge}
                onOpenWhatsAppModal={() => setShowWhatsAppModal(true)}
              />
            )}
          </>
        )}
      </main>

      {/* WhatsApp Broadcast Templates Modal */}
      <WhatsAppTemplatesModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        participants={participants}
        weeks={weeks}
      />

      {/* Backend Security Architecture Modal */}
      <SecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* Footer on all pages */}
      <footer className="py-5 text-center text-xs sm:text-sm text-slate-500 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-1 font-medium">
          <span>Built by</span>
          <span className="font-bold text-slate-900">Adebimpe Adetoba</span>
        </div>
      </footer>
    </div>
  );
}
