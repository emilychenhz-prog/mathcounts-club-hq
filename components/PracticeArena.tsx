
import React, { useState } from 'react';
import { Difficulty, RoundType, Problem } from '../types';
import { generateMathProblem, getAITutorHint } from '../services/geminiService';
// Fixed: Added missing CalculatorIcon to imports
import { 
  SparklesIcon, 
  LightBulbIcon, 
  CheckCircleIcon, 
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

const PracticeArena: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'hint', message: string } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.SCHOOL);
  const [round, setRound] = useState<RoundType>(RoundType.SPRINT);
  const [hintQuery, setHintQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchNewProblem = async () => {
    setLoading(true);
    setFeedback(null);
    setShowExplanation(false);
    setUserAnswer('');
    try {
      const p = await generateMathProblem(difficulty, round);
      setProblem(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    if (!problem) return;
    const isCorrect = userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect 
        ? "Excellent! That's the correct answer." 
        : "Not quite. Try checking your work or ask for a hint!"
    });
    if (isCorrect) setShowExplanation(true);
  };

  const askAiTutor = async () => {
    if (!problem || !hintQuery.trim()) return;
    setAiLoading(true);
    try {
      const hint = await getAITutorHint(problem.question, hintQuery);
      setFeedback({ type: 'hint', message: hint });
    } finally {
      setAiLoading(false);
      setHintQuery('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1">Difficulty</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1">Round</label>
            <select 
              value={round} 
              onChange={(e) => setRound(e.target.value as RoundType)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.values(RoundType).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={fetchNewProblem}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SparklesIcon className="w-5 h-5" />
          )}
          Generate Problem
        </button>
      </header>

      {problem ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                {problem.category}
              </span>
              <span className="text-slate-400 text-xs">ID: {problem.id}</span>
            </div>
            <p className="text-xl text-slate-800 leading-relaxed math-font whitespace-pre-wrap">
              {problem.question}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-bold text-slate-500 mb-2">Your Answer</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter numerical answer..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                />
                <button
                  onClick={checkAnswer}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-xl transition-all"
                >
                  Submit
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <label className="block text-sm font-bold text-slate-500 mb-2">AI Math Coach</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={hintQuery}
                  onChange={(e) => setHintQuery(e.target.value)}
                  placeholder="Ask for a hint..."
                  className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all italic text-slate-600"
                  onKeyPress={(e) => e.key === 'Enter' && askAiTutor()}
                />
                <button
                  onClick={askAiTutor}
                  disabled={aiLoading}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-3 rounded-xl transition-all disabled:opacity-50"
                  title="Ask for help"
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {feedback && (
            <div className={`p-6 rounded-2xl border ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
              feedback.type === 'hint' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-red-50 border-red-100 text-red-800'
            } animate-in zoom-in-95 duration-200`}>
              <div className="flex gap-3">
                {feedback.type === 'success' ? <CheckCircleIcon className="w-6 h-6 shrink-0" /> : <LightBulbIcon className="w-6 h-6 shrink-0" />}
                <p className="font-medium">{feedback.message}</p>
              </div>
            </div>
          )}

          {showExplanation && (
            <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-yellow-400" />
                Solution Breakdown
              </h3>
              <div className="space-y-4 text-slate-300 leading-relaxed math-font whitespace-pre-wrap">
                {problem.explanation}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                <p className="text-indigo-400 font-bold">Final Answer: {problem.answer}</p>
                <button 
                  onClick={fetchNewProblem}
                  className="text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  Next Problem <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <CalculatorIcon className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Click "Generate Problem" to start your AI-powered practice session.</p>
        </div>
      )}
    </div>
  );
};

export default PracticeArena;
