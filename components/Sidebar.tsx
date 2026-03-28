
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import {
  HomeIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  CalendarIcon,
  TrophyIcon,
  MapIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout, userName }) => {
  const location = useLocation();
  const isGuest = role === UserRole.GUEST;

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon, roles: [UserRole.COACH, UserRole.STUDENT, UserRole.GUEST] },
    { name: 'Club Schedule', path: '/schedule', icon: CalendarIcon, roles: [UserRole.COACH, UserRole.STUDENT] },
    { name: 'Season Timeline', path: '/timeline', icon: MapIcon, roles: [UserRole.COACH] },
    { name: 'Mathcounts Lab', path: '/analyzer', icon: DocumentMagnifyingGlassIcon, roles: [UserRole.COACH] },
    { name: 'Daily Problem', path: '/daily', icon: CalendarDaysIcon, roles: [UserRole.STUDENT] },
    { name: 'Practice Arena', path: '/practice', icon: CalculatorIcon, roles: [UserRole.STUDENT] },
    { name: 'My Badges', path: '/badges', icon: TrophyIcon, roles: [UserRole.STUDENT] },
    { name: 'Club Roster', path: '/roster', icon: UsersIcon, roles: [UserRole.COACH] },
    { name: 'Accounts', path: '/admin', icon: ShieldCheckIcon, roles: [UserRole.ADMIN] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <span className="text-xl font-bold">Σ</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Mathcounts HQ</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        {!isGuest ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        ) : (
          <div className="px-4 py-3 text-xs text-slate-400 text-center italic font-medium">
            Visitor Mode
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
