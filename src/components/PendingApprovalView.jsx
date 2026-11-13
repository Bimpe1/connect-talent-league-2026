import React, { useState } from 'react';
import { Clock, RefreshCw, XCircle } from 'lucide-react';

// Shown after a participant signs in but before an admin has approved their registration.
// (The database also blocks submissions and uploads until approval, so this is not just cosmetic.)
export default function PendingApprovalView({ user, onCheckAgain }) {
  const [checking, setChecking] = useState(false);
  const rejected = user.status === 'rejected';
  // Accounts created from the Supabase dashboard (e.g. an invited facilitator) have no team or role chosen yet
  const hasTeam = Boolean(user.teamName);

  const check = async () => {
    setChecking(true);
    await onCheckAgain();
    setChecking(false);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-sm border text-center space-y-5 ${rejected ? 'border-rose-200' : 'border-purple-200'}`}>
        <div className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center mx-auto shadow-sm ${
          rejected ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'
        }`}>
          {rejected ? <XCircle size={32} /> : <Clock size={32} />}
        </div>

        <div className="space-y-2">
          <span className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full inline-block border ${
            rejected ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            {rejected ? 'Registration Not Approved' : 'Registration Submitted for Review'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 font-heading">Welcome, {user.name}!</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {rejected
              ? 'Your registration was not approved. Please speak to a Connect Talent facilitator if you think this is a mistake.'
              : <>Your registration{hasTeam && <> for <strong>Team {user.teamName}</strong></>} has been received. An admin will review and approve it before you can start the challenges. You can close this page and come back later: just sign in again with your email.</>}
          </p>
        </div>

        {!rejected && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500 font-medium">Player Name:</span><span className="font-bold text-slate-800">{user.name}</span></div>
            {hasTeam && (
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Team:</span><span className="font-bold text-purple-700">{user.teamName}</span></div>
            )}
            {hasTeam && (
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Role:</span><span className="font-bold text-slate-800 capitalize">{user.role}</span></div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold text-amber-700 flex items-center gap-1"><Clock size={12} /> Pending Admin Approval</span>
            </div>
          </div>
        )}

        {!rejected && !hasTeam && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-sm mx-auto">
            Are you a facilitator? Ask the league administrator to activate your account, then sign in again.
          </p>
        )}

        {!rejected && (
          <button
            type="button"
            onClick={check}
            disabled={checking}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95 inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? 'Checking…' : 'Check if I have been approved'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
