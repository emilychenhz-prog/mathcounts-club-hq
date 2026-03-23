
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LoginProps {
  onLogin: (name: string) => void;
  onCancel: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onCancel }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <button 
        onClick={onCancel}
        className="absolute top-8 left-8 p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-2xl shadow-sm transition-all hover:bg-slate-50"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl shadow-indigo-100">
            Σ
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mathcounts HQ</h1>
          <p className="text-slate-500 mt-2 font-medium">Enter your name to sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Newton Euler"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-2 italic">* Use "Coach" in your name to sign in with coaching privileges.</p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] text-xl"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
            >
              Back to News
            </button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm">
            Middle schoolers must have parental consent to join competitive clubs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
