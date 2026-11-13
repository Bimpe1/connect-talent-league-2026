import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, LogIn, UserPlus, AlertCircle, Check, Mail } from 'lucide-react';
import { TEAMS } from '../data/curriculum';
import { sendMagicLink, fetchTeamCounts, nameTaken } from '../lib/api';

const INPUT =
  'w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition';
const PRIMARY =
  'bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-60';
const STEP_TITLES = ['Your Name', 'Your Email', 'Your Role', 'Select Team'];
const TOTAL_STEPS = STEP_TITLES.length;

const StepTag = ({ n, children }) => (
  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
    Step {n} · {children}
  </span>
);

// Sign-up wizard + email sign-in. There are no passwords: we email a one-tap sign-in link.
// A captain then approves the registration (see PendingApprovalView).
export default function EnrollmentView({ initialTab = 'enroll', onOpenCaptainLogin }) {
  const [tab, setTab] = useState(initialTab); // 'enroll' | 'signin'
  const [step, setStep] = useState(1);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [role, setRole] = useState('learner');
  const [selectedTeamId, setSelectedTeamId] = useState(null); // no auto pre-selection
  const [enrollError, setEnrollError] = useState('');

  const [signInEmail, setSignInEmail] = useState('');
  const [signInError, setSignInError] = useState('');

  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [sentKind, setSentKind] = useState('enroll');
  const [teamCounts, setTeamCounts] = useState({});

  const totalEnrolled = TEAMS.reduce((n, t) => n + (teamCounts[t.id] || 0), 0);
  const totalCapacity = TEAMS.reduce((n, t) => n + t.capacity, 0);
  const allTeamsFull = TEAMS.every((t) => (teamCounts[t.id] || 0) >= t.capacity);

  useEffect(() => { fetchTeamCounts().then(setTeamCounts).catch(() => {}); }, []);

  // Show an error and bring it into view (the form is tall on phones)
  const showError = (setter, id, msg) => {
    setter(msg);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
    }, 50);
  };
  const enrollErr = (msg) => showError(setEnrollError, 'enroll-error-bottom', msg);
  const signinErr = (msg) => showError(setSignInError, 'signin-error-bottom', msg);

  const send = async (addr, profile, kind, onError) => {
    setSending(true);
    try {
      await sendMagicLink({ email: addr, profile });
      setSentKind(kind);
      setSentTo(addr);
    } catch (err) {
      onError(err.message || 'Could not send the sign-in link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleNext = async () => {
    setEnrollError('');
    if (step === 1) {
      const cleanName = displayName.trim();
      if (!cleanName) { enrollErr('Please enter your name to continue.'); return; }
      setSending(true);
      try {
        if (await nameTaken(cleanName)) {
          enrollErr(`The display name "${cleanName}" is already registered. If that is you, switch to Returning Sign-In. Otherwise add an initial or number (e.g. ${cleanName} 2).`);
          return;
        }
      } catch { /* if the check fails, carry on: the database still rejects a duplicate */ } finally { setSending(false); }
      setStep(2);
    } else if (step === 2) {
      if (!/\S+@\S+\.\S+/.test(email.trim())) { enrollErr('Please enter a valid email address (e.g. alex@gmail.com).'); return; }
      if (!consent) { enrollErr('Please tick the box to agree to us storing your email.'); return; }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => { setEnrollError(''); if (step > 1) setStep(step - 1); };

  const handleEnrollSubmit = (e) => {
    e?.preventDefault();
    setEnrollError('');
    const team = TEAMS.find((t) => t.id === selectedTeamId);
    if (!team) { enrollErr('Please select a team from the available teams to continue.'); return; }
    if ((teamCounts[team.id] || 0) >= team.capacity) {
      enrollErr(`Team "${team.name}" is full (${team.capacity}/${team.capacity}). Please pick another team.`);
      return;
    }
    send(
      email.trim().toLowerCase(),
      { name: displayName.trim(), kind: role, team_id: team.id, team_name: team.name },
      'enroll',
      enrollErr
    );
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setSignInError('');
    send(signInEmail.trim().toLowerCase(), undefined, 'signin', signinErr);
  };

  const Header = (
    <div className="text-center space-y-3 pb-1 flex flex-col items-center">
      <img
        src="/connect-logo.png"
        alt="Connect Talent CIO Logo"
        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm"
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://connect-talent.org/assets/images/logos/connect-logo.png'; }}
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#0a2558] via-[#4338ca] to-[#7c3aed] bg-clip-text text-transparent font-heading tracking-tight">
        Connect Talent League 2026
      </h1>
    </div>
  );

  // ---- After the link has been sent
  if (sentTo) {
    return (
      <div className="max-w-xl mx-auto py-5 sm:py-8 px-3.5 sm:px-4 space-y-6">
        {Header}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-200 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Mail size={26} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-heading">Check your inbox</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We sent a sign-in link to <span className="font-bold">{sentTo}</span>. Open it on this device to continue. It can take a minute, so check your spam folder too.
          </p>
          {sentKind === 'enroll' && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              After you open the link, an admin will approve your registration before you can start the challenges.
            </p>
          )}
          <button onClick={() => setSentTo('')} className="text-xs font-bold text-[#6d28d9] underline">
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-5 sm:py-8 px-3.5 sm:px-4 space-y-6">
      {Header}

      {/* Mode switcher */}
      <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 gap-1.5">
        {[
          { id: 'enroll', label: 'Enroll as New', icon: <UserPlus size={16} /> },
          { id: 'signin', label: 'Returning Sign-In', icon: <LogIn size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setEnrollError(''); setSignInError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition border ${
              tab === t.id
                ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white shadow-sm border-transparent'
                : 'text-slate-600 border-transparent hover:text-[#0a2558]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        {/* ============================ ENROLL (guided) ============================ */}
        {tab === 'enroll' && (
          <form onSubmit={handleEnrollSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="uppercase tracking-wider">Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step - 1]}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-[#0a2558] to-[#6d28d9] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <StepTag n={1}>Display Name</StepTag>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">What is your name?</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Enter your first name and last initial. This is what will appear on the friendly league board.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Jordan T."
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setEnrollError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNext(); } }}
                  className={`${INPUT} px-5 py-4 text-base sm:text-lg`}
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <StepTag n={2}>Email Address</StepTag>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">What is your email address?</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    We email you a one-tap link to sign in, so there is no password to remember.
                  </p>
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEnrollError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNext(); } }}
                  className={`${INPUT} px-5 py-4 text-base sm:text-lg`}
                  autoFocus
                />
                <label className="flex items-start gap-2.5 text-xs text-slate-500 font-normal cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setEnrollError(''); }} className="mt-0.5" />
                  <span>
                    I agree to Connect Talent storing my email to sign me in and send league updates. It is never shown to other participants and is deleted after the programme.
                  </span>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <StepTag n={3}>Your Role</StepTag>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">How would you like to take part?</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose whether you are learning digital skills or volunteering to help peers.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {[
                    { id: 'learner', title: 'Learner', sub: 'Building digital skills & doing daily challenges' },
                    { id: 'volunteer', title: 'Volunteer / Mentor', sub: 'Supporting fellow learners & encouraging peers' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                        role === r.id
                          ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm ring-2 ring-purple-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-base sm:text-lg block">{r.title}</span>
                        <span className="text-xs text-slate-500 font-normal mt-0.5 block">{r.sub}</span>
                      </div>
                      {role === r.id && <Check size={22} className="text-[#6d28d9] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StepTag n={4}>Choose Team</StepTag>
                    <span className="text-[11px] font-semibold text-slate-500">{totalEnrolled}/{totalCapacity} places filled</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">Pick your team</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select an available team with open spaces. Teammates learn and earn points together.
                  </p>
                </div>
                {allTeamsFull ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm font-medium">
                    <strong>Notice:</strong> All teams are full ({totalCapacity}/{totalCapacity}). Please speak with your Captain.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {TEAMS.map((t) => {
                      const enrolledCount = teamCounts[t.id] || 0;
                      const isFull = enrolledCount >= t.capacity;
                      const isSelected = selectedTeamId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => { setSelectedTeamId(t.id); setEnrollError(''); }}
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
                              <span className="w-5 h-5 rounded-full bg-[#6d28d9] text-white flex items-center justify-center"><Check size={12} /></span>
                            )}
                            {isFull && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Full</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 mt-2">
                            {enrolledCount}/{t.capacity} places {isFull ? '• Closed' : '• Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {enrollError && (
              <div id="enroll-error-bottom" tabIndex={-1} role="alert"
                className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium shadow-sm outline-none">
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block leading-relaxed">{enrollError}</span>
                  {/already (registered|enrolled)/.test(enrollError) && (
                    <button type="button"
                      onClick={() => { setTab('signin'); setSignInEmail(email.trim()); setEnrollError(''); }}
                      className="inline-block mt-2 font-bold underline text-rose-900 hover:text-rose-950 text-xs sm:text-sm">
                      Switch to Returning Sign-In →
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={handleBack}
                  className="px-5 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 transition">
                  <ArrowLeft size={18} /><span>Back</span>
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button type="button" onClick={handleNext} disabled={sending} className={`flex-1 py-3.5 rounded-2xl text-base ${PRIMARY}`}>
                  <span>{sending ? 'Checking…' : 'Continue'}</span><ArrowRight size={18} />
                </button>
              ) : (
                <button type="submit" disabled={sending || allTeamsFull} className={`flex-1 py-3.5 rounded-2xl text-base ${PRIMARY}`}>
                  <span>{sending ? 'Sending link…' : 'Email Me a Sign-In Link'}</span><ArrowRight size={18} />
                </button>
              )}
            </div>
          </form>
        )}

        {/* ============================ RETURNING SIGN-IN ============================ */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Enter the email you registered with and we will send you a one-tap sign-in link. Facilitators sign in here too.
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Your Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={signInEmail}
                onChange={(e) => { setSignInEmail(e.target.value); setSignInError(''); }}
                className={`${INPUT} px-4 py-3 text-base`}
                required
                autoFocus
              />
            </div>
            {signInError && (
              <div id="signin-error-bottom" tabIndex={-1} role="alert"
                className="bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm font-medium shadow-sm outline-none">
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block leading-relaxed">{signInError}</span>
                  <button type="button" onClick={() => { setTab('enroll'); setSignInError(''); }}
                    className="inline-block mt-2 font-bold underline text-rose-900 hover:text-rose-950 text-xs sm:text-sm">
                    Go to Enroll as New →
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={sending} className={`w-full py-3.5 rounded-2xl text-base ${PRIMARY}`}>
              <LogIn size={18} /><span>{sending ? 'Sending link…' : 'Email Me a Sign-In Link'}</span>
            </button>
          </form>
        )}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onOpenCaptainLogin}
          className="text-xs sm:text-sm font-bold text-[#0a2558] bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/90 px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          Facilitator / Captain Sign-In
        </button>
      </div>
    </div>
  );
}
