import { NextResponse } from 'next/server';
import { connectToDatabase, getMongoConnectionState, isMongoConfigured } from '@/lib/mongodb';
import { isGeminiConfigured } from '@/lib/gemini';
import { memoryStore } from '@/lib/store';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET() {
  const mongoConfigured = isMongoConfigured();
  const geminiConfigured = isGeminiConfigured();

  let mongoLive = false;
  let mongoError: string | null = null;

  if (mongoConfigured) {
    try {
      const conn = await connectToDatabase();
      if (conn && mongoose.connection.readyState === 1) {
        mongoLive = true;
      }
    } catch (e: any) {
      mongoError = e.message;
    }
  }

  const { stateText } = getMongoConnectionState();

  const exams = memoryStore.getAllExams();
  const written = memoryStore.getAllWritten();
  const revision = memoryStore.getAllRevision();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: {
      configured: mongoConfigured,
      connected: mongoLive,
      stateText: mongoLive ? 'Connected to MongoDB Atlas' : stateText,
      error: mongoError,
    },
    gemini: {
      configured: geminiConfigured,
      model: 'gemini-2.5-flash',
      mode: geminiConfigured ? 'Live Multimodal AI' : 'Smart Demo Generator (Fallbacks Active)',
    },
    storeStats: {
      examsCount: exams.length,
      writtenCount: written.length,
      revisionCount: revision.length,
    },
  });
}
