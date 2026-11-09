import React from 'react';
import { X, Shield, Lock, FileCode, CheckCircle2 } from 'lucide-react';

export default function SecurityModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-800 p-2 rounded-xl">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Backend Security & Role Integrity</h3>
              <p className="text-xs text-gray-500">How Connect Talent League guarantees tamper-proof scoring</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto my-4 space-y-4 text-xs text-gray-700">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-blue-600" />
              Client-Side UI vs Database Enforcement
            </h4>
            <p className="leading-relaxed">
              In this application, hiding the Captain's portal behind a passkey is only the first line of defense. 
              The true protection resides in <code className="bg-blue-200/60 px-1 py-0.5 rounded font-mono">firestore.rules</code>:
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">1. Participant Isolation (Read Rule)</span>
              <p className="text-gray-600">
                Participants can only read their own evidence documents (<code className="font-mono">resource.data.participantId == request.auth.uid</code>). 
                Captains alone possess elevated access to read all pending queue submissions across all 7 teams.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">2. Prevention of Pre-Approved Submissions (Create Rule)</span>
              <p className="text-gray-600">
                A participant can only create documents in status <code className="font-mono">'pending'</code>. 
                Any write attempt containing pre-set approved scores or status is immediately rejected by the database engine.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">3. Captain-Only Updates (Update Rule)</span>
              <p className="text-gray-600">
                Status changes to <code className="font-mono">'approved'</code> and Talent Point modifications strictly verify that the caller's JWT token has <code className="font-mono">request.auth.token.role == 'captain'</code>. 
                Even if someone tampers with local browser JavaScript, Firestore returns <code className="font-mono">PERMISSION_DENIED</code>.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">4. Permanent Audit Trail (Delete Rule)</span>
              <p className="text-gray-600">
                Submissions cannot be deleted once entered (<code className="font-mono">allow delete: if false;</code>), guaranteeing complete accountability for volunteer captains and learners.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
