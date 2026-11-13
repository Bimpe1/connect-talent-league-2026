import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import EnrollmentView from './components/EnrollmentView';
import PendingApprovalView from './components/PendingApprovalView';
import { WEEKS as DEFAULT_WEEKS } from './data/curriculum';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as api from './lib/api';
import { evaluateRubric } from './lib/scoring';

const ParticipantView = lazy(() => import('./components/ParticipantView'));
const LeaderboardView = lazy(() => import('./components/LeaderboardView'));
const BadgesView = lazy(() => import('./components/BadgesView'));
const CaptainDashboard = lazy(() => import('./components/CaptainDashboard'));
const WhatsAppTemplatesModal = lazy(() => import('./components/WhatsAppTemplatesModal'));

export default function App() {
  const [booting, setBooting] = useState(isSupabaseConfigured);
  const [currentUser, setCurrentUser] = useState(null); // profile of the signed-in user
  const [requestedTab, setCurrentTab] = useState('challenges'); // 'challenges', 'leaderboard', 'badges', 'captain'
  const [participants, setParticipants] = useState([]);
  const [registrations, setRegistrations] = useState([]); // captains: every sign-up incl. pending
  const [submissions, setSubmissions] = useState([]);
  const [weeks, setWeeks] = useState(DEFAULT_WEEKS);
  const [schedule, setSchedule] = useState(null); // time-gating settings (captain-editable)
  const [windows, setWindows] = useState([]);       // per-day open/close instants from the database
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [signinRequest, setSigninRequest] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);

  const isCaptain = currentUser?.role === 'captain';

  // UI-level role guard (the real enforcement is Row Level Security in the database):
  // captains never see participant tabs, participants never see the captain tab.
  const currentTab = isCaptain
    ? (requestedTab === 'challenges' || requestedTab === 'badges' ? 'captain' : requestedTab)
    : (requestedTab === 'captain' ? 'challenges' : requestedTab);

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
      setRegistrations(data.registrations);
      setSubmissions(data.submissions);
      setWeeks(data.weeks || DEFAULT_WEEKS);
      setSchedule(data.schedule);
      setWindows(data.windows);
      setServerOffsetMs(data.serverOffsetMs);
      // keep the signed-in user's own approval status, badges and attendance fresh
      const me = data.participants.find(p => p.id === user.id);
      let status = user.status;
      if (user.role !== 'captain') {
        try { status = (await api.fetchMyProfile(user.id)).status; } catch { /* keep the last known status */ }
      }
      setCurrentUser(u => (u ? { ...u, status, ...(me ? { badges: me.badges, attendance: me.attendance } : {}) } : u));
    } catch (err) {
      showError(err);
    }
  }, [currentUser]);

  // Restore / react to the Supabase session (magic-link redirect lands here too)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadUser = async (session) => {
      if (!session) {
        setCurrentUser(null);
        setBooting(false);
        return;
      }
      try {
        const user = await api.fetchMyProfile(session.user.id);
        // Load league data BEFORE showing the signed-in views, so they start on today's challenge
        await refresh(user);
        setCurrentUser(user);
        setCurrentTab(user.role === 'captain' ? 'captain' : 'challenges');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [currentTab]);
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

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

  const handleApproveParticipant = (id) => captainAction(() => api.setRegistrationStatus(id, 'approved'));
  const handleRejectParticipant = (id) => captainAction(() => api.setRegistrationStatus(id, 'rejected'));

  const handleSaveSchedule = (next) => captainAction(() => api.saveSchedule(next));

  // Participant Submit Challenge
  const handleSubmitChallenge = async (payload) => {
    if (!currentUser || isCaptain) {
      triggerSecurityViolation('Only enrolled participants can submit challenge evidence.');
      return false;
    }
    try {
      const files = await api.uploadAttachments(currentUser.id, payload); // photo / voice -> Storage
      await api.insertSubmission(currentUser.id, { ...payload, ...files }, payload.isAttendance
          ? { total: 10, notes: 'In-person attendance claimed by participant.' } // the database also forces this
          : evaluateRubric(payload.submissionText));
      await refresh();
      return true;
    } catch (err) {
      // includes "This challenge has closed / not opened yet" from the database time gate
      showError(err, 'Could not save your submission. Please try again.');
      await refresh();
      return false;
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
            key={signinRequest}
            initialTab={signinRequest ? 'signin' : 'enroll'}
            onOpenCaptainLogin={() => setSigninRequest(n => n + 1)}
          />
        ) : !isCaptain && currentUser.status !== 'approved' ? (
          /* Signed in, but an admin hasn't approved the registration yet */
          <PendingApprovalView user={currentUser} onCheckAgain={() => refresh()} />
        ) : (
          /* User is Enrolled / Logged in */
          <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading…</div>}>
            {/* Participant Challenges View (ONLY visible to the signed-in participant) */}
            {currentTab === 'challenges' && currentUser.role !== 'captain' && (
              <ParticipantView
                currentUser={currentUser}
                submissions={submissions}
                weeks={weeks}
                windows={windows}
                serverOffsetMs={serverOffsetMs}
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
                registrations={registrations}
                onApproveParticipant={handleApproveParticipant}
                onRejectParticipant={handleRejectParticipant}
                onUpdateChallenge={handleUpdateChallenge}
                onResetChallenges={handleResetChallenges}
                schedule={schedule}
                windows={windows}
                serverOffsetMs={serverOffsetMs}
                onSaveSchedule={handleSaveSchedule}
                onApproveSubmission={handleApproveSubmission}
                onAdjustScore={handleAdjustScore}
                onAwardBadge={handleAwardBadge}
                onOpenWhatsAppModal={() => setShowWhatsAppModal(true)}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* WhatsApp Broadcast Templates Modal (loaded on demand) */}
      {showWhatsAppModal && (
        <Suspense fallback={null}>
          <WhatsAppTemplatesModal
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            participants={participants}
            weeks={weeks}
          />
        </Suspense>
      )}

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
