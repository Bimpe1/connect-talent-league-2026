import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EnrollmentView from './components/EnrollmentView';
import ParticipantView from './components/ParticipantView';
import LeaderboardView from './components/LeaderboardView';
import BadgesView from './components/BadgesView';
import CaptainDashboard from './components/CaptainDashboard';
import WhatsAppTemplatesModal from './components/WhatsAppTemplatesModal';
import SecurityModal from './components/SecurityModal';
import { WEEKS as DEFAULT_WEEKS } from './data/curriculum';
import { Key, AlertTriangle, X, ShieldAlert, Cloud } from 'lucide-react';
import {
  fetchParticipants,
  saveParticipant,
  deleteParticipant,
  fetchSubmissions,
  saveSubmission,
  fetchCaptains,
  saveCaptain,
  fetchWeeks,
  saveWeek,
  fetchSchedule,
  saveSchedule
} from './services/api';
import { DEFAULT_SCHEDULE, getChallengeTiming } from './utils/timing';

const CAPTAIN_ACCOUNT = { 
  id: 'c_morgan', 
  name: 'Coach Morgan', 
  role: 'captain', 
  teamName: 'Staff' 
};

export default function App() {
  // Current active logged in user (restored from localStorage if remembered)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_current_user_2026');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.role !== 'captain' && parsed.isApproved === false) {
        localStorage.removeItem('ct_current_user_2026');
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState('challenges'); // 'challenges', 'leaderboard', 'badges', 'captain'

  // Enrolled Participants (starts clean, persists in localStorage)
  const [participants, setParticipants] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_participants_2026');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Challenge Submissions (starts clean, persists in localStorage)
  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_submissions_2026');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Dynamic Curriculum State (Persisted in localStorage)
  const [weeks, setWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_league_weeks_2026');
      return saved ? JSON.parse(saved) : DEFAULT_WEEKS;
    } catch (e) {
      return DEFAULT_WEEKS;
    }
  });

  // Registered Captains (Persisted in localStorage)
  const [captains, setCaptains] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_captains_2026');
      return saved ? JSON.parse(saved) : [{ id: 'c_morgan', name: 'Coach Morgan', role: 'captain', teamName: 'Staff' }];
    } catch (e) {
      return [{ id: 'c_morgan', name: 'Coach Morgan', role: 'captain', teamName: 'Staff' }];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ct_captains_2026', JSON.stringify(captains));
    } catch (e) {}
  }, [captains]);

  // Persist state changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ct_current_user_2026', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ct_current_user_2026');
      }
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('ct_participants_2026', JSON.stringify(participants));
    } catch (e) {}
  }, [participants]);

  useEffect(() => {
    try {
      localStorage.setItem('ct_submissions_2026', JSON.stringify(submissions));
    } catch (e) {}
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem('ct_league_weeks_2026', JSON.stringify(weeks));
    } catch (e) {}
  }, [weeks]);

  // Challenge open/close timing & auto-lock schedule
  const [schedule, setSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('ct_challenge_schedule_2026');
      return saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
    } catch (e) {
      return DEFAULT_SCHEDULE;
    }
  });

  const timing = getChallengeTiming(schedule);

  const handleUpdateSchedule = (newSchedule) => {
    setSchedule(newSchedule);
    try {
      localStorage.setItem('ct_challenge_schedule_2026', JSON.stringify(newSchedule));
    } catch (e) {}
    saveSchedule(newSchedule);
  };

  // Periodic Cloud Sync with Vercel Postgres / Database API
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudParticipants, cloudSubmissions, cloudCaptains, cloudWeeks, cloudSchedule] = await Promise.all([
          fetchParticipants(participants),
          fetchSubmissions(submissions),
          fetchCaptains(captains),
          fetchWeeks(weeks),
          fetchSchedule(schedule)
        ]);

        if (isMounted) {
          if (Array.isArray(cloudParticipants) && cloudParticipants.length > 0) {
            setParticipants(prev => {
              const map = new Map();
              prev.forEach(p => map.set(p.id, p));
              cloudParticipants.forEach(cp => {
                const local = map.get(cp.id);
                map.set(cp.id, {
                  ...local,
                  ...cp,
                  email: (cp.email && cp.email.trim()) ? cp.email.trim().toLowerCase() : (local?.email || ''),
                  passwordHash: cp.passwordHash || local?.passwordHash || '',
                  isApproved: cp.isApproved !== undefined ? cp.isApproved : (local?.isApproved !== undefined ? local.isApproved : true),
                  status: cp.status || local?.status || (cp.isApproved ? 'approved' : 'pending')
                });
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('ct_participants_2026', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (Array.isArray(cloudSubmissions) && cloudSubmissions.length > 0) {
            setSubmissions(cloudSubmissions);
          }
          if (Array.isArray(cloudCaptains) && cloudCaptains.length > 0) {
            setCaptains(cloudCaptains);
          }
          if (Array.isArray(cloudWeeks) && cloudWeeks.length > 0) {
            setWeeks(cloudWeeks);
          }
          if (cloudSchedule && typeof cloudSchedule === 'object') {
            setSchedule(cloudSchedule);
          }
        }
      } catch (err) {
        console.warn("Background cloud sync check:", err);
      }
    }

    loadCloudData();
    const interval = setInterval(loadCloudData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Strict role enforcement
  // Ensure participants cannot access captain dashboard, and captains cannot access participant tabs or badges
  useEffect(() => {
    if (currentUser?.role !== 'captain' && currentTab === 'captain') {
      setCurrentTab('challenges');
    }
    if (currentUser?.role === 'captain' && (currentTab === 'challenges' || currentTab === 'badges')) {
      setCurrentTab('captain');
    }
  }, [currentUser, currentTab]);

  // Modals & Alerts
  const [showCaptainLoginModal, setShowCaptainLoginModal] = useState(false);
  const [captainModalMode, setCaptainModalMode] = useState('signin'); // 'signin' or 'register'
  const [captainName, setCaptainName] = useState('');
  const [captainPasscode, setCaptainPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);

  // Participant Enrollment Handler
  const handleEnrollParticipant = ({ name, email, passwordHash, role, teamId, teamName }) => {
    const newParticipant = {
      id: `p_${Date.now()}`,
      name,
      email: email || '',
      passwordHash: passwordHash || '',
      role,
      teamId,
      teamName,
      wk1: 0,
      wk2: 0,
      wk3: 0,
      wk4: 0,
      attendance: { prep: true, wk1: false, wk2: false, wk3: false, wk4: false },
      // Induction earns Ready to Begin badge automatically per pack page 2 & 7
      badges: ["ready_to_begin"],
      isApproved: false,
      status: 'pending',
      registeredAt: new Date().toISOString()
    };

    setParticipants(prev => {
      const filtered = prev.filter(p => p.name.trim().toLowerCase() !== name.trim().toLowerCase());
      const updated = [...filtered, newParticipant];
      try {
        localStorage.setItem('ct_participants_2026', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    saveParticipant(newParticipant);

    // Registration requires Captain Approval before sign-in:
    // Return the new participant object so EnrollmentView can show the pending approval confirmation
    return newParticipant;
  };

  // Approve Participant Registration (Captain)
  const handleApproveParticipant = (participantId) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            isApproved: true,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser?.name || 'Captain'
          };
        }
        return p;
      });
      try {
        localStorage.setItem('ct_participants_2026', JSON.stringify(updated));
      } catch (e) {}
      const target = updated.find(p => p.id === participantId);
      if (target) saveParticipant(target);
      return updated;
    });
  };

  // Reject / Remove Participant Registration (Captain)
  const handleRejectParticipant = (participantId) => {
    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== participantId);
      try {
        localStorage.setItem('ct_participants_2026', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    deleteParticipant(participantId);
  };

  // Update participant email directly
  const handleUpdateParticipantEmail = (participantId, newEmail) => {
    const clean = (newEmail || '').trim().toLowerCase();
    setParticipants(prev => {
      const updated = prev.map(p => p.id === participantId ? { ...p, email: clean } : p);
      try {
        localStorage.setItem('ct_participants_2026', JSON.stringify(updated));
      } catch (e) {}
      const target = updated.find(p => p.id === participantId);
      if (target) saveParticipant(target);
      return updated;
    });
  };

  // Switch to previously enrolled user (enforces captain approval)
  const handleSelectExistingUser = (participant) => {
    if (participant.isApproved === false || participant.status === 'pending') {
      return { success: false, reason: 'pending_approval', participant };
    }
    setCurrentUser(participant);
    setCurrentTab('challenges');
    return { success: true };
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('challenges');
    setSecurityAlert(null);
  };

  // Update Challenge Handler (For Captain)
  const handleUpdateChallenge = ({ weekNumber, dayIndex, updatedChallenge, updatedCriticalFocus }) => {
    if (currentUser?.role !== 'captain') {
      triggerSecurityViolation("Only verified Captains can set or edit challenges.");
      return;
    }

    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekNumber === weekNumber) {
        const updatedChallenges = [...w.challenges];
        updatedChallenges[dayIndex] = updatedChallenge;
        const updated = {
          ...w,
          challenges: updatedChallenges,
          criticalFocus: updatedCriticalFocus || w.criticalFocus
        };
        saveWeek(weekNumber, updated);
        return updated;
      }
      return w;
    }));
  };

  // Reset Challenges to Default Pack
  const handleResetChallenges = () => {
    if (currentUser?.role !== 'captain') return;
    setWeeks(DEFAULT_WEEKS);
    try {
      localStorage.removeItem('ct_league_weeks_2026');
    } catch (e) {}
  };

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
  const handleSubmitChallenge = ({
    weekNumber,
    challengeDay,
    challengeTitle,
    submissionText,
    mediaType,
    attachedVoice,
    attachedMedia,
    isTeamMission,
    isReflection,
    isAttendance
  }) => {
    if (!currentUser || currentUser.role === 'captain') {
      triggerSecurityViolation("Only enrolled participants can submit challenge evidence.");
      return;
    }

    // Verify if challenge is currently open (in-person attendance is always allowed)
    if (!isAttendance && !timing.isOpen) {
      triggerSecurityViolation(
        `Submissions are currently locked for today (${timing.reason})`
      );
      return;
    }

    const aiEvaluation = isAttendance
      ? { total: 10, notes: "In-person attendance claimed by participant." }
      : evaluateRubricWithAi(submissionText);

    const newSub = {
      id: `sub_${Date.now()}`,
      participantId: currentUser.id,
      participantName: currentUser.name,
      teamName: currentUser.teamName || "Phoenix",
      weekNumber,
      challengeDay,
      challengeTitle,
      submissionText,
      mediaType,
      attachedVoice,
      attachedMedia,
      isTeamMission: !!isTeamMission,
      isReflection: !!isReflection,
      isAttendance: !!isAttendance,
      aiScore: aiEvaluation,
      aiNotes: aiEvaluation.notes,
      status: 'pending',
      submittedAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: isAttendance ? "In-Person Attendance" : isTeamMission ? "Team Mission" : isReflection ? "Sunday Reflection" : "Daily Challenge"
    };

    setSubmissions(prev => [newSub, ...prev]);
    saveSubmission(newSub);

    // Check First Step badge upon submitting first challenge
    setParticipants(prev => prev.map(p => {
      if (p.id === currentUser.id && !p.badges.includes("first_step")) {
        const updated = { ...p, badges: [...p.badges, "first_step"] };
        saveParticipant(updated);
        return updated;
      }
      return p;
    }));

  };

  // Captain Approves Submission
  const handleApproveSubmission = (id) => {
    if (currentUser?.role !== 'captain') {
      triggerSecurityViolation("Only Captains can approve submissions.");
      return;
    }

    const targetSub = submissions.find(s => s.id === id);
    if (!targetSub) return;

    const awardedPoints = targetSub.aiScore?.total ?? (targetSub.isAttendance ? 10 : 20);

    const updatedSub = { 
      ...targetSub, 
      status: 'approved', 
      approvedBy: currentUser.name, 
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    saveSubmission(updatedSub);

    setSubmissions(prev => prev.map(s => 
      s.id === id ? updatedSub : s
    ));

    setParticipants(prev => prev.map(p => {
      if (p.id === targetSub.participantId) {
        const wkKey = targetSub.weekNumber === 1 ? 'wk1' : targetSub.weekNumber === 2 ? 'wk2' : targetSub.weekNumber === 3 ? 'wk3' : 'wk4';
        
        if (targetSub.isAttendance) {
          const updated = {
            ...p,
            attendance: {
              ...p.attendance,
              [wkKey]: true
            }
          };
          saveParticipant(updated);
          return updated;
        }

        const currentPoints = p[wkKey] || 0;
        const updated = {
          ...p,
          [wkKey]: currentPoints + awardedPoints
        };
        saveParticipant(updated);
        return updated;
      }
      return p;
    }));
  };

  // Captain Adjusts Score
const handleAdjustScore = (id, newScore) => {
  if (currentUser?.role !== 'captain') return;

  const val = Number(newScore);

  if (newScore === '' || !Number.isInteger(val) || val < 0 || val > 20) {
    return;
  }

  const targetSub = submissions.find(s => s.id === id);
  if (targetSub) {
    const updatedSub = {
      ...targetSub,
      aiScore: {
        ...targetSub.aiScore,
        total: val
      }
    };
    saveSubmission(updatedSub);
  }

  setSubmissions(prev => prev.map(s =>
    s.id === id
      ? {
          ...s,
          aiScore: {
            ...s.aiScore,
            total: val
          }
        }
      : s
  ));
};

  // Captain Toggles Attendance
  const handleToggleAttendance = (participantId, sessionKey) => {
    if (currentUser?.role !== 'captain') return;

    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        const updated = {
          ...p,
          attendance: {
            ...p.attendance,
            [sessionKey]: !p.attendance[sessionKey]
          }
        };
        saveParticipant(updated);
        return updated;
      }
      return p;
    }));
  };

  // Captain Awards Recognition Badge
  const handleAwardBadge = (participantId, badgeId) => {
    if (currentUser?.role !== 'captain') return;

    setParticipants(prev => prev.map(p => {
      if (p.id === participantId && !p.badges.includes(badgeId)) {
        const updated = { ...p, badges: [...p.badges, badgeId] };
        saveParticipant(updated);
        return updated;
      }
      return p;
    }));
  };

  // Captain Authentication (Sign In & Register with Duplicate Prevention)
  const handleCaptainLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (captainPasscode !== 'CAPTAIN2026') {
      setLoginError('Invalid passkey. Please check your credentials or contact the coordinator.');
      return;
    }

    const cleanName = captainName.trim();
    if (!cleanName) {
      setLoginError('Please enter your Facilitator / Captain Name.');
      return;
    }

    if (captainModalMode === 'signin') {
      // Find existing registered captain (case-insensitive)
      const found = captains.find(c => c.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (!found) {
        setLoginError(`No Captain found with name "${cleanName}". If this is your first time, switch to "Register New" above.`);
        return;
      }
      setCurrentUser(found);
      setCurrentTab('captain');
      setShowCaptainLoginModal(false);
      setCaptainPasscode('');
      setCaptainName('');
      setLoginError('');
      setSecurityAlert(null);
    } else {
      // Register mode - prevent duplicate captain name
      const isDuplicate = captains.some(c => c.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (isDuplicate) {
        setLoginError(`A Captain named "${cleanName}" is already registered. Please switch to "Sign In" or choose another name.`);
        return;
      }

      const newCap = {
        id: `c_${Date.now()}`,
        name: cleanName,
        role: 'captain',
        teamName: 'Staff'
      };

      setCaptains(prev => [...prev, newCap]);
      saveCaptain(newCap);
      setCurrentUser(newCap);
      setCurrentTab('captain');
      setShowCaptainLoginModal(false);
      setCaptainPasscode('');
      setCaptainName('');
      setLoginError('');
      setSecurityAlert(null);
    }
  };

  const triggerSecurityViolation = (msg) => {
    setSecurityAlert({ message: msg, time: new Date().toLocaleTimeString() });
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Light & Breezy Header with STACKED Title and NO participant switcher */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCaptainLogin={() => setShowCaptainLoginModal(true)}
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
            onEnroll={handleEnrollParticipant}
            onSelectExistingUser={handleSelectExistingUser}
            existingParticipants={participants}
            onOpenCaptainLogin={() => setShowCaptainLoginModal(true)}
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
                schedule={schedule}
                timing={timing}
                onSubmitChallenge={handleSubmitChallenge}
              />
            )}

            {/* Leaderboard View (Clean rankings of all approved participants) */}
            {currentTab === 'leaderboard' && (
              <LeaderboardView
                participants={participants.filter(p => p.isApproved !== false && p.status !== 'pending')}
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
                schedule={schedule}
                timing={timing}
                onUpdateSchedule={handleUpdateSchedule}
                onUpdateParticipantEmail={handleUpdateParticipantEmail}
                onApproveParticipant={handleApproveParticipant}
                onRejectParticipant={handleRejectParticipant}
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

      {/* Captain Sign-In & Registration Modal */}
      {showCaptainLoginModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                {captainModalMode === 'signin' ? 'Captain Sign-In' : 'Register New Captain'}
              </h3>
              <button 
                onClick={() => {
                  setShowCaptainLoginModal(false);
                  setLoginError('');
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toggle Mode: Sign In vs Register */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setCaptainModalMode('signin'); setLoginError(''); }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  captainModalMode === 'signin'
                    ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Returning Sign-In
              </button>
              <button
                type="button"
                onClick={() => { setCaptainModalMode('register'); setLoginError(''); }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  captainModalMode === 'register'
                    ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register New
              </button>
            </div>

            <form onSubmit={handleCaptainLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Captain / Facilitator Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex or Facilitator Name"
                  value={captainName}
                  onChange={(e) => { setCaptainName(e.target.value); setLoginError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Passkey
                </label>
                <input
                  type="password"
                  placeholder="Enter passkey"
                  value={captainPasscode}
                  onChange={(e) => { setCaptainPasscode(e.target.value); setLoginError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-semibold leading-relaxed">
                  {loginError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCaptainLoginModal(false);
                    setLoginError('');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
                >
                  {captainModalMode === 'signin' ? 'Sign In as Captain' : 'Register Captain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span>Built by Adebimpe Adetoba</span>
        </div>
      </footer>
    </div>
  );
}
