
import React from 'react';
import { 
  TrophyIcon, 
  FireIcon, 
  BoltIcon, 
  StarIcon,
  AcademicCapIcon,
  UsersIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/solid';

const BADGES = [
  { id: '1', name: 'Sprint Master', description: 'Score 25+ on a mock Sprint round', icon: BoltIcon, color: 'bg-yellow-500', earned: true, date: 'Oct 12, 2025' },
  { id: '2', name: 'On Fire', description: 'Maintain a 7-day solving streak', icon: FireIcon, color: 'bg-orange-500', earned: true, date: 'Oct 15, 2025' },
  { id: '3', name: 'Perfect Target', description: 'Score 8/8 on a Target round', icon: StarIcon, color: 'bg-blue-500', earned: true, date: 'Oct 18, 2025' },
  { id: '4', name: 'Team Player', description: 'Complete 10 team practice sets', icon: UsersIcon, color: 'bg-emerald-500', earned: false },
  { id: '5', name: 'Geometry Wiz', description: 'Solve 50 geometry problems', icon: LightBulbIcon, color: 'bg-purple-500', earned: true, date: 'Oct 22, 2025' },
  { id: '6', name: 'National Hopeful', description: 'Complete a National level round', icon: TrophyIcon, color: 'bg-indigo-500', earned: false },
  { id: '7', name: 'Scholar', description: 'Read 20 solution explanations', icon: AcademicCapIcon, color: 'bg-slate-500', earned: true, date: 'Oct 05, 2025' },
  { id: '8', name: 'First Steps', description: 'Solve your first daily problem', icon: RocketLaunchIcon, color: 'bg-rose-500', earned: true, date: 'Oct 01, 2025' },
];

const Badges: React.FC = () => {
  const earnedCount = BADGES.filter(b => b.earned).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Achievement Gallery</h2>
          <p className="text-slate-500 mt-1">Collect badges by completing challenges and improving your skills.</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-indigo-200">Total Earned</p>
            <p className="text-2xl font-bold">{earnedCount} / {BADGES.length}</p>
          </div>
          <TrophyIcon className="w-10 h-10 text-yellow-400" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {BADGES.map((badge) => (
          <div 
            key={badge.id} 
            className={`relative group bg-white rounded-3xl border-2 p-6 transition-all duration-300 ${
              badge.earned 
                ? 'border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1' 
                : 'border-dashed border-slate-200 opacity-60 grayscale'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl ${badge.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
              <badge.icon className="w-8 h-8" />
            </div>
            
            <h4 className="text-lg font-bold text-slate-800 mb-1">{badge.name}</h4>
            <p className="text-sm text-slate-500 leading-snug mb-4">{badge.description}</p>
            
            {badge.earned ? (
              <div className="flex items-center gap-2 mt-auto">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Earned</span>
                <span className="text-[10px] text-slate-400">{badge.date}</span>
              </div>
            ) : (
              <div className="mt-auto">
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                  <div className="bg-slate-300 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
              </div>
            )}

            {!badge.earned && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-3xl backdrop-blur-[2px]">
                <button className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl">View Requirements</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-indigo-900 mb-2">Season Rankings are Live!</h3>
          <p className="text-indigo-700 leading-relaxed">Your badge count contributes to your overall club rank. Keep solving to climb the leaderboard before the Chapter competition!</p>
        </div>
        <button className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all whitespace-nowrap">
          View Leaderboard
        </button>
      </div>
    </div>
  );
};

export default Badges;
