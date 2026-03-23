
import React, { useState, useEffect } from 'react';
import { Difficulty, RoundType, Problem, UserRole } from '../types';
import { generateMathProblem } from '../services/geminiService';
import { 
  CalendarDaysIcon, 
  TrophyIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DailyProblemProps {
  role: UserRole;
}

const DailyProblem: React.FC<DailyProblemProps> = ({ role }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const isStudent = role === UserRole.STUDENT;
  const isCoach = role === UserRole.COACH;

  useEffect(() => {
    fetchDaily();
  }, []);

  const fetchDaily = async () => {
    setLoading(true);
    setIsCorrect(null);
    setShowExplanation(false);
    setUserAnswer('');
    try {
      const p = await generateMathProblem(Difficulty.SCHOOL, RoundType.SPRINT);
      setProblem(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!problem) return;
    const correct = userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    setIsCorrect(correct);
    if (correct) {
      setShowExplanation(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className="text-slate-500 font-bold text-lg animate-pulse">Consulting the math gods...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-indigo-100 text-indigo-600 px-5 py-2.5 rounded-2xl font-bold text-sm">
          <CalendarDaysIcon className="w-5 h-5" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Daily Challenge</h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          {isCoach 
            ? "View today's challenge and prepare hints for your students." 
            : "Solve today's mystery to keep your streak and climb the leaderboard."}
        </p>
      </div>

      {problem && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
          <div className="p-8 md:p-16">
            <div className="bg-slate-50/80 p-10 rounded-[2rem] mb-10 border border-slate-100 shadow-inner">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-4 block">The Problem</span>
              <p className="text-2xl md:text-3xl text-slate-800 leading-relaxed math-font whitespace-pre-wrap">
                {problem.question}
              </p>
            </div>

            {!isCorrect ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Your numerical answer..."
                      className={`w-full bg-white border-2 rounded-[1.5rem] px-8 py-5 outline-none transition-all font-mono text-2xl shadow-sm ${
                        isCorrect === false ? 'border-red-200 focus:border-red-500 bg-red-50/30' : 'border-slate-100 focus:border-indigo-600'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    {isCorrect === false && (
                      <p className="absolute -bottom-6 left-6 text-red-500 text-xs font-bold uppercase tracking-wider">Try calculating one more time!</p>
                    )}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-95 text-lg"
                  >
                    Submit
                  </button>
                </div>
                {isCoach && (
                  <button 
                    onClick={() => {setIsCorrect(true); setShowExplanation(true);}}
                    className="text-xs text-indigo-500 hover:underline font-bold"
                  >
                    * Coach Tool: Show solution directly
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10 animate-in zoom-in-95 duration-500">
                {isStudent && (
                  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-8 text-emerald-800 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg animate-bounce">
                      <TrophyIcon className="w-10 h-10" />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="text-2xl font-black">Achievement Unlocked!</h4>
                      <p className="text-emerald-700 text-lg opacity-80">"Daily Solver" Badge Earned + 50 Achievement Points</p>
                    </div>
                    <div className="md:ml-auto">
                       <button onClick={fetchDaily} className="bg-white border border-emerald-200 text-emerald-600 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition-colors">
                          <ArrowPathIcon className="w-4 h-4" /> Try Another
                       </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <SparklesIcon className="w-6 h-6 text-indigo-400" />
                    <h5 className="font-black text-indigo-400 uppercase tracking-[0.2em] text-sm">Official Solution</h5>
                  </div>
                  <div className="math-font text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {problem.explanation}
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
                    <p className="font-black text-3xl text-emerald-400">Answer: {problem.answer}</p>
                    <div className="flex gap-4">
                       <button onClick={fetchDaily} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl transition-colors font-bold">Next Level</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyProblem;
