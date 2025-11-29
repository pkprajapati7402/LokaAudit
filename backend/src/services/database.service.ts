import { MongoClient, Db } from 'mongodb';

let db: Db;
let client: MongoClient;

// Database service implementation
export async function connectToDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lokaaudit-backend';
    console.log('🗄️  Connecting to MongoDB...');
    
    client = new MongoClient(mongoUri);
    await client.connect();
    
    // Extract database name from URI or use default
    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'lokaaudit-backend';
    db = client.db(dbName);
    
    // Test connection
    await db.admin().ping();
    console.log('✅ MongoDB connected successfully');
    
  } catch (error) {
    console.log('⚠️  MongoDB connection failed, using in-memory storage');
    console.log('   To use MongoDB: Install MongoDB and set MONGODB_URI in .env');
  }
}

export function getDatabase(): Db | null {
  return db || null;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}
