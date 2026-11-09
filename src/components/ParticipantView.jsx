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
  UserCheck
} from 'lucide-react';
import { WEEKS as DEFAULT_WEEKS } from '../data/curriculum';
import VoiceRecorder from './VoiceRecorder';
import MediaUploader from './MediaUploader';

export default function ParticipantView({ 
  currentUser, 
  submissions, 
  weeks,
  onSubmitChallenge 
}) {
  const [selectedWeek, setSelectedWeek] = useState(2);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [submissionText, setSubmissionText] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text', 'voice', 'media'
  const [attachedVoice, setAttachedVoice] = useState(null);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [buddyTested, setBuddyTested] = useState(false);
  const [buddyNotes, setBuddyNotes] = useState('');

  const activeWeeks = weeks || DEFAULT_WEEKS;
  const currentWeekData = activeWeeks.find(w => w.weekNumber === selectedWeek) || activeWeeks[1];
  const activeChallenge = currentWeekData.challenges[selectedDayIndex] || currentWeekData.challenges[0];

  // Current participant's submissions
  const mySubmissions = submissions.filter(s => s.participantId === currentUser.id);
  const existingSubmission = mySubmissions.find(
    s => s.weekNumber === selectedWeek && s.challengeTitle === activeChallenge.title
  );

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

    setSubmissionText('');
    setBuddyNotes('');
    setBuddyTested(false);
    setAttachedVoice(null);
    setAttachedMedia(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7 py-3">
      
      {/* Title Header with larger readable font */}
      <div className="text-center space-y-2 pb-1">
        <span className="text-xs sm:text-sm font-bold text-blue-700 tracking-wider uppercase bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full inline-block">
          Connect Talent League 2026
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
          {activeChallenge.title}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Week {selectedWeek} · {activeChallenge.day} · Max {activeChallenge.maxPoints} Talent Points
        </p>
      </div>

      {/* Week & Day Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-center gap-2 border-b border-slate-100 pb-2.5">
          {activeWeeks.map((w) => (
            <button
              key={w.weekNumber}
              onClick={() => {
                setSelectedWeek(w.weekNumber);
                setSelectedDayIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                selectedWeek === w.weekNumber
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              Week {w.weekNumber}
            </button>
          ))}
        </div>

        {/* Days Ribbon */}
        <div className="flex justify-center flex-wrap gap-2 pt-0.5">
          {currentWeekData.challenges.map((c, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                selectedDayIndex === idx
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {c.day}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
        
        {/* Challenge Instructions Box */}
        <div className="space-y-4">
          <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-5 text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Challenge:
            </span>
            {activeChallenge.instructions}
          </div>

          {activeChallenge.thinkingPrompt && (
            <div className="border border-blue-200 bg-blue-50/60 rounded-2xl p-5 text-sm sm:text-base text-blue-950 leading-relaxed">
              <span className="font-bold text-blue-800 block mb-1 uppercase tracking-wide text-xs">
                Explain your thinking (Earns full points):
              </span>
              <p className="italic font-medium">{activeChallenge.thinkingPrompt}</p>
            </div>
          )}
        </div>

        {/* Existing Submission or Form */}
        {existingSubmission ? (
          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-300 space-y-3">
            <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
              <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Evidence Submitted
              </span>
              <span className="text-sm font-bold text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">
                {existingSubmission.status === 'approved' 
                  ? `Approved (${existingSubmission.aiScore?.total || 20} TP)` 
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
                Choose how to answer:
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
                Your Answer & Explanation
              </label>
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type your response here... (What helped you decide? What might you check or change?)"
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
                <span>I tested or checked this idea with a buddy or teammate (+5 TP Evidence)</span>
              </label>

              {buddyTested && (
                <div className="pl-8 pt-1">
                  <input
                    type="text"
                    placeholder="Who did you test with and what did they say?"
                    value={buddyNotes}
                    onChange={(e) => setBuddyNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Effort counts · Your ideas matter
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                Submit Evidence to Captain
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Submissions List */}
      {mySubmissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
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
                className="py-3.5 flex justify-between items-center gap-4 text-sm first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5 truncate">
                  <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    Week {sub.weekNumber} · {sub.challengeTitle}
                  </div>
                  <div className="text-slate-500 text-xs sm:text-sm truncate">
                    {sub.submissionText}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {sub.status === 'approved' ? (
                    <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs sm:text-sm">
                      +{sub.aiScore?.total || 20} TP
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs sm:text-sm">
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
