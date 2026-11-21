import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface IUserAnswer {
  questionId: number;
  selectedOption: number | null;
  isMarkedForReview: boolean;
}

export interface IExamSession extends Document {
  userId?: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Job-Exam Standard';
  negativeMarking: number;
  totalQuestions: number;
  timeLimitSeconds: number;
  questions: IMCQQuestion[];
  status: 'pending' | 'in_progress' | 'completed';
  userAnswers: IUserAnswer[];
  score: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  createdAt: Date;
  completedAt?: Date;
}

const MCQQuestionSchema = new Schema<IMCQQuestion>({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true },
});

const UserAnswerSchema = new Schema<IUserAnswer>({
  questionId: { type: Number, required: true },
  selectedOption: { type: Number, default: null },
  isMarkedForReview: { type: Boolean, default: false },
});

const ExamSessionSchema = new Schema<IExamSession>(
  {
    userId: { type: String, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Job-Exam Standard'],
      default: 'Job-Exam Standard',
    },
    negativeMarking: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    timeLimitSeconds: { type: Number, required: true },
    questions: [MCQQuestionSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    userAnswers: [UserAnswerSchema],
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const ExamSession: Model<IExamSession> =
  mongoose.models.ExamSession || mongoose.model<IExamSession>('ExamSession', ExamSessionSchema);

export default ExamSession;
