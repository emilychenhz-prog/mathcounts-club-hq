
import React, { useState, useEffect } from 'react';
import { UserRole, Announcement, ScheduleEntry } from '../types';
import {
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/solid';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UnifiedEvent {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  type: 'Meeting' | 'Tournament';
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'State Finals Registration Open', date: 'Oct 24, 2025', content: 'All qualified students please check your email for the state registration link.' },
  { id: 2, title: 'Guest Speaker: Math Olympiad Winner', date: 'Oct 28, 2025', content: 'Join us next Tuesday for a session with a former National champion.' },
  { id: 3, title: 'Practice Set Update', date: 'Oct 20, 2025', content: 'New geometry problem sets have been added to the practice arena.' },
];
const MAX_LATEST_ANNOUNCEMENTS = 5;
const MAX_UPCOMING_EVENTS = 3;

interface DashboardProps {
  role: UserRole;
  userName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ role, userName }) => {
  const isGuest = role === UserRole.GUEST;
  const isCoach = role === UserRole.COACH;

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('mathcounts_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [annToDelete, setAnnToDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<UnifiedEvent[]>([]);

  const parseAnnouncementDate = (value: string) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const latestAnnouncements = [...announcements]
    .sort((a, b) => parseAnnouncementDate(b.date) - parseAnnouncementDate(a.date))
    .slice(0, MAX_LATEST_ANNOUNCEMENTS);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const schedSnap = await getDocs(collection(db, 'schedule'));
        const tourneySnap = await getDocs(collection(db, 'tournaments'));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const events: UnifiedEvent[] = [];

        schedSnap.forEach(d => {
          const data = d.data();
          if (data.content === 'Skip') return;
          const ed = new Date(data.date + 'T00:00:00');
          ed.setHours(0, 0, 0, 0);
          if (ed >= today) {
            events.push({
              id: d.id,
              date: data.date,
              title: data.content,
              subtitle: data.isDayA ? 'A Day' : 'B Day',
              type: 'Meeting'
            });
          }
        });

        tourneySnap.forEach(d => {
          const data = d.data();
          const ed = new Date(data.date + 'T00:00:00');
          ed.setHours(0, 0, 0, 0);
          if (ed >= today) {
            events.push({
              id: d.id,
              date: data.date,
              title: data.event,
              subtitle: data.location || 'Tournament',
              type: 'Tournament'
            });
          }
        });

        events.sort((a, b) => a.date.localeCompare(b.date));
        setUpcomingEvents(events.slice(0, MAX_UPCOMING_EVENTS));
      } catch (err) {
        console.error("Failed to fetch upcoming events", err);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    localStorage.setItem('mathcounts_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const triggerDelete = (id: number) => {
    setAnnToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (annToDelete !== null) {
      setAnnouncements(announcements.filter(a => a.id !== annToDelete));
      setShowDeleteConfirm(false);
      setAnnToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (editingId) {
      setAnnouncements(announcements.map(a =>
        a.id === editingId ? { ...a, title: newTitle, content: newContent } : a
      ));
    } else {
      const newAnn: Announcement = {
        id: Date.now(),
        title: newTitle,
        content: newContent,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };
      setAnnouncements([newAnn, ...announcements]);
    }
    resetForm();
  };

  const startEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setNewTitle(ann.title);
    setNewContent(ann.content);
    setShowFormModal(true);
  };

  const resetForm = () => {
    setShowFormModal(false);
    setEditingId(null);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {isGuest ? "Mathcounts HQ" : isCoach ? `Coach Dashboard: ${userName}` : `Welcome back, ${userName}!`}
          </h2>
          <p className="text-slate-500 mt-2 text-lg">
            {isGuest
              ? "The central hub for middle school competitive mathematics."
              : isCoach
                ? "Manage your club's news and track student success."
                : "Ready to solve? Keep that 5-day streak alive."}
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <MegaphoneIcon className="w-7 h-7 text-indigo-500" />
                Latest Announcements
              </h3>
              {isCoach && (
                <button
                  onClick={() => setShowFormModal(true)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <PlusIcon className="w-5 h-5" /> Post Announcement
                </button>
              )}
            </div>

            <div className="space-y-4">
              {latestAnnouncements.map(item => (
                <div key={item.id} className="group bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {item.date}
                    </span>
                    {isCoach && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => triggerDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors leading-tight">{item.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-lg">{item.content}</p>
                </div>
              ))}
              {latestAnnouncements.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-medium bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <MegaphoneIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No announcements yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="text-xl font-bold mb-6">Upcoming Events</h3>
            <div className="space-y-6">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex gap-4 group cursor-default">
                  <div className={`font-bold w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all ${event.type === 'Tournament' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-500/30'}`}>
                    <span className="text-[10px] uppercase leading-none mb-0.5 font-black">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit' })}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className={`font-black text-sm flex items-center gap-2 ${event.type === 'Tournament' ? 'text-amber-100' : 'text-indigo-50'}`}>
                      {event.type === 'Tournament' ? <TrophyIcon className="w-4 h-4 text-amber-500" /> : <CalendarDaysIcon className="w-4 h-4 text-indigo-500" />}
                      {event.title}
                    </p>
                    <p className={`text-[11px] font-bold uppercase mt-1 ${event.type === 'Tournament' ? 'text-amber-500' : 'text-indigo-400'}`}>
                      {event.subtitle}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-slate-300 text-sm">No upcoming events.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Announcements Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Announcement' : 'New Post'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Headline</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="The major news..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Details</label>
                <textarea
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Provide context and instructions..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-600"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  {editingId ? 'Save Changes' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Announcement</h3>
            <p className="text-slate-500 text-sm mb-8">Are you sure you want to remove this post? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setAnnToDelete(null); }} className="flex-1 py-4 font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 font-black text-white bg-red-500 rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
