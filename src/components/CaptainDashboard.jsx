import SchedulePanel from './SchedulePanel';
import { EvidenceImage, EvidenceAudio } from './EvidenceMedia';
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
  Sparkles,
  AlertCircle,
  Lock,
  Unlock,
  Mail,
  Bell,
  Send,
  Eye,
  CheckCheck,
  UserCheck,
  UserX,
  Users,
  ShieldCheck
} from 'lucide-react';

import {
  TEAMS,
  RECOGNITION_BADGES,
  WEEKS as DEFAULT_WEEKS
} from '../data/curriculum';

export default function CaptainDashboard({
  currentUser,
  submissions,
  participants = [],
  weeks,
  registrations = [],
  onApproveParticipant,
  onRejectParticipant,
  onUpdateChallenge,
  onResetChallenges,
  schedule,
  windows,
  serverOffsetMs,
  onSaveSchedule,
  onApproveSubmission,
  onAdjustScore,
  onAwardBadge,
  onOpenWhatsAppModal
}) {
  const [section, setSection] = useState('queue');
  const [teamFilter, setTeamFilter] = useState('all');
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [confirmRejectId, setConfirmRejectId] = useState(null);

  // Participant Approval Lists
  const pendingRegistrations = registrations.filter(p => p.status === 'pending');
  const approvedParticipants = registrations.filter(p => p.status === 'approved');

  // Challenge Editor Form State
  const [editWeekNum, setEditWeekNum] = useState(1);
  const [editDayIndex, setEditDayIndex] = useState(0);

  const selectedWeekData =
    (weeks || DEFAULT_WEEKS).find(
      w => w.weekNumber === editWeekNum
    ) || (weeks || DEFAULT_WEEKS)[0];

  const selectedChallenge =
    selectedWeekData.challenges[editDayIndex] ||
    selectedWeekData.challenges[0];

  const [formTitle, setFormTitle] = useState(selectedChallenge.title);
  const [formInstructions, setFormInstructions] = useState(selectedChallenge.instructions);
  const [formThinkingPrompt, setFormThinkingPrompt] = useState(selectedChallenge.thinkingPrompt);
  const [formMaxPoints, setFormMaxPoints] = useState(selectedChallenge.maxPoints || 20);
  const [formCriticalFocus, setFormCriticalFocus] = useState(selectedWeekData.criticalFocus || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // When changing selected week or day in editor
  const handleSelectChallengeToEdit = (weekNum, dayIdx) => {
    setEditWeekNum(weekNum);
    setEditDayIndex(dayIdx);

    const wData =
      (weeks || DEFAULT_WEEKS).find(
        w => w.weekNumber === weekNum
      ) || (weeks || DEFAULT_WEEKS)[0];

    const cData =
      wData.challenges[dayIdx] || wData.challenges[0];

    setFormTitle(cData.title);
    setFormInstructions(cData.instructions);
    setFormThinkingPrompt(cData.thinkingPrompt);
    setFormMaxPoints(cData.maxPoints || 20);
    setFormCriticalFocus(wData.criticalFocus || '');
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  };

  const handleSaveChallenge = (e) => {
    e.preventDefault();
    setSaveErrorMsg('');

    if (!formTitle.trim() || !formInstructions.trim()) {
      setSaveErrorMsg("Title and instructions are required.");
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

    setSaveSuccessMsg(
      `Published! "${formTitle}" is now live for all participants.`
    );

    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const pendingSubmissions = submissions.filter(
    s => s.status === 'pending'
  );

  const filteredQueue = teamFilter === 'all'
    ? pendingSubmissions
    : pendingSubmissions.filter(
        s =>
          s.teamName?.toLowerCase() === teamFilter.toLowerCase()
      );

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-3">

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs sm:text-sm font-bold text-[#0a2558] tracking-wider uppercase bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full inline-block mb-1.5">
            Facilitator Portal
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            Captain Dashboard
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review submissions, approve players, and manage challenges.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
            const rows = [['name', 'email', 'team', 'role', 'status'], ...registrations.map(p => [p.name, p.email, p.teamName, p.role, p.status])];
            const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'league-participants.csv';
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#0a2558] border border-slate-300 rounded-xl text-sm font-bold"
        >
          Export emails (CSV)
        </button>
        <button
          onClick={onOpenWhatsAppModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Share2 size={15} />
          <span>WhatsApp Broadcast</span>
        </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">

        <button
          onClick={() => setSection('queue')}
          className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
            section === 'queue'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span>Review Queue</span>

          {pendingSubmissions.length > 0 && (
            <span className="bg-purple-300 text-[#0a2558] text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-black">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSection('approvals')}
          className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
            section === 'approvals'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <UserCheck size={14} />
          <span className="truncate">Approvals</span>

          {pendingRegistrations.length > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
              {pendingRegistrations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSection('manage_challenges')}
          className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
            section === 'manage_challenges'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Edit3 size={14} />
          <span className="truncate">Challenges</span>
        </button>

        <button
          onClick={() => setSection('badges')}
          className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
            section === 'badges'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Award size={14} />
          <span className="truncate">Badges</span>
        </button>

        <button
          onClick={() => setSection('schedule')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition border ${
            section === 'schedule'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          Schedule
        </button>

        <button
          onClick={() => setSection('checklist')}
          className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
            section === 'checklist'
              ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <CheckCircle size={14} />
          <span className="truncate">Checklist</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION: PARTICIPANT REGISTRATION APPROVALS                    */}
      {/* ============================================================== */}
      {section === 'approvals' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Player Registration Approvals
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    pendingRegistrations.length > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {pendingRegistrations.length > 0 ? `${pendingRegistrations.length} Awaiting Approval` : 'All Approved'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Approve newly registered players so they can sign in.
                </p>
              </div>

              {pendingRegistrations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    pendingRegistrations.forEach(p => onApproveParticipant?.(p.id));
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                >
                  <CheckCheck size={14} />
                  <span>Approve All ({pendingRegistrations.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Pending Registrations List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
              Pending Verification ({pendingRegistrations.length})
            </h4>

            {pendingRegistrations.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  No Pending Registrations
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All registered players are approved.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pendingRegistrations.map(p => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-amber-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-extrabold text-base text-slate-900 block font-heading">
                            {p.name}
                          </span>
                          <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-purple-200">
                            Team {p.teamName || 'Unassigned'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                          <Clock size={11} /> Pending
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1 pt-1">
                        <div>
                          <span className="font-semibold text-slate-600">Role: </span>
                          <span className="capitalize">{p.role || 'Learner'}</span>
                        </div>
                        {p.email && (
                          <div className="truncate">
                            <span className="font-semibold text-slate-600">Email: </span>
                            <span className="font-mono text-slate-700">{p.email}</span>
                          </div>
                        )}
                        {p.registeredAt && (
                          <div className="text-[11px] text-slate-400">
                            Registered: {new Date(p.registeredAt).toLocaleDateString()} {new Date(p.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {confirmRejectId === p.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-xs font-bold text-rose-800">Reject?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onRejectParticipant?.(p.id);
                              setConfirmRejectId(null);
                            }}
                            className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                          >
                            Yes, Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRejectId(null)}
                            className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onApproveParticipant?.(p.id)}
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmRejectId(p.id)}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition active:scale-95 flex items-center justify-center gap-1"
                            title="Decline registration"
                          >
                            <UserX size={14} />
                            <span className="hidden sm:inline">Decline</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Players Directory */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Approved Active Players ({approvedParticipants.length})
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Active players permitted to sign in.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                {approvedParticipants.length} Active Players
              </span>
            </div>

            {approvedParticipants.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                No approved players yet. Approve players above to activate them.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pt-1">
                {approvedParticipants.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Team {p.teamName} · {p.role || 'Learner'} {p.email ? `· ${p.email}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> Approved
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: SET & EDIT CHALLENGES                               */}

      {section === 'manage_challenges' && (
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-5 sm:space-y-6">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Set Daily Challenge
              </h3>

              <p className="text-xs sm:text-sm text-slate-500">
                Edit challenges for any day. Updates publish immediately.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition w-full sm:w-auto justify-center"
            >
              <RotateCcw size={13} />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* In-App Reset Confirmation Dialog */}
          {showResetConfirm && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <p className="text-xs sm:text-sm text-amber-900 font-semibold">
                Reset all challenges to curriculum defaults? Custom edits will be overwritten.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetChallenges();
                    handleSelectChallengeToEdit(2, 0);
                    setShowResetConfirm(false);
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Error Notice */}
          {saveErrorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Week & Day Selector */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider w-16">
                Week:
              </span>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(wNum => (
                  <button
                    key={wNum}
                    type="button"
                    onClick={() =>
                      handleSelectChallengeToEdit(wNum, editDayIndex)
                    }
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
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider w-16">
                Day:
              </span>

              <div className="flex flex-wrap gap-1.5">
                {selectedWeekData.challenges.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      handleSelectChallengeToEdit(editWeekNum, idx)
                    }
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
                  onChange={e => setFormTitle(e.target.value)}
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
                  onChange={e => setFormMaxPoints(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Instructions
              </label>

              <textarea
                rows={3}
                value={formInstructions}
                onChange={e => setFormInstructions(e.target.value)}
                placeholder="Step-by-step instructions for the challenge..."
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Thinking Prompt
              </label>

              <textarea
                rows={2}
                value={formThinkingPrompt}
                onChange={e => setFormThinkingPrompt(e.target.value)}
                placeholder="What helped you decide? What might you check or change?"
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Critical Thinking Focus
              </label>

              <input
                type="text"
                value={formCriticalFocus}
                onChange={e => setFormCriticalFocus(e.target.value)}
                placeholder="e.g. Comparing options and explaining decisions."
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <Save size={16} />
                <span>Save & Publish Challenge</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SECTION 2: QUEUE                                               */}

      {section === 'queue' && (
        <div className="space-y-4">

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-bold">
              {filteredQueue.length} pending review
            </span>

            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="bg-white border border-slate-300 text-sm text-slate-700 font-semibold rounded-xl px-3 py-1.5 shadow-sm focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Teams</option>

              {TEAMS.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {filteredQueue.length > 0 ? (
            <div className="space-y-4">

              {filteredQueue.map(sub => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl p-4 sm:p-7 shadow-sm border border-slate-200 space-y-4"
                >

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 border-b border-slate-200 pb-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base sm:text-lg text-slate-900">
                          {sub.participantName}
                        </h4>
                        {sub.isAttendance && (
                          <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            📍 In-Person Attendance Claim
                          </span>
                        )}
                      </div>

                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        {sub.teamName} · Week {sub.weekNumber} · {sub.challengeDay || 'Physical Attendance'}
                      </span>
                    </div>

                    <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                      sub.isAttendance
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                        : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}>
                      {sub.isAttendance 
                        ? `Attendance +${sub.aiScore?.total ?? 10} TP` 
                        : `Suggested ${sub.aiScore?.total ?? 15} / 20 TP`}
                    </span>
                  </div>

                  <div className="text-sm sm:text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap font-medium">
                    {sub.submissionText}
                  </div>

                  {/* Audio */}
                  {sub.attachedVoice?.path && (
                    <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-rose-900 block">
                        Recorded Voice Note Audio:
                      </span>

                      <EvidenceAudio path={sub.attachedVoice.path} />
                    </div>
                  )}

                  {/* Image/Drawing */}
                  {sub.attachedMedia?.path && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-700 block">
                        Attached Visual Evidence:
                      </span>

                      <EvidenceImage path={sub.attachedMedia.path} />
                    </div>
                  )}

                  {/* CAPTAIN SCORE ADJUSTMENT                           */}

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-slate-100">

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`score-${sub.id}`}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                      >
                        Adjust Talent Points
                      </label>

                      <div className="flex items-center gap-2">

                        <input
                          id={`score-${sub.id}`}
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={
                            scoreDrafts[sub.id] ??
                            (sub.aiScore?.total ?? 15)
                          }
                          onChange={e =>
                            setScoreDrafts(prev => ({
                              ...prev,
                              [sub.id]: e.target.value
                            }))
                          }
                          disabled={currentUser?.role !== 'captain'}
                          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-center text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        />

                        <span className="text-xs text-slate-500">
                          / 20 TP
                        </span>

                        <button
                          type="button"
                          disabled={
                            currentUser?.role !== 'captain' ||
                            scoreDrafts[sub.id] === undefined ||
                            scoreDrafts[sub.id] === '' ||
                            !Number.isInteger(Number(scoreDrafts[sub.id])) ||
                            Number(scoreDrafts[sub.id]) < 0 ||
                            Number(scoreDrafts[sub.id]) > 20
                          }
                          onClick={() => {
                            const score = Number(scoreDrafts[sub.id]);

                            if (
                              !Number.isInteger(score) ||
                              score < 0 ||
                              score > 20
                            ) {
                              return;
                            }

                            onAdjustScore(sub.id, score);

                            setScoreDrafts(prev => {
                              const updated = { ...prev };
                              delete updated[sub.id];
                              return updated;
                            });
                          }}
                          className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-[#0a2558] transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Save Score
                        </button>

                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApproveSubmission(sub.id)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 text-center justify-center flex items-center"
                    >
                      {sub.isAttendance ? 'Approve Attendance (+10 TP)' : `Approve ${sub.aiScore?.total ?? 15} TP`}
                    </button>

                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-1.5">
              <CheckCircle
                className="mx-auto text-emerald-500 mb-2"
                size={38}
              />

              <h4 className="text-base font-bold text-slate-900">
                Queue is Clear
              </h4>

              <p className="text-sm text-slate-500">
                All submissions have been verified.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: BADGES                                              */}
      {/* ============================================================== */}

      {section === 'badges' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">

          <div className="text-xs sm:text-sm text-slate-500 font-medium border-b border-slate-100 pb-3">
            Award badges for kindness, teamwork, and peer support.
          </div>

          <div className="divide-y divide-slate-200 text-sm">

            {participants.map(p => (
              <div
                key={p.id}
                className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 first:pt-0 last:pb-0"
              >

                <div>
                  <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                    {p.name}
                  </h5>

                  <span className="text-slate-500 text-xs sm:text-sm font-medium">
                    {p.teamName}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">

                  {RECOGNITION_BADGES.map(rb => {
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
                        {has ? '✓ ' : '+ '}
                        {rb.name}
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

      {section === 'schedule' && (
        <SchedulePanel
          schedule={schedule}
          windows={windows}
          serverOffsetMs={serverOffsetMs}
          onSaveSchedule={onSaveSchedule}
        />
      )}

      {section === 'checklist' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4 text-sm text-slate-700 leading-relaxed">

          <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
            Weekly Rhythm Checklist
          </h4>

          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li>Post daily challenges each weekday morning (5–15 mins).</li>
            <li>Paper, voice notes, and text submissions carry equal points.</li>
            <li>Supported completion earns full points when ideas are the participant's own.</li>
            <li>Submit scores by 6pm Sunday; publish results at 7pm.</li>
            <li>Participants may query a score within 48 hours.</li>
          </ul>

        </div>
      )}

    </div>
  );
}