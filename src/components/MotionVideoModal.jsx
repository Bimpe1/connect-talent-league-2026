import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Trophy, Check, Sparkles, ArrowRight, ShieldCheck, Flame, MapPin, Users, Award } from 'lucide-react';

const CUES = [
  { id: 'intro', time: 0, text: "Welcome! Here is a quick workflow showing how the league works from registration to earning points." },
  { id: 'step1', time: 6, text: "Step one: enter your first name and last initial for the league board." },
  { id: 'step2', time: 11, text: "Step two: enter your email address so you can securely sign in." },
  { id: 'step3', time: 16, text: "Step three: create a password you can easily remember." },
  { id: 'step4', time: 21, text: "Step four: choose whether you are joining as a learner or a volunteer." },
  { id: 'step5', time: 26, text: "Step five: select your team with available spots and complete your registration." },
  { id: 'challenge', time: 32, text: "Every weekday, a short five-minute challenge appears. You can type your answer, record a voice note, or upload a photo showing proof of your task." },
  { id: 'review', time: 43, text: "Your facilitator reviews your effort and awards points. Every submission earns points for your team!" },
  { id: 'attendance', time: 49, text: "You can also claim ten bonus points each week by attending in person at the Connect Talent centre, confirmed by your facilitator." },
  { id: 'leaderboard', time: 58, text: "Check the leaderboard anytime to see where you stand. You can track your team ranking and follow individual learner scores." },
  { id: 'finish', time: 66, text: "That is the complete workflow! Have fun and enjoy learning!" }
];

const SCENES = [
  { id: 1, start: 0, end: 6, title: 'Workflow Overview' },
  { id: 2, start: 6, end: 32, title: 'Step-by-Step Registration' },
  { id: 3, start: 32, end: 43, title: 'Daily Challenge Arena' },
  { id: 4, start: 43, end: 49, title: 'Facilitator Review & Points' },
  { id: 5, start: 49, end: 58, title: 'In-Person Attendance Bonus' },
  { id: 6, start: 58, end: 66, title: 'Team & Individual Leaderboard' },
  { id: 7, start: 66, end: 70, title: 'Ready to Start' }
];

const TOTAL_DURATION = 70; // 70 seconds total (+1s to step 5)

// Helper to find a natural female English voice across browsers
function getNaturalFemaleVoice(availableVoices) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = (availableVoices && availableVoices.length > 0)
    ? availableVoices
    : (window.speechSynthesis.getVoices() || []);
  if (voices.length === 0) return null;

  // High-definition natural female voices
  const preferredFemaleNames = [
    'mia online', 'sonia online', 'jenny online', 'aria online', 'libby online',
    'google uk english female', 'samantha', 'victoria', 'zira', 'karen', 'hazel',
    'serena', 'fiona', 'stephanie', 'cora', 'female'
  ];

  for (const name of preferredFemaleNames) {
    const found = voices.find(v => v.name && v.name.toLowerCase().includes(name));
    if (found) return found;
  }

  // Any English voice with female indicator
  const femaleFallback = voices.find(v => 
    (v.lang && (v.lang.startsWith('en') || v.lang.includes('GB') || v.lang.includes('US'))) &&
    v.name && v.name.toLowerCase().includes('female')
  );
  if (femaleFallback) return femaleFallback;

  // Microsoft Zira (standard Windows female voice)
  const zira = voices.find(v => v.name && v.name.includes('Zira'));
  if (zira) return zira;

  // English fallback
  return voices.find(v => v.lang && v.lang.includes('en-GB')) || 
         voices.find(v => v.lang && v.lang.includes('en-US')) || 
         voices.find(v => v.lang && v.lang.startsWith('en')) || 
         voices[0];
}

