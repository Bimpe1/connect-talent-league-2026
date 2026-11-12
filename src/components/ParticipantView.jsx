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
  ShieldCheck
} from 'lucide-react';
import { WEEKS as DEFAULT_WEEKS } from '../data/curriculum';
import VoiceRecorder from './VoiceRecorder';
import MediaUploader from './MediaUploader';
import ChallengeMiniLab from './ChallengeMiniLab';
import ConfettiEffect from './ConfettiEffect';

export default function ParticipantView({ 
  currentUser, 
  submissions, 
  weeks,
  onSubmitChallenge
}) {
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

  const activeWeeks = weeks || DEFAULT_WEEKS;
  const currentWeekData = activeWeeks.find(w => w.weekNumber === selectedWeek) || activeWeeks[0];
  const activeChallenge = currentWeekData.challenges[selectedDayIndex] || currentWeekData.challenges[0];

  // Current participant's submissions
  const mySubmissions = submissions.filter(s => s.participantId === currentUser.id);
  const existingSubmission = mySubmissions.find(
    s => s.weekNumber === selectedWeek && s.challengeTitle === activeChallenge.title
  );

  // Calculate current streak (number of challenges completed in this week)
  const completedInCurrentWeek = currentWeekData.challenges.filter(c =>
    mySubmissions.some(s => s.weekNumber === selectedWeek && s.challengeTitle === c.title)
  ).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !attachedVoice && !attachedMedia) {
      alert("Please enter a short answer, record a voice note, or attach a photo/drawing.");
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
      {/* 2. CHALLENGE CARD                                              */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        
        {/* Challenge Header */}
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
              {activeChallenge.day} Challenge · Max {activeChallenge.maxPoints} TP
            </span>
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
        ) : (
          /* Response Form */
          <form onSubmit={handleSubmit} className="space-y-6 pt-1">
            
            {/* Input Mode Selector Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3.5">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Choose how to submit evidence:
              </span>
              
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition border ${
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border ${
                    inputMode === 'voice' 
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <Mic size={15} className="text-rose-500" />
                  <span>Voice Note</span>
                  {attachedVoice && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('media')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border ${
                    inputMode === 'media' 
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <Camera size={15} className="text-blue-500" />
                  <span>Photo / Drawing</span>
                  {attachedMedia && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
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
                Coach's Rubric Quality Tips:
              </span>
              <p className="text-slate-500 text-xs">
                Captains evaluate submissions individually based on effort, reasoning, and peer collaboration. For full marks, remember to:
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
    </div>
  );
}
