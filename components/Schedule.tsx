
import React, { useState, useEffect } from 'react';
import { UserRole, ScheduleEntry } from '../types';
import { 
  PlusIcon, 
  CalendarIcon,
  TrashIcon,
  UserIcon,
  ChevronDoubleRightIcon,
  CalendarDaysIcon,
  TagIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ScheduleProps {
  role: UserRole;
}

interface TournamentItem {
  id: string;
  date: string;
  event: string;
  location: string;
  notes: string;
}

const TOPIC_OPTIONS = ["TryOut", "Quiz", "School Round", "Practice", "Skip"];
const COACH_OPTIONS = ["Fei", "Emily", "Joseph", "N/A"];
const DEFAULT_AB_CALENDAR_URL = "https://carsonms.fcps.edu/sites/default/files/media/inline/carson-middle-school-2025-2026-a-b-calendar_0.jpg";

type CarsonDayCode = 'A' | 'B' | 'TW' | 'SD' | 'SP' | 'H';

const CARSON_AB_DAY_MAP: Record<string, CarsonDayCode> = {
  '2025-08-18': 'A', '2025-08-19': 'B', '2025-08-20': 'A', '2025-08-21': 'B', '2025-08-22': 'A', '2025-08-25': 'B', '2025-08-26': 'A', '2025-08-27': 'B', '2025-08-28': 'A',
  '2025-09-02': 'B', '2025-09-03': 'A', '2025-09-04': 'B', '2025-09-05': 'A', '2025-09-08': 'B', '2025-09-10': 'B', '2025-09-11': 'A', '2025-09-12': 'B', '2025-09-15': 'A', '2025-09-16': 'B', '2025-09-17': 'A', '2025-09-18': 'B', '2025-09-19': 'A', '2025-09-22': 'B', '2025-09-24': 'A', '2025-09-25': 'B', '2025-09-26': 'A', '2025-09-29': 'B', '2025-09-30': 'A',
  '2025-10-01': 'B', '2025-10-03': 'A', '2025-10-06': 'B', '2025-10-07': 'A', '2025-10-08': 'B', '2025-10-09': 'A', '2025-10-10': 'B', '2025-10-14': 'A', '2025-10-15': 'B', '2025-10-16': 'A', '2025-10-17': 'B', '2025-10-21': 'A', '2025-10-22': 'B', '2025-10-23': 'A', '2025-10-24': 'B', '2025-10-27': 'A', '2025-10-28': 'B', '2025-10-29': 'A', '2025-10-30': 'B', '2025-10-31': 'A',
  '2025-11-05': 'B', '2025-11-06': 'A', '2025-11-07': 'B', '2025-11-10': 'A', '2025-11-12': 'B', '2025-11-13': 'A', '2025-11-14': 'B', '2025-11-17': 'A', '2025-11-18': 'B', '2025-11-19': 'A', '2025-11-20': 'B', '2025-11-21': 'A', '2025-11-24': 'B', '2025-11-25': 'A',
  '2025-12-01': 'B', '2025-12-02': 'A', '2025-12-03': 'B', '2025-12-04': 'A', '2025-12-05': 'B', '2025-12-08': 'A', '2025-12-09': 'B', '2025-12-10': 'A', '2025-12-11': 'B', '2025-12-12': 'A', '2025-12-15': 'B', '2025-12-16': 'A', '2025-12-17': 'B', '2025-12-18': 'A', '2025-12-19': 'B',
  '2026-01-05': 'A', '2026-01-06': 'B', '2026-01-07': 'A', '2026-01-08': 'B', '2026-01-09': 'A', '2026-01-12': 'B', '2026-01-13': 'A', '2026-01-14': 'B', '2026-01-15': 'A', '2026-01-16': 'B', '2026-01-20': 'A', '2026-01-21': 'B', '2026-01-22': 'A', '2026-01-23': 'B', '2026-01-26': 'A', '2026-01-27': 'B', '2026-01-28': 'A',
  '2026-02-02': 'B', '2026-02-03': 'A', '2026-02-04': 'B', '2026-02-05': 'A', '2026-02-06': 'B', '2026-02-09': 'A', '2026-02-10': 'B', '2026-02-11': 'A', '2026-02-12': 'B', '2026-02-13': 'A', '2026-02-18': 'B', '2026-02-19': 'A', '2026-02-20': 'B', '2026-02-23': 'A', '2026-02-24': 'B', '2026-02-25': 'A', '2026-02-26': 'B', '2026-02-27': 'A',
  '2026-03-02': 'B', '2026-03-03': 'A', '2026-03-04': 'B', '2026-03-05': 'A', '2026-03-06': 'B', '2026-03-09': 'A', '2026-03-10': 'B', '2026-03-11': 'A', '2026-03-12': 'B', '2026-03-13': 'A', '2026-03-16': 'B', '2026-03-17': 'A', '2026-03-18': 'B', '2026-03-19': 'A', '2026-03-23': 'B', '2026-03-24': 'A', '2026-03-25': 'B', '2026-03-26': 'A', '2026-03-27': 'B',
  '2026-04-07': 'A', '2026-04-08': 'B', '2026-04-09': 'A', '2026-04-13': 'B', '2026-04-14': 'A', '2026-04-15': 'B', '2026-04-16': 'A', '2026-04-17': 'B', '2026-04-20': 'A', '2026-04-21': 'B', '2026-04-22': 'A', '2026-04-23': 'B', '2026-04-24': 'A', '2026-04-27': 'B', '2026-04-28': 'A', '2026-04-29': 'B', '2026-04-30': 'A',
  '2026-05-01': 'B', '2026-05-04': 'A', '2026-05-05': 'B', '2026-05-06': 'A', '2026-05-07': 'B', '2026-05-08': 'A', '2026-05-11': 'B', '2026-05-12': 'A', '2026-05-13': 'B', '2026-05-14': 'A', '2026-05-15': 'B', '2026-05-18': 'A', '2026-05-19': 'B', '2026-05-20': 'A', '2026-05-21': 'B', '2026-05-22': 'A', '2026-05-28': 'B', '2026-05-29': 'A',
  '2026-06-01': 'B', '2026-06-02': 'A', '2026-06-03': 'B', '2026-06-04': 'A', '2026-06-05': 'B', '2026-06-08': 'A', '2026-06-09': 'B', '2026-06-10': 'A', '2026-06-11': 'B', '2026-06-12': 'A', '2026-06-15': 'B', '2026-06-16': 'A'
};

const getCarsonDayCode = (isoDate: string): CarsonDayCode | null => CARSON_AB_DAY_MAP[isoDate] || null;
const getCarsonDayType = (isoDate: string): boolean | null => {
  const code = getCarsonDayCode(isoDate);
  if (code === 'A') return true;
  if (code === 'B') return false;
  return null;
};
const isCarsonSkipCode = (code: CarsonDayCode | null) =>
  code === 'TW' || code === 'SD' || code === 'SP' || code === 'H';

const Schedule: React.FC<ScheduleProps> = ({ role }) => {
  const isCoach = role === UserRole.COACH;
  const [activeTab, setActiveTab] = useState<'regular' | 'tournament'>('regular');
  
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
    const saved = localStorage.getItem('mathcounts_schedule');
    return saved ? JSON.parse(saved) : [];
  });
  const [tournamentCalendar, setTournamentCalendar] = useState<TournamentItem[]>(() => {
    const saved = localStorage.getItem('mathcounts_tournament_calendar');
    return saved ? JSON.parse(saved) : [];
  });

  const [showWizard, setShowWizard] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [abCalendarUrl, setAbCalendarUrl] = useState<string>(() => {
    const saved = localStorage.getItem('mathcounts_ab_calendar_url');
    return saved || DEFAULT_AB_CALENDAR_URL;
  });

  // Bulk Generator State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Default Mon, Wed, Fri

  // Single Entry State
  const [singleDate, setSingleDate] = useState('');
  const [singleContent, setSingleContent] = useState('Practice');
  const [singleCoach, setSingleCoach] = useState('Fei');
  const [singleIsDayA, setSingleIsDayA] = useState(true);

  // Tournament calendar state
  const [tournamentDate, setTournamentDate] = useState('');
  const [tournamentEvent, setTournamentEvent] = useState('');
  const [tournamentLocation, setTournamentLocation] = useState('');
  const [tournamentNotes, setTournamentNotes] = useState('');
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mathcounts_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('mathcounts_tournament_calendar', JSON.stringify(tournamentCalendar));
  }, [tournamentCalendar]);

  useEffect(() => {
    localStorage.setItem('mathcounts_ab_calendar_url', abCalendarUrl);
  }, [abCalendarUrl]);

  // Handle auto-N/A for single entry modal
  useEffect(() => {
    if (singleContent === 'Skip') {
      setSingleCoach('N/A');
    }
  }, [singleContent]);

  const generateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || selectedDays.length === 0) return;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const newEntries: ScheduleEntry[] = [];
    
    let current = new Date(start);
    let dayToggle = true; // Fallback toggle if date not found in Carson A/B map

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        const iso = current.toISOString().split('T')[0];
        const dayCode = getCarsonDayCode(iso);
        const mappedDay = getCarsonDayType(iso);
        const isMissingDayType = mappedDay === null;
        const isSkipDay = isMissingDayType || isCarsonSkipCode(dayCode);
        newEntries.push({
          id: Math.random().toString(36).substr(2, 9),
          date: iso,
          content: isSkipDay ? 'Skip' : 'Practice',
          isDayA: mappedDay ?? dayToggle,
          coach: isSkipDay ? 'N/A' : 'Fei'
        });
        if (mappedDay === null) dayToggle = !dayToggle;
      }
      current.setDate(current.getDate() + 1);
    }

    setSchedule([...schedule, ...newEntries].sort((a, b) => a.date.localeCompare(b.date)));
    setShowWizard(false);
  };

  const handleAddSingleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleDate) return;

    const dayCode = getCarsonDayCode(singleDate);
    const mappedDay = getCarsonDayType(singleDate);
    const isMissingDayType = mappedDay === null;
    const isSkipDay = isMissingDayType || isCarsonSkipCode(dayCode);
    const newEntry: ScheduleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: singleDate,
      content: isSkipDay ? 'Skip' : singleContent,
      isDayA: mappedDay ?? singleIsDayA,
      coach: isSkipDay ? 'N/A' : singleCoach
    };

    setSchedule([...schedule, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
    setShowSingleModal(false);
    resetSingleForm();
  };

  const resetSingleForm = () => {
    setSingleDate('');
    setSingleContent('Practice');
    setSingleCoach('Fei');
    setSingleIsDayA(true);
  };

  const updateEntry = (id: string, field: keyof ScheduleEntry, value: any) => {
    setSchedule(prev => prev.map(s => {
      if (s.id === id) {
        let updated = { ...s, [field]: value };
        // Rule: If topic is set to Skip, Lead Coach is set to N/A automatically
        if (field === 'content' && value === 'Skip') {
          updated.coach = 'N/A';
        }
        return updated;
      }
      return s;
    }));
  };

  const removeEntry = (id: string) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const toggleDayType = (id: string) => {
    const entry = schedule.find(s => s.id === id);
    if (entry) updateEntry(id, 'isDayA', !entry.isDayA);
  };

  const clearSchedule = () => {
    setSchedule([]);
    setShowDeleteAllConfirm(false);
  };

  const reapplyCalendarRules = () => {
    setSchedule(prev => prev.map(entry => {
      const code = getCarsonDayCode(entry.date);
      const mappedDay = getCarsonDayType(entry.date);
      const shouldSkip = mappedDay === null || isCarsonSkipCode(code);
      return {
        ...entry,
        isDayA: mappedDay ?? entry.isDayA,
        content: shouldSkip ? 'Skip' : entry.content,
        coach: shouldSkip ? 'N/A' : entry.coach
      };
    }));
  };

  const resetTournamentForm = () => {
    setTournamentDate('');
    setTournamentEvent('');
    setTournamentLocation('');
    setTournamentNotes('');
    setEditingTournamentId(null);
  };

  const upsertTournamentItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentDate || !tournamentEvent.trim()) return;

    if (editingTournamentId) {
      setTournamentCalendar(prev =>
        prev
          .map(item =>
            item.id === editingTournamentId
              ? {
                  ...item,
                  date: tournamentDate,
                  event: tournamentEvent.trim(),
                  location: tournamentLocation.trim(),
                  notes: tournamentNotes.trim()
                }
              : item
          )
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      resetTournamentForm();
      return;
    }

    const item: TournamentItem = {
      id: Math.random().toString(36).slice(2),
      date: tournamentDate,
      event: tournamentEvent.trim(),
      location: tournamentLocation.trim(),
      notes: tournamentNotes.trim()
    };
    setTournamentCalendar(prev => [...prev, item].sort((a, b) => a.date.localeCompare(b.date)));
    resetTournamentForm();
  };

  const editTournamentItem = (id: string) => {
    const item = tournamentCalendar.find(i => i.id === id);
    if (!item) return;
    setEditingTournamentId(item.id);
    setTournamentDate(item.date);
    setTournamentEvent(item.event);
    setTournamentLocation(item.location);
    setTournamentNotes(item.notes);
  };

  const removeTournamentItem = (id: string) => {
    setTournamentCalendar(prev => prev.filter(item => item.id !== id));
    if (editingTournamentId === id) {
      resetTournamentForm();
    }
  };

  const WEEKDAYS = [
    { label: 'Mon', index: 1 },
    { label: 'Tue', index: 2 },
    { label: 'Wed', index: 3 },
    { label: 'Thu', index: 4 },
    { label: 'Fri', index: 5 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-600" />
            Club Meeting Schedule
          </h2>
          <div className="mt-3 inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('regular')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'regular' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Regular Calendar
            </button>
            <button
              onClick={() => setActiveTab('tournament')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'tournament' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tournament Calendar
            </button>
          </div>
          <p className="text-slate-500 mt-1">
            {activeTab === 'regular'
              ? 'Plan and view the upcoming semester of Mathcounts club sessions.'
              : 'Track tournaments and deadlines in a separate calendar view.'}
          </p>
          {activeTab === 'regular' && (
            <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">A/B Calendar URL</label>
              <input
                type="url"
                value={abCalendarUrl}
                onChange={(e) => setAbCalendarUrl(e.target.value)}
                className="w-full md:w-[34rem] bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <a
                href={abCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Open
              </a>
            </div>
          )}
        </div>
        {isCoach && activeTab === 'regular' && (
          <div className="flex gap-3 md:mt-16">
            <button 
              onClick={reapplyCalendarRules}
              className="bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              Reapply A/B Rules
            </button>
            <button 
              onClick={() => setShowDeleteAllConfirm(true)}
              className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              Clear All
            </button>
            <button 
              onClick={() => { resetSingleForm(); setShowSingleModal(true); }}
              className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Meeting
            </button>
            <button 
              onClick={() => setShowWizard(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Generator Wizard
            </button>
          </div>
        )}
      </header>

      {activeTab === 'regular' ? (
        <>
          {schedule.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">Cycle</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Topic / Activity Content</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">Lead Coach</th>
                    {isCoach && <th className="px-6 py-5 text-right w-16"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          disabled={!isCoach}
                          onClick={() => toggleDayType(entry.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                            entry.isDayA
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {entry.isDayA ? 'A Day' : 'B Day'}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        {isCoach ? (
                          <div className="flex items-center gap-2 group/input relative">
                            <TagIcon className="w-4 h-4 text-slate-300" />
                            <select
                              value={entry.content}
                              onChange={(e) => updateEntry(entry.id, 'content', e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white px-2 py-1 outline-none text-sm font-semibold text-slate-700 w-full transition-all appearance-none cursor-pointer"
                            >
                              {TOPIC_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        ) : (
                          <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                            entry.content === 'Skip' ? 'text-slate-400 bg-slate-100' : 'text-slate-600 bg-indigo-50/50'
                          }`}>
                            {entry.content}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {isCoach ? (
                          <div className="flex items-center gap-2 group/input">
                            <UserIcon className="w-4 h-4 text-slate-300" />
                            <select
                              disabled={entry.content === 'Skip'}
                              value={entry.coach}
                              onChange={(e) => updateEntry(entry.id, 'coach', e.target.value)}
                              className={`bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white px-2 py-1 outline-none text-sm font-bold w-full transition-all appearance-none cursor-pointer ${
                                entry.content === 'Skip' ? 'text-slate-300 italic' : 'text-indigo-600'
                              }`}
                            >
                              {COACH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${entry.content === 'Skip' ? 'text-slate-300 italic' : 'text-indigo-600'}`}>
                            {entry.coach}
                          </span>
                        )}
                      </td>
                      {isCoach && (
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <CalendarIcon className="w-16 h-16 text-slate-200 mb-6" />
              <p className="text-slate-400 font-bold text-lg">No meetings scheduled yet.</p>
              {isCoach && <p className="text-slate-400 text-sm mt-1">Use the generator or add a meeting manually to start planning.</p>}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {isCoach && (
            <form onSubmit={upsertTournamentItem} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="date"
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                value={tournamentEvent}
                onChange={(e) => setTournamentEvent(e.target.value)}
                placeholder="Event"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <input
                value={tournamentLocation}
                onChange={(e) => setTournamentLocation(e.target.value)}
                placeholder="Location"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  {editingTournamentId ? 'Save' : 'Add'}
                </button>
                {editingTournamentId && (
                  <button
                    type="button"
                    onClick={resetTournamentForm}
                    className="px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="Cancel edit"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                value={tournamentNotes}
                onChange={(e) => setTournamentNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>
          )}

          {tournamentCalendar.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Event</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</th>
                    {isCoach && <th className="px-6 py-5 text-right w-24"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tournamentCalendar.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">{item.event}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{item.location || '-'}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{item.notes || '-'}</td>
                      {isCoach && (
                        <td className="px-6 py-5">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => editTournamentItem(item.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                              title="Edit"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeTournamentItem(item.id)}
                              className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <CalendarIcon className="w-16 h-16 text-slate-200 mb-6" />
              <p className="text-slate-400 font-bold text-lg">No tournament items yet.</p>
              {isCoach && <p className="text-slate-400 text-sm mt-1">Add a tournament date to populate this calendar tab.</p>}
            </div>
          )}
        </div>
      )}

      {/* Generation Wizard Modal */}
      {activeTab === 'regular' && showWizard && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Meeting Wizard</h3>
            <p className="text-slate-500 text-sm mb-8">Select start and end dates. Meetings will be generated for every occurrence of the chosen weekdays.</p>
            
            <form onSubmit={generateSchedule} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Weekly Meeting Days</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.label}
                      type="button"
                      onClick={() => {
                        setSelectedDays(prev => prev.includes(day.index) ? prev.filter(d => d !== day.index) : [...prev, day.index]);
                      }}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-black transition-all border-2 ${
                        selectedDays.includes(day.index)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                          : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowWizard(false)} 
                  className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={selectedDays.length === 0}
                  className="flex-2 bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  Generate Entries <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Entry Modal */}
      {activeTab === 'regular' && showSingleModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2">New Club Session</h3>
            <p className="text-slate-500 text-sm mb-8">Add a single specific meeting date to the club calendar.</p>
            
            <form onSubmit={handleAddSingleEntry} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Meeting Date</label>
                <input 
                  type="date" 
                  required 
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Meeting Topic</label>
                <select 
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm appearance-none cursor-pointer"
                >
                  {TOPIC_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Coach</label>
                <select 
                  disabled={singleContent === 'Skip'}
                  value={singleCoach}
                  onChange={(e) => setSingleCoach(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-indigo-600 appearance-none cursor-pointer disabled:text-slate-300"
                >
                  {COACH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Schedule Cycle</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleIsDayA(true)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${
                      singleIsDayA ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    A Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleIsDayA(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${
                      !singleIsDayA ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    B Day
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowSingleModal(false); resetSingleForm(); }} 
                  className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-2 bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Confirm Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {activeTab === 'regular' && showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-sm rounded-[2rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrashIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Wipe Schedule?</h3>
            <p className="text-slate-500 text-sm mb-8">This will permanently delete all meeting entries from the current ledger.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAllConfirm(false)} className="flex-1 py-4 font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={clearSchedule} className="flex-1 py-4 font-black text-white bg-red-500 rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-all">Clear Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
