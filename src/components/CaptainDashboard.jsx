import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Check, 
  Share2, 
  FileText, 
  Award, 
  Calendar,
  Volume2,
  ImageIcon,
  Edit3,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { TEAMS, RECOGNITION_BADGES, WEEKS as DEFAULT_WEEKS } from '../data/curriculum';

export default function CaptainDashboard({
  currentUser,
  submissions,
  participants,
  weeks,
  onUpdateChallenge,
  onResetChallenges,
  onApproveSubmission,
  onAdjustScore,
  onToggleAttendance,
  onAwardBadge,
  onOpenWhatsAppModal
}) {
  const [section, setSection] = useState('queue'); // 'queue', 'manage_challenges', 'attendance', 'badges', 'checklist'
  const [teamFilter, setTeamFilter] = useState('all');

  // Challenge Editor Form State
  const [editWeekNum, setEditWeekNum] = useState(1);
  const [editDayIndex, setEditDayIndex] = useState(0);

  const selectedWeekData = (weeks || DEFAULT_WEEKS).find(w => w.weekNumber === editWeekNum) || (weeks || DEFAULT_WEEKS)[0];
  const selectedChallenge = selectedWeekData.challenges[editDayIndex] || selectedWeekData.challenges[0];

  const [formTitle, setFormTitle] = useState(selectedChallenge.title);
  const [formInstructions, setFormInstructions] = useState(selectedChallenge.instructions);
  const [formThinkingPrompt, setFormThinkingPrompt] = useState(selectedChallenge.thinkingPrompt);
  const [formMaxPoints, setFormMaxPoints] = useState(selectedChallenge.maxPoints || 20);
  const [formCriticalFocus, setFormCriticalFocus] = useState(selectedWeekData.criticalFocus || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // When changing selected week or day in editor
  const handleSelectChallengeToEdit = (weekNum, dayIdx) => {
    setEditWeekNum(weekNum);
    setEditDayIndex(dayIdx);
    const wData = (weeks || DEFAULT_WEEKS).find(w => w.weekNumber === weekNum) || (weeks || DEFAULT_WEEKS)[0];
    const cData = wData.challenges[dayIdx] || wData.challenges[0];

    setFormTitle(cData.title);
    setFormInstructions(cData.instructions);
    setFormThinkingPrompt(cData.thinkingPrompt);
    setFormMaxPoints(cData.maxPoints || 20);
    setFormCriticalFocus(wData.criticalFocus || '');
    setSaveSuccessMsg('');
  };

  const handleSaveChallenge = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formInstructions.trim()) {
      alert("Title and instructions are required.");
      return;
    }

    onUpdateChallenge({
      weekNumber: editWeekNum,
      dayIndex: editDayIndex,
      updatedChallenge: {
        ...selectedChallenge,
        title: formTitle.trim(),
        instructions: formInstructions.trim(),
        thinkingPrompt: formThinkingPrompt.trim(),
        maxPoints: parseInt(formMaxPoints, 10) || 20
      },
      updatedCriticalFocus: formCriticalFocus.trim()
    });

    setSaveSuccessMsg(`Published! "${formTitle}" is now live for all participants.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const filteredQueue = teamFilter === 'all' 
    ? pendingSubmissions 
    : pendingSubmissions.filter(s => s.teamName?.toLowerCase() === teamFilter.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-3">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs sm:text-sm font-bold text-blue-700 tracking-wider uppercase bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full inline-block mb-1.5">
            Facilitator Portal
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            Captain Dashboard
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Set challenges, verify participant evidence, record attendance, and export Sunday announcements.
          </p>
        </div>

        <button
          onClick={onOpenWhatsAppModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Share2 size={15} />
          <span>WhatsApp Broadcast</span>
        </button>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setSection('queue')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 border ${
            section === 'queue' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span>Review Queue</span>
          {pendingSubmissions.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSection('manage_challenges')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 border ${
            section === 'manage_challenges' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Edit3 size={15} />
          <span>Set & Edit Challenges</span>
        </button>

        <button
          onClick={() => setSection('attendance')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${
            section === 'attendance' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          Thursday Attendance
        </button>

        <button
          onClick={() => setSection('badges')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${
            section === 'badges' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          Award Recognition Badges
        </button>

        <button
          onClick={() => setSection('checklist')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${
            section === 'checklist' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          Checklist
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: SET & EDIT CHALLENGES (NEW FEATURE)                 */}
      {/* ============================================================== */}
      {section === 'manage_challenges' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Set Daily Challenge</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Create or modify challenges for any day. Changes update immediately for all participants.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm("Reset all challenges to the official Connect Talent 2026 Curriculum?")) {
                  onResetChallenges();
                  handleSelectChallengeToEdit(2, 0);
                }
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RotateCcw size={13} />
              <span>Reset to Default Pack</span>
            </button>
          </div>

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Week & Day Selector for Editor */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider w-16">Week:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(wNum => (
                  <button
                    key={wNum}
                    type="button"
                    onClick={() => handleSelectChallengeToEdit(wNum, editDayIndex)}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border transition ${
                      editWeekNum === wNum 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Week {wNum}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider w-16">Day:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWeekData.challenges.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectChallengeToEdit(editWeekNum, idx)}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border transition ${
                      editDayIndex === idx 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Challenge Edit Form */}
          <form onSubmit={handleSaveChallenge} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. A message that matters"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Max Talent Points
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="5"
                  value={formMaxPoints}
                  onChange={(e) => setFormMaxPoints(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Instructions (What participants do)
              </label>
              <textarea
                rows={3}
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                placeholder="Give clear, step-by-step guidance for the daily challenge..."
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Explain Your Thinking Prompt
              </label>
              <textarea
                rows={2}
                value={formThinkingPrompt}
                onChange={(e) => setFormThinkingPrompt(e.target.value)}
                placeholder="What helped you decide? What might you check or change?..."
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Week {editWeekNum} Critical Thinking Focus
              </label>
              <input
                type="text"
                value={formCriticalFocus}
                onChange={(e) => setFormCriticalFocus(e.target.value)}
                placeholder="e.g. Comparing options and explaining decisions."
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <Save size={16} />
                <span>Save & Publish Challenge</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: QUEUE                                               */}
      {/* ============================================================== */}
      {section === 'queue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-bold">{filteredQueue.length} pending review</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-white border border-slate-300 text-sm text-slate-700 font-semibold rounded-xl px-3 py-1.5 shadow-sm focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Teams</option>
              {TEAMS.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {filteredQueue.length > 0 ? (
            <div className="space-y-4">
              {filteredQueue.map((sub) => (
                <div key={sub.id} className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-3.5">
                    <div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-900">{sub.participantName}</h4>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">{sub.teamName} · Week {sub.weekNumber} {sub.challengeDay}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
                      Suggested {sub.aiScore?.total || 15} / 20 TP
                    </span>
                  </div>

                  <div className="text-sm sm:text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap font-medium">
                    {sub.submissionText}
                  </div>

                  {/* Audio */}
                  {sub.attachedVoice?.url && (
                    <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-rose-900 block">Recorded Voice Note Audio:</span>
                      <audio src={sub.attachedVoice.url} controls className="w-full h-9" />
                    </div>
                  )}

                  {/* Image/Drawing */}
                  {sub.attachedMedia?.dataUrl && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-700 block">Attached Visual Evidence:</span>
                      <img src={sub.attachedMedia.dataUrl} alt="Visual evidence" className="max-h-56 rounded-lg border border-slate-300 mx-auto" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onAdjustScore(sub.id)}
                      className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                    >
                      Adjust Score
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveSubmission(sub.id)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
                    >
                      Approve {sub.aiScore?.total || 20} TP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-1.5">
              <CheckCircle className="mx-auto text-emerald-500 mb-2" size={38} />
              <h4 className="text-base font-bold text-slate-900">Queue is Clear</h4>
              <p className="text-sm text-slate-500">All submissions have been verified.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: ATTENDANCE                                          */}
      {/* ============================================================== */}
      {section === 'attendance' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="text-sm text-slate-600 font-medium border-b border-slate-100 pb-3">
            Click boxes to toggle 1 (attended) or 0 (missed). Thursday sessions earn 10 TP attendance bonus.
          </div>

          <div className="divide-y divide-slate-200 text-sm">
            {participants.map((p) => {
              const bonus = ((p.attendance.wk1 ? 1 : 0) + 
                             (p.attendance.wk2 ? 1 : 0) + 
                             (p.attendance.wk3 ? 1 : 0) + 
                             (p.attendance.wk4 ? 1 : 0)) * 10;
              return (
                <div key={p.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 first:pt-0 last:pb-0">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base">{p.name}</h5>
                    <span className="text-slate-500 text-xs sm:text-sm font-medium">{p.teamName}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {['wk1', 'wk2', 'wk3', 'wk4'].map((wk, i) => (
                      <button
                        key={wk}
                        onClick={() => onToggleAttendance(p.id, wk)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs sm:text-sm border transition ${
                          p.attendance[wk] 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                        title={`Week ${i + 1}`}
                      >
                        {p.attendance[wk] ? '1' : '0'}
                      </button>
                    ))}
                    <span className="text-sm font-black text-blue-700 ml-2 w-16 text-right">+{bonus} TP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: BADGES                                              */}
      {/* ============================================================== */}
      {section === 'badges' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="text-sm text-slate-600 font-medium border-b border-slate-100 pb-3">
            Award recognition badges for considerate help, kindness, and peer support.
          </div>

          <div className="divide-y divide-slate-200 text-sm">
            {participants.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 first:pt-0 last:pb-0">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm sm:text-base">{p.name}</h5>
                  <span className="text-slate-500 text-xs sm:text-sm font-medium">{p.teamName}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {RECOGNITION_BADGES.map((rb) => {
                    const has = p.badges?.includes(rb.id);
                    return (
                      <button
                        key={rb.id}
                        disabled={has}
                        onClick={() => onAwardBadge(p.id, rb.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                          has 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700 shadow-sm'
                        }`}
                      >
                        {has ? '✓ ' : '+ '} {rb.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 5: CHECKLIST                                           */}
      {/* ============================================================== */}
      {section === 'checklist' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4 text-sm text-slate-700 leading-relaxed">
          <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">Weekly Rhythm Checklist</h4>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>Post one daily challenge each weekday morning (5–15 mins).</li>
            <li>Paper, verbal, and WhatsApp routes carry equal points.</li>
            <li>Supported completion earns full points when ideas are the participant's own.</li>
            <li>Submit scores by 6pm Sunday; publish results at 7pm.</li>
            <li>Participants can query a score privately within 48 hours for a second captain review.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
