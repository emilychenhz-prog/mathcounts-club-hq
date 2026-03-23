
import React, { useEffect, useRef, useState } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  UserGroupIcon, 
  BeakerIcon, 
  AcademicCapIcon, 
  TrophyIcon, 
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const TIMELINE_STAGES = [
  {
    id: 'prep',
    title: 'Preparation Stage',
    period: 'Early August - Early September',
    icon: ClipboardDocumentCheckIcon,
    color: 'indigo',
    status: 'completed',
    tasks: [
      '8/4 discuss with Mr. Barrows to confirm no school teacher is willing to take the lead and start requesting background check process.',
      'Get access to MathCounts Carson (carsonmathcounts@gmail.com), and create a Mathcounts group in Schoology before the interest meeting.',
      'Share the Google Drive folder with new coaches.',
      'Discuss with Mr. Barrows about the interest meeting (9/11) and tryout date (9/16) and location (preferably B block, one hour for testing), and also figure out the time for regular meetings.',
      'Schedule a time to stop by Mr. Barrows office to complete the registration process and register your school on the official Mathcounts portal.',
      'Order the school handbook and practice materials.',
      'Confirm with Mr. Barrows that both D107 and D108 rooms are reserved. We often had to ask the technician/custodian to remove the separator to open up the entire space.',
      'Secure a meeting room and finalize co-coaches or parent volunteers.'
    ]
  },
  {
    id: 'interest',
    title: 'Interest Meeting',
    period: 'Mid September',
    icon: UserGroupIcon,
    color: 'emerald',
    status: 'active',
    tasks: [
      'Announce the club via school posters and morning announcements.',
      'Explain the competition format (Sprint, Target, Team, Countdown).',
      'Gather parent contact info and student availability.',
      'Distribute the first set of warmup problems.'
    ]
  },
  {
    id: 'tryout',
    title: 'Tryout Round',
    period: 'Early October',
    icon: BeakerIcon,
    color: 'amber',
    status: 'upcoming',
    tasks: [
      'Administer a mock Sprint Round to assess baseline levels.',
      'Prepare scratch paper, make 110 copies of the tryout quiz, additional pencils, and pencil sharpener for the tryout.',
      'Update the Club Roster with tryout scores.',
      'Announce the admissions and Also create a form to collect the student ID, grader, math level, parent email and parent phone number for future contact.'
    ]
  },
  {
    id: 'practice',
    title: 'Weekly Practice - Team Selection Cycle',
    period: 'Late September - December',
    icon: AcademicCapIcon,
    color: 'blue',
    status: 'upcoming',
    tasks: [
      'Arrive 30 mins early to make copies of the quiz and set up the classroom.',
      'Track student progress using the Coach Ledger.',
      'Arrange two school round test to finalize the team and individual list.',
      'Host monthly mini-competitions with small prizes.',
      'Select the Competition Team (4 students) based on weighted rankings.',
      'Identify Individual competitors (up to 8-10 per school).',
      'Host a team-building social (Pizza party!).',
      'Ensure all competitors are officially registered for Chapter.'
    ]
  },
  {
    id: 'team',
    title: 'Chpater Round Preparation',
    period: 'Early January',
    icon: TrophyIcon,
    color: 'purple',
    status: 'upcoming',
    tasks: [
      'Team round preparation.',
      'Countdown practice.'
    ]
  },
  {
    id: 'chapter',
    title: 'Chapter Round',
    period: 'February',
    icon: FlagIcon,
    color: 'rose',
    status: 'upcoming',
    tasks: [
      'Confirm transportation and event logistics.',
      'Conduct "Countdown Round" practice for fast-paced mental math.',
      'Review rules on calculator usage for Target/Team rounds.',
      'Celebrate student effort regardless of the final score.'
    ]
  },
  {
    id: 'state',
    title: 'State Round',
    period: 'March',
    icon: TrophyIcon,
    color: 'yellow',
    status: 'upcoming',
    tasks: [
      'Intensive prep for qualifiers.',
      'Focus on State-level problem difficulty (State/National handbook sets).',
      'Coordinate travel if state finals are in another city.',
      'Document the season for next year\'s transition.'
    ]
  },
  {
    id: 'transfer-ownership',
    title: 'Transfer Ownership',
    period: 'May',
    icon: ClipboardDocumentCheckIcon,
    color: 'teal',
    status: 'upcoming',
    tasks: [
      'Write email to Mr. Barrows to clarify the new coaches for the next school year.'
    ]
  }
];

interface StoredTransferEmail {
  name: string;
  mimeType: string;
  dataUrl: string;
  updatedAt: string;
}

