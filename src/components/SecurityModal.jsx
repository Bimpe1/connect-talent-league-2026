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
              The true protection resides in the PostgreSQL serverless backend (<code className="bg-blue-200/60 px-1 py-0.5 rounded font-mono">/api/</code>):
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">1. Serverless SQL Isolation & Sanitization</span>
              <p className="text-gray-600">
                All participant and submission writes use parameterized SQL queries through Neon serverless drivers, protecting against query injection and guaranteeing that participant records are strictly segregated.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">2. Prevention of Pre-Approved Submissions</span>
              <p className="text-gray-600">
                Participant submissions are created with default status <code className="font-mono">'pending'</code>. 
                Scores and points are not calculated or credited on the client; they must be verified and approved by a Captain.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">3. Captain Scoring Authority</span>
              <p className="text-gray-600">
                Talent Point modifications (0–20 TP) and status transitions to <code className="font-mono">'approved'</code> require verified Facilitator authorization. Client tampering cannot bypass server-side validation.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border rounded-xl">
              <span className="font-bold text-gray-900 block mb-0.5">4. Permanent Audit Trail</span>
              <p className="text-gray-600">
                All submissions, timestamps, and approved points are permanently recorded in PostgreSQL, ensuring complete transparency and accountability for volunteers and participants throughout the 4-week League.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] hover:from-[#0d2e6e] hover:to-[#7c3aed] text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
