import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'user';
  avatar?: string;
  targetExam?: string;
  authProvider?: 'password' | 'google';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatar: { type: String },
    targetExam: { type: String, default: 'Job Preparation' },
    authProvider: { type: String, enum: ['password', 'google'], default: 'password' },
    googleId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
