
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentStats, MathLevel, AssessmentColumn } from '../types';
import {
  UserPlusIcon,
  XMarkIcon,
  InformationCircleIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { db } from '../services/firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, deleteField } from 'firebase/firestore';

const MOCK_NAMES = [
  "Alex Rivera", "Samantha Wu", "Jordan Lee", "Casey Smith", "Emma Chen",
  "Liam O'Connor", "Sophia Garcia", "Noah Kim", "Olivia Brown", "Ethan Davis",
  "Isabella Martinez", "Mason Wilson", "Mia Anderson", "Lucas Thomas", "Ava Taylor",
  "William Moore", "Charlotte Jackson", "James Martin", "Amelia White", "Benjamin Thompson",
  "Evelyn Harris", "Daniel Clark", "Abigail Lewis", "Jacob Robinson", "Harper Walker",
  "Michael Perez", "Emily Hall", "Alexander Young", "Elizabeth Allen", "Elijah Sanchez"
];

const MOCK_COLS: AssessmentColumn[] = [
  { id: 'q1', title: 'Quiz 1', type: 'Quiz' },
  { id: 'q2', title: 'Quiz 2', type: 'Quiz' },
  { id: 'q3', title: 'Quiz 3', type: 'Quiz' },
  { id: 'q4', title: 'Quiz 4', type: 'Quiz' },
  { id: 'q5', title: 'Quiz 5', type: 'Quiz' },
  { id: 'q6', title: 'Quiz 6', type: 'Quiz' },
  { id: 'sr1', title: 'SchRd 1', type: 'School Round' },
  { id: 'sr2', title: 'SchRd 2', type: 'School Round' },
];

const generateMockStudents = (): StudentStats[] => {
  return MOCK_NAMES.map((fullName, i) => {
    const [first, last] = fullName.split(' ');
    const id = (i + 1).toString();
    const dynamicScores: Record<string, number> = {};

    // Random quiz scores (10-30)
    for (let j = 1; j <= 6; j++) {
      dynamicScores[`q${j}`] = Math.floor(Math.random() * 21) + 10;
    }
    // Random school round scores (15-46)
    dynamicScores['sr1'] = Math.floor(Math.random() * 32) + 15;
    dynamicScores['sr2'] = Math.floor(Math.random() * 32) + 15;

    return {
      id,
      firstName: first,
      lastName: last,
      studentId: `MC${100 + i}`,
      grade: ['6', '7', '8'][Math.floor(Math.random() * 3)],
      mathLevel: ['Alg 1', 'Geo', 'Alg 2', 'PreCal'][Math.floor(Math.random() * 4)] as MathLevel,
      gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
      tryoutScore: Math.floor(Math.random() * 31) + 15,
      problemsSolved: Math.floor(Math.random() * 300),
      badges: [],
      dynamicScores
    };
  });
};

const CoachDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [assessmentColumns, setAssessmentColumns] = useState<AssessmentColumn[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showColModal, setShowColModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteColConfirm, setShowDeleteColConfirm] = useState(false);
  const [colToDeleteId, setColToDeleteId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [tempColScores, setTempColScores] = useState<Record<string, string>>({});

  const detailsRef = useRef<HTMLDivElement>(null);

  const [newColType, setNewColType] = useState<'Quiz' | 'School Round'>('Quiz');
  const [newStudent, setNewStudent] = useState<Partial<StudentStats>>({
    firstName: '', lastName: '', studentId: '', grade: '6', mathLevel: 'Alg 1', gender: 'Other', tryoutScore: 0
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentStats | null>(null);

  useEffect(() => {
    const fetchGlobalRoster = async () => {
      try {
        const rosterSnap = await getDocs(collection(db, 'roster'));
        let rosterData: StudentStats[] = [];
        rosterSnap.forEach(d => {
          rosterData.push({ ...d.data(), id: d.id } as StudentStats);
        });

        if (rosterData.length === 0) {
          const mocks = generateMockStudents();
          const batch = writeBatch(db);
          mocks.forEach(m => {
            const docRef = doc(collection(db, 'roster'));
            batch.set(docRef, { ...m, id: docRef.id });
            rosterData.push({ ...m, id: docRef.id });
          });
          await batch.commit();
        } else {
          // Auto-clean database by stripping deprecated fields immediately
          const batch = writeBatch(db);
          let needsClean = false;
          rosterSnap.docs.forEach(documentSnapshot => {
            const data = documentSnapshot.data();
            if (data.averageSprintScore !== undefined || data.averageTargetScore !== undefined) {
              batch.update(documentSnapshot.ref, {
                averageSprintScore: deleteField(),
                averageTargetScore: deleteField()
              });
              needsClean = true;
            }
          });
          if (needsClean) await batch.commit();
        }

        setStudents(rosterData);

        const colsDoc = await getDoc(doc(db, 'metadata', 'columns'));
        if (colsDoc.exists()) {
          setAssessmentColumns(colsDoc.data().cols);
        } else {
          setAssessmentColumns(MOCK_COLS);
          await setDoc(doc(db, 'metadata', 'columns'), { cols: MOCK_COLS });
        }
      } catch (err) {
        console.error("Failed to fetch cloud roster", err);
      }
    };
    fetchGlobalRoster();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.info-trigger')) {
          setSelectedStudentId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const countOfSameType = assessmentColumns.filter(c => c.type === newColType).length;
    const prefix = newColType === 'Quiz' ? 'Quiz' : 'SchRd';
    const autoTitle = `${prefix} ${countOfSameType + 1}`;
    const col: AssessmentColumn = {
      id: Math.random().toString(36).substr(2, 9),
      title: autoTitle,
      type: newColType
    };
    const updatedCols = [...assessmentColumns, col];
    setAssessmentColumns(updatedCols);
    setDoc(doc(db, 'metadata', 'columns'), { cols: updatedCols }).catch(console.error);

    setShowColModal(false);
    setEditingColId(col.id);
    const initialScores: Record<string, string> = {};
    students.forEach(s => { initialScores[s.id] = '0'; });
    setTempColScores(initialScores);
  };

  const triggerDeleteColumn = (id: string) => {
    setColToDeleteId(id);
    setShowDeleteColConfirm(true);
  };

  const handleConfirmDeleteColumn = () => {
    if (!colToDeleteId) return;
    const id = colToDeleteId;
    const updatedCols = assessmentColumns.filter(c => c.id !== id);
    setAssessmentColumns(updatedCols);
    setDoc(doc(db, 'metadata', 'columns'), { cols: updatedCols }).catch(console.error);

    const batch = writeBatch(db);
    const nextRoster = students.map(s => {
      const nextScores = { ...(s.dynamicScores || {}) };
      delete nextScores[id];
      batch.update(doc(db, 'roster', s.id), { dynamicScores: nextScores });
      return { ...s, dynamicScores: nextScores };
    });

    setStudents(nextRoster);
    batch.commit().catch(console.error);

    if (editingColId === id) {
      setEditingColId(null);
      setTempColScores({});
    }
    setShowDeleteColConfirm(false);
    setColToDeleteId(null);
  };

  const startEditingColumn = (colId: string) => {
    setEditingColId(colId);
    const scores: Record<string, string> = {};
    students.forEach(s => {
      scores[s.id] = String(s.dynamicScores?.[colId] || 0);
    });
    setTempColScores(scores);
  };

  const applyColumnChanges = () => {
    if (!editingColId) return;
    const batch = writeBatch(db);

    const updatedRoster = students.map(s => {
      const updatedDynamic = { ...(s.dynamicScores || {}) };
      updatedDynamic[editingColId] = parseInt(tempColScores[s.id]) || 0;
      batch.update(doc(db, 'roster', s.id), { dynamicScores: updatedDynamic });
      return { ...s, dynamicScores: updatedDynamic };
    });

    setStudents(updatedRoster);
    batch.commit().catch(console.error);

    setEditingColId(null);
    setTempColScores({});
  };

  const handleDiscardConfirm = () => {
    if (!editingColId) return;
    const idToDelete = editingColId;
    const updatedCols = assessmentColumns.filter(c => c.id !== idToDelete);
    setAssessmentColumns(updatedCols);
    setDoc(doc(db, 'metadata', 'columns'), { cols: updatedCols }).catch(console.error);

    const batch = writeBatch(db);
    const nextRoster = students.map(s => {
      const nextScores = { ...(s.dynamicScores || {}) };
      delete nextScores[idToDelete];
      batch.update(doc(db, 'roster', s.id), { dynamicScores: nextScores });
      return { ...s, dynamicScores: nextScores };
    });

    setStudents(nextRoster);
    batch.commit().catch(console.error);

    setEditingColId(null);
    setTempColScores({});
    setShowDiscardConfirm(false);
  };

  const handleScoreUpdate = (studentId: string, val: string) => {
    setTempColScores(prev => ({ ...prev, [studentId]: val }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const studentObj: any = {
      ...newStudent as StudentStats,
      problemsSolved: 0,
      badges: [],
      dynamicScores: {}
    };

    addDoc(collection(db, 'roster'), studentObj).then(docRef => {
      studentObj.id = docRef.id;
      // Rewrite the ID in Firestore just to be safe identically mapped
      updateDoc(docRef, { id: docRef.id });
      setStudents([...students, studentObj as StudentStats]);
    }).catch(console.error);

    setShowAddModal(false);
    setNewStudent({ firstName: '', lastName: '', studentId: '', grade: '6', mathLevel: 'Alg 1', gender: 'Other', tryoutScore: 0 });
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Remove student from roster globally?')) {
      deleteDoc(doc(db, 'roster', id)).then(() => {
        setStudents(students.filter(s => s.id !== id));
      }).catch(console.error);
    }
  };

  const startEditingStudent = (student: StudentStats) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateDoc(doc(db, 'roster', editingStudent.id), editingStudent as any).then(() => {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    }).catch(console.error);

    setShowEditModal(false);
    setEditingStudent(null);
  };

  const getRank = (score: number, list: number[]) => {
    return list.filter(s => s > score).length + 1;
  };

  const quizColumns = assessmentColumns.filter(c => c.type === 'Quiz');
  const schoolRoundColumns = assessmentColumns.filter(c => c.type === 'School Round');

  const studentQuizData = useMemo(() => {
    const dataMap: Record<string, { ranks: number[], scores: number[] }> = {};
    quizColumns.forEach(col => {
      const allScoresForCol = students.map(s => {
        if (editingColId === col.id) return parseInt(tempColScores[s.id]) || 0;
        return s.dynamicScores?.[col.id] || 0;
      });
      students.forEach(s => {
        const score = (editingColId === col.id) ? (parseInt(tempColScores[s.id]) || 0) : (s.dynamicScores?.[col.id] || 0);
        const rank = getRank(score, allScoresForCol);
        if (!dataMap[s.id]) dataMap[s.id] = { ranks: [], scores: [] };
        dataMap[s.id].ranks.push(rank);
        dataMap[s.id].scores.push(score);
      });
    });
    return dataMap;
  }, [students, assessmentColumns, editingColId, tempColScores]);

  const getQuizAvgRank = (studentId: string) => {
    const ranks = studentQuizData[studentId]?.ranks || [];
    if (ranks.length === 0) return '-';
    let selectedRanks = [...ranks];
    if (selectedRanks.length > 5) {
      selectedRanks.sort((a, b) => a - b);
      selectedRanks = selectedRanks.slice(0, 5);
    }
    const sum = selectedRanks.reduce((a, b) => a + b, 0);
    return (sum / selectedRanks.length).toFixed(2);
  };

  const getFinalScoreValue = (studentId: string): number => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 999;

    const quizAvgRankStr = getQuizAvgRank(studentId);
    const quizAvgRank = quizAvgRankStr === '-' ? 0 : parseFloat(quizAvgRankStr);

    const schRd1Col = schoolRoundColumns[0];
    const schRd2Col = schoolRoundColumns[1];

    const getRankValue = (col?: AssessmentColumn) => {
      if (!col) return null;
      const allScores = students.map(s => {
        if (editingColId === col.id) return parseInt(tempColScores[s.id]) || 0;
        return s.dynamicScores?.[col.id] || 0;
      });
      const score = (editingColId === col.id)
        ? (parseInt(tempColScores[studentId]) || 0)
        : (student.dynamicScores?.[col.id] || 0);
      return getRank(score, allScores);
    };

    const sr1Rank = getRankValue(schRd1Col);
    const sr2Rank = getRankValue(schRd2Col);

    let weightedSum = 0;
    let totalWeight = 0;

    if (quizAvgRankStr !== '-') {
      weightedSum += quizAvgRank * 0.5;
      totalWeight += 0.5;
    }
    if (sr1Rank !== null) {
      weightedSum += sr1Rank * 0.25;
      totalWeight += 0.25;
    }
    if (sr2Rank !== null) {
      weightedSum += sr2Rank * 0.25;
      totalWeight += 0.25;
    }

    if (totalWeight === 0) return 999;
    return weightedSum / totalWeight;
  };

  const sortedStudents = useMemo(() => {
    const withScores = students.map(s => ({
      ...s,
      finalScoreNumeric: getFinalScoreValue(s.id)
    }));
    return withScores.sort((a, b) => a.finalScoreNumeric - b.finalScoreNumeric);
  }, [students, studentQuizData, schoolRoundColumns, editingColId, tempColScores]);

  const activeCol = assessmentColumns.find(c => c.id === editingColId);
  const columnBeingDeleted = assessmentColumns.find(c => c.id === colToDeleteId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Coach's Ledger</h2>
          <p className="text-slate-500 mt-1">Weighted club rankings. Best students (lowest Final Score) are at the top.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <ArrowPathIcon className="w-3 h-3" /> Reset Demo
          </button>
          <button onClick={() => setShowColModal(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all">
            <PlusIcon className="w-5 h-5 text-emerald-500" /> Add Assessment
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all">
            <UserPlusIcon className="w-5 h-5" /> New Student
          </button>
        </div>
      </header>

      {editingColId && activeCol && (
        <div className="bg-amber-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 shadow-lg shadow-amber-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg"><PencilSquareIcon className="w-5 h-5" /></div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Editing: {activeCol.title}</p>
              <p className="text-xs text-amber-50">Entering scores for all students in this column.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDiscardConfirm(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-xl font-bold text-xs transition-colors">Discard Column</button>
            <button onClick={applyColumnChanges} className="px-6 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-xl font-black text-xs shadow-md transition-all">Apply & Save</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-x-auto relative max-w-full">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 sticky left-0 bg-slate-50 z-10">Rank</th>
              <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-16 bg-slate-50 z-10 whitespace-nowrap">Student Name</th>
              <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 whitespace-nowrap">Tryout Score</th>
              <th className="px-4 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 whitespace-nowrap border-r border-slate-200">Tryout Rank</th>
              {assessmentColumns.map(col => (
                <React.Fragment key={col.id}>
                  <th className={`px-4 py-5 text-[10px] font-black uppercase tracking-widest border-l border-slate-100 relative group whitespace-nowrap ${col.type === 'Quiz' ? 'text-indigo-600 bg-indigo-50/30' : 'text-teal-600 bg-teal-50/30'}`}>
                    <div className="flex items-center gap-2">
                      {col.type === 'Quiz' ? <ClipboardDocumentCheckIcon className="w-3 h-3" /> : <AcademicCapIcon className="w-3 h-3" />}
                      {col.title}
                      {!editingColId && (
                        <div className="opacity-0 group-hover:opacity-100 ml-auto flex gap-1">
                          <button onClick={() => startEditingColumn(col.id)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit this column"><PencilSquareIcon className="w-3 h-3" /></button>
                          <button onClick={() => triggerDeleteColumn(col.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Delete this column"><TrashIcon className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-4 py-5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-r border-slate-100 ${col.type === 'Quiz' ? 'text-indigo-400 bg-indigo-50/20' : 'text-teal-400 bg-teal-50/20'}`}>Rank</th>
                </React.Fragment>
              ))}
              <th className="px-4 py-5 text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-100/30 whitespace-nowrap border-l-4 border-indigo-200">
                <div className="flex items-center gap-1.5"><ChartBarIcon className="w-3.5 h-3.5" /> Quiz Avg</div>
              </th>
              <th className="px-4 py-5 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100/30 whitespace-nowrap border-l-4 border-emerald-200 shadow-[inset_-2px_0_0_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-1.5"><StarIcon className="w-3.5 h-3.5" /> Final Score</div>
              </th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedStudents.map((student, index) => {
              const displayRank = index + 1;
              const tryoutRank = getRank(student.tryoutScore, students.map(s => s.tryoutScore));
              const avgRank = getQuizAvgRank(student.id);
              const finalScore = student.finalScoreNumeric === 999 ? '0.00' : student.finalScoreNumeric.toFixed(2);

              return (
                <tr key={student.id} className={`hover:bg-slate-50 transition-colors group ${editingColId ? 'bg-slate-50/20' : ''}`}>
                  <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${displayRank === 1 ? 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-100' : displayRank === 2 ? 'bg-slate-200 text-slate-700' : displayRank === 3 ? 'bg-orange-100 text-orange-700' : 'text-slate-400 bg-slate-50'}`}>{displayRank}</span>
                  </td>
                  <td className="px-4 py-4 sticky left-16 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">{student.firstName[0]}{student.lastName[0]}</div>
                      <span className="font-semibold text-slate-700 text-sm">{student.firstName} {student.lastName}</span>
                      <button onClick={() => setSelectedStudentId(student.id === selectedStudentId ? null : student.id)} className="info-trigger p-1 text-slate-300 hover:text-indigo-600 rounded-lg transition-colors"><InformationCircleIcon className="w-3.5 h-3.5" /></button>
                      {selectedStudentId === student.id && (
                        <div ref={detailsRef} className="absolute left-full top-0 ml-4 z-[999] w-64 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-left-2">
                          <p className="font-black text-indigo-400 mb-2">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">ID: {student.studentId}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Grade</p><p>{student.grade}th</p></div>
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Math</p><p>{student.mathLevel}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap"><span className="font-black text-slate-800 text-base">{student.tryoutScore}</span></td>
                  <td className="px-4 py-4 whitespace-nowrap border-r border-slate-100"><span className="font-bold text-slate-400 text-sm">{tryoutRank}</span></td>
                  {assessmentColumns.map(col => {
                    const isColEditing = editingColId === col.id;
                    const score = isColEditing ? (parseInt(tempColScores[student.id]) || 0) : (student.dynamicScores?.[col.id] || 0);
                    const allColScores = students.map(s => editingColId === col.id ? (parseInt(tempColScores[s.id]) || 0) : (s.dynamicScores?.[col.id] || 0));
                    const rank = getRank(score, allColScores);
                    return (
                      <React.Fragment key={col.id}>
                        <td className={`px-4 py-4 border-l border-slate-50 whitespace-nowrap ${col.type === 'Quiz' ? 'bg-indigo-50/10' : 'bg-teal-50/10'}`}>
                          {isColEditing ? (
                            <input type="text" value={tempColScores[student.id] || ''} onChange={(e) => handleScoreUpdate(student.id, e.target.value)} className={`w-14 bg-white border border-amber-300 rounded-lg px-2 py-1 text-center text-sm font-black outline-none focus:ring-2 focus:ring-amber-500 transition-all ${col.type === 'Quiz' ? 'text-indigo-700' : 'text-teal-700'}`} autoFocus={index === 0} />
                          ) : (
                            <span className={`font-black text-sm ${col.type === 'Quiz' ? 'text-indigo-700' : 'text-teal-700'}`}>{score}</span>
                          )}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap border-r border-slate-100 ${col.type === 'Quiz' ? 'bg-indigo-50/5' : 'bg-teal-50/5'}`}><span className="font-bold text-slate-400 text-xs">{rank}</span></td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-4 py-4 bg-indigo-50/20 border-l-4 border-indigo-100 whitespace-nowrap text-center"><span className={`font-black text-sm ${avgRank === '-' ? 'text-slate-300' : 'text-indigo-700'}`}>{avgRank}</span></td>
                  <td className="px-4 py-4 bg-emerald-50/20 border-l-4 border-emerald-100 whitespace-nowrap text-center font-black text-sm text-emerald-700">
                    {finalScore}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {!editingColId && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEditingStudent(student)} className="p-1.5 text-slate-200 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Student"><PencilSquareIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Student"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDeleteColConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><TrashIcon className="w-8 h-8" /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Column</h3>
            <p className="text-slate-500 text-sm mb-2">Are you sure you want to delete <span className="font-bold text-slate-700">"{columnBeingDeleted?.title}"</span>?</p>
            <p className="text-slate-400 text-xs mb-8 italic">All recorded scores for this assessment will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteColConfirm(false); setColToDeleteId(null); }} className="flex-1 py-4 font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleConfirmDeleteColumn} className="flex-1 py-4 font-black text-white bg-red-500 rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><ExclamationTriangleIcon className="w-8 h-8" /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Discard Current Column</h3>
            <p className="text-slate-500 text-sm mb-8">Are you sure? All entered scores will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={handleDiscardConfirm} className="flex-1 py-4 font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Discard</button>
              <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 py-4 font-black text-white bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showColModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2">New Assessment</h3>
            <p className="text-slate-500 text-sm mb-8">Round name is assigned automatically based on type.</p>
            <form onSubmit={handleAddAssessment} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                <div className="grid grid-cols-1 gap-3">
                  <button type="button" onClick={() => setNewColType('Quiz')} className={`p-6 rounded-2xl font-bold border-2 transition-all flex items-center gap-4 ${newColType === 'Quiz' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`p-3 rounded-xl ${newColType === 'Quiz' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}><ClipboardDocumentCheckIcon className="w-6 h-6" /></div>
                    <div className="text-left"><p className="text-lg">Quiz</p><p className={`text-xs ${newColType === 'Quiz' ? 'text-indigo-100' : 'text-slate-400'}`}>Short weekly warmup</p></div>
                  </button>
                  <button type="button" onClick={() => setNewColType('School Round')} className={`p-6 rounded-2xl font-bold border-2 transition-all flex items-center gap-4 ${newColType === 'School Round' ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`p-3 rounded-xl ${newColType === 'School Round' ? 'bg-white/20' : 'bg-teal-50 text-teal-500'}`}><AcademicCapIcon className="w-6 h-6" /></div>
                    <div className="text-left"><p className="text-lg">School Round</p><p className={`text-xs ${newColType === 'School Round' ? 'text-teal-100' : 'text-slate-400'}`}>Full mock competition</p></div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowColModal(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-2 bg-slate-900 text-white font-black px-10 py-4 rounded-2xl shadow-lg transition-all hover:bg-slate-800">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Enroll Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="First Name" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
                <input required type="text" placeholder="Last Name" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <input required type="text" placeholder="Student ID" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newStudent.grade} onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="6">6th Grade</option><option value="7">7th Grade</option><option value="8">8th Grade</option>
                </select>
                <select value={newStudent.mathLevel} onChange={e => setNewStudent({ ...newStudent, mathLevel: e.target.value as MathLevel })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Alg 1">Alg 1</option><option value="Geo">Geo</option><option value="Alg 2">Alg 2</option><option value="PreCal">PreCal</option>
                </select>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Edit Student</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="First Name" value={editingStudent.firstName} onChange={e => setEditingStudent({ ...editingStudent, firstName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
                <input required type="text" placeholder="Last Name" value={editingStudent.lastName} onChange={e => setEditingStudent({ ...editingStudent, lastName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <input required type="text" placeholder="Student ID" value={editingStudent.studentId} onChange={e => setEditingStudent({ ...editingStudent, studentId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-4">
                <select value={editingStudent.grade} onChange={e => setEditingStudent({ ...editingStudent, grade: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="6">6th Grade</option><option value="7">7th Grade</option><option value="8">8th Grade</option>
                </select>
                <select value={editingStudent.mathLevel} onChange={e => setEditingStudent({ ...editingStudent, mathLevel: e.target.value as MathLevel })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Alg 1">Alg 1</option><option value="Geo">Geo</option><option value="Alg 2">Alg 2</option><option value="PreCal">PreCal</option>
                </select>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingStudent(null); }} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl">Update Info</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;
