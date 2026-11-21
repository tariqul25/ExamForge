export type SubjectType =
  | 'Bangla'
  | 'English'
  | 'Mathematics'
  | 'General Knowledge'
  | 'Computer Science / IT'
  | string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  targetExam?: string;
  createdAt?: string;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number | null;
  isMarkedForReview: boolean;
}

export interface ExamSessionData {
  _id: string;
  userId?: string;
  isGuest?: boolean;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Job-Exam Standard';
  negativeMarking: number;
  totalQuestions: number;
  timeLimitSeconds: number;
  questions: MCQQuestion[];
  status: 'pending' | 'in_progress' | 'completed';
  userAnswers: UserAnswer[];
  score: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  createdAt: string;
  completedAt?: string;
}

export interface WrittenQuestion {
  id: number;
  question: string;
  marks: number;
  modelAnswer: string;
  keyPoints: string[];
  status: 'Not Practiced' | 'Needs Review' | 'Mastered';
}

export interface WrittenSessionData {
  _id: string;
  userId?: string;
  isGuest?: boolean;
  subject: string;
  topic: string;
  questionMix: 'Short Answer' | 'Broad/Descriptive' | 'Problem-Solving';
  totalQuestions: number;
  questions: WrittenQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface RevisionItemData {
  _id: string;
  userId?: string;
  type: 'mcq' | 'written';
  subject: string;
  topic: string;
  sessionId: string;
  questionId: number;
  question: string;
  options?: string[];
  userAnswer?: number | null;
  correctAnswer?: number;
  explanation?: string;
  marks?: number;
  modelAnswer?: string;
  keyPoints?: string[];
  isMastered: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalExamsTaken: number;
  overallAccuracy: number;
  studyStreakDays: number;
  totalQuestionsSolved: number;
  isGuestUser?: boolean;
  subjectPerformance: {
    subject: string;
    accuracy: number;
    totalExams: number;
    color: string;
  }[];
  scoreTrend: {
    date: string;
    score: number;
    accuracy: number;
    topic: string;
    subject: string;
  }[];
  weaknessAreas: {
    subject: string;
    topic: string;
    accuracy: number;
    recommendedAction: string;
  }[];
  recentHistory: {
    id: string;
    type: 'mcq' | 'written';
    subject: string;
    topic: string;
    date: string;
    scoreText: string;
    status: string;
  }[];
}
