import React, { useState } from 'react';
import { Clock, Lock, Save, RotateCcw } from 'lucide-react';
import { challengeState, formatTime } from '../lib/schedule';
import { useServerNow } from '../lib/useServerNow';

const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

const STATE_CHIP = {
  open: 'bg-emerald-100 text-emerald-800',
  upcoming: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-600',
  locked: 'bg-rose-100 text-rose-800',
};
const STATE_LABEL = { open: 'Open', upcoming: 'Not open yet', closed: 'Closed', locked: 'Locked' };

// Captain controls for time-gating. Times are UK time. The database enforces these on every submission.
export default function SchedulePanel({ schedule, windows, serverOffsetMs, onSaveSchedule }) {
  const nowMs = useServerNow(serverOffsetMs);
  const [draft, setDraft] = useState(schedule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!draft) return <div className="text-sm text-slate-500">Schedule is loading…</div>;

  const overrides = draft.overrides || {};
  const dirty = JSON.stringify(draft) !== JSON.stringify(schedule);
  const set = (patch) => { setDraft((d) => ({ ...d, ...patch })); setError(''); };
  const setOverride = (date, next) => {
    const o = { ...overrides };
    if (next) o[date] = next; else delete o[date];
    set({ overrides: o });
  };

  const validate = () => {
    if (draft.close_time <= draft.release_time) return 'The default closing time must be after the release time.';
    for (const [date, o] of Object.entries(overrides)) {
      if (o.mode === 'custom' && (!o.release_time || !o.close_time || o.close_time <= o.release_time)) {
        return `Custom hours for ${fmtDay(date)} need a closing time after the release time.`;
      }
    }
    return '';
  };

  const save = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setSaving(true);
    await onSaveSchedule(draft);
    setSaving(false);
  };

  const modeOf = (date) => overrides[date]?.mode || 'default';

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock size={18} className="text-[#6d28d9]" /> Challenge Schedule
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Each daily challenge opens and closes at these times (UK time). Participants can read a challenge early but can only
          submit while it is open. Saturday team missions and Sunday reflections stay open.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <input type="checkbox" checked={draft.gating !== false} onChange={(e) => set({ gating: e.target.checked })} />
        Time-gate daily challenges
      </label>

      <div className={`grid grid-cols-2 gap-4 max-w-sm ${draft.gating === false ? 'opacity-50' : ''}`}>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 space-y-1">
          Opens at
          <input type="time" value={draft.release_time} onChange={(e) => set({ release_time: e.target.value })}
            className="block w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-medium normal-case" />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 space-y-1">
          Closes at
          <input type="time" value={draft.close_time} onChange={(e) => set({ close_time: e.target.value })}
            className="block w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-medium normal-case" />
        </label>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Per-day overrides</h4>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {windows.map((w) => {
            const mode = modeOf(w.dayDate);
            const o = overrides[w.dayDate] || {};
            const state = challengeState(w, nowMs);
            return (
              <div key={`${w.weekNumber}-${w.dayName}`} className="p-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="w-32 font-semibold text-slate-800">Wk {w.weekNumber} · {fmtDay(w.dayDate)}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATE_CHIP[state]}`}>
                  {state === 'locked' && <Lock size={10} className="inline mr-1" />}
                  {w.ungated && state === 'open' ? 'Always open' : STATE_LABEL[state]}
                </span>
                {!w.ungated && !w.locked && (
                  <span className="text-xs text-slate-500">{formatTime(w.opensAt)}–{formatTime(w.closesAt)}</span>
                )}
                <select
                  value={mode}
                  onChange={(e) => {
                    const m = e.target.value;
                    if (m === 'default') setOverride(w.dayDate, null);
                    else if (m === 'custom') setOverride(w.dayDate, { mode: 'custom', release_time: draft.release_time, close_time: draft.close_time });
                    else setOverride(w.dayDate, { mode: m });
                  }}
                  className="ml-auto border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold"
                >
                  <option value="default">Default</option>
                  <option value="open">Open all day</option>
                  <option value="locked">Locked</option>
                  <option value="custom">Custom hours</option>
                </select>
                {mode === 'custom' && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <input type="time" value={o.release_time || ''} onChange={(e) => setOverride(w.dayDate, { ...o, release_time: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1" />
                    to
                    <input type="time" value={o.close_time || ''} onChange={(e) => setOverride(w.dayDate, { ...o, close_time: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Status shown is for the saved schedule. Save to apply changes.</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-semibold">{error}</div>}

      <div className="flex gap-2.5">
        <button type="button" onClick={save} disabled={!dirty || saving}
          className="px-5 py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving…' : 'Save schedule'}
        </button>
        <button type="button" onClick={() => { setDraft(schedule); setError(''); }} disabled={!dirty}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 flex items-center gap-2 disabled:opacity-50">
          <RotateCcw size={15} /> Discard
        </button>
      </div>
    </div>
  );
}
