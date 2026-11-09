import React from 'react';
import { Award, Trophy, Heart, Sparkles, TrendingUp, Users, Brain, Compass, CheckCircle } from 'lucide-react';
import { MILESTONE_BADGES, RECOGNITION_BADGES } from '../data/curriculum';

export default function BadgesView({ currentUser, participants }) {
  const userProfile = participants.find(p => p.id === currentUser.id) || participants[2];
  const userBadges = userProfile?.badges || ["ready_to_begin", "first_step", "growing_confidence"];

  const getIcon = (name) => {
    switch (name) {
      case 'Trophy': return <Trophy size={20} />;
      case 'Award': return <Award size={20} />;
      case 'Brain': return <Brain size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      case 'Heart': return <Heart size={20} />;
      case 'Users': return <Users size={20} />;
      case 'Compass': return <Compass size={20} />;
      case 'TrendingUp': return <TrendingUp size={20} />;
      default: return <Award size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-3">
      {/* Title */}
      <div className="text-center space-y-2 pb-1">
        <span className="text-xs sm:text-sm font-bold text-blue-700 tracking-wider uppercase bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full inline-block">
          Celebrate Every Step
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
          Badges & Milestones
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Points do not measure personal worth. Kindness, teamwork, and steady progress are celebrated for everyone.
        </p>
      </div>

      {/* Milestone Badges */}
      <div className="space-y-3.5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
          Milestones (Points & Participation)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {MILESTONE_BADGES.map((b) => {
            const isEarned = userBadges.includes(b.id);
            return (
              <div 
                key={b.id}
                className={`bg-white rounded-2xl p-5 border transition space-y-2.5 ${
                  isEarned ? 'border-slate-300 shadow-sm' : 'border-slate-200 opacity-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    {getIcon(b.icon)}
                  </div>
                  {isEarned ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                      Earned
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">
                      Locked
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{b.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{b.requirement}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recognition Badges */}
      <div className="space-y-3.5 pt-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
          Captain Recognition Badges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {RECOGNITION_BADGES.map((b) => {
            const isEarned = userBadges.includes(b.id);
            return (
              <div 
                key={b.id}
                className={`bg-white rounded-2xl p-5 border transition space-y-2.5 ${
                  isEarned ? 'border-rose-200 shadow-sm' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                    {getIcon(b.icon)}
                  </div>
                  {isEarned && (
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-full">
                      Awarded
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{b.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{b.requirement}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
