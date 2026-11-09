import React from 'react';
import { Trophy, Shield, Key, LogOut, Award } from 'lucide-react';

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  currentUser, 
  onLogout,
  onOpenCaptainLogin, 
  pendingCount
}) {
  const isCaptain = currentUser?.role === 'captain';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & STACKED Title (Not on the same line) */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm flex-shrink-0">
            <span className="font-heading font-black text-white">CT</span>
          </div>

          {/* Stacked Title: Connect Talent on top line, League 2026 on line below */}
          <div className="flex flex-col">
            <span className="font-heading font-black text-slate-900 tracking-tight text-base sm:text-xl leading-none">
              Connect Talent
            </span>
            <span className="text-[10px] sm:text-xs font-extrabold text-blue-600 tracking-wider uppercase mt-0.5 sm:mt-1">
              {isCaptain ? "Captain Admin" : "League 2026"}
            </span>
          </div>
        </div>

        {/* Center: Dynamic Role-Specific Navigation (Desktop only) */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {isCaptain ? (
              /* Captain Navigation: ONLY Captain Dashboard and Leaderboard (NO Badges) */
              <>
                <button
                  onClick={() => setCurrentTab('captain')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border ${
                    currentTab === 'captain'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <Shield size={15} />
                  <span>Captain Dashboard</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentTab('leaderboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    currentTab === 'leaderboard'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  Leaderboard
                </button>
              </>
            ) : (
              /* Participant Navigation: Challenges, Leaderboard, Badges */
              <>
                <button
                  onClick={() => setCurrentTab('challenges')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    currentTab === 'challenges'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  Daily Challenge
                </button>

                <button
                  onClick={() => setCurrentTab('leaderboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    currentTab === 'leaderboard'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  Leaderboard
                </button>

                <button
                  onClick={() => setCurrentTab('badges')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    currentTab === 'badges'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-sm'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  Badges
                </button>
              </>
            )}
          </nav>
        )}

        {/* Right: User Identity & Clean Sign Out (NO dropdown to other participants) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Participant / Captain Identity Chip */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-800">
                <span className="max-w-[85px] sm:max-w-none truncate">{currentUser.name}</span>
                {currentUser.teamName && (
                  <span className="hidden xs:inline text-[11px] sm:text-xs text-blue-700 bg-blue-50 border border-blue-200 font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
                    {currentUser.teamName}
                  </span>
                )}
              </div>

              {/* Log Out Button */}
              <button
                onClick={onLogout}
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition flex items-center gap-1"
                title="Log out of your session"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCaptainLogin}
              className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition shadow-sm"
            >
              Captain Sign-In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (Optimized for touch on iOS & Android) */}
      {currentUser && (
        <div className="md:hidden border-t border-slate-200 px-2 py-2 flex justify-around text-xs sm:text-sm font-semibold bg-slate-50">
          {isCaptain ? (
            <>
              <button
                onClick={() => setCurrentTab('captain')}
                className={`py-1 px-3 rounded-lg font-bold transition ${
                  currentTab === 'captain' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Captain Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('leaderboard')}
                className={`py-1 px-3 rounded-lg font-bold transition ${
                  currentTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Leaderboard
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('challenges')}
                className={`py-1 px-3 rounded-lg font-bold transition ${
                  currentTab === 'challenges' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Challenge
              </button>
              <button
                onClick={() => setCurrentTab('leaderboard')}
                className={`py-1 px-3 rounded-lg font-bold transition ${
                  currentTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setCurrentTab('badges')}
                className={`py-1 px-3 rounded-lg font-bold transition ${
                  currentTab === 'badges' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Badges
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
