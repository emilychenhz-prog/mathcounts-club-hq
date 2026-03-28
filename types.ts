export enum UserRole {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST'
}

export enum RoundType {
  SPRINT = 'SPRINT',
  TARGET = 'TARGET',
  TEAM = 'TEAM',
  COUNTDOWN = 'COUNTDOWN'
}

export enum Difficulty {
  SCHOOL = 'SCHOOL',
  CHAPTER = 'CHAPTER',
  STATE = 'STATE',
  NATIONAL = 'NATIONAL'
}

export interface Problem {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  round: RoundType;
  category: string;
}

export interface AnalyzedProblem {
  problemId: string;
  problemSet: string;
  category: string;
  difficulty: string;
  ccssMapping: string;
  year?: string;
  answer?: string;
  quiz?: string;
  quizNumber?: string;
  isUsed?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export type MathLevel = 'Alg 1' | 'Geo' | 'Alg 2' | 'PreCal';

export interface AssessmentColumn {
  id: string;
  title: string;
  type: 'Quiz' | 'School Round';
}

export interface StudentStats {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  grade: string;
  mathLevel: MathLevel;
  gender: string;
  tryoutScore: number;
  problemsSolved: number;
  badges: Badge[];
  // Dynamic scores indexed by AssessmentColumn.id
  dynamicScores?: Record<string, number>;
}

export interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  content: string;
  isDayA: boolean;
  coach: string;
}

export interface SessionData {
  role: UserRole;
  userName: string;
}
