import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, LogIn, UserPlus, AlertCircle, Check, Mail, Clock, UserCheck, ShieldCheck, Lock, Eye, EyeOff, HelpCircle, HeartHandshake } from 'lucide-react';
import { TEAMS } from '../data/curriculum';
import { hashPassword, verifyPassword } from '../utils/security';

export default function EnrollmentView({ 
  onEnroll, 
  onSelectExistingUser,
  existingParticipants = [],
  onOpenCaptainLogin 
}) {
  const [tab, setTab] = useState('enroll'); // 'enroll' or 'signin'
  const [guidedStep, setGuidedStep] = useState(1); // 1 to 5

  // Enrollment fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('learner'); // 'learner' or 'volunteer'
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [submittedForApproval, setSubmittedForApproval] = useState(null);

  // Check if entire League is full
  const allTeamsFull = TEAMS.every(
    t => existingParticipants.filter(p => p.teamId === t.id).length >= t.capacity
  );

  // Sign in fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  // Handle Guided Wizard Step Progression
  const handleNextStep = () => {
    setEnrollError('');
    if (guidedStep === 1) {
      const cleanName = displayName.trim();
      if (!cleanName) {
        triggerEnrollError('Please enter your name to continue.');
        return;
      }
      const isDuplicate = existingParticipants.some(
        p => p.name && p.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (isDuplicate) {
        triggerEnrollError(
          `The display name "${cleanName}" is already registered. If this is your account, switch to Returning Sign-In. Otherwise, please add an initial (e.g. ${cleanName} B.).`
        );
        return;
      }
      setGuidedStep(2);
    } else if (guidedStep === 2) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
        triggerEnrollError('Please enter a valid email address (e.g. alex@gmail.com).');
        return;
      }
      const emailInUse = existingParticipants.some(
        p => p.email && p.email.trim().toLowerCase() === cleanEmail
      );
      if (emailInUse) {
        triggerEnrollError(
          `The email address "${cleanEmail}" is already registered. Please switch to Returning Sign-In to log in.`
        );
        return;
      }
      setGuidedStep(3);
    } else if (guidedStep === 3) {
      if (!password || password.length < 6) {
        triggerEnrollError('Please enter a password of at least 6 characters.');
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

  // Handle New Participant Enrollment
  const handleEnrollSubmit = async (e) => {
    e?.preventDefault();
    setEnrollError('');

    const cleanName = displayName.trim();
    if (!cleanName) {
      triggerEnrollError('Please enter an approved display name (e.g. Jordan T.)');
      return;
    }

    // Email validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      triggerEnrollError('Please enter a valid email address (e.g. alex@gmail.com).');
      return;
    }

    // Check duplicate email (case-insensitive)
    const emailInUse = existingParticipants.some(
      p => p.email && p.email.trim().toLowerCase() === cleanEmail
    );
    if (emailInUse) {
      triggerEnrollError(
        `The email address "${cleanEmail}" is already registered. Please switch to Returning Sign-In to log in.`
      );
      return;
    }

    // Check duplicate display name (case-insensitive)
    const isDuplicate = existingParticipants.some(
      p => p.name && p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      triggerEnrollError(
        `The display name "${cleanName}" is already registered. If this is your account, switch to Returning Sign-In. Otherwise, please add an initial (e.g. ${cleanName} B.).`
      );
      return;
    }

    // Password validation
    if (!password || password.length < 6) {
      triggerEnrollError('Password must be at least 6 characters.');
      return;
    }

    // Require explicit team selection
    if (!selectedTeamId) {
      triggerEnrollError('Please select a team from the available teams below to continue.');
      return;
    }

    const team = TEAMS.find(t => t.id === selectedTeamId);
    if (!team) {
      triggerEnrollError('Please select a valid team.');
      return;
    }

    const teamMembersCount = existingParticipants.filter(p => p.teamId === team.id).length;

    // Hard Capacity Enforcement (per team capacity: 5 or 6 places)
    if (teamMembersCount >= team.capacity) {
      triggerEnrollError(
        `Team "${team.name}" has reached full capacity (${team.capacity}/${team.capacity} places filled). Please select another team with available places.`
      );
      return;
    }

    const passwordHash = await hashPassword(password);

    const newPlayer = onEnroll({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role,
      teamId: team.id,
      teamName: team.name,
    });

    if (newPlayer) {
      setSubmittedForApproval(newPlayer);
    }
  };

  // Helper to trigger sign-in error and scroll to it
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

  // Handle Returning Participant Sign In with Email & Password
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');

    const cleanIdentifier = signInIdentifier.trim().toLowerCase();
    if (!cleanIdentifier) {
      triggerSignInError('Please enter your registered email address or display name.');
      return;
    }

    if (!signInPassword) {
      triggerSignInError('Please enter your account password.');
      return;
    }

    setIsSigningIn(true);

    try {
      // Find participant by email first, or by display name
      const found = existingParticipants.find(
        p => (p.email && p.email.trim().toLowerCase() === cleanIdentifier) ||
             (p.name && p.name.trim().toLowerCase() === cleanIdentifier)
      );

      if (!found) {
        triggerSignInError(
          `No enrolled player found matching "${signInIdentifier}". Please verify your email/name or switch to "Enroll as New".`
        );
        setIsSigningIn(false);
        return;
      }

      // Check approval status
      if (found.isApproved === false || found.status === 'pending') {
        triggerSignInError(
          `⏳ Hi ${found.name}, your registration for Team ${found.teamName || 'League'} is currently pending approval. Once an admin approves it, you can log in immediately!`
        );
        setIsSigningIn(false);
        return;
      }

      // If account has a password set, verify it
      if (found.passwordHash) {
        const isMatch = await verifyPassword(signInPassword, found.passwordHash);
        if (!isMatch) {
          triggerSignInError('Incorrect password. Please verify your password and try again.');
          setIsSigningIn(false);
          return;
        }
      } else {
        // If legacy account had no password hash, save this password as their account password
        const newHash = await hashPassword(signInPassword);
        found.passwordHash = newHash;
      }

      onSelectExistingUser(found);
    } catch (err) {
      triggerSignInError(`Sign-in error: ${err.message}`);
    } finally {
      setIsSigningIn(false);
    }
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
              Your registration for <strong>Team {submittedForApproval.teamName}</strong> has been received. An admin will review and approve your registration before you can log in.
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
                <Clock size={12} /> Pending Admin Approval
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSubmittedForApproval(null);
                setTab('signin');
                setSignInIdentifier(submittedForApproval.email || submittedForApproval.name);
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/20 transition active:scale-95"
            >
              Go to Sign-In Tab
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
        {/* TAB 1: ENROLL AS NEW (STEP-BY-STEP GUIDED)               */}
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
                    guidedStep === 3 ? "Create Password" :
                    guidedStep === 4 ? "Your Role" : "Select Team"
                  }
                </span>
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
                        Step 1 · Display Name
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
                        Step 2 · Email Address
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                        What is your email address?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        You will use this to sign into your account and receive challenge reminders.
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

                {/* STEP 3: Create a password */}
                {guidedStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        Step 3 · Password
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                        Create a simple password
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Choose a password of at least 6 characters that you can easily remember.
                      </p>
                    </div>

                    <div className="relative pt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setEnrollError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNextStep(); } }}
                        className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-12 pr-12 py-4 text-base sm:text-lg text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                        autoFocus
                      />
                      <Lock size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-0.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Choose your role */}
                {guidedStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        Step 4 · Your Role
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
                        Step 5 · Choose Team
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                        Pick your team
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Select an available team with open spaces. Teammates learn and earn points together.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      {TEAMS.map(t => {
                        const enrolledCount = existingParticipants.filter(p => p.teamId === t.id).length;
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
                            setSignInIdentifier(email.trim() || displayName.trim());
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
                      className="px-5 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 transition active:scale-95 bg-white"
                    >
                      <ArrowLeft size={18} />
                      <span>Back</span>
                    </button>
                  )}

                  {guidedStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95"
                    >
                      <span>Continue</span>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnrollSubmit}
                      disabled={allTeamsFull}
                      className="flex-1 py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{allTeamsFull ? 'League is Full' : 'Complete Registration 🎉'}</span>
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
            {/* Email Address or Display Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address or Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. alex@gmail.com or Alex T."
                  value={signInIdentifier}
                  onChange={e => { setSignInIdentifier(e.target.value); setSignInError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-11 pr-4 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                  required
                  autoFocus
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignInPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={e => { setSignInPassword(e.target.value); setSignInError(''); }}
                  className="w-full border-2 border-slate-300 focus:border-[#6d28d9] focus:ring-4 focus:ring-purple-100 rounded-2xl pl-11 pr-11 py-3 text-base text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition"
                  required
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error / Status Notification (At bottom directly above sign-in button) */}
            {signInError && (
              <div
                id="signin-error-bottom"
                tabIndex={-1}
                className={`${
                  signInError.includes('pending')
                    ? 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-2 border-rose-300 text-rose-800'
                } rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm font-medium shadow-sm transition outline-none`}
              >
                {signInError.includes('pending') ? (
                  <Clock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className="font-semibold block leading-relaxed">{signInError}</span>
                  {!signInError.includes('pending') && (
                    <button
                      type="button"
                      onClick={() => { setTab('enroll'); setSignInError(''); }}
                      className="inline-block mt-2 font-bold underline text-rose-900 hover:text-rose-950 text-xs sm:text-sm"
                    >
                      Go to Enroll as New →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>{isSigningIn ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        )}
      </div>
      </>
      )}
    </div>
  );
}
