import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let connectionAttempted = false;

// Redis service implementation - NO RETRIES, SINGLE ATTEMPT ONLY
export async function connectToRedis(): Promise<void> {
  if (connectionAttempted) {
    return; // Prevent multiple connection attempts
  }
  
  connectionAttempted = true;
  
  const redisUrl = process.env.REDIS_URL;
  
  // Skip Redis connection if URL not provided
  if (!redisUrl) {
    console.log('📮 Redis URL not configured, using in-memory queue');
    redisClient = null;
    return;
  }
  
  try {
    console.log('📮 Connecting to Redis...');
    
    // Create client with short timeout and NO event listeners that loop
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 2000
      }
    });
    
    // CRITICAL: Wrap connection in Promise.race to enforce timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 3000)
      )
    ]);
    
    console.log('✅ Redis connected successfully');
    
  } catch (error) {
    console.log('⚠️  Redis connection failed, using in-memory queue');
    redisClient = null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient || null;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
}
