import React, { useState } from 'react';
import { Sparkles, ArrowRight, LogIn, UserPlus, AlertCircle, Check, Mail, Clock, UserCheck, ShieldCheck } from 'lucide-react';
import { TEAMS } from '../data/curriculum';

export default function EnrollmentView({ 
  onEnroll, 
  onSelectExistingUser,
  existingParticipants = [],
  onOpenCaptainLogin 
}) {
  const [tab, setTab] = useState('enroll'); // 'enroll' or 'signin'

  // Enrollment fields - NO automatic team pre-selection
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('learner'); // 'learner' or 'volunteer'
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [submittedForApproval, setSubmittedForApproval] = useState(null);

  // Check if entire League is full
  const allTeamsFull = TEAMS.every(
    t => existingParticipants.filter(p => p.teamId === t.id).length >= t.capacity
  );

  // Sign in fields
  const [signInName, setSignInName] = useState('');
  const [signInError, setSignInError] = useState('');

  // Handle New Participant Enrollment
  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    setEnrollError('');

    const cleanName = displayName.trim();
    if (!cleanName) {
      setEnrollError('Please enter an approved display name (e.g. Jordan T.)');
      return;
    }

    // Require explicit team selection
    if (!selectedTeamId) {
      setEnrollError('Please select a team from the available teams below to continue.');
      return;
    }

    // Check for duplicate name (case-insensitive)
    const isDuplicate = existingParticipants.some(
      p => p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      setEnrollError(
        `"${cleanName}" is already enrolled. If this is you, click "Sign In" above. If you are another participant with the same name, please add an extra initial or number (e.g. ${cleanName} 2).`
      );
      return;
    }

    const team = TEAMS.find(t => t.id === selectedTeamId);
    if (!team) {
      setEnrollError('Please select a valid team.');
      return;
    }

    const teamMembersCount = existingParticipants.filter(p => p.teamId === team.id).length;

    // Hard Capacity Enforcement (per team capacity: 5 or 6 places)
    if (teamMembersCount >= team.capacity) {
      setEnrollError(
        `Team "${team.name}" has reached full capacity (${team.capacity}/${team.capacity} places filled). Please select another team with available places.`
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setEnrollError('Please enter a valid email address (e.g. yourname@example.com) or leave it blank.');
      return;
    }

    const newPlayer = onEnroll({
      name: cleanName,
      email: cleanEmail || '',
      role,
      teamId: team.id,
      teamName: team.name,
    });

    if (newPlayer) {
      setSubmittedForApproval(newPlayer);
    }
  };

  // Handle Returning Participant Sign In
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setSignInError('');

    const cleanName = signInName.trim();
    if (!cleanName) {
      setSignInError('Please enter your enrolled display name.');
      return;
    }

    // Lookup participant
    const found = existingParticipants.find(
      p => p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (!found) {
      setSignInError(
        `No enrolled participant found matching "${cleanName}". Please verify the spelling or click "Enroll as New" to register.`
      );
      return;
    }

    if (found.isApproved === false || found.status === 'pending') {
      setSignInError(
        `⏳ Hi ${found.name}, your registration for Team ${found.teamName || 'League'} is currently pending Captain approval. Once Coach Morgan or your Team Captain approves it, you can log in immediately!`
      );
      return;
    }

    onSelectExistingUser(found);
  };

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

      {submittedForApproval ? (
        /* ============================================================== */
        /* PENDING APPROVAL CONFIRMATION CARD                             */
        /* ============================================================== */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Clock size={32} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full inline-block">
              Registration Submitted for Review
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-heading">
              Welcome, {submittedForApproval.name}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your registration for <strong>Team {submittedForApproval.teamName}</strong> has been received. For transparency and participant safety, your Team Captain must approve your registration before you can log in and submit daily challenges.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Player Name:</span>
              <span className="font-bold text-slate-800">{submittedForApproval.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Team Assigned:</span>
              <span className="font-bold text-purple-700">{submittedForApproval.teamName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Role:</span>
              <span className="font-bold text-slate-800 capitalize">{submittedForApproval.role}</span>
            </div>
            {submittedForApproval.email && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-bold text-slate-800">{submittedForApproval.email}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Current Status:</span>
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <Clock size={12} /> Pending Captain Approval
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setSubmittedForApproval(null);
                setTab('signin');
                setSignInName(submittedForApproval.name);
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/20 transition active:scale-95"
            >
              Go to Sign-In Tab
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedForApproval(null);
                setDisplayName('');
                setEmail('');
                setSelectedTeamId(null);
                setTab('enroll');
              }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              Register Another Player
            </button>
          </div>
        </div>
      ) : (
        <>
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
                  {enrollError.includes('already enrolled') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signin');
                        setSignInName(displayName);
                        setSignInError('');
                        setEnrollError('');
                      }}
                      className="block mt-2 font-bold underline text-rose-900 hover:text-rose-950"
                    >
                      Switch to Sign In as "{displayName}" →
                    </button>
                  )}
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

            {/* Email Address for Notifications */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Email Address <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                </label>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Optional Contact
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. jordan.t@example.com (optional)"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEnrollError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-500 block font-normal">
                Optional: Enter an email address to receive challenge updates and league reminders.
              </span>
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
                  {existingParticipants.length}/40 League places filled
                </span>
              </div>

              {!selectedTeamId && !allTeamsFull && (
                <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-xl font-medium">
                  Please click on one of the teams below to select your team.
                </p>
              )}

              {allTeamsFull ? (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm font-medium">
                  <strong>Notice:</strong> All 7 teams have reached maximum capacity (40/40 places filled). Please speak with Coach Morgan or your Facilitator.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TEAMS.map(t => {
                    const isSelected = selectedTeamId === t.id;
                    const enrolledCount = existingParticipants.filter(p => p.teamId === t.id).length;
                    const isFull = enrolledCount >= t.capacity;

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
                            <span className="w-4 h-4 rounded-full bg-[#6d28d9] text-white flex items-center justify-center text-[10px]">
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
              disabled={allTeamsFull}
              className="w-full py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{allTeamsFull ? 'League is Full' : 'Enroll & Start League'}</span>
              {!allTeamsFull && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RETURNING PARTICIPANT SIGN IN                     */}
        {/* ======================================================== */}
        {tab === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Enter the approved display name you used when you enrolled to access your daily challenges, submissions, and badges.
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

            {/* Display Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Enrolled Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan T."
                value={signInName}
                onChange={e => { setSignInName(e.target.value); setSignInError(''); }}
                className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                required
                autoFocus
              />
              <span className="text-xs text-slate-400 block font-normal">
                Case-insensitive (e.g. "jordan t" or "Jordan T.")
              </span>
            </div>

            {/* Quick Profile Chips for Easy One-Click Sign In */}
            {existingParticipants.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Or click your registered profile:
                </span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {existingParticipants.map(p => {
                    const isPending = p.isApproved === false || p.status === 'pending';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isPending) {
                            setSignInError(
                              `⏳ Hi ${p.name}, your registration for Team ${p.teamName || 'League'} is currently pending Captain approval. Once Coach Morgan or your Team Captain approves it, you can log in immediately!`
                            );
                          } else {
                            onSelectExistingUser(p);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs ${
                          isPending
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-purple-50 hover:bg-purple-100 text-[#0a2558] hover:text-[#6d28d9] border-purple-200'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isPending ? 'bg-amber-200/80 text-amber-950' : 'bg-white text-purple-600'
                        }`}>
                          {isPending ? '⏳ Pending Approval' : p.teamName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              <LogIn size={18} />
              <span>Sign In to My Account</span>
            </button>
          </form>
        )}
      </div>
      </>
      )}

      {/* Captain Sign-In Link */}
      <div className="text-center pt-2">
        <button
          onClick={onOpenCaptainLogin}
          className="text-xs sm:text-sm font-bold text-[#0a2558] bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/90 px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          Facilitator / Captain Sign-In &amp; Register
        </button>
      </div>
    </div>
  );
}
