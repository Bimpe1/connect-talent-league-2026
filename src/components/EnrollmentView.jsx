import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { sendMagicLink, fetchTeamCounts, nameTaken } from '../lib/api';
import { TEAMS } from '../data/curriculum';

export default function EnrollmentView({ initialTab = 'enroll', onOpenCaptainLogin }) {
  const [tab, setTab] = useState(initialTab); // 'enroll' or 'signin'
  const [guidedStep, setGuidedStep] = useState(1); // 1 to 5

  // Enrollment fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false); // consent must be an active choice (a pre-ticked box is not valid consent)
  const [role, setRole] = useState('learner'); // 'learner' or 'volunteer'
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [enrollError, setEnrollError] = useState('');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInError, setSignInError] = useState('');

  // Submission / Loading states
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [sentKind, setSentKind] = useState('signin'); // 'enroll' | 'signin'
  const [teamCounts, setTeamCounts] = useState({});

  const totalEnrolled = TEAMS.reduce((n, t) => n + (teamCounts[t.id] || 0), 0);
  const totalCapacity = TEAMS.reduce((n, t) => n + t.capacity, 0);
  const allTeamsFull = TEAMS.every(t => (teamCounts[t.id] || 0) >= t.capacity);

  useEffect(() => {
    fetchTeamCounts().then(setTeamCounts).catch(() => {});
  }, []);

  // Helper to trigger enrollment error and scroll directly to it
  const triggerEnrollError = (msg) => {
    setEnrollError(msg);
    setTimeout(() => {
      const errEl = document.getElementById('enroll-error-bottom');
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errEl.focus();
      }
    }, 50);
  };

  // Helper to trigger sign-in error
  const triggerSignInError = (msg) => {
    setSignInError(msg);
    setTimeout(() => {
      const errEl = document.getElementById('signin-error-bottom');
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errEl.focus();
      }
    }, 50);
  };

  // Handle Guided Wizard Step Progression
  const handleNextStep = async () => {
    setEnrollError('');
    if (guidedStep === 1) {
      const cleanName = displayName.trim();
      if (!cleanName) {
        triggerEnrollError('Please enter your name to continue (e.g. Jordan T.)');
        return;
      }
      setSending(true);
      try {
        if (await nameTaken(cleanName)) {
          setSending(false);
          triggerEnrollError(
            `"${cleanName}" is already enrolled. If that is you, switch to Returning Sign-In. Otherwise, please add an initial (e.g. ${cleanName} B.).`
          );
          return;
        }
      } catch {
        // Fallback: database will still enforce uniqueness
      } finally {
        setSending(false);
      }
      setGuidedStep(2);
    } else if (guidedStep === 2) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
        triggerEnrollError('Please enter a valid email address (e.g. alex@gmail.com).');
        return;
      }
      setGuidedStep(3);
    } else if (guidedStep === 3) {
      if (!consent) {
        triggerEnrollError('Please tick the consent box to continue.');
        return;
      }
      setGuidedStep(4);
    } else if (guidedStep === 4) {
      setGuidedStep(5);
    }
  };

  const handlePrevStep = () => {
    setEnrollError('');
    if (guidedStep > 1) {
      setGuidedStep(guidedStep - 1);
    }
  };

  // Submit Enrollment
  const handleEnrollSubmit = async (e) => {
    e?.preventDefault();
    setEnrollError('');

    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      triggerEnrollError('Please enter your display name.');
      return;
    }
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      triggerEnrollError('Please enter a valid email address.');
      return;
    }
    if (!consent) {
      triggerEnrollError('Please agree to store your email for league participation.');
      return;
    }
    if (!selectedTeamId) {
      triggerEnrollError('Please select a team from the available teams below to continue.');
      return;
    }

    const team = TEAMS.find(t => t.id === selectedTeamId);
    if (!team) {
      triggerEnrollError('Please select a valid team.');
      return;
    }

    const currentCount = teamCounts[team.id] || 0;
    if (currentCount >= team.capacity) {
      triggerEnrollError(
        `Team "${team.name}" has reached full capacity (${team.capacity}/${team.capacity} places filled). Please select another team with available places.`
      );
      return;
    }

    setSending(true);
    try {
      if (await nameTaken(cleanName)) {
        setSending(false);
        triggerEnrollError(`"${cleanName}" is already enrolled. Please use a different name or switch to Returning Sign-In.`);
        return;
      }
      await sendMagicLink({
        email: cleanEmail,
        profile: {
          name: cleanName,
          kind: role,
          team_id: team.id,
          team_name: team.name
        }
      });
      setSentKind('enroll');
      setSentTo(cleanEmail);
    } catch (err) {
      triggerEnrollError(err.message || 'Could not complete registration. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Submit Returning Sign In
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');

    const cleanEmail = signInEmail.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      triggerSignInError('Please enter your registered email address.');
      return;
    }

    setSending(true);
    try {
      await sendMagicLink({ email: cleanEmail });
      setSentKind('signin');
      setSentTo(cleanEmail);
    } catch (err) {
      triggerSignInError(err.message || 'Could not send sign-in link. Please check your email and try again.');
    } finally {
      setSending(false);
    }
  };

  // Check Your Inbox Confirmation Screen
  if (sentTo) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Mail size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0a2558] font-heading">
            Check your inbox!
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            We sent a secure sign-in link to <span className="font-bold text-slate-900">{sentTo}</span>. Open it on this device to enter the league and join your team.
          </p>
          {sentKind === 'enroll' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 max-w-sm mx-auto">
              After you open the link, an admin will approve your registration before you can start the challenges.
            </div>
          )}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-900 max-w-sm mx-auto">
            💡 Links usually arrive in seconds. If you don't see it right away, be sure to check your spam/junk folder.
          </div>
          <div className="pt-2">
            <button
              onClick={() => { setSentTo(''); setTab('signin'); }}
              className="text-xs font-bold text-[#6d28d9] hover:underline"
            >
              ← Use a different email or sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-5 sm:py-8 px-3.5 sm:px-4 space-y-6">
      
      {/* Welcome Banner with Official Connect Talent Logo */}
      <div className="text-center space-y-3 pb-1 flex flex-col items-center">
        <img 
          src="/connect-logo.png" 
          alt="Connect Talent CIO Logo" 
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://connect-talent.org/assets/images/logos/connect-logo.png";
          }}
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#0a2558] via-[#4338ca] to-[#7c3aed] bg-clip-text text-transparent font-heading tracking-tight">
          Connect Talent League 2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Welcome! Join a squad, complete bite-sized daily challenges, and earn points for your team.
        </p>
      </div>

      {/* Mode Switcher Tabs: Enroll vs Sign In */}
      <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 gap-1.5">
        <button
          type="button"
          onClick={() => { setTab('enroll'); setEnrollError(''); setSignInError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition border ${
            tab === 'enroll'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white shadow-sm border-transparent'
              : 'text-slate-600 border-transparent hover:text-[#0a2558]'
          }`}
        >
          <UserPlus size={16} />
          <span>Enroll as New (Step-by-Step)</span>
        </button>

        <button
          type="button"
          onClick={() => { setTab('signin'); setEnrollError(''); setSignInError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition border ${
            tab === 'signin'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white shadow-sm border-transparent'
              : 'text-slate-600 border-transparent hover:text-[#0a2558]'
          }`}
        >
          <LogIn size={16} />
          <span>Returning Sign-In</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        
        {/* ======================================================== */}
        {/* TAB 1: ENROLL AS NEW (STEP-BY-STEP GUIDED WIZARD)         */}
        {/* ======================================================== */}
        {tab === 'enroll' && (
          <div className="space-y-6">
            
            {/* Step Indicator Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="uppercase tracking-wider">
                  Step {guidedStep} of 5 · {
                    guidedStep === 1 ? "Your Name" :
                    guidedStep === 2 ? "Your Email" :
                    guidedStep === 3 ? "Privacy Consent" :
                    guidedStep === 4 ? "Your Role" : "Select Team"
                  }
                </span>
                <span className="text-purple-600 font-extrabold">{guidedStep * 20}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-[#0a2558] to-[#6d28d9] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(guidedStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: What is your name? */}
            {guidedStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Step 1 of 5 · Display Name
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                    What is your name?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Enter your first name and last initial. This is what will appear on the friendly league board.
                  </p>
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="e.g. Jordan T."
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); setEnrollError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNextStep(); } }}
                    className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl px-5 py-4 text-base sm:text-lg text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 2: What is your email? */}
            {guidedStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Step 2 of 5 · Email Address
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                    What is your email address?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Used to securely sign you into your account with a one-click magic link.
                  </p>
                </div>

                <div className="relative pt-1">
                  <input
                    type="email"
                    placeholder="e.g. alex@gmail.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEnrollError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNextStep(); } }}
                    className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-12 pr-5 py-4 text-base sm:text-lg text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                    autoFocus
                  />
                  <Mail size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-0.5" />
                </div>
              </div>
            )}

            {/* STEP 3: Privacy Consent & Passwordless Security */}
            {guidedStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Step 3 of 5 · Privacy &amp; Security
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                    Passwordless Magic Link
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    No complicated passwords to remember! You sign in securely using email links.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => { setConsent(e.target.checked); setEnrollError(''); }}
                      className="mt-1 w-5 h-5 rounded text-[#6d28d9] focus:ring-purple-500 border-slate-300"
                    />
                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      <span>I agree to Connect Talent storing my email address securely for league participation, progress tracking, and league updates. It is deleted after the programme.</span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        Only facilitators can view emails; your email is never shown on the public leaderboard.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4: Choose your role */}
            {guidedStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Step 4 of 5 · Your Role
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                    How would you like to take part?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose whether you are learning digital skills or volunteering to help peers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setRole('learner')}
                    className={`p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      role === 'learner'
                        ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-base sm:text-lg block">Learner</span>
                      <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                        Building digital skills &amp; doing daily challenges
                      </span>
                    </div>
                    {role === 'learner' && <Check size={22} className="text-[#6d28d9] flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('volunteer')}
                    className={`p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      role === 'volunteer'
                        ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-base sm:text-lg block">Volunteer / Mentor</span>
                      <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                        Supporting fellow learners &amp; encouraging peers
                      </span>
                    </div>
                    {role === 'volunteer' && <Check size={22} className="text-[#6d28d9] flex-shrink-0" />}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Choose your team */}
            {guidedStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Step 5 of 5 · Choose Squad
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                    Pick your team
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select an available team with open spaces ({totalEnrolled}/{totalCapacity} spots taken).
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {TEAMS.map(t => {
                    const enrolledCount = teamCounts[t.id] || 0;
                    const isFull = enrolledCount >= t.capacity;
                    const isSelected = selectedTeamId === t.id;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          if (!isFull) {
                            setSelectedTeamId(t.id);
                            setEnrollError('');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                          isFull
                            ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm ring-2 ring-purple-300'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm block">{t.name}</span>
                          {isSelected && !isFull && (
                            <span className="w-5 h-5 rounded-full bg-[#6d28d9] text-white flex items-center justify-center text-xs">
                              <Check size={12} />
                            </span>
                          )}
                          {isFull && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                              Full
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-2">
                          {enrolledCount}/{t.capacity} places {isFull ? '• Closed' : '• Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Notification */}
            {enrollError && (
              <div
                id="enroll-error-bottom"
                tabIndex={-1}
                className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium shadow-sm transition outline-none"
              >
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block leading-relaxed">{enrollError}</span>
                  {(enrollError.includes('already registered') || enrollError.includes('already enrolled')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signin');
                        setSignInEmail(email.trim());
                        setSignInError('');
                        setEnrollError('');
                      }}
                      className="inline-block mt-2 font-bold underline text-rose-900 hover:text-rose-950 text-xs sm:text-sm"
                    >
                      Switch to Returning Sign-In →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Guided Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {guidedStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={sending}
                  className="px-5 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 transition active:scale-95 bg-white disabled:opacity-50"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
              )}

              {guidedStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={sending}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  <span>{sending ? 'Checking...' : 'Continue'}</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnrollSubmit}
                  disabled={sending || allTeamsFull}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{sending ? 'Sending Link...' : allTeamsFull ? 'League is Full' : 'Complete Registration 🎉'}</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RETURNING PARTICIPANT SIGN IN                     */}
        {/* ======================================================== */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. alex@gmail.com"
                  value={signInEmail}
                  onChange={e => { setSignInEmail(e.target.value); setSignInError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                  required
                  autoFocus
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your email and we'll send you an instant one-click sign-in link.
              </p>
            </div>

            {/* Error Notification */}
            {signInError && (
              <div
                id="signin-error-bottom"
                tabIndex={-1}
                className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium shadow-sm transition outline-none"
              >
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block leading-relaxed">{signInError}</span>
                  <button
                    type="button"
                    onClick={() => { setTab('enroll'); setSignInError(''); }}
                    className="inline-block mt-2 font-bold underline text-rose-900 hover:text-rose-950 text-xs sm:text-sm"
                  >
                    Go to Enroll as New →
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>{sending ? 'Sending Sign-In Link...' : 'Send Magic Sign-In Link'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
