import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { WEEKS as DEFAULT_WEEKS, TEAMS } from '../data/curriculum';

export default function WhatsAppTemplatesModal({ 
  isOpen, 
  onClose, 
  participants,
  weeks
}) {
  const [templateType, setTemplateType] = useState('daily'); // 'daily' or 'results'
  const [selectedWeek, setSelectedWeek] = useState(2);
  const [selectedDay, setSelectedDay] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeWeeks = weeks || DEFAULT_WEEKS;
  const currentWeek = activeWeeks.find(w => w.weekNumber === selectedWeek) || activeWeeks[1];
  const currentChallenge = currentWeek.challenges[selectedDay] || currentWeek.challenges[0];

  // Daily Challenge Text
  const dailyText = `*CONNECT TALENT LEAGUE - WEEK ${selectedWeek}, ${currentChallenge.day.toUpperCase()}*
*Today's challenge: ${currentChallenge.title}*

${currentChallenge.instructions}

Explain your thinking: What helped you decide?
What might you check or change?

Up to *${currentChallenge.maxPoints} TP*. Allow around 5-15 minutes.

Send a short text, voice note or drawing, or explain it
to your captain. Paper and supported participation are
welcome.

*Your effort counts. Your ideas matter.*`;

  // Sunday Results Text Calculation
  const sortedParticipants = [...participants].sort((a, b) => {
    const aTotal = (a.wk1 || 0) + (a.wk2 || 0) + (a.attendance.wk1 ? 10 : 0) + (a.attendance.wk2 ? 10 : 0);
    const bTotal = (b.wk1 || 0) + (b.wk2 || 0) + (b.attendance.wk1 ? 10 : 0) + (b.attendance.wk2 ? 10 : 0);
    return bTotal - aTotal;
  });
  const topIndividual = sortedParticipants[0];

  const resultsText = `*CONNECT TALENT LEAGUE - WEEK ${selectedWeek} RESULTS*

Top Individual: ${topIndividual?.name || 'Sam V.'} - 220 TP
Top Team: Vision - 198.5 TP per member
${selectedWeek === 1 ? 'Strong Start' : 'Rising Star'}: Maya K. - weekly score up 20 TP
Kindness Champion: Maya K. - supported peer with text contrast

New Milestones:
• Alex P. (Growing Confidence - 100 TP)
• Sam V. (Building Momentum - 250 TP)

Thank you to everyone who tried something new, supported
a teammate or kept learning.

Prize collection: Thursday session at the hub or via buddy drop-off.
*Next week brings fresh challenges and more chances to shine!*`;

  const textToCopy = templateType === 'daily' ? dailyText : resultsText;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">WhatsApp Broadcast Generator</h3>
              <p className="text-xs text-slate-500 font-medium">Official message templates from Page 10 of the pack</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Template Selectors */}
        <div className="my-4 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTemplateType('daily')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                templateType === 'daily' ? 'bg-white text-emerald-800 border border-slate-300 shadow-sm' : 'text-slate-600'
              }`}
            >
              Daily Challenge Post
            </button>
            <button
              onClick={() => setTemplateType('results')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                templateType === 'results' ? 'bg-white text-emerald-800 border border-slate-300 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sunday Results (7pm)
            </button>
          </div>

          {templateType === 'daily' && (
            <div className="flex gap-2">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm border border-slate-300 rounded-xl px-3 py-1.5 font-semibold bg-white"
              >
                <option value={1}>Week 1</option>
                <option value={2}>Week 2</option>
                <option value={3}>Week 3</option>
                <option value={4}>Week 4</option>
              </select>

              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm border border-slate-300 rounded-xl px-3 py-1.5 font-semibold bg-white"
              >
                {currentWeek.challenges.map((c, i) => (
                  <option key={i} value={i}>{c.day}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Message Content Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
          {textToCopy}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Ready to copy and paste into your WhatsApp broadcast group.
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 flex-1 sm:flex-initial"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition flex-1 sm:flex-initial"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Template'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
