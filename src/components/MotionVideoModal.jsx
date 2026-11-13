import React, { useRef, useEffect } from 'react';
import { X, Play, Download, Sparkles, Trophy, Users, Award, Calendar, ExternalLink } from 'lucide-react';

export default function MotionVideoModal({ isOpen, onClose, userName = 'Friend' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: user can click play
      });
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Background Click to Dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Video Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[95vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Connect Talent League 2026 · Video Walkthrough
              </h3>
              <p className="text-[11px] text-slate-400">
                Narrated & captioned guide for {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/connect-talent-league-walkthrough.mp4"
              download="connect-talent-league-walkthrough.mp4"
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Download video file (.mp4)"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
              aria-label="Close walkthrough"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src="/connect-talent-league-walkthrough.mp4"
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/connect-talent-league-walkthrough.mp4" type="video/mp4" />
            <source src="/connect-talent-league-walkthrough.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer Quick Summary */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Daily Challenges</p>
                <p className="text-[10px] text-slate-400">Mon–Fri (text, voice, photo)</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
              <Award size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Facilitator Review</p>
                <p className="text-[10px] text-slate-400">Feedback &amp; rubric scoring</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
              <Users size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">+10 TP Attendance</p>
                <p className="text-[10px] text-slate-400">Weekly in-person bonus</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
              <Trophy size={16} className="text-purple-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Leaderboards</p>
                <p className="text-[10px] text-slate-400">Team rankings &amp; badges</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="/video.html"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
            >
              <span>Open in standalone page</span>
              <ExternalLink size={11} />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
            >
              Got it, let's go!
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
