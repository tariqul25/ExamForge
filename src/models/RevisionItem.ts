import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevisionItem extends Document {
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
  createdAt: Date;
}

const RevisionItemSchema = new Schema<IRevisionItem>(
  {
    type: { type: String, enum: ['mcq', 'written'], required: true, index: true },
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    sessionId: { type: String, required: true },
    questionId: { type: Number, required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    userAnswer: { type: Number, default: null },
    correctAnswer: { type: Number },
    explanation: { type: String },
    marks: { type: Number },
    modelAnswer: { type: String },
    keyPoints: [{ type: String }],
    isMastered: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const RevisionItem: Model<IRevisionItem> =
  mongoose.models.RevisionItem ||
  mongoose.model<IRevisionItem>('RevisionItem', RevisionItemSchema);

export default RevisionItem;
