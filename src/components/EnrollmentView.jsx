import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, LogIn, UserPlus, AlertCircle, Check, Mail } from 'lucide-react';
import { sendMagicLink, fetchTeamCounts, nameTaken } from '../lib/api';
import { TEAMS } from '../data/curriculum';

export default function EnrollmentView({ initialTab = 'enroll', onOpenCaptainLogin }) {
  const [tab, setTab] = useState(initialTab); // 'enroll' or 'signin'

  // Enrollment fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [role, setRole] = useState('learner'); // 'learner' or 'volunteer'
  const [selectedTeamId, setSelectedTeamId] = useState(null); // no auto pre-selection: participant must choose
  const [enrollError, setEnrollError] = useState('');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInError, setSignInError] = useState('');

  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [teamCounts, setTeamCounts] = useState({});
  const totalEnrolled = TEAMS.reduce((n, t) => n + (teamCounts[t.id] || 0), 0);
  const totalCapacity = TEAMS.reduce((n, t) => n + t.capacity, 0);
  const allTeamsFull = TEAMS.every(t => (teamCounts[t.id] || 0) >= t.capacity);

  useEffect(() => { fetchTeamCounts().then(setTeamCounts).catch(() => {}); }, []);


  const send = async (addr, profile, setError) => {
    setSending(true);
    setError('');
    try {
      await sendMagicLink({ email: addr, profile });
      setSentTo(addr);
    } catch (err) {
      setError(err.message || 'Could not send the sign-in link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) { setEnrollError('Please enter an approved display name (e.g. Jordan T.)'); return; }
    if (!consent) { setEnrollError('Please tick the box to agree to us storing your email.'); return; }
    if (!selectedTeamId) { setEnrollError('Please select a team from the available teams below to continue.'); return; }
    const team = TEAMS.find(t => t.id === selectedTeamId);
    if (!team) { setEnrollError('Please select a valid team.'); return; }
    if ((teamCounts[team.id] || 0) >= team.capacity) {
      setEnrollError(`Team "${team.name}" is full (${team.capacity}/${team.capacity}). Please pick another team.`);
      return;
    }
    // Check the display name up front so the message is clear (the database enforces uniqueness too)
    setSending(true);
    try {
      if (await nameTaken(cleanName)) {
        setSending(false);
        setEnrollError(`"${cleanName}" is already enrolled. If that is you, use "Returning Sign-In" above. If you are a different person with the same name, add an initial or number (e.g. ${cleanName} 2).`);
        return;
      }
    } catch { /* if the check fails, carry on: the database still rejects a duplicate */ }
    send(cleanEmail, { name: cleanName, kind: role, team_id: team.id, team_name: team.name }, setEnrollError);
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    send(signInEmail.trim().toLowerCase(), undefined, setSignInError);
  };

  if (sentTo) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Mail size={22} />
          </div>
          <h2 className="text-xl font-extrabold text-[#0a2558] font-heading">Check your inbox</h2>
          <p className="text-sm text-slate-600">
            We sent a sign-in link to <span className="font-bold">{sentTo}</span>. Open it on this device to enter the league. It can take a minute, so check spam too.
          </p>
          <button onClick={() => setSentTo('')} className="text-xs font-bold text-[#6d28d9] underline">
            Use a different email
          </button>
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
          <span>Enroll as New</span>
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
        {/* TAB 1: ENROLL AS NEW                                     */}
        {/* ======================================================== */}
        {tab === 'enroll' && (
          <form onSubmit={handleEnrollSubmit} className="space-y-6">
            
            {/* Error Notification */}
            {enrollError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium">
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{enrollError}</span>
                </div>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Approved Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan T. (First name & initial)"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setEnrollError(''); }}
                className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                required
              />
              <span className="text-xs text-slate-400 block font-normal">
                Choose a unique display name. Only your approved display name is visible on leaderboards.
              </span>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Your Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setEnrollError(''); }}
                className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                required
              />
              <label className="flex items-start gap-2 text-xs text-slate-500 font-normal cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
                <span>
                  I agree to Connect Talent storing my email to sign me in and send league updates. It is never shown to other participants and is deleted after the programme.
                </span>
              </label>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('learner')}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                    role === 'learner'
                      ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm sm:text-base block">Learner</span>
                    <span className="text-xs text-slate-500 font-normal">Building digital skills</span>
                  </div>
                  {role === 'learner' && <Check size={18} className="text-[#6d28d9]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('volunteer')}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                    role === 'volunteer'
                      ? 'border-[#6d28d9] bg-purple-50/70 text-[#0a2558] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm sm:text-base block">Volunteer</span>
                    <span className="text-xs text-slate-500 font-normal">Supporting peers</span>
                  </div>
                  {role === 'volunteer' && <Check size={18} className="text-[#6d28d9]" />}
                </button>
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Choose Your Team (Click to select)
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {totalEnrolled}/{totalCapacity} League places filled
                </span>
              </div>

              {!selectedTeamId && !allTeamsFull && (
                <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-xl font-medium">
                  Please click on one of the teams below to select your team.
                </p>
              )}

              {allTeamsFull ? (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm font-medium">
                  <strong>Notice:</strong> All teams have reached maximum capacity ({totalCapacity}/{totalCapacity} places filled). Please speak with your Captain.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TEAMS.map(t => {
                    const isSelected = selectedTeamId === t.id;
                    const enrolledCount = teamCounts[t.id] || 0;
                    const isFull = enrolledCount >= t.capacity;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => { setSelectedTeamId(t.id); setEnrollError(''); }}
                        className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
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
                            <span className="w-4 h-4 rounded-full bg-[#6d28d9] text-white flex items-center justify-center">
                              <Check size={10} />
                            </span>
                          )}
                          {isFull && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                              Full
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1">
                          {enrolledCount}/{t.capacity} places {isFull ? '• Closed' : '• Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || allTeamsFull}
              className="w-full disabled:opacity-60 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <span>{sending ? 'Sending link…' : 'Email Me a Sign-In Link'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RETURNING PARTICIPANT SIGN IN                     */}
        {/* ======================================================== */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Enter the email you enrolled with and we'll send you a one-tap sign-in link. Facilitators / Captains sign in here too.
            </div>

            {/* Error Notification */}
            {signInError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium">
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{signInError}</span>
                  <button
                    type="button"
                    onClick={() => { setTab('enroll'); setSignInError(''); }}
                    className="block mt-2 font-bold underline text-rose-900 hover:text-rose-950"
                  >
                    Go to Enroll as New →
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={signInEmail}
                onChange={e => { setSignInEmail(e.target.value); setSignInError(''); }}
                className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                required
                autoFocus
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={sending}
              className="w-full disabled:opacity-60 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <LogIn size={18} />
              <span>{sending ? 'Sending link…' : 'Email Me a Sign-In Link'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Captain Sign-In Link */}
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
