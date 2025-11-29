import { getRedisClient } from './redis.service';

// In-memory queue as fallback
const inMemoryQueue: any[] = [];

// Job queue service implementation
export async function setupJobQueue(): Promise<void> {
  console.log('⚡ Job queue setup...');
  
  const redisClient = getRedisClient();
  if (redisClient) {
    console.log('✅ Job queue using Redis');
  } else {
    console.log('✅ Job queue using in-memory storage');
  }
}

export async function addJobToQueue(job: any): Promise<void> {
  const redisClient = getRedisClient();
  
  if (redisClient) {
    // Use Redis for job queue
    await redisClient.lPush('audit_jobs', JSON.stringify(job));
  } else {
    // Use in-memory queue as fallback
    inMemoryQueue.push(job);
  }
}

export async function getJobFromQueue(): Promise<any> {
  const redisClient = getRedisClient();
  
  if (redisClient) {
    // Use Redis for job queue
    const job = await redisClient.rPop('audit_jobs');
    return job ? JSON.parse(job) : null;
  } else {
    // Use in-memory queue as fallback
    return inMemoryQueue.shift() || null;
  }
}

export async function getQueueLength(): Promise<number> {
  const redisClient = getRedisClient();
  
  if (redisClient) {
    return await redisClient.lLen('audit_jobs');
  } else {
    return inMemoryQueue.length;
  }
}
