import { attendanceCount, totalPoints, ATTENDANCE_BONUS } from '../lib/points';
import React, { useState } from 'react';
import { Trophy, Users, User, Sparkles } from 'lucide-react';
import { TEAMS } from '../data/curriculum';

export default function LeaderboardView({ participants }) {
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'individuals'

  // Calculate Individual Totals
  const individualsWithCalculations = (participants || []).map((p) => ({
    ...p,
    attendanceBonus: attendanceCount(p) * ATTENDANCE_BONUS,
    totalTP: totalPoints(p),
  }));

  const sortedIndividuals = [...individualsWithCalculations].sort((a, b) => b.totalTP - a.totalTP);

  // Fair Team Calculation (Total TP ÷ Registered Team Members)
  const teamCalculations = TEAMS.map((team) => {
    const members = individualsWithCalculations.filter(p => p.teamId === team.id);
    const memberCount = members.length;
    const rawTotalTP = members.reduce((sum, m) => sum + m.totalTP, 0);
    const avgTPPerMember = memberCount > 0 ? parseFloat((rawTotalTP / memberCount).toFixed(1)) : 0;

    return {
      ...team,
      registeredCount: memberCount,
      rawTotalTP,
      avgTPPerMember
    };
  });

  const sortedTeams = [...teamCalculations].sort((a, b) => b.avgTPPerMember - a.avgTPPerMember);

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-3">
      {/* Title */}
      <div className="text-center space-y-2 pb-1">
        <span className="text-xs sm:text-sm font-bold text-[#0a2558] tracking-wider uppercase bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full inline-block">
          Standings & Progress
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
          Fair Leaderboard
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Ranked by average points per registered member so team size doesn't give an unfair advantage.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center px-2">
        <div className="flex w-full sm:w-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition border ${
              activeTab === 'teams' 
                ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm' 
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Team Rankings
          </button>
          <button
            onClick={() => setActiveTab('individuals')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition border ${
              activeTab === 'individuals' 
                ? 'bg-gradient-to-r from-[#0a2558] to-[#6d28d9] text-white border-transparent shadow-sm' 
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Individuals ({sortedIndividuals.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'teams' ? (
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="divide-y divide-slate-200">
            {sortedTeams.map((team, idx) => (
              <div key={team.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-center flex items-center justify-center text-sm font-bold text-slate-700">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">{team.name}</h4>
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">
                      {team.registeredCount} enrolled · {team.capacity} capacity · {team.rawTotalTP} total TP
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-[#0a2558]">
                    {team.avgTPPerMember}
                  </span>
                  <span className="text-xs sm:text-sm text-purple-700 ml-1 font-semibold">avg TP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          {sortedIndividuals.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {sortedIndividuals.map((p, idx) => (
                <div key={p.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-center flex items-center justify-center text-sm font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">{p.name}</h4>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">{p.teamName} · {p.role}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-[#0a2558]">
                      {p.totalTP}
                    </span>
                    <span className="text-xs sm:text-sm text-purple-700 ml-1 font-semibold">TP</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">
              No participants enrolled yet. Participants will appear here as they join teams.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
