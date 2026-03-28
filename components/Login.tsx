import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from './auth/AuthContext';
import { UserRole } from '../types';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onCancel: () => void;
}

const Login: React.FC<LoginProps> = ({ onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateSessionRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) return;

    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // Infer role from name for demo purposes
        let role = (name.toLowerCase().includes('coach') || name.toLowerCase().includes('admin'))
          ? UserRole.COACH
          : UserRole.STUDENT;

        if (email.toLowerCase() === 'emilychen.hz@gmail.com') {
          role = UserRole.ADMIN;
        }

        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email.toLowerCase(),
            name: name,
            role: role,
            uid: userCredential.user.uid,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Firestore creation failed", err);
        }

        updateSessionRole(role);
      } else {
        // Login user
        await signInWithEmailAndPassword(auth, email, password);
        // Note: Realistically role should be fetched from Firestore upon login.
        // If not using Firestore, we keep the previous local storage role logic from AuthContext.
      }
      onCancel();
    } catch (err: any) {
      console.error("Auth error", err);
      // Clean up Firebase error messages for display
      let displayError = 'An error occurred during authentication.';
      if (err.code === 'auth/invalid-credential') {
        displayError = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        displayError = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        displayError = 'Password must be at least 6 characters.';
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative z-50">
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isSignUp ? 'Sign up for Mathcounts HQ' : 'Sign in to Mathcounts HQ'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                required={isSignUp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Newton Euler"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-2 italic">* Use "Coach" in your name to sign up with coaching privileges.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              // Prevent standard browser autofill from completely messing up layout without user clicking
              autoComplete={isSignUp ? "new-email" : "email"}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              autoFocus={!isSignUp}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] text-lg flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
