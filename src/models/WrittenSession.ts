import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWrittenQuestion {
  id: number;
  question: string;
  marks: number;
  modelAnswer: string;
  keyPoints: string[];
  status: 'Not Practiced' | 'Needs Review' | 'Mastered';
}

export interface IWrittenSession extends Document {
  userId?: string;
  subject: string;
  topic: string;
  questionMix: 'Short Answer' | 'Broad/Descriptive' | 'Problem-Solving';
  totalQuestions: number;
  questions: IWrittenQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const WrittenQuestionSchema = new Schema<IWrittenQuestion>({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  marks: { type: Number, required: true, default: 5 },
  modelAnswer: { type: String, required: true },
  keyPoints: [{ type: String }],
  status: {
    type: String,
    enum: ['Not Practiced', 'Needs Review', 'Mastered'],
    default: 'Not Practiced',
  },
});

const WrittenSessionSchema = new Schema<IWrittenSession>(
  {
    userId: { type: String, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    questionMix: {
      type: String,
      enum: ['Short Answer', 'Broad/Descriptive', 'Problem-Solving'],
      default: 'Broad/Descriptive',
    },
    totalQuestions: { type: Number, required: true },
    questions: [WrittenQuestionSchema],
  },
  {
    timestamps: true,
  }
);

export const WrittenSession: Model<IWrittenSession> =
  mongoose.models.WrittenSession ||
  mongoose.model<IWrittenSession>('WrittenSession', WrittenSessionSchema);

export default WrittenSession;
