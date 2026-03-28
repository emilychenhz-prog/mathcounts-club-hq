
import React, { useState, useEffect } from 'react';
import { useAuth } from './components/auth/AuthContext';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, SessionData } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PracticeArena from './components/PracticeArena';
import CoachDashboard from './components/CoachDashboard';
import Login from './components/Login';
import DailyProblem from './components/DailyProblem';
import Badges from './components/Badges';
import Schedule from './components/Schedule';
import TimelineGuide from './components/TimelineGuide';
import DataAnalyzer from './components/DataAnalyzer';
import AdminDashboard from './components/AdminDashboard';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const { session, currentUser, loading, logout } = useAuth();
  const [isLoginView, setIsLoginView] = useState(false);

  const triggerLogin = () => setIsLoginView(true);
  const cancelLogin = () => setIsLoginView(false);

  // Auto-hide login view if auth state changes to logged in
  useEffect(() => {
    if (currentUser) {
      setIsLoginView(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isLoginView) {
    return <Login onCancel={cancelLogin} />;
  }

  const isGuest = session.role === UserRole.GUEST;

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 relative">
        <Sidebar
          role={session.role}
          onLogout={logout}
          userName={session.userName}
        />

        <div className="fixed top-6 right-6 z-40 flex items-center gap-4">
          {isGuest ? (
            <button
              onClick={triggerLogin}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 leading-none">{session.userName}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">{session.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border-2 border-white">
                {session.userName?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-auto pt-20 md:pt-12">
          <Routes>
            <Route path="/" element={session.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <Dashboard role={session.role} userName={session.userName} />} />

            {(session.role === UserRole.STUDENT || session.role === UserRole.COACH) && (
              <>
                <Route path="/schedule" element={<Schedule role={session.role} />} />
              </>
            )}

            {session.role === UserRole.STUDENT && (
              <>
                <Route path="/daily" element={<DailyProblem role={session.role} />} />
                <Route path="/practice" element={<PracticeArena />} />
                <Route path="/badges" element={<Badges />} />
              </>
            )}

            {session.role === UserRole.COACH && (
              <>
                <Route path="/roster" element={<CoachDashboard />} />
                <Route path="/timeline" element={<TimelineGuide />} />
                <Route path="/analyzer" element={<DataAnalyzer />} />
              </>
            )}

            {session.role === UserRole.ADMIN && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
