import React, { useState, useEffect, useMemo, useRef } from 'react';
import { extractProblemDataFromPdf } from '../services/geminiService';
import { AnalyzedProblem } from '../types';
import { db } from '../services/firebase';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  PlusIcon,
  ArrowPathRoundedSquareIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  Bars3BottomLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface QuizRule {
  id: string;
  type: 'Sprint' | 'Target';
  categories: string[];
  problemSets: string[];
  difficulties: string[];
  count: number;
}

interface QuizDraft {
  problem: AnalyzedProblem;
  ruleId: string | null;
  type: 'Sprint' | 'Target';
  index: number;
}

interface DebugRow {
  id: string;
  diff: string;
  category: string;
  set: string;
  type: string;
}

const DataAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadYear, setUploadYear] = useState('2526');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzedProblem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Quiz Factory State
  const [view, setView] = useState<'data' | 'factory'>('data');
  const [assignmentType, setAssignmentType] = useState<'Quiz' | 'School Round'>('Quiz');
  const [quizNum, setQuizNum] = useState('1');
  const [quizNumAuto, setQuizNumAuto] = useState(true);
  const [totalSprint, setTotalSprint] = useState(15);
  const [totalTarget, setTotalTarget] = useState(4);
  const [rules, setRules] = useState<QuizRule[]>([]);
  const [draft, setDraft] = useState<QuizDraft[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [debugSprint, setDebugSprint] = useState<DebugRow[]>([]);
  const [debugTarget, setDebugTarget] = useState<DebugRow[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const isStrictTargetRequested = true;
  const isStrictSprintRequested = true;

  // Rule Modal State
  const [newRuleType, setNewRuleType] = useState<'Sprint' | 'Target'>('Sprint');
  const [newRuleCategories, setNewRuleCategories] = useState<string[]>([]);
  const [newRuleDifficulties, setNewRuleDifficulties] = useState<string[]>([]);
  const [newRuleProblemSets, setNewRuleProblemSets] = useState<string[]>([]);
  const [newRuleCount, setNewRuleCount] = useState(1);

  const getProblemKey = (p: Pick<AnalyzedProblem, 'problemId' | 'year'>) =>
    `${String(p.problemId || '').trim()}_${String(p.year || '').trim()}`.replace(/\//g, '-');

  const pushToCloudInChunks = async (problemsToSync: AnalyzedProblem[]) => {
    try {
      const chunkSize = 450; // Google Cloud Limit is 500 per batch
      for (let i = 0; i < problemsToSync.length; i += chunkSize) {
        const chunk = problemsToSync.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(p => {
          const key = getProblemKey(p);
          batch.set(doc(db, 'problems', key), p, { merge: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Failed to sync chunk to cloud', err);
    }
  };

  useEffect(() => {
    const fetchGlobalProblems = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'problems'));

        if (snap.empty) {
          const saved = localStorage.getItem('mathcounts_analyzed_data');
          if (saved) {
            const parsed = JSON.parse(saved) as AnalyzedProblem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              const dataWithYear = parsed.map(d => ({ ...d, year: d.year || '2526' }));
              setResults(dataWithYear);
              await pushToCloudInChunks(dataWithYear);
              console.log("Successfully migrated local ledger to Firestore!");
            }
          }
        } else {
          const loaded: AnalyzedProblem[] = [];
          snap.forEach(d => loaded.push({ ...d.data() } as AnalyzedProblem));
          setResults(loaded);
        }
      } catch (err) {
        console.error("Failed to fetch lab problems", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalProblems();
  }, []);

  const mergeProblems = (prev: AnalyzedProblem[], incoming: AnalyzedProblem[]) => {
    const merged = new Map<string, AnalyzedProblem>();
    const mergeOne = (item: AnalyzedProblem) => {
      const key = getProblemKey(item);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, item);
        return;
      }
      merged.set(key, {
        ...existing,
        ...item,
        problemSet: item.problemSet || existing.problemSet,
        category: item.category || existing.category,
        difficulty: item.difficulty || existing.difficulty,
        ccssMapping: item.ccssMapping || existing.ccssMapping,
        answer: item.answer || existing.answer,
        quiz: item.quiz || existing.quiz,
        quizNumber: item.quizNumber || existing.quizNumber,
        isUsed: item.isUsed ?? existing.isUsed,
        year: item.year || existing.year
      });
    };
    prev.forEach(mergeOne);
    incoming.forEach(mergeOne);

    // Backfill problemSet by range headers like "1. 25 (1)".
    const rangeHeaders = Array.from(merged.values())
      .map(p => p.problemSet || '')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const m = s.match(/^(\d+)\.\s*(\d+)\s*\((\d+)\)\s*$/);
        if (!m) return null;
        return { start: parseInt(m[1], 10), end: parseInt(m[2], 10), label: s };
      })
      .filter((v): v is { start: number; end: number; label: string } => Boolean(v));

    if (rangeHeaders.length > 0) {
      merged.forEach((val, key) => {
        if (val.problemSet) return;
        const idNum = parseInt(val.problemId, 10);
        if (Number.isNaN(idNum)) return;
        const header = rangeHeaders.find(r => idNum >= r.start && idNum <= r.end);
        if (header) merged.set(key, { ...val, problemSet: header.label });
      });
    }

    return Array.from(merged.values());
  };

  useEffect(() => {
    if (results.length === 0) return;
    const needsYear = results.some(r => !r.year);
    if (!needsYear) return;
    setResults(prev => prev.map(p => ({ ...p, year: p.year || '2526' })));
  }, [results]);

  useEffect(() => {
    if (results.length === 0) return;
    const normalized = mergeProblems(results, []);
    if (normalized.length !== results.length) {
      setResults(normalized);
      return;
    }
    const byId = new Map<string, AnalyzedProblem>(results.map(r => [getProblemKey(r), r]));
    const needsUpdate = normalized.some(n => {
      const prev = byId.get(getProblemKey(n));
      if (!prev) return true;
      return (
        (prev.problemSet || '') !== (n.problemSet || '') ||
        (prev.category || '') !== (n.category || '') ||
        (prev.difficulty || '') !== (n.difficulty || '') ||
        (prev.ccssMapping || '') !== (n.ccssMapping || '') ||
        (prev.answer || '') !== (n.answer || '')
      );
    });
    if (needsUpdate) setResults(normalized);
  }, [results]);

  useEffect(() => {
    if (!quizNumAuto) return;
    let maxQuiz = 0;
    results.forEach(r => {
      const match = (r.quiz || '').match(/quiz\s+(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num)) maxQuiz = Math.max(maxQuiz, num);
      }
    });
    const next = maxQuiz > 0 ? String(maxQuiz + 1) : '1';
    setQuizNum(next);
  }, [results, quizNumAuto]);

  const categoriesList = [
    "Algebraic",
    "Probability",
    "Proportional Reasoning",
    "Solid Geometry",
    "Coordinate Geometry",
    "Number Theory",
    "Plane Geometry",
    "Sequences",
    "Statistics",
    "Misc"
  ];

  const getConsolidatedCategory = (cat: string) => {
    if (!cat) return "Misc";
    const norm = cat.trim().toLowerCase();

    // Standards for Target Rounds (Priority Groups)
    if (norm.includes("algebra")) return "Algebraic";
    if (norm.includes("number theory")) return "Number Theory";
    if (norm.includes("probability") || norm.includes("counting")) return "Probability";
    if (norm.includes("geometry")) {
      if (norm.includes("solid")) return "Solid Geometry";
      if (norm.includes("coordinate")) return "Coordinate Geometry";
      return "Plane Geometry";
    }

    if (norm === "statistics" || norm.includes("statistics & data") || norm.includes("data analysis")) return "Statistics";
    if (norm.includes("proportional reasoning")) return "Proportional Reasoning";
    if (norm.includes("sequences") || norm.includes("series")) return "Sequences";

    const miscKeywords = ["general math", "logic", "measurement", "percent", "fraction", "miscellaneous", "problem solving", "misc"];
    if (miscKeywords.some(kw => norm.includes(kw))) return "Misc";

    return "Misc";
  };

  const getConsolidatedProblemSet = (set: string) => {
    if (!set) return "";
    const norm = set.toLowerCase();
    if (norm.includes("warm-up")) return "Warm-ups";
    if (norm.includes("workout")) return "Workouts";
    return set;
  };

  const problemSets = useMemo(() => {
    const set = new Set(results.map(r => getConsolidatedProblemSet(r.problemSet)).filter(Boolean));
    return Array.from(set).sort();
  }, [results]);

  const difficulties = useMemo(() => {
    const set = new Set<string>(results.map(r => r.difficulty).filter((d): d is string => Boolean(d)));
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [results]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files) as File[];
    const nonPdf = selectedFiles.find(f => f.type !== 'application/pdf');
    if (nonPdf) {
      setError("Please upload PDF files only.");
      return;
    }
    setFiles(selectedFiles);
    setError(null);
  };


  const toBase64 = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          if (base64) resolve(base64);
          else reject(new Error("Failed to parse base64"));
        } else reject(new Error("Result not string"));
      };
      reader.onerror = error => reject(error);
    });

  const analyzePdf = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const allData: AnalyzedProblem[] = [];
      for (const f of files) {
        const base64 = await toBase64(f);
        const data = await extractProblemDataFromPdf(base64);
        allData.push(...data.map(d => ({ ...d, year: uploadYear })));
      }
      setResults(prev => mergeProblems(prev, allData));
      await pushToCloudInChunks(allData);
      setFiles([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to analyze PDF: ${errorMessage}. Please check your API key.`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'problems'));
      const chunkSize = 450;
      for (let i = 0; i < snap.docs.length; i += chunkSize) {
        const chunk = snap.docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      setResults([]);
      setShowClearConfirm(false);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert('Failed to delete cloud problems.');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const rule: QuizRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: newRuleType,
      categories: newRuleCategories,
      problemSets: newRuleProblemSets,
      difficulties: newRuleDifficulties,
      count: newRuleCount
    };
    setRules([...rules, rule]);
    setShowRuleModal(false);
    setNewRuleCount(1);
    setNewRuleCategories([]);
    setNewRuleProblemSets([]);
    setNewRuleDifficulties([]);
  };

  const setupQuickQuiz = () => {
    const sprintRules: QuizRule[] = [
      { id: 'sq-atomic', type: 'Sprint', categories: ['STRICT_SPRINT_COMPLIANT'], problemSets: [], difficulties: [], count: 15 }
    ];

    const targetRules: QuizRule[] = [
      { id: 'tq-atomic', type: 'Target', categories: ['STRICT_MC_COMPLIANT'], problemSets: ['Workouts'], difficulties: [], count: 4 }
    ];

    setRules([...sprintRules, ...targetRules]);
    setTotalSprint(15);
    setTotalTarget(4);
  };

  const generateDraft = () => {
    const available = results.filter(r => !r.isUsed);
    let newDraft: QuizDraft[] = [];
    const usedIds = new Set<string>();

    const sprintCoreCategoryGroups = [
      ['Algebraic'],
      ['Probability'],
      ['Number Theory'],
      ['Plane Geometry', 'Solid Geometry', 'Coordinate Geometry']
    ];

    const buildSprintCategoryGroups = () => {
      const otherCategories = ['Proportional Reasoning', 'Sequences', 'Statistics', 'Misc'];
      const base = [
        ['Algebraic'],
        ['Algebraic'],
        ['Algebraic'],
        ['Probability'],
        ['Probability'],
        ['Probability'],
        ['Number Theory'],
        ['Number Theory'],
        ['Number Theory'],
        ['Plane Geometry', 'Solid Geometry', 'Coordinate Geometry'],
        ['Plane Geometry', 'Solid Geometry', 'Coordinate Geometry'],
        ['Plane Geometry', 'Solid Geometry', 'Coordinate Geometry']
      ];

      for (let i = 0; i < 3; i++) {
        base.push(otherCategories);
      }

      return base;
    };

    const sprintDifficultySlots = [
      ['1', '2', '3'],
      ['1', '2', '3'],
      ['1', '2', '3'],
      ['1', '2', '3'],
      ['1', '2', '3'],
      ['4'],
      ['4'],
      ['4'],
      ['4'],
      ['4'],
      ['5'],
      ['5'],
      ['5'],
      ['6'],
      ['6', '7']
    ];

    const targetCategoryGroups = [
      ['Algebraic'],
      ['Probability'],
      ['Number Theory'],
      ['Plane Geometry', 'Solid Geometry', 'Coordinate Geometry']
    ];

    const targetDifficultySlots = [['4'], ['4'], ['5'], ['6', '7']];

    if (isStrictSprintRequested) {
      let success = false;
      const MAX_RETRIES = 1500;
      let lastSprintAttempt: QuizDraft[] = [];
      setGenerationError(null);

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const attemptUsedIds = new Set<string>();
        const attemptSelection: QuizDraft[] = [];
        const shuffledGroups = buildSprintCategoryGroups().sort(() => Math.random() - 0.5);
        const shuffledSlots = [...sprintDifficultySlots].sort(() => Math.random() - 0.5);

        let attemptFailed = false;
        for (let i = 0; i < 15; i++) {
          const currentGroup = shuffledGroups[i];
          const currentSlot = shuffledSlots[i];

          const pool = available.filter(r => {
            const diff = String(r.difficulty);
            const isWorkout = getConsolidatedProblemSet(r.problemSet) === 'Workouts';
            const workoutAllowed = isWorkout && (diff === '2' || diff === '3');
            const nonWorkoutAllowed = !isWorkout;
            return (
              !attemptUsedIds.has(getProblemKey(r)) &&
              (nonWorkoutAllowed || workoutAllowed) &&
              currentGroup.includes(getConsolidatedCategory(r.category)) &&
              currentSlot.includes(diff)
            );
          });

          if (pool.length > 0) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            attemptUsedIds.add(getProblemKey(picked));
            attemptSelection.push({ problem: picked, ruleId: null, type: 'Sprint', index: 0 });
          } else {
            attemptFailed = true;
            break;
          }
        }

        if (!attemptFailed && attemptSelection.length === 15) {
          attemptSelection.forEach(d => {
            newDraft.push(d);
            usedIds.add(getProblemKey(d.problem));
          });
          success = true;
          setDebugSprint([]);
          break;
        }

        if (attempt === MAX_RETRIES - 1) {
          lastSprintAttempt = attemptSelection;
        }
      }

      if (!success) {
        setDraft([]);
        const pool = available.filter(r => {
          const diff = String(r.difficulty);
          const isWorkout = getConsolidatedProblemSet(r.problemSet) === 'Workouts';
          return !isWorkout || diff === '2' || diff === '3';
        });
        const debugRows = lastSprintAttempt.map(d => ({
          id: d.problem.problemId,
          diff: String(d.problem.difficulty),
          category: getConsolidatedCategory(d.problem.category),
          set: getConsolidatedProblemSet(d.problem.problemSet),
          type: d.type
        }));
        setDebugSprint(debugRows);
        setGenerationError(
          "CRITICAL ERROR: Could not satisfy Sprint round constraints. " +
          "Requires 15 non-Workout problems with category minimums (Alg/Prob/NumTheory/Geometry) " +
          "and difficulty slots [5x L1-3, 5x L4, 3x L5, 1x L6, 1x L6/7]. " +
          summarizeSprintAvailability(pool)
        );
        return;
      }
    }

    if (isStrictTargetRequested) {
      let success = false;
      const MAX_RETRIES = 1500;
      let lastTargetAttempt: QuizDraft[] = [];

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const attemptUsedIds = new Set<string>();
        const attemptSelection: QuizDraft[] = [];
        const shuffledGroups = [...targetCategoryGroups].sort(() => Math.random() - 0.5);
        const shuffledSlots = [...targetDifficultySlots].sort(() => Math.random() - 0.5);

        let attemptFailed = false;
        for (let i = 0; i < 4; i++) {
          const currentGroup = shuffledGroups[i];
          const currentSlot = shuffledSlots[i];

          const pool = available.filter(r =>
            !attemptUsedIds.has(getProblemKey(r)) &&
            getConsolidatedProblemSet(r.problemSet) === 'Workouts' &&
            currentGroup.includes(getConsolidatedCategory(r.category)) &&
            currentSlot.includes(String(r.difficulty))
          );

          if (pool.length > 0) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            attemptUsedIds.add(getProblemKey(picked));
            attemptSelection.push({ problem: picked, ruleId: 'tq-atomic', type: 'Target', index: 0 });
          } else {
            attemptFailed = true;
            break;
          }
        }

        if (!attemptFailed && attemptSelection.length === 4) {
          attemptSelection.forEach(d => {
            newDraft.push(d);
            usedIds.add(getProblemKey(d.problem));
          });
          success = true;
          setDebugTarget([]);
          break;
        }

        if (attempt === MAX_RETRIES - 1) {
          lastTargetAttempt = attemptSelection;
        }
      }

      if (!success) {
        setDraft([]);
        const pool = available.filter(r => getConsolidatedProblemSet(r.problemSet) === 'Workouts');
        const debugRows = lastTargetAttempt.map(d => ({
          id: d.problem.problemId,
          diff: String(d.problem.difficulty),
          category: getConsolidatedCategory(d.problem.category),
          set: getConsolidatedProblemSet(d.problem.problemSet),
          type: d.type
        }));
        setDebugTarget(debugRows);
        setGenerationError(
          "CRITICAL ERROR: Could not satisfy Target round constraints. " +
          "Requires 4 Workout problems: [1x Alg, 1x Prob, 1x NumTheory, 1x Geometry]. " +
          "Difficulty Pairing: [2x Lvl 4, 1x Lvl 5, 1x Lvl 6/7]. " +
          summarizeTargetAvailability(pool)
        );
        return;
      }
    }

    rules
      .filter(r => r.id !== 'tq-atomic' && (!isStrictTargetRequested || r.type !== 'Target') && (!isStrictSprintRequested || r.type !== 'Sprint'))
      .forEach(rule => {
        let pool = available.filter(r => !usedIds.has(getProblemKey(r)));

        if (rule.type === 'Sprint') {
          pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) !== 'Workouts');
        } else if (rule.type === 'Target') {
          pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) === 'Workouts');
        }

        if (rule.categories.length > 0 && rule.categories[0] !== 'STRICT_MC_COMPLIANT') {
          pool = pool.filter(r => rule.categories.includes(getConsolidatedCategory(r.category)));
        }

        if (rule.difficulties.length > 0) {
          pool = pool.filter(r => rule.difficulties.includes(r.difficulty));
        }

        if (rule.problemSets.length > 0) {
          pool = pool.filter(r => rule.problemSets.includes(getConsolidatedProblemSet(r.problemSet)));
        }

        const selection = pool.sort(() => 0.5 - Math.random()).slice(0, rule.count);
        selection.forEach(p => {
          newDraft.push({ problem: p, ruleId: rule.id, type: rule.type, index: 0 });
          usedIds.add(getProblemKey(p));
        });
      });

    const fill = (type: 'Sprint' | 'Target', target: number) => {
      if (type === 'Sprint' && isStrictSprintRequested) return;
      if (type === 'Target' && isStrictTargetRequested) return;
      const currentCount = newDraft.filter(d => d.type === type).length;
      if (currentCount < target) {
        let pool = available.filter(r => !usedIds.has(getProblemKey(r)));
        if (type === 'Sprint') {
          pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) !== 'Workouts');
        } else if (!isStrictTargetRequested) {
          pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) === 'Workouts');
        } else {
          return;
        }
        const selection = pool.sort(() => 0.5 - Math.random()).slice(0, target - currentCount);
        selection.forEach(p => {
          newDraft.push({ problem: p, ruleId: null, type, index: 0 });
          usedIds.add(getProblemKey(p));
        });
      }
    };

    fill('Sprint', totalSprint);
    fill('Target', totalTarget);

    if (isStrictSprintRequested) {
      const sprintDraft = newDraft.filter(d => d.type === 'Sprint');
      if (!validateStrictSprint(sprintDraft)) {
        setDebugSprint(sprintDraft.map(d => ({
          id: d.problem.problemId,
          diff: String(d.problem.difficulty),
          category: getConsolidatedCategory(d.problem.category),
          set: getConsolidatedProblemSet(d.problem.problemSet),
          type: d.type
        })));
        setDraft([]);
        const pool = available.filter(r => {
          const diff = String(r.difficulty);
          const isWorkout = getConsolidatedProblemSet(r.problemSet) === 'Workouts';
          return !isWorkout || diff === '2' || diff === '3';
        });
        setGenerationError(
          "Sprint draft failed strict validation after generation. Please regenerate. " +
          summarizeSprintAvailability(pool)
        );
        return;
      }
    }

    if (isStrictTargetRequested) {
      const targetDraft = newDraft.filter(d => d.type === 'Target');
      if (!validateStrictTarget(targetDraft)) {
        setDebugTarget(targetDraft.map(d => ({
          id: d.problem.problemId,
          diff: String(d.problem.difficulty),
          category: getConsolidatedCategory(d.problem.category),
          set: getConsolidatedProblemSet(d.problem.problemSet),
          type: d.type
        })));
        setDraft([]);
        const pool = available.filter(r => getConsolidatedProblemSet(r.problemSet) === 'Workouts');
        setGenerationError(
          "Target draft failed strict validation after generation. Please regenerate. " +
          summarizeTargetAvailability(pool)
        );
        return;
      }
    }

    const sprintGroup = newDraft
      .filter(d => d.type === 'Sprint')
      .sort((a, b) => (parseInt(a.problem.difficulty) || 0) - (parseInt(b.problem.difficulty) || 0));

    const targetGroup = newDraft
      .filter(d => d.type === 'Target')
      .sort((a, b) => (parseInt(a.problem.difficulty) || 0) - (parseInt(b.problem.difficulty) || 0));

    let sprintIdx = 1;
    let targetIdx = 1;
    setDraft([
      ...sprintGroup.map(d => ({ ...d, index: sprintIdx++ })),
      ...targetGroup.map(d => ({ ...d, index: targetIdx++ }))
    ]);
    setGenerationError(null);
  };

  const swapQuestion = (problemKey: string) => {
    const draftItem = draft.find(d => getProblemKey(d.problem) === problemKey);
    if (!draftItem) return;
    const usedInDraft = new Set(draft.map(d => getProblemKey(d.problem)));
    let pool = results.filter(r => !r.isUsed && !usedInDraft.has(getProblemKey(r)));

    if (draftItem.type === 'Sprint') {
      pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) !== 'Workouts');
    } else {
      pool = pool.filter(r => getConsolidatedProblemSet(r.problemSet) === 'Workouts');
    }

    if (draftItem.type === 'Target' && isStrictTargetRequested) {
      const cat = getConsolidatedCategory(draftItem.problem.category);
      const diff = draftItem.problem.difficulty;
      pool = pool.filter(r =>
        getConsolidatedCategory(r.category) === cat &&
        r.difficulty === diff &&
        getConsolidatedProblemSet(r.problemSet) === 'Workouts'
      );
    } else if (draftItem.type === 'Sprint' && isStrictSprintRequested) {
      const cat = getConsolidatedCategory(draftItem.problem.category);
      const diff = draftItem.problem.difficulty;
      pool = pool.filter(r =>
        getConsolidatedCategory(r.category) === cat &&
        r.difficulty === diff &&
        getConsolidatedProblemSet(r.problemSet) !== 'Workouts'
      );
    } else if (draftItem.ruleId) {
      const rule = rules.find(r => r.id === draftItem.ruleId);
      if (rule && rule.id !== 'tq-atomic') {
        if (rule.categories.length > 0) pool = pool.filter(r => rule.categories.includes(getConsolidatedCategory(r.category)));
        if (rule.difficulties.length > 0) pool = pool.filter(r => rule.difficulties.includes(r.difficulty));
        if (rule.problemSets.length > 0) pool = pool.filter(r => rule.problemSets.includes(getConsolidatedProblemSet(r.problemSet)));
      } else if (rule?.id === 'tq-atomic') {
        const cat = getConsolidatedCategory(draftItem.problem.category);
        const diff = draftItem.problem.difficulty;
        pool = pool.filter(r =>
          getConsolidatedCategory(r.category) === cat &&
          r.difficulty === diff &&
          getConsolidatedProblemSet(r.problemSet) === 'Workouts'
        );
      }
    }

    if (pool.length > 0) {
      const newProblem = pool[Math.floor(Math.random() * pool.length)];
      setDraft(draft.map(d => getProblemKey(d.problem) === problemKey ? { ...d, problem: newProblem } : d));
    } else {
      alert("No matching replacements found in the available ledger pool.");
    }
  };

  const validateStrictSprint = (items: QuizDraft[]) => {
    const sprintCounts: Record<string, number> = {
      Algebraic: 0,
      Probability: 0,
      'Number Theory': 0,
      Geometry: 0,
      Other: 0
    };
    const sprintDiffs: Record<string, number> = {};
    let sprintWorkoutOk = true;

    items.forEach(d => {
      const cat = getConsolidatedCategory(d.problem.category);
      if (cat === 'Algebraic') sprintCounts.Algebraic += 1;
      else if (cat === 'Probability') sprintCounts.Probability += 1;
      else if (cat === 'Number Theory') sprintCounts['Number Theory'] += 1;
      else if (cat === 'Plane Geometry' || cat === 'Solid Geometry' || cat === 'Coordinate Geometry') sprintCounts.Geometry += 1;
      else sprintCounts.Other += 1;

      sprintDiffs[d.problem.difficulty] = (sprintDiffs[d.problem.difficulty] || 0) + 1;

      if (getConsolidatedProblemSet(d.problem.problemSet) === 'Workouts') {
        const diff = String(d.problem.difficulty);
        if (diff !== '2' && diff !== '3') sprintWorkoutOk = false;
      }
    });

    const sprintLow = (sprintDiffs['1'] || 0) + (sprintDiffs['2'] || 0) + (sprintDiffs['3'] || 0);
    const sprintLevel4 = sprintDiffs['4'] || 0;
    const sprintLevel5 = sprintDiffs['5'] || 0;
    const sprintLevel6 = sprintDiffs['6'] || 0;
    const sprintLevel67 = (sprintDiffs['6'] || 0) + (sprintDiffs['7'] || 0);

    return (
      items.length === 15 &&
      sprintWorkoutOk &&
      sprintCounts.Algebraic === 3 &&
      sprintCounts.Probability === 3 &&
      sprintCounts['Number Theory'] === 3 &&
      sprintCounts.Geometry === 3 &&
      sprintCounts.Other === 3 &&
      sprintLow === 5 &&
      sprintLevel4 === 5 &&
      sprintLevel5 === 3 &&
      sprintLevel6 >= 1 &&
      sprintLevel6 <= 2 &&
      sprintLevel67 === 2
    );
  };

  const validateStrictTarget = (items: QuizDraft[]) => {
    const targetCounts: Record<string, number> = {
      Algebraic: 0,
      Probability: 0,
      'Number Theory': 0,
      Geometry: 0
    };
    const targetDiffs: Record<string, number> = {};
    let targetWorkoutOk = true;

    items.forEach(d => {
      const cat = getConsolidatedCategory(d.problem.category);
      if (cat === 'Algebraic') targetCounts.Algebraic += 1;
      else if (cat === 'Probability') targetCounts.Probability += 1;
      else if (cat === 'Number Theory') targetCounts['Number Theory'] += 1;
      else if (cat === 'Plane Geometry' || cat === 'Solid Geometry' || cat === 'Coordinate Geometry') targetCounts.Geometry += 1;

      targetDiffs[d.problem.difficulty] = (targetDiffs[d.problem.difficulty] || 0) + 1;

      if (getConsolidatedProblemSet(d.problem.problemSet) !== 'Workouts') targetWorkoutOk = false;
    });

    const targetLevel4 = targetDiffs['4'] || 0;
    const targetLevel5 = targetDiffs['5'] || 0;
    const targetLevel67 = (targetDiffs['6'] || 0) + (targetDiffs['7'] || 0);

    return (
      items.length === 4 &&
      targetWorkoutOk &&
      targetCounts.Algebraic === 1 &&
      targetCounts.Probability === 1 &&
      targetCounts['Number Theory'] === 1 &&
      targetCounts.Geometry === 1 &&
      targetLevel4 === 2 &&
      targetLevel5 === 1 &&
      targetLevel67 === 1
    );
  };

  const summarizeTargetAvailability = (pool: AnalyzedProblem[]) => {
    const counts = {
      Algebraic: 0,
      Probability: 0,
      'Number Theory': 0,
      Geometry: 0
    };
    const diffs: Record<string, number> = {};

    pool.forEach(p => {
      const cat = getConsolidatedCategory(p.category);
      if (cat === 'Algebraic') counts.Algebraic += 1;
      else if (cat === 'Probability') counts.Probability += 1;
      else if (cat === 'Number Theory') counts['Number Theory'] += 1;
      else if (cat === 'Plane Geometry' || cat === 'Solid Geometry' || cat === 'Coordinate Geometry') counts.Geometry += 1;
      diffs[String(p.difficulty)] = (diffs[String(p.difficulty)] || 0) + 1;
    });

    const lvl4 = diffs['4'] || 0;
    const lvl5 = diffs['5'] || 0;
    const lvl67 = (diffs['6'] || 0) + (diffs['7'] || 0);

    return `Available Workouts: Alg ${counts.Algebraic}, Prob ${counts.Probability}, NumTheory ${counts['Number Theory']}, Geometry ${counts.Geometry} | L4 ${lvl4}, L5 ${lvl5}, L6/7 ${lvl67}`;
  };

  const summarizeSprintAvailability = (pool: AnalyzedProblem[]) => {
    const counts = {
      Algebraic: 0,
      Probability: 0,
      'Number Theory': 0,
      Geometry: 0,
      Other: 0
    };
    const diffs: Record<string, number> = {};

    pool.forEach(p => {
      const cat = getConsolidatedCategory(p.category);
      if (cat === 'Algebraic') counts.Algebraic += 1;
      else if (cat === 'Probability') counts.Probability += 1;
      else if (cat === 'Number Theory') counts['Number Theory'] += 1;
      else if (cat === 'Plane Geometry' || cat === 'Solid Geometry' || cat === 'Coordinate Geometry') counts.Geometry += 1;
      else counts.Other += 1;
      diffs[String(p.difficulty)] = (diffs[String(p.difficulty)] || 0) + 1;
    });

    const low = (diffs['1'] || 0) + (diffs['2'] || 0) + (diffs['3'] || 0);
    const lvl4 = diffs['4'] || 0;
    const lvl5 = diffs['5'] || 0;
    const lvl6 = diffs['6'] || 0;
    const lvl67 = (diffs['6'] || 0) + (diffs['7'] || 0);

    return `Available non-Workouts + Workouts(L2/L3): Alg ${counts.Algebraic}, Prob ${counts.Probability}, NumTheory ${counts['Number Theory']}, Geometry ${counts.Geometry}, Other ${counts.Other} | L1-3 ${low}, L4 ${lvl4}, L5 ${lvl5}, L6 ${lvl6}, L6/7 ${lvl67}`;
  };

  const finalizeQuiz = async () => {
    if (draft.length === 0) return;
    const sprintDraft = draft.filter(d => d.type === 'Sprint');
    const targetDraft = draft.filter(d => d.type === 'Target');

    if (isStrictSprintRequested && sprintDraft.length > 0) {
      if (!validateStrictSprint(sprintDraft)) {
        alert("Sprint draft does not meet strict constraints. Please regenerate the draft.");
        return;
      }
    }

    if (isStrictTargetRequested && targetDraft.length > 0) {
      if (!validateStrictTarget(targetDraft)) {
        alert("Target draft does not meet strict constraints. Please regenerate the draft.");
        return;
      }
    }

    setLoading(true);
    try {
      const draftMap = new Map<string, QuizDraft>(draft.map(d => [getProblemKey(d.problem), d]));
      const updatedProblems: AnalyzedProblem[] = [];

      setResults(prev => prev.map(p => {
        const draftItem = draftMap.get(getProblemKey(p));
        if (draftItem) {
          const updated = { ...p, isUsed: true, quiz: `Quiz ${quizNum}`, quizNumber: `${draftItem.type[0].toLowerCase()}${draftItem.index}` };
          updatedProblems.push(updated);
          return updated;
        }
        return p;
      }));

      if (updatedProblems.length > 0) {
        const batch = writeBatch(db);
        updatedProblems.forEach(p => {
          const key = getProblemKey(p);
          // merge: true natively updates only the mutated fields on Google Cloud
          batch.set(doc(db, 'problems', key), {
            isUsed: p.isUsed,
            quiz: p.quiz,
            quizNumber: p.quizNumber
          }, { merge: true });
        });
        await batch.commit();
      }

      setDraft([]);
      setRules([]);
      setView('data');
      alert(`Successfully finalized Quiz ${quizNum} globally!`);
    } catch (err) {
      console.error("Failed to sync generated quiz to Firestore", err);
      alert("Failed to sync generated quiz to Google Cloud.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMultiSelect = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) setter(current.filter(i => i !== item));
    else setter([...current, item]);
  };

  const filteredResults = results.filter(r =>
    r.problemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.problemSet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.quiz || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.quizNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedResults = useMemo(() => {
    const copy = [...filteredResults];
    copy.sort((a, b) => {
      const aNum = parseInt(a.problemId, 10);
      const bNum = parseInt(b.problemId, 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.problemId.localeCompare(b.problemId);
    });
    return copy;
  }, [filteredResults]);

  const draftSummary = useMemo(() => {
    if (draft.length === 0) return null;
    const summary = {
      Sprint: {} as Record<string, { count: number, diffs: Record<string, number> }>,
      Target: {} as Record<string, { count: number, diffs: Record<string, number> }>
    };
    draft.forEach(d => {
      const type = d.type;
      const cat = getConsolidatedCategory(d.problem.category);
      const diff = d.problem.difficulty;
      if (!summary[type][cat]) summary[type][cat] = { count: 0, diffs: {} };
      summary[type][cat].count += 1;
      summary[type][cat].diffs[diff] = (summary[type][cat].diffs[diff] || 0) + 1;
    });
    return summary;
  }, [draft]);

  const strictValidation = useMemo(() => {
    const sprintDraft = draft.filter(d => d.type === 'Sprint');
    const targetDraft = draft.filter(d => d.type === 'Target');
    return {
      sprintOk: !isStrictSprintRequested || validateStrictSprint(sprintDraft),
      targetOk: !isStrictTargetRequested || validateStrictTarget(targetDraft)
    };
  }, [draft, isStrictSprintRequested, isStrictTargetRequested]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">
      <input type="file" ref={uploadInputRef} multiple accept="application/pdf" className="hidden" onChange={handleFileChange} />

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <DocumentTextIcon className="w-10 h-10 text-indigo-600" />
            Mathcounts Lab
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl">
            Analyze handbooks and transform them into automated, difficulty-sorted quizzes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm grow lg:grow-0">
            <button onClick={() => setView('data')} className={`flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${view === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Ledger</button>
            <button disabled={results.length === 0} onClick={() => setView('factory')} className={`flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${view === 'factory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}>Quiz Factory</button>
          </div>
        </div>
      </header>

      {view === 'data' ? (
        <>
          <div className="max-w-3xl mx-auto">
            <section className={`relative group border-4 border-dashed rounded-[2.5rem] p-10 text-center bg-white ${files.length > 0 ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-400'}`}>
              <div className="flex flex-col items-center">
                <CloudArrowUpIcon className={`w-12 h-12 mb-4 ${files.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <h3 className="font-bold text-slate-800">
                  {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''} selected` : 'Drop Handbook PDFs'}
                </h3>
                <p className="text-xs text-slate-400 mb-6 italic">Uses AI to natively extract questions and push them safely to Google Cloud</p>
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-[10px] font-black uppercase text-slate-400">Year</label>
                  <input
                    type="text"
                    value={uploadYear}
                    onChange={e => setUploadYear(e.target.value)}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); uploadInputRef.current?.click(); }}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Select PDFs
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); analyzePdf(); }} disabled={files.length === 0 || loading} className="relative z-20 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:bg-slate-200 transition-all">{loading ? 'Analyzing...' : 'Process Handbooks'}</button>
                </div>
              </div>
            </section>
          </div>

          {results.length > 0 && (
            <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full relative">
                  <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Filter by ID, Set, Category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-16 pr-8 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm" />
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowClearConfirm(true)} className="text-red-500 text-sm font-bold flex items-center gap-2 hover:underline"><TrashIcon className="w-4 h-4" /> Clear All</button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Problem Set</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Difficulty</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Year</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Quiz</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Q#</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedResults.map((resultItem: AnalyzedProblem) => (
                        <tr key={`${resultItem.problemId}-${resultItem.year || ''}`} className={`hover:bg-slate-50 transition-colors ${resultItem.isUsed ? 'bg-slate-50/50 opacity-60' : ''}`}>
                          <td className="px-6 py-4 font-black text-slate-900">{resultItem.problemId}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{resultItem.problemSet}</td>
                          <td className="px-6 py-4"><span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{getConsolidatedCategory(resultItem.category)}</span></td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-400">{resultItem.difficulty}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{resultItem.year || ''}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{resultItem.quiz || ''}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{resultItem.quizNumber || ''}</td>
                          <td className="px-6 py-4 text-xs">
                            {resultItem.isUsed ? (
                              <span className="text-emerald-500 flex items-center gap-1 font-black uppercase"><CheckCircleIcon className="w-4 h-4" /> Used</span>
                            ) : (
                              <span className="text-slate-300 font-black uppercase">Available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                  <span>Total Rows: {filteredResults.length}</span>
                  <span>Ledger Size: {results.length}</span>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <section className="space-y-8">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2"><WrenchScrewdriverIcon className="w-6 h-6 text-indigo-600" /> Assignment Info</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setAssignmentType('Quiz')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${assignmentType === 'Quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Quiz</button>
                      <button onClick={() => setAssignmentType('School Round')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${assignmentType === 'School Round' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>School Round</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Round Number</label>
                    <input
                      type="number"
                      value={quizNum}
                      onChange={e => {
                        setQuizNum(e.target.value);
                        setQuizNumAuto(false);
                      }}
                      className="w-full bg-slate-50 border rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button onClick={setupQuickQuiz} className="w-full flex items-center justify-center gap-1 px-3 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-colors"><RocketLaunchIcon className="w-3 h-3" /> Quick Setup</button>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Rules</label>
                      <button onClick={() => setShowRuleModal(true)} className="text-indigo-600 font-bold text-xs hover:underline">+ Add</button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border group">
                          <div className="text-[10px] space-y-1">
                            <div>
                              <span className={`font-black mr-2 ${rule.type === 'Sprint' ? 'text-indigo-600' : 'text-teal-600'}`}>{rule.type}</span>
                              <span className="text-slate-600 font-medium">
                                {rule.categories[0] === 'STRICT_MC_COMPLIANT'
                                  ? 'Target Constraints (Workouts Only)'
                                  : rule.categories[0] === 'STRICT_SPRINT_COMPLIANT'
                                    ? 'Sprint Constraints (Non-Workouts)'
                                    : `[${rule.categories.join(',')}]`}
                              </span>
                            </div>
                            {rule.categories[0] === 'STRICT_MC_COMPLIANT' ? (
                              <div className="text-slate-500 font-medium">
                                Categories: Algebraic, Probability, Number Theory, Geometry (Plane/Coordinate/Solid)
                                <span className="mx-1">|</span>
                                Difficulty: 2x L4, 1x L5, 1x L6/7
                              </div>
                            ) : rule.categories[0] === 'STRICT_SPRINT_COMPLIANT' ? (
                              <div className="text-slate-500 font-medium">
                                Categories: 3x each of Algebraic, Probability, Number Theory, Geometry (Plane/Coordinate/Solid) + 3x from Other (Proportional/Sequences/Statistics/Misc)
                                <span className="mx-1">|</span>
                                Difficulty: 5x L1-3, 5x L4, 3x L5, 1x L6, 1x L6/7
                                <span className="mx-1">|</span>
                                Sets: All except Workouts (Workouts allowed only for L2/L3)
                              </div>
                            ) : (
                              <div className="text-slate-500 font-medium">
                                {rule.problemSets.length > 0 ? `Sets: ${rule.problemSets.join(', ')}` : 'Sets: Any'}
                                <span className="mx-1">|</span>
                                {rule.difficulties.length > 0 ? `Diff: ${rule.difficulties.join(', ')}` : 'Diff: Any'}
                                <span className="mx-1">|</span>
                                Count: {rule.count}
                              </div>
                            )}
                          </div>
                          <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="text-slate-300 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={generateDraft} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><SparklesIcon className="w-5 h-5" /> Generate Draft</button>
              </div>
            </section>

            <section className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black flex items-center gap-3"><BeakerIcon className="w-8 h-8 text-indigo-600" /> Proposed Draft</h3>
                {draft.length > 0 && (
                  <button
                    onClick={finalizeQuiz}
                    disabled={!strictValidation.sprintOk || !strictValidation.targetOk}
                    className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
                    title={!strictValidation.sprintOk || !strictValidation.targetOk ? 'Draft does not meet strict constraints' : ''}
                  >
                    Finalize Draft
                  </button>
                )}
              </div>

              {(generationError || debugSprint.length > 0 || debugTarget.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-xs font-black uppercase text-amber-700 mb-2">Generation Debug</div>
                  {generationError && (
                    <div className="text-[11px] text-amber-900 font-medium mb-3">
                      {generationError}
                    </div>
                  )}
                  {debugSprint.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10px] font-black text-amber-700 uppercase mb-2">Sprint Last Attempt</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead>
                            <tr className="text-amber-700">
                              <th className="py-1 pr-3">ID</th>
                              <th className="py-1 pr-3">Diff</th>
                              <th className="py-1 pr-3">Category</th>
                              <th className="py-1 pr-3">Set</th>
                            </tr>
                          </thead>
                          <tbody>
                            {debugSprint.map(row => (
                              <tr key={`s-${row.id}`} className="text-amber-900">
                                <td className="py-0.5 pr-3 font-black">{row.id}</td>
                                <td className="py-0.5 pr-3">{row.diff}</td>
                                <td className="py-0.5 pr-3">{row.category}</td>
                                <td className="py-0.5 pr-3">{row.set}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {debugTarget.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-amber-700 uppercase mb-2">Target Last Attempt</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead>
                            <tr className="text-amber-700">
                              <th className="py-1 pr-3">ID</th>
                              <th className="py-1 pr-3">Diff</th>
                              <th className="py-1 pr-3">Category</th>
                              <th className="py-1 pr-3">Set</th>
                            </tr>
                          </thead>
                          <tbody>
                            {debugTarget.map(row => (
                              <tr key={`t-${row.id}`} className="text-amber-900">
                                <td className="py-0.5 pr-3 font-black">{row.id}</td>
                                <td className="py-0.5 pr-3">{row.diff}</td>
                                <td className="py-0.5 pr-3">{row.category}</td>
                                <td className="py-0.5 pr-3">{row.set}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {draft.map((draftItem, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${draftItem.type === 'Sprint' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                        {draftItem.type[0]}{draftItem.index}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black text-slate-400">ID: {draftItem.problem.problemId} | Diff: {draftItem.problem.difficulty} | Year: {draftItem.problem.year || '2526'}</span>
                          <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{getConsolidatedCategory(draftItem.problem.category)}</span>
                        </div>
                        <p className="text-slate-800 font-medium text-sm line-clamp-1 italic">{draftItem.problem.problemSet}</p>
                      </div>
                    </div>
                    <button onClick={() => swapQuestion(getProblemKey(draftItem.problem))} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all" title="Swap Question">
                      <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {draft.length === 0 && (
                  <div className="py-32 text-center text-slate-400 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="font-bold">Set rules and click Generate Draft</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {draftSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-6">
              <div className="bg-indigo-950 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <h4 className="text-xl font-black uppercase tracking-widest text-indigo-200 mb-6">Sprint Composition</h4>
                <div className="space-y-4">
                  {/* Cast stats to any to avoid TypeScript unknown type errors during Object.entries mapping */}
                  {Object.entries(draftSummary.Sprint).map(([cat, stats]: [string, any]) => (
                    <div key={cat} className="bg-indigo-900/50 p-4 rounded-2xl border border-indigo-800">
                      <div className="flex justify-between mb-2"><span className="font-black text-sm">{cat}</span><span className="text-xs">{stats.count}x</span></div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(stats.diffs as Record<string, number>).map(([d, c]) => <span key={d} className="bg-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold">LV{d}: {c}x</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-teal-950 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <h4 className="text-xl font-black uppercase tracking-widest text-teal-200 mb-6">Target Composition</h4>
                <div className="space-y-4">
                  {/* Cast stats to any to avoid TypeScript unknown type errors during Object.entries mapping */}
                  {Object.entries(draftSummary.Target).map(([cat, stats]: [string, any]) => (
                    <div key={cat} className="bg-teal-900/50 p-4 rounded-2xl border border-teal-800">
                      <div className="flex justify-between mb-2"><span className="font-black text-sm">{cat}</span><span className="text-xs">{stats.count}x</span></div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(stats.diffs as Record<string, number>).map(([d, c]) => <span key={d} className="bg-teal-800 px-2 py-0.5 rounded text-[9px] font-bold">LV{d}: {c}x</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Add Selection Rule</h3>
            <div className="space-y-6">
              <div className="flex gap-2">{['Sprint', 'Target'].map(t => <button key={t} onClick={() => setNewRuleType(t as any)} className={`flex-1 py-3 rounded-xl font-bold border-2 ${newRuleType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>{t}</button>)}</div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Categories</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border">{categoriesList.map(c => (<label key={c} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"><input type="checkbox" checked={newRuleCategories.includes(c)} onChange={() => toggleMultiSelect(c, newRuleCategories, setNewRuleCategories)} className="rounded text-indigo-600" /><span className="text-xs font-bold text-slate-500">{c}</span></label>))}</div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Difficulties</label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(d => (<label key={d} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"><input type="checkbox" checked={newRuleDifficulties.includes(d)} onChange={() => toggleMultiSelect(d, newRuleDifficulties, setNewRuleDifficulties)} className="rounded text-indigo-600" /><span className="text-xs font-bold text-slate-500">{d}</span></label>))}</div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Quantity</label><input type="number" value={newRuleCount} onChange={e => setNewRuleCount(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border rounded-xl p-4 font-bold text-sm outline-none" /></div>
              <div className="flex gap-4 pt-4"><button onClick={() => setShowRuleModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button><button onClick={addRule} className="flex-2 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg">Save Rule</button></div>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-sm rounded-[2rem] shadow-2xl p-10 text-center">
            <h3 className="text-xl font-black text-slate-900 mb-2">Wipe Ledger?</h3>
            <p className="text-slate-500 text-sm mb-8">This will delete all analyzed problems from the Google Cloud collection permanently across all devices.</p>
            <div className="flex gap-3"><button onClick={() => setShowClearConfirm(false)} className="flex-1 py-4 font-bold text-slate-500">Cancel</button><button onClick={clearResults} className="flex-1 py-4 font-black text-white bg-red-500 rounded-2xl">Delete All</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalyzer;