const TimelineGuide: React.FC = () => {
  const [transferEmail, setTransferEmail] = useState<StoredTransferEmail | null>(() => {
    const raw = localStorage.getItem('mathcounts_transfer_ownership_email');
    return raw ? JSON.parse(raw) : null;
  });
  const [prepEmail, setPrepEmail] = useState<StoredTransferEmail | null>(() => {
    const raw = localStorage.getItem('mathcounts_preparation_email_reference');
    return raw ? JSON.parse(raw) : null;
  });
  const uploadRef = useRef<HTMLInputElement>(null);
  const prepUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!transferEmail) {
      localStorage.removeItem('mathcounts_transfer_ownership_email');
      return;
    }
    localStorage.setItem('mathcounts_transfer_ownership_email', JSON.stringify(transferEmail));
  }, [transferEmail]);

  useEffect(() => {
    if (!prepEmail) {
      localStorage.removeItem('mathcounts_preparation_email_reference');
      return;
    }
    localStorage.setItem('mathcounts_preparation_email_reference', JSON.stringify(prepEmail));
  }, [prepEmail]);

  const handleUploadTransferEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setTransferEmail({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: result,
        updatedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadPrepEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setPrepEmail({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: result,
        updatedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <input
        ref={uploadRef}
        type="file"
        className="hidden"
        onChange={handleUploadTransferEmail}
      />
      <input
        ref={prepUploadRef}
        type="file"
        className="hidden"
        onChange={handleUploadPrepEmail}
      />
      <header className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Season Roadmap</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          A coach's guide to navigating the Mathcounts year. Keep your club on track for competition success.
        </p>
      </header>

      <div className="relative">
        {/* Central Vertical Line */}
        <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-1 bg-slate-200 -translate-x-1/2 hidden md:block"></div>

        <div className="space-y-12 relative">
          {TIMELINE_STAGES.map((stage, index) => {
            const isEven = index % 2 === 0;
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className={`flex flex-col md:flex-row items-start md:items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Content Card */}
                <div className="flex-1 w-full">
                  <div className={`bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-2 h-full bg-${stage.color}-500`}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest text-${stage.color}-600 bg-${stage.color}-50 px-3 py-1 rounded-full`}>
                        {stage.period}
                      </span>
                      {stage.status === 'completed' && <CheckCircleIcon className="w-6 h-6 text-emerald-500" />}
                      {stage.status === 'active' && <ClockIcon className="w-6 h-6 text-indigo-500 animate-pulse" />}
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 mb-6 group-hover:text-indigo-600 transition-colors">
                      {stage.title}
                    </h3>

                    <ul className="space-y-3">
                      {stage.tasks.map((task, i) => (
                        <li key={i} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${stage.color}-400 shrink-0 mt-2`}></div>
                          {task}
                        </li>
                      ))}
                    </ul>

                    {stage.id === 'prep' && (
                      <div className="mt-6 border-t border-slate-200 pt-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Email Reference</p>
                          <button
                            onClick={() => prepUploadRef.current?.click()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
                          >
                            <DocumentArrowUpIcon className="w-4 h-4" />
                            {prepEmail ? 'Replace File' : 'Upload File'}
                          </button>
                        </div>

                        {prepEmail ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800">{prepEmail.name}</p>
                              <p className="text-xs text-slate-500">Updated {new Date(prepEmail.updatedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={prepEmail.dataUrl}
                                download={prepEmail.name}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => setPrepEmail(null)}
                                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No reference file uploaded yet.</p>
                        )}
                      </div>
                    )}

                    {stage.id === 'transfer-ownership' && (
                      <div className="mt-6 border-t border-slate-200 pt-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Email Reference</p>
                          <button
                            onClick={() => uploadRef.current?.click()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
                          >
                            <DocumentArrowUpIcon className="w-4 h-4" />
                            {transferEmail ? 'Replace File' : 'Upload File'}
                          </button>
                        </div>

                        {transferEmail ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800">{transferEmail.name}</p>
                              <p className="text-xs text-slate-500">Updated {new Date(transferEmail.updatedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={transferEmail.dataUrl}
                                download={transferEmail.name}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => setTransferEmail(null)}
                                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No reference file uploaded yet.</p>
                        )}
                      </div>
                    )}

                    {stage.id === 'interest' && (
                      <div className="mt-6 border-t border-slate-200 pt-5 space-y-3">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">Past Year Slides</p>
                        <a
                          href="https://docs.google.com/presentation/d/1v41UdZFZFPpLShNrjJcm4WTYiQaJ52ov/edit?usp=sharing&ouid=105878564914551489855&rtpof=true&sd=true"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                        >
                          Open Interest Meeting Slides
                        </a>
                      </div>
                    )}

                  </div>
                </div>

                {/* Timeline Junction (The Bubble) */}
                <div className="relative z-10 shrink-0">
                  <div className={`w-16 h-16 rounded-3xl bg-white border-4 border-slate-100 flex items-center justify-center text-${stage.color}-600 shadow-lg`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="flex-1 hidden md:block"></div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="bg-indigo-900 text-white rounded-[2.5rem] p-10 mt-20 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="flex-1">
          <h4 className="text-2xl font-black mb-2">Need Official Help?</h4>
          <p className="text-indigo-200 leading-relaxed">
            Mathcounts National provides comprehensive resources, including the Official School Handbook and the OPLET problem database.
          </p>
        </div>
        <a 
          href="https://www.mathcounts.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-indigo-900 font-black px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg whitespace-nowrap"
        >
          Official Website
        </a>
      </footer>
    </div>
  );
};

export default TimelineGuide;
