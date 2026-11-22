import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(uri && uri.trim() !== '' && !uri.includes('YOUR_MONGODB_ATLAS_URI_HERE'));
}

let lastFailureTime = 0;
const RETRY_INTERVAL_MS = 60000;

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  let uri = process.env.MONGODB_URI;

  if (!isMongoConfigured() || !uri) {
    return null;
  }

  // Ensure default database name if missing
  if (uri.endsWith('/')) {
    uri = uri + 'examforge?retryWrites=true&w=majority';
  }

  // If previous connection attempt failed, do not block UI with repeated timeouts
  if (Date.now() - lastFailureTime < RETRY_INTERVAL_MS) {
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1200,
      connectTimeoutMS: 1500,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      lastFailureTime = 0;
      return m;
    }).catch((err) => {
      cached.promise = null;
      lastFailureTime = Date.now();
      console.warn('MongoDB connection failed, falling back to local memory store:', err.message);
      return null;
    });
  }

  try {
    const conn = await cached.promise;
    cached.conn = conn;
    return conn;
  } catch (e) {
    cached.promise = null;
    lastFailureTime = Date.now();
    return null;
  }
}

export function getMongoConnectionState(): { isConnected: boolean; stateText: string } {
  if (!isMongoConfigured()) {
    return { isConnected: false, stateText: 'Not configured (using local store)' };
  }
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return { isConnected: true, stateText: 'Connected to MongoDB Atlas' };
    case 2:
      return { isConnected: false, stateText: 'Connecting...' };
    default:
      return { isConnected: false, stateText: 'Disconnected' };
  }
}
