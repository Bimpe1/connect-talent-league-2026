import React, { useState } from 'react';
import { 
  Camera, 
  Mic, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Check, 
  FileText, 
  PenTool, 
  Info, 
  ChevronRight, 
  UserCheck, 
  Flame, 
  Award, 
  Trophy, 
  X, 
  HelpCircle, 
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  Lock
} from 'lucide-react';
import { WEEKS as DEFAULT_WEEKS } from '../data/curriculum';
import { getChallengeTiming } from '../utils/timing';
import VoiceRecorder from './VoiceRecorder';
import MediaUploader from './MediaUploader';
import ChallengeMiniLab from './ChallengeMiniLab';
import ConfettiEffect from './ConfettiEffect';

export default function ParticipantView({ 
  currentUser, 
  submissions, 
  weeks,
  schedule,
  timing,
  onSubmitChallenge,
  onNavigateLeaderboard 
}) {
  const currentTiming = timing || getChallengeTiming(schedule);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [submissionText, setSubmissionText] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text', 'voice', 'media'
  const [attachedVoice, setAttachedVoice] = useState(null);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [buddyTested, setBuddyTested] = useState(false);
  const [buddyNotes, setBuddyNotes] = useState('');

  // Gamification & Celebration States
  const [confettiActive, setConfettiActive] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [lastSubmittedTitle, setLastSubmittedTitle] = useState('');
  const [challengeFormError, setChallengeFormError] = useState('');

  // Senior Walkthrough & How to Use Modal State (opens automatically on first visit)
  const [showHowToUseModal, setShowHowToUseModal] = useState(() => {
    try {
      return !localStorage.getItem(`ct_seen_guide_${currentUser?.id || 'guest'}`);
    } catch {
      return false;
    }
  });

  // In-Person Attendance State
  const [attendanceDay, setAttendanceDay] = useState('Wednesday');
  const [attendanceText, setAttendanceText] = useState('');
  const [attendanceMode, setAttendanceMode] = useState('text'); // 'text', 'voice', 'media'
  const [attendanceVoice, setAttendanceVoice] = useState(null);
  const [attendanceMedia, setAttendanceMedia] = useState(null);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceFormError, setAttendanceFormError] = useState('');

  const activeWeeks = weeks || DEFAULT_WEEKS;
  const currentWeekData = activeWeeks.find(w => w.weekNumber === selectedWeek) || activeWeeks[0];
  const activeChallenge = currentWeekData.challenges[selectedDayIndex] || currentWeekData.challenges[0];

  // Current participant's submissions
  const mySubmissions = submissions.filter(s => s.participantId === currentUser.id);
  const existingSubmission = mySubmissions.find(
    s => s.weekNumber === selectedWeek && s.challengeTitle === activeChallenge.title
  );

  // Check if physical attendance is already verified or pending for selectedWeek
  const isAttendanceVerified = !!currentUser.attendance?.[`wk${selectedWeek}`];
  const existingAttendanceSub = mySubmissions.find(
    s => s.weekNumber === selectedWeek && s.isAttendance
  );

  // Calculate current streak (number of challenges completed in this week)
  const completedInCurrentWeek = currentWeekData.challenges.filter(c =>
    mySubmissions.some(s => s.weekNumber === selectedWeek && s.challengeTitle === c.title)
  ).length;

  // Handle In-Person Attendance Submission
  const handleAttendanceSubmit = (e) => {
    e.preventDefault();
    setAttendanceFormError('');

    if (!attendanceText.trim() && !attendanceVoice && !attendanceMedia) {
      setAttendanceFormError("Please enter a short note, record a voice note, or attach a photo confirming your physical attendance.");
      return;
    }

    let fullNote = attendanceText.trim() || `Attended in person at the centre on ${attendanceDay}.`;
    if (attendanceVoice?.transcript) {
      fullNote += `\n\n[Voice Note]: ${attendanceVoice.transcript}`;
    }

    onSubmitChallenge({
      weekNumber: selectedWeek,
      challengeDay: attendanceDay,
      challengeTitle: `Week ${selectedWeek} In-Person Attendance`,
      submissionText: fullNote,
      mediaType: attendanceMedia?.type || (attendanceVoice ? 'voice' : 'text'),
      attachedVoice: attendanceVoice,
      attachedMedia: attendanceMedia,
      isAttendance: true
    });

    setLastSubmittedTitle(`Week ${selectedWeek} In-Person Attendance (+10 TP)`);
    setAttendanceText('');
    setAttendanceVoice(null);
    setAttendanceMedia(null);
    setShowAttendanceForm(false);
    setConfettiActive(true);
    setShowCelebrationModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setChallengeFormError('');

    if (!submissionText.trim() && !attachedVoice && !attachedMedia) {
      setChallengeFormError("Please enter a short answer, record a voice note, or attach a photo/drawing.");
      return;
    }

    let fullSubmission = submissionText.trim();
    if (attachedVoice?.transcript) {
      fullSubmission = fullSubmission 
        ? `${fullSubmission}\n\n[Voice Note Transcript]: ${attachedVoice.transcript}`
        : `[Voice Note Transcript]: ${attachedVoice.transcript}`;
    }

    if (buddyTested && buddyNotes.trim()) {
      fullSubmission += ` [Buddy check: Tested with ${buddyNotes.trim()}]`;
    } else if (buddyTested) {
      fullSubmission += ` [Tested with a buddy]`;
    }

    onSubmitChallenge({
      weekNumber: selectedWeek,
      challengeDay: activeChallenge.day,
      challengeTitle: activeChallenge.title,
      submissionText: fullSubmission || "Evidence attached.",
      mediaType: attachedMedia?.type || (attachedVoice ? 'voice' : 'text'),
      attachedVoice,
      attachedMedia,
      isTeamMission: !!activeChallenge.isTeamMission,
      isReflection: !!activeChallenge.isReflection
    });

    setLastSubmittedTitle(activeChallenge.title);
    setSubmissionText('');
    setBuddyNotes('');
    setBuddyTested(false);
    setAttachedVoice(null);
    setAttachedMedia(null);

    // Trigger celebration effects
    setConfettiActive(true);
    setShowCelebrationModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      
      {/* Confetti Particle Layer */}
      <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* ============================================================== */}
      {/* 1. WEEKLY RHYTHM & STREAK BANNER                                */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-[#0a2558] via-[#2e1065] to-[#4c1d95] rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3.5 border border-purple-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center font-bold text-amber-300">
              <Trophy size={18} />
            </span>
            <div>
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider block">
                {currentUser.teamName || 'Your'} Team Arena
              </span>
              <h3 className="text-base sm:text-lg font-bold font-heading">
                Week {selectedWeek}: {currentWeekData.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* How to Use / Senior Guide Button */}
            <button
              type="button"
              onClick={() => setShowHowToUseModal(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-2xs"
            >
              <HelpCircle size={15} className="text-amber-300" />
              <span>How It Works</span>
            </button>

            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold">
              <Flame size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span>{completedInCurrentWeek} Completed</span>
            </div>
          </div>
        </div>

        {/* Days of the Week Progress Dots */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs">
          {currentWeekData.challenges.map((c, idx) => {
            const isDone = mySubmissions.some(
              s => s.weekNumber === selectedWeek && s.challengeTitle === c.title
            );
            const isCurrent = selectedDayIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-between border ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#0a2558] to-[#6d28d9] text-white border-purple-400 shadow-md ring-2 ring-purple-300/50'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight">
                  {c.day.slice(0, 3)}
                </span>
                <span className="mt-1">
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white/30 block" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Selector Pills */}
      <div className="flex justify-center gap-2">
        {activeWeeks.map((w) => (
          <button
            key={w.weekNumber}
            onClick={() => {
              setSelectedWeek(w.weekNumber);
              setSelectedDayIndex(0);
              setShowAttendanceForm(false);
            }}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all border ${
              selectedWeek === w.weekNumber
                ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Week {w.weekNumber}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 2. WEEKLY IN-PERSON ATTENDANCE CARD (+10 TP)                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-[#0a2558] flex items-center justify-center font-bold border border-purple-200 flex-shrink-0">
              <MapPin size={20} className="text-[#6d28d9]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  In-Person Attendance
                </h3>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  +10 TP Bonus
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Attend physically at the Connect Talent centre on any day in Week {selectedWeek} to claim 10 TP.
              </p>
            </div>
          </div>

          <div>
            {isAttendanceVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Week {selectedWeek} Verified (+10 TP)</span>
              </span>
            ) : existingAttendanceSub ? (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3.5 py-1 rounded-full">
                <Clock size={15} className="text-amber-600" />
                <span>Pending Captain Review (+10 TP)</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Not Claimed Yet
              </span>
            )}
          </div>
        </div>

        {isAttendanceVerified ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={24} />
            <div className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
              <strong>Attendance Confirmed:</strong> Your physical in-person attendance for Week {selectedWeek} has been verified by the Captain. 10 Talent Points have been added to your score!
            </div>
          </div>
        ) : existingAttendanceSub ? (
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-amber-600" />
                <span>Evidence Submitted ({existingAttendanceSub.challengeDay || 'In-Person Session'})</span>
              </span>
              <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
                In Captain Queue
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-amber-100 whitespace-pre-wrap font-medium">
              {existingAttendanceSub.submissionText}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {!showAttendanceForm ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-purple-50/40 border border-purple-100 rounded-2xl p-4">
                <div className="text-xs sm:text-sm text-slate-700">
                  <span className="font-bold text-[#0a2558] block mb-0.5">Did you visit the centre this week?</span>
                  Submit a quick note, photo, or voice check-in confirming when you attended.
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttendanceForm(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <MapPin size={15} />
                  <span>Claim 10 TP Attendance</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAttendanceSubmit} className="space-y-4 pt-1 border border-purple-200 bg-purple-50/30 rounded-2xl p-3.5 sm:p-5">
                <div className="flex justify-between items-center pb-2 border-b border-purple-100">
                  <span className="text-xs sm:text-sm font-bold text-[#0a2558] uppercase tracking-wider">
                    Submit In-Person Attendance Evidence
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttendanceForm(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>

                {/* Day of Week Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Which day did you attend in person?
                  </label>
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAttendanceDay(d)}
                        className={`py-2 px-0.5 sm:px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition border ${
                          attendanceDay === d
                            ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evidence Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto sm:inline-flex">
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('text')}
                    className={`py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center text-[11px] sm:text-xs ${
                      attendanceMode === 'text' ? 'bg-[#0a2558] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quick Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('voice')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
                      attendanceMode === 'voice' ? 'bg-[#0a2558] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mic size={13} className="text-rose-400 flex-shrink-0" />
                    <span className="truncate">Voice</span>
                    {attendanceVoice && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('media')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
                      attendanceMode === 'media' ? 'bg-[#0a2558] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera size={13} className="text-blue-400 flex-shrink-0" />
                    <span className="truncate">Photo</span>
                    {attendanceMedia && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                  </button>
                </div>

                {/* Mode Contents */}
                {attendanceMode === 'text' && (
                  <textarea
                    rows={2}
                    value={attendanceText}
                    onChange={e => setAttendanceText(e.target.value)}
                    placeholder={`e.g. Attended in-person on ${attendanceDay} at the centre...`}
                    className="w-full border-2 border-slate-200 focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 rounded-xl p-3 text-sm focus:outline-none bg-white font-medium"
                  />
                )}

                {attendanceMode === 'voice' && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs text-slate-500 font-medium block">
                      Record a quick 10-second voice note saying when you visited:
                    </span>
                    <VoiceRecorder
                      onRecordingComplete={audioData => setAttendanceVoice(audioData)}
                      savedAudio={attendanceVoice}
                    />
                  </div>
                )}

                {attendanceMode === 'media' && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs text-slate-500 font-medium block">
                      Attach a selfie, photo of the sign-in sheet, or photo at the centre:
                    </span>
                    <MediaUploader
                      onMediaCaptured={mediaData => setAttendanceMedia(mediaData)}
                      savedMedia={attendanceMedia}
                    />
                  </div>
                )}

                {attendanceFormError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm p-3 rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                    <span>{attendanceFormError}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAttendanceForm(false)}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Submit Attendance Evidence (+10 TP)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. CHALLENGE CARD                                              */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
        
        {/* Challenge Header */}
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-700 tracking-wider uppercase bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                {activeChallenge.day} Challenge · Max {activeChallenge.maxPoints} TP
              </span>

              {/* Timing Status Pill */}
              <span className={`text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 border ${
                !currentTiming.isOpen
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : currentTiming.isClosingSoon
                  ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {!currentTiming.isOpen ? (
                  <>
                    <Lock size={12} className="text-rose-600 flex-shrink-0" />
                    <span>{currentTiming.badgeText}</span>
                  </>
                ) : currentTiming.isClosingSoon ? (
                  <>
                    <Clock size={12} className="text-amber-600 flex-shrink-0" />
                    <span>{currentTiming.badgeText}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{currentTiming.badgeText}</span>
                  </>
                )}
              </span>
            </div>

            {existingSubmission && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check size={12} />
                <span>Submitted</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            {activeChallenge.title}
          </h2>
        </div>

        {/* Challenge Instructions Box */}
        <div className="space-y-3.5">
          <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-5 text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Instructions:
            </span>
            {activeChallenge.instructions}
          </div>

          {activeChallenge.thinkingPrompt && (
            <div className="border border-blue-200 bg-blue-50/60 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-blue-950 leading-relaxed">
              <span className="font-bold text-blue-800 block mb-1 uppercase tracking-wide text-xs">
                Coach's Critical-Thinking Prompt:
              </span>
              <p className="italic font-medium">{activeChallenge.thinkingPrompt}</p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 3. INTERACTIVE CHALLENGE MINI-LAB                              */}
        {/* ============================================================== */}
        {!existingSubmission && (
          <ChallengeMiniLab
            challengeTitle={activeChallenge.title}
            onInsertIntoAnswer={(text) => {
              setSubmissionText(prev => prev ? `${prev}\n\n${text}` : text);
            }}
          />
        )}

        {/* Existing Submission or Response Form */}
        {existingSubmission ? (
          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-300 space-y-3">
            <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
              <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Evidence Submitted to Captain
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">
                {existingSubmission.status === 'approved' 
                  ? `Approved (+${existingSubmission.aiScore?.total || 20} TP)` 
                  : 'Pending Review'}
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 bg-white p-4 rounded-xl border border-emerald-200 leading-relaxed whitespace-pre-wrap font-medium">
              {existingSubmission.submissionText}
            </p>
          </div>
        ) : !currentTiming.isOpen ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-[#0a2558] flex items-center justify-center border border-purple-200 shadow-sm">
              <Lock size={22} className="text-[#6d28d9]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Submissions Currently Closed
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
              {currentTiming.reason} Review the challenge instructions and thinking prompt above to prepare your ideas!
            </p>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs mt-1">
              <Clock size={13} className="text-[#6d28d9]" />
              <span>Submission Window: <strong>{currentTiming.openDisplay} – {currentTiming.closeDisplay}</strong></span>
            </div>
          </div>
        ) : (
          /* Response Form */
          <form onSubmit={handleSubmit} className="space-y-6 pt-1">
            
            {/* Input Mode Selector Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 border-b border-slate-200 pb-3">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Choose how to submit evidence:
              </span>
              
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 sm:p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`py-1.5 px-2 sm:px-3.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition border flex items-center justify-center text-center ${
                    inputMode === 'text' 
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  Write Text
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`py-1.5 px-2 sm:px-3.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition flex items-center justify-center gap-1 border text-center ${
                    inputMode === 'voice' 
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <Mic size={14} className="text-rose-500 flex-shrink-0" />
                  <span className="truncate">Voice</span>
                  {attachedVoice && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('media')}
                  className={`py-1.5 px-2 sm:px-3.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition flex items-center justify-center gap-1 border text-center ${
                    inputMode === 'media' 
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <Camera size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">Photo</span>
                  {attachedMedia && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                </button>
              </div>
            </div>

            {/* Voice Mode Area */}
            {inputMode === 'voice' && (
              <VoiceRecorder
                onVoiceRecorded={(data) => {
                  setAttachedVoice(data);
                  if (data.transcript && !submissionText) {
                    setSubmissionText(data.transcript);
                  }
                }}
                onTranscriptGenerated={(trans) => {
                  if (!submissionText) setSubmissionText(trans);
                }}
              />
            )}

            {/* Media Mode Area */}
            {inputMode === 'media' && (
              <MediaUploader
                onMediaAttached={(media) => setAttachedMedia(media)}
                onMediaRemoved={() => setAttachedMedia(null)}
              />
            )}

            {/* Primary Textarea */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Your Answer & Reasoning
              </label>
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Share your thoughts here... Explain what helped you decide and what you learned."
                className="w-full border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl p-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none transition leading-relaxed bg-white shadow-inner font-normal"
              />
            </div>

            {/* Buddy Check Box */}
            <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-4 space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={buddyTested}
                  onChange={(e) => setBuddyTested(e.target.checked)}
                  className="rounded border-slate-400 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                />
                <span>I tested or discussed this idea with a buddy or teammate</span>
              </label>

              {buddyTested && (
                <div className="pl-8 pt-1">
                  <input
                    type="text"
                    placeholder="Who did you talk with and what was their feedback?"
                    value={buddyNotes}
                    onChange={(e) => setBuddyNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 4. COACH'S QUALITY TIPS (Honest Scaffolding - No Rigged Meter) */}
            {/* ============================================================== */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs sm:text-sm text-slate-700">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                <ShieldCheck size={16} className="text-blue-600" />
                Submission Quality Tips:
              </span>
              <p className="text-slate-500 text-xs">
                Submissions are scored on effort, reasoning, and peer collaboration:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold pt-1">
                <li className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <Check size={14} className="text-blue-600 flex-shrink-0" />
                  <span>Clear attempt &amp; effort</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <Check size={14} className="text-blue-600 flex-shrink-0" />
                  <span>Explain reasoning ("because...")</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <Check size={14} className="text-blue-600 flex-shrink-0" />
                  <span>Discuss or test with a buddy</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <Check size={14} className="text-blue-600 flex-shrink-0" />
                  <span>Note next step or improvement</span>
                </li>
              </ul>
            </div>

            {/* Validation Notice */}
            {challengeFormError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium">
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
                <span>{challengeFormError}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-2xl text-base font-bold shadow-md shadow-indigo-950/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                <span>Submit Evidence to Captain</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. RECENT SUBMISSIONS HISTORY                                  */}
      {/* ============================================================== */}
      {mySubmissions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Your Submission History
            </h4>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {mySubmissions.length} submitted
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {mySubmissions.map((sub) => (
              <div 
                key={sub.id} 
                className="py-3 flex justify-between items-center gap-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5 truncate">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    Week {sub.weekNumber} · {sub.challengeTitle}
                  </div>
                  <div className="text-slate-500 text-xs truncate">
                    {sub.submissionText}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {sub.status === 'approved' ? (
                    <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs">
                      +{sub.aiScore?.total || 20} TP
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs">
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. CELEBRATION FANFARE MODAL (On Submission)                   */}
      {/* ============================================================== */}
      {showCelebrationModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Trophy size={32} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0a2558] bg-purple-50 border border-purple-200 px-3 py-0.5 rounded-full inline-block">
                Team {currentUser.teamName || 'League'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Evidence Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                Great job completing <span className="font-bold text-slate-800">"{lastSubmittedTitle}"</span>. Your response has been placed in the Captain queue for review!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 flex items-center justify-around font-bold">
              <div className="text-center">
                <span className="block text-slate-400 font-normal text-[10px] uppercase">Streak</span>
                <span className="text-amber-600 text-sm flex items-center justify-center gap-0.5">
                  <Flame size={14} className="fill-amber-500" />
                  {completedInCurrentWeek} Days
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center">
                <span className="block text-slate-400 font-normal text-[10px] uppercase">Max Points</span>
                <span className="text-indigo-600 text-sm">Up to 20 TP</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              className="w-full py-3 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-950/20 transition active:scale-95"
            >
              Keep Going!
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SENIOR-FRIENDLY "HOW IT WORKS" WALKTHROUGH MODAL               */}
      {/* ============================================================== */}
      {showHowToUseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowHowToUseModal(false);
                try {
                  localStorage.setItem(`ct_seen_guide_${currentUser?.id || 'guest'}`, 'true');
                } catch {}
              }}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              aria-label="Close guide"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0a2558] to-[#6d28d9] text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-900/20">
                <Sparkles size={28} className="text-amber-300" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Welcome to Connect Talent!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto">
                Here is how everything works in 3 easy steps. You cannot break anything here!
              </p>
            </div>

            {/* 3 Simple Steps */}
            <div className="space-y-3.5 text-left">
              {/* Step 1 */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a2558] text-white flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Read Today's Short Question
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Every weekday morning, a new challenge appears. It takes just 5 to 10 minutes to think about.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Answer Any Way You Like
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Type a few sentences, OR press the microphone to talk, OR write on paper and upload a photo!
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Earn Points for Your Team
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    There are no wrong answers—your effort and curiosity are what count. Every entry scores points!
                  </p>
                </div>
              </div>
            </div>

            {/* Reassurance Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-xs text-amber-900 font-semibold">
                🌟 Go at your own pace. Have fun trying something new!
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowHowToUseModal(false);
                  try {
                    localStorage.setItem(`ct_seen_guide_${currentUser?.id || 'guest'}`, 'true');
                  } catch {}
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#0a2558] hover:from-[#163573] to-[#6d28d9] hover:to-[#5b21b6] text-white rounded-2xl text-base font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
              >
                Got It, Let's Start! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