export default function MotionVideoModal({ isOpen, onClose, userName = 'Friend' }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [voices, setVoices] = useState([]);
  const timerRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const lastCueRef = useRef('');

  // Pre-load voices on mount & listen to voiceschanged event
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices() || [];
      if (list.length > 0) setVoices(list);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Play voiceover narration with natural female voice (audio is always on)
  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // clear, comfortable cadence
      utterance.pitch = 1.05; // natural warm tone
      const femaleVoice = getNaturalFemaleVoice(voices);
      if (femaleVoice) utterance.voice = femaleVoice;

      activeUtteranceRef.current = utterance;
      utterance.onend = () => { activeUtteranceRef.current = null; };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        activeUtteranceRef.current = null;
      };

      // 60ms buffer ensures audio context unjams before speaking
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech speak error:', err);
        }
      }, 60);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      clearInterval(timerRef.current);
      setHasStarted(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentSceneIdx(0);
      lastCueRef.current = '';
      return;
    }

    setHasStarted(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSceneIdx(0);
    lastCueRef.current = '';

    return () => {
      clearInterval(timerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  // Video playback interval timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.25;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [isOpen, isPlaying]);

  // Sync Scene index and trigger Speech cues when currentTime updates
  useEffect(() => {
    if (!isOpen || !hasStarted) return;

    // 1. Sync Scene Index
    const sIdx = SCENES.findIndex(s => currentTime >= s.start && currentTime < s.end);
    if (sIdx !== -1 && sIdx !== currentSceneIdx) {
      setCurrentSceneIdx(sIdx);
    }

    // 2. Trigger individual voice cues
    let activeCue = CUES[0];
    for (let i = CUES.length - 1; i >= 0; i--) {
      if (currentTime >= CUES[i].time) {
        activeCue = CUES[i];
        break;
      }
    }
    if (activeCue && activeCue.id !== lastCueRef.current && isPlaying) {
      lastCueRef.current = activeCue.id;
      speakText(activeCue.text);
    }
  }, [currentTime, isPlaying, isOpen, hasStarted, currentSceneIdx]);

  if (!isOpen) return null;

  // Explicit user gesture to start walkthrough: unlocks browser audio reliably
  const handleStartWalkthrough = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setHasStarted(true);
    setCurrentTime(0);
    setCurrentSceneIdx(0);
    setIsPlaying(true);
    lastCueRef.current = CUES[0].id;
    speakText(CUES[0].text);
  };

  const togglePlay = () => {
    if (!hasStarted) {
      handleStartWalkthrough();
      return;
    }
    if (currentTime >= TOTAL_DURATION) {
      handleRestart();
    } else {
      const nextPlay = !isPlaying;
      setIsPlaying(nextPlay);
      if (!nextPlay && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      } else if (nextPlay && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else {
          let activeCue = CUES[0];
          for (let i = CUES.length - 1; i >= 0; i--) {
            if (currentTime >= CUES[i].time) {
              activeCue = CUES[i];
              break;
            }
          }
          speakText(activeCue.text);
        }
      }
    }
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setHasStarted(true);
    setCurrentTime(0);
    setCurrentSceneIdx(0);
    lastCueRef.current = CUES[0].id;
    setIsPlaying(true);
    speakText(CUES[0].text);
  };

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * TOTAL_DURATION;
    setCurrentTime(newTime);
    if (!hasStarted) setHasStarted(true);
  };

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentScene = SCENES[currentSceneIdx] || SCENES[0];
  const progressPercent = (currentTime / TOTAL_DURATION) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      
      {/* Video Modal Card */}
      <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Interactive Video Walkthrough
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Skip Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span>Skip Tour</span>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage (16:9 Aspect Ratio) */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-[#051329] via-[#0a1e47] to-[#1e0a38] overflow-hidden flex items-center justify-center p-4">
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />

          {/* ================= INITIAL WELCOME / START SCREEN ================= */}
          {!hasStarted && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#051329] via-[#0d2253] to-[#240c42] z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-3 shadow-2xl flex items-center justify-center mb-3">
                <img 
                  src="/connect-logo.png" 
                  alt="Connect Talent CIO Logo" 
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://connect-talent.org/assets/images/logos/connect-logo.png";
                  }}
                />
              </div>

              <span className="text-[11px] font-black tracking-widest text-purple-300 uppercase bg-purple-950/80 px-3.5 py-1 rounded-full border border-purple-800/80 mb-2">
                Registered Charity 1169975
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                Connect Talent League 2026
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm mx-auto">
                Welcome, {userName}! Watch a quick walkthrough showing registration, daily challenges, weekly attendance, and leaderboards.
              </p>

              {/* Start Walkthrough Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartWalkthrough}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-xl hover:shadow-purple-500/25 transition flex items-center gap-2 transform hover:scale-105 cursor-pointer"
                >
                  <Play size={16} className="fill-white" />
                  <span>Start Walkthrough</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= SCENE 1: WORKFLOW OVERVIEW (0-6s) ================= */}
          {hasStarted && currentScene.id === 1 && (
            <div className="text-center space-y-3 p-4 animate-in fade-in zoom-in-95 duration-500 max-w-lg">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-3 mx-auto shadow-2xl flex items-center justify-center">
                <img 
                  src="/connect-logo.png" 
                  alt="Connect Talent CIO Logo" 
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://connect-talent.org/assets/images/logos/connect-logo.png";
                  }}
                />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-purple-300 uppercase bg-purple-950/80 px-3 py-0.5 rounded-full border border-purple-800/80 inline-block mb-1">
                  Connect Talent League 2026
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight font-heading">
                  League Workflow Walkthrough
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                  From step-by-step registration to completing challenges, in-person attendance, and leaderboards.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-1">
                <span className="text-[11px] font-semibold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-slate-200">
                  1. Simple Sign-up
                </span>
                <span className="text-[11px] font-semibold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-slate-200">
                  2. 5-Min Challenge
                </span>
                <span className="text-[11px] font-semibold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-slate-200">
                  3. In-Person Bonus
                </span>
                <span className="text-[11px] font-semibold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-slate-200">
                  4. Leaderboards
                </span>
              </div>
            </div>
          )}

          {/* ================= SCENE 2: STEP-BY-STEP REGISTRATION (6-32s) ================= */}
          {hasStarted && currentScene.id === 2 && (() => {
            const stepData = currentTime < 11
              ? { title: 'Step 1 of 5 · Your Name', q: 'What is your name?', sub: 'Enter your first name and last initial for the league board.', val: 'Jordan T.', pct: 20 }
              : currentTime < 16
              ? { title: 'Step 2 of 5 · Email Address', q: 'What is your email address?', sub: 'Used to securely sign into your account.', val: 'jordan@example.com', pct: 40 }
              : currentTime < 21
              ? { title: 'Step 3 of 5 · Create Password', q: 'Create a password', sub: 'Pick a password you can easily remember.', val: '••••••••', pct: 60 }
              : currentTime < 26
              ? { title: 'Step 4 of 5 · Choose Your Role', q: 'Select your role', sub: 'Choose whether you are joining as a learner or a volunteer.', val: 'Selected: Learner', pct: 80 }
              : { title: 'Step 5 of 5 · Choose Your Team', q: 'Pick your team', sub: 'Select an available team with open spaces.', val: 'Selected: Team Phoenix', pct: 100 };

            return (
              <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-200 space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    {stepData.title}
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    Step {stepData.pct / 20} of 5
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#0a2558] to-[#6d28d9] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${stepData.pct}%` }}
                  />
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                    {stepData.q}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stepData.sub}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border-2 border-purple-500 text-sm sm:text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>{stepData.val}</span>
                  <span className="w-2 h-4 bg-[#6d28d9] animate-pulse rounded-xs" />
                </div>

                <div className="py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white rounded-xl font-bold text-center text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5">
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })()}

          {/* ================= SCENE 3: DAILY CHALLENGE ARENA (32-43s) ================= */}
          {hasStarted && currentScene.id === 3 && (
            <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Today's Daily Challenge</span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 font-heading">Comparing Two Sources of Information</h4>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">+20 TP</span>
              </div>

              {/* 3 Input Options */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-900 shadow-2xs">
                  <span className="text-base block">✍️</span>
                  <span>Type Text</span>
                </div>
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="text-base block">🎙️</span>
                  <span>Voice Note</span>
                </div>
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="text-base block">📸</span>
                  <span>Photo Evidence</span>
                </div>
              </div>

              {/* Simulated Voice Recording Waveform */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  ▶
                </div>
                <div className="flex items-center gap-1 flex-1 h-6">
                  <div className="w-1 bg-purple-600 rounded-full h-3 animate-pulse" />
                  <div className="w-1 bg-purple-600 rounded-full h-6 animate-pulse" />
                  <div className="w-1 bg-purple-600 rounded-full h-4 animate-pulse" />
                  <div className="w-1 bg-purple-600 rounded-full h-5 animate-pulse" />
                  <div className="w-1 bg-purple-600 rounded-full h-3 animate-pulse" />
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-900">0:12 / 0:30</span>
              </div>

              <div className="py-2.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white rounded-xl font-bold text-center text-xs sm:text-sm shadow-sm">
                Submit Evidence to Facilitator 🚀
              </div>
            </div>
          )}

          {/* ================= SCENE 4: FACILITATOR APPROVAL & POINTS (43-49s) ================= */}
          {hasStarted && currentScene.id === 4 && (
            <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                <Check size={28} />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full inline-block">
                  Verified by Facilitator
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  +20 Talent Points Awarded!
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Every answer counts. Points go towards your team's weekly standing!
                </p>
              </div>

              {/* Team Progress */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Team Phoenix
                  </span>
                  <span className="text-purple-700 font-black">+20 TP</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-700" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          )}

          {/* ================= SCENE 5: IN-PERSON ATTENDANCE BONUS (49-58s) ================= */}
          {hasStarted && currentScene.id === 5 && (
            <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-200 space-y-3.5 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-[#6d28d9] flex items-center justify-center font-bold">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Weekly Bonus</span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 font-heading">In-Person Attendance</h4>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">+10 TP Bonus</span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1 text-xs">
                <div className="font-bold text-[#0a2558] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  Connect Talent Centre Session
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Attend in person on any weekday during the week to earn 10 extra Talent Points.
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Check size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Attendance Confirmed by Facilitator (+10 TP)</span>
              </div>
            </div>
          )}

          {/* ================= SCENE 6: TEAM & INDIVIDUAL LEADERBOARDS (58-66s) ================= */}
          {hasStarted && currentScene.id === 6 && (() => {
            const isIndividuals = currentTime >= 62;
            return (
              <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Header & Tabs */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-heading">League Standings</span>
                  </div>

                  {/* Dynamic Tab Switcher */}
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <span className={`px-2 py-0.5 rounded-md transition ${!isIndividuals ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'}`}>
                      Team Rankings
                    </span>
                    <span className={`px-2 py-0.5 rounded-md transition ${isIndividuals ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'}`}>
                      Individuals
                    </span>
                  </div>
                </div>

                {/* Team Rankings View (55-59s) */}
                {!isIndividuals ? (
                  <div className="space-y-1.5 text-xs animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-2 bg-purple-50/80 border border-purple-200 rounded-xl font-bold">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Team Phoenix</span>
                      </span>
                      <span className="text-purple-700 font-black">185 Avg TP</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">2</span>
                        <span>Team Titans</span>
                      </span>
                      <span className="font-bold text-slate-900">160 Avg TP</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-900 flex items-center justify-center text-[10px]">3</span>
                        <span>Team Warriors</span>
                      </span>
                      <span className="font-bold text-slate-900">145 Avg TP</span>
                    </div>
                  </div>
                ) : (
                  /* Individual Learners View (59-63s) */
                  <div className="space-y-1.5 text-xs animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl font-bold">
                      <span className="flex items-center gap-2">
                        <span>🥇</span>
                        <span>Jordan T.</span>
                        <span className="text-[10px] text-slate-500 font-normal">(Phoenix)</span>
                      </span>
                      <span className="text-emerald-700 font-black">140 TP</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span>🥈</span>
                        <span>Sarah M.</span>
                        <span className="text-[10px] text-slate-500 font-normal">(Titans)</span>
                      </span>
                      <span className="font-bold text-slate-900">120 TP</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span>🥉</span>
                        <span>David K.</span>
                        <span className="text-[10px] text-slate-500 font-normal">(Warriors)</span>
                      </span>
                      <span className="font-bold text-slate-900">100 TP</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ================= SCENE 7: ENCOURAGEMENT & CALL TO ACTION (66-70s) ================= */}
          {hasStarted && currentScene.id === 7 && (
            <div className="text-center space-y-3 p-4 animate-in fade-in zoom-in-95 duration-500 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0a2558] to-[#6d28d9] text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-purple-900/30">
                <Sparkles size={28} className="text-amber-300" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                You're Ready to Begin!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Go at your own pace and enjoy building confidence with your team.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-7 py-3 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition transform hover:scale-105 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Today's Challenge</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Video Controls & Timeline Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          
          {/* Progress Bar (Clickable/Scrubbable) */}
          <div 
            onClick={handleScrub}
            className="relative w-full bg-slate-800 h-2.5 rounded-full overflow-hidden cursor-pointer"
            title="Click to jump along the timeline"
          >
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 h-full transition-all duration-100 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 fill-white" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw size={12} />
                <span>Restart</span>
              </button>

              <span className="hidden sm:inline text-slate-400 text-xs font-mono">
                Scene {currentSceneIdx + 1} of 7: {currentScene.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono text-xs">
                {formatMinSec(currentTime)} / {formatMinSec(TOTAL_DURATION)}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white font-bold rounded-xl text-xs shadow-sm hover:opacity-95 transition cursor-pointer"
              >
                Start League →
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
