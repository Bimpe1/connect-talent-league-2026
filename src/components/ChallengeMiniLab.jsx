import React, { useState } from 'react';
import { 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Lightbulb,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function ChallengeMiniLab({ challengeTitle, onInsertIntoAnswer }) {
  const title = challengeTitle?.toLowerCase() || '';

  // 1. Budget Mini-Lab State (£20 Decision)
  const [budget, setBudget] = useState({
    materials: 8,
    snacks: 6,
    digital: 4,
    prize: 2
  });

  // 2. Phishing Scanner Mini-Lab State (Pause Before You Click)
  const [spottedFlags, setSpottedFlags] = useState({
    sender: false,
    urgency: false,
    link: false
  });

  // 3. Fact vs Opinion Sorter State
  const [sortedCards, setSortedCards] = useState({
    c1: null,
    c2: null,
    c3: null
  });

  // 4. Laptop Hub Timetable State (30 mins shared between 3 people)
  const [laptopSlots, setLaptopSlots] = useState({
    personA: 10,
    personB: 10,
    personC: 10
  });

  // Handler for inserting budget
  const handleInsertBudget = () => {
    const total = budget.materials + budget.snacks + budget.digital + budget.prize;
    const text = `My £20 Budget Allocation:\n• Learning & Art Materials: £${budget.materials}\n• Refreshments & Snacks: £${budget.snacks}\n• Digital Tools & Print: £${budget.digital}\n• Small Team Prize: £${budget.prize}\nTotal: £${total} / £20.\n\nReasoning: I allocated £${budget.materials} to materials because hands-on practice helps people learn best, while snacks ensure everyone feels welcome.`;
    onInsertIntoAnswer(text);
  };

  // Handler for inserting phishing flags
  const handleInsertPhishing = () => {
    const text = `Inspection Findings for Suspicious Message:\n1. Fake Urgency: Demands action within 12 minutes to cause panic.\n2. Suspicious Sender: Domain 'verify-bank-security2026.xyz' is unofficial.\n3. Safe Next Step: Never click the link; report the message to an advisor or official support channel.`;
    onInsertIntoAnswer(text);
  };

  // Handler for inserting sorting
  const handleInsertSorting = () => {
    const text = `Statement Sorting Analysis:\n1. 'Connect Talent meets every Thursday' -> Fact (verifiable schedule).\n2. 'Everyone finds technology very easy' -> Opinion / False assumption (everyone has different comfort levels).\n3. 'Team Phoenix has 6 places' -> Fact (matches team directory).\n\nReasoning: Checked against official league guidelines rather than personal assumptions.`;
    onInsertIntoAnswer(text);
  };

  // Handler for inserting laptop schedule
  const handleInsertLaptopSchedule = () => {
    const text = `Fair 30-Minute Laptop Sharing Plan:\n• Person A (Job application / urgent deadline): ${laptopSlots.personA} minutes\n• Person B (Course learning module): ${laptopSlots.personB} minutes\n• Person C (Email & digital practice): ${laptopSlots.personC} minutes\nTotal: ${laptopSlots.personA + laptopSlots.personB + laptopSlots.personC} minutes.\n\nFairness explanation: Equal 10-minute blocks with 2-minute buffer for handover so no one is rushed.`;
    onInsertIntoAnswer(text);
  };

  // ==============================================================
  // MINI-LAB 1: £20 BUDGET DECISION
  // ==============================================================
  if (title.includes('£20') || title.includes('budget') || title.includes('decision')) {
    const total = budget.materials + budget.snacks + budget.digital + budget.prize;
    const isExact = total === 20;

    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg">
              <Sliders size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Interactive £20 Budget Allocator</h4>
              <p className="text-xs text-slate-600">Slide to test different trade-offs before explaining your choice</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-black border ${
            isExact ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}>
            Total: £{total} / £20
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-semibold">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>🎨 Learning & Materials</span>
              <span className="font-bold text-amber-900">£{budget.materials}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={budget.materials}
              onChange={(e) => setBudget({ ...budget, materials: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>🥪 Refreshments & Snacks</span>
              <span className="font-bold text-amber-900">£{budget.snacks}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={budget.snacks}
              onChange={(e) => setBudget({ ...budget, snacks: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>💻 Digital Print & Guides</span>
              <span className="font-bold text-amber-900">£{budget.digital}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={budget.digital}
              onChange={(e) => setBudget({ ...budget, digital: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>🎁 Small Team Prize</span>
              <span className="font-bold text-amber-900">£{budget.prize}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={budget.prize}
              onChange={(e) => setBudget({ ...budget, prize: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-amber-200/80">
          <span className="text-xs text-amber-800 font-medium">
            {isExact ? '✅ Perfectly balanced at £20!' : total > 20 ? '⚠️ You are over the £20 budget limit.' : '💡 You still have funds remaining to allocate.'}
          </span>
          <button
            type="button"
            onClick={handleInsertBudget}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Sparkles size={14} />
            <span>Use This Split in My Answer</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // MINI-LAB 2: PAUSE BEFORE YOU CLICK (PHISHING SCANNER)
  // ==============================================================
  if (title.includes('pause') || title.includes('click') || title.includes('warning') || title.includes('scam')) {
    const spottedCount = Object.values(spottedFlags).filter(Boolean).length;

    return (
      <div className="bg-gradient-to-br from-rose-50 to-orange-50/60 border-2 border-rose-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-rose-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 text-white p-1.5 rounded-lg">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Interactive Phishing Red-Flag Scanner</h4>
              <p className="text-xs text-slate-600">Tap the 3 suspicious areas in the mock message below to inspect them</p>
            </div>
          </div>
          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-xs font-black">
            {spottedCount}/3 Flags Spotted
          </span>
        </div>

        {/* Mock Simulated Message */}
        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm space-y-3 font-sans text-xs sm:text-sm">
          {/* Header Area */}
          <div 
            onClick={() => setSpottedFlags({ ...spottedFlags, sender: !spottedFlags.sender })}
            className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
              spottedFlags.sender ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-slate-50 border-dashed border-rose-300 hover:bg-rose-50'
            }`}
          >
            <div>
              <span className="text-[11px] text-slate-400 block font-normal">Sender Address:</span>
              <span className="font-mono font-bold">urgent-notice@verify-bank-security2026.xyz</span>
            </div>
            <span className="text-xs font-bold">{spottedFlags.sender ? '🚩 Flagged: Fake Domain!' : 'Tap to Inspect'}</span>
          </div>

          {/* Body Area */}
          <div
            onClick={() => setSpottedFlags({ ...spottedFlags, urgency: !spottedFlags.urgency })}
            className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
              spottedFlags.urgency ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-slate-50 border-dashed border-rose-300 hover:bg-rose-50'
            }`}
          >
            <div>
              <span className="text-[11px] text-slate-400 block font-normal">Message Body:</span>
              <p className="font-medium text-slate-800">
                "FINAL WARNING: Your account access will be terminated within 12 minutes unless a verification charge of £45 is authorized immediately."
              </p>
            </div>
            <span className="text-xs font-bold flex-shrink-0 ml-2">{spottedFlags.urgency ? '🚩 Flagged: Manufactured Panic!' : 'Tap to Inspect'}</span>
          </div>

          {/* Button Area */}
          <div
            onClick={() => setSpottedFlags({ ...spottedFlags, link: !spottedFlags.link })}
            className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
              spottedFlags.link ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-slate-50 border-dashed border-rose-300 hover:bg-rose-50'
            }`}
          >
            <div>
              <span className="text-[11px] text-slate-400 block font-normal">Action Button:</span>
              <span className="text-blue-600 underline font-semibold">http://bit.ly/secure-instant-pay-auth</span>
            </div>
            <span className="text-xs font-bold">{spottedFlags.link ? '🚩 Flagged: Shortened Dangerous Link!' : 'Tap to Inspect'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 border-t border-rose-200">
          <span className="text-xs text-rose-800 font-medium">
            {spottedCount === 3 ? '🎉 Excellent! All 3 red flags identified.' : 'Tap each suspicious area above to reveal the warning sign.'}
          </span>
          <button
            type="button"
            onClick={handleInsertPhishing}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Sparkles size={14} />
            <span>Insert Findings into My Answer</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // MINI-LAB 3: FACT, OPINION OR UNKNOWN
  // ==============================================================
  if (title.includes('fact') || title.includes('opinion')) {
    const cards = [
      { id: 'c1', text: "Connect Talent meets every Thursday for group learning sessions.", answer: 'fact' },
      { id: 'c2', text: "Learning computers and technology is very easy for everyone.", answer: 'opinion' },
      { id: 'c3', text: "All 7 teams will complete 100% of their challenges this week.", answer: 'unknown' }
    ];

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border-2 border-blue-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <HelpCircle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Interactive Statement Sorter</h4>
              <p className="text-xs text-slate-600">Categorize each statement to practice critical thinking</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {cards.map((c) => (
            <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
              <p className="font-semibold text-slate-800">{c.text}</p>
              <div className="flex gap-2">
                {['Fact', 'Opinion', 'Unknown'].map((tag) => {
                  const tagLower = tag.toLowerCase();
                  const isSelected = sortedCards[c.id] === tagLower;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSortedCards({ ...sortedCards, [c.id]: tagLower })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleInsertSorting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Sparkles size={14} />
            <span>Use My Sorting in Answer</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // MINI-LAB 4: SOLVE THE HUB PUZZLE (LAPTOP SHARING)
  // ==============================================================
  if (title.includes('hub') || title.includes('laptop') || title.includes('puzzle')) {
    const total = laptopSlots.personA + laptopSlots.personB + laptopSlots.personC;

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border-2 border-emerald-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">30-Minute Laptop Sharing Simulator</h4>
              <p className="text-xs text-slate-600">Balance 30 minutes fairly between 3 learners sharing 1 hub laptop</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black border ${
            total === 30 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}>
            Total: {total} / 30 mins
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">Learner A (Job Application)</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="20"
                step="5"
                value={laptopSlots.personA}
                onChange={(e) => setLaptopSlots({ ...laptopSlots, personA: parseInt(e.target.value) || 10 })}
                className="accent-emerald-600"
              />
              <span className="font-bold text-emerald-800 w-16 text-right">{laptopSlots.personA} mins</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">Learner B (Course Module)</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="20"
                step="5"
                value={laptopSlots.personB}
                onChange={(e) => setLaptopSlots({ ...laptopSlots, personB: parseInt(e.target.value) || 10 })}
                className="accent-emerald-600"
              />
              <span className="font-bold text-emerald-800 w-16 text-right">{laptopSlots.personB} mins</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">Learner C (Digital Skills Practice)</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="20"
                step="5"
                value={laptopSlots.personC}
                onChange={(e) => setLaptopSlots({ ...laptopSlots, personC: parseInt(e.target.value) || 10 })}
                className="accent-emerald-600"
              />
              <span className="font-bold text-emerald-800 w-16 text-right">{laptopSlots.personC} mins</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleInsertLaptopSchedule}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Sparkles size={14} />
            <span>Insert Schedule into My Answer</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // GENERAL INTERACTIVE STARTER (FOR ALL OTHER CHALLENGES)
  // ==============================================================
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
        <Lightbulb size={16} className="text-amber-500" />
        <span>Tap a starter prompt to build your response:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onInsertIntoAnswer("My proposal is to ")}
          className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          💡 "My proposal is to..."
        </button>
        <button
          type="button"
          onClick={() => onInsertIntoAnswer("I decided on this approach because ")}
          className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          🧠 "I chose this because..."
        </button>
        <button
          type="button"
          onClick={() => onInsertIntoAnswer("When I checked this with my buddy, they pointed out that ")}
          className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          👥 "When I checked with a buddy..."
        </button>
        <button
          type="button"
          onClick={() => onInsertIntoAnswer("Next time, one thing I would improve or test further is ")}
          className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          🚀 "One thing I would improve next is..."
        </button>
      </div>
    </div>
  );
}
