// Database Models for Test Case System
import { MongoClient, Db, Collection } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import {
  TestSession,
  TestCase,
  TestResult,
  AuditLog,
  TestSessionStatus,
  TestCaseStatus,
  TestResultStatus,
  AuditAction
} from '../types/test-types';

let cachedCollections: {
  testSessions?: Collection<TestSession>;
  testCases?: Collection<TestCase>;
  testResults?: Collection<TestResult>;
  auditLogs?: Collection<AuditLog>;
} = {};

async function getCollections() {
  if (Object.keys(cachedCollections).length === 4) {
    return cachedCollections;
  }

  const { db } = await connectToDatabase();
  
  cachedCollections = {
    testSessions: db.collection<TestSession>('test_sessions'),
    testCases: db.collection<TestCase>('test_cases'),
    testResults: db.collection<TestResult>('test_results'),
    auditLogs: db.collection<AuditLog>('audit_logs')
  };

  // Create indexes for better performance
  await createIndexes(cachedCollections);
  
  return cachedCollections;
}

async function createIndexes(collections: typeof cachedCollections) {
  try {
    // Test Sessions indexes
    await collections.testSessions!.createIndex({ sessionId: 1 }, { unique: true });
    await collections.testSessions!.createIndex({ projectId: 1 });
    await collections.testSessions!.createIndex({ developerId: 1 });
    await collections.testSessions!.createIndex({ status: 1 });
    await collections.testSessions!.createIndex({ createdAt: -1 });

    // Test Cases indexes
    await collections.testCases!.createIndex({ sessionId: 1 });
    await collections.testCases!.createIndex({ testId: 1 }, { unique: true });
    await collections.testCases!.createIndex({ fileName: 1 });
    await collections.testCases!.createIndex({ testType: 1 });
    await collections.testCases!.createIndex({ status: 1 });

    // Test Results indexes
    await collections.testResults!.createIndex({ sessionId: 1 });
    await collections.testResults!.createIndex({ testId: 1 });
    await collections.testResults!.createIndex({ testCaseId: 1 });
    await collections.testResults!.createIndex({ status: 1 });
    await collections.testResults!.createIndex({ timestamp: -1 });

    // Audit Logs indexes
    await collections.auditLogs!.createIndex({ sessionId: 1 });
    await collections.auditLogs!.createIndex({ userId: 1 });
    await collections.auditLogs!.createIndex({ action: 1 });
    await collections.auditLogs!.createIndex({ timestamp: -1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.warn('Some indexes may already exist:', error);
  }
}

// Test Session Operations
export async function createTestSession(sessionData: Omit<TestSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<TestSession> {
  const { testSessions } = await getCollections();
  
  const session: TestSession = {
    ...sessionData,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await testSessions!.insertOne(session);
  return { ...session, _id: result.insertedId.toString() };
}

export async function getTestSession(sessionId: string): Promise<TestSession | null> {
  const { testSessions } = await getCollections();
  return await testSessions!.findOne({ sessionId });
}

export async function updateTestSessionStatus(
  sessionId: string, 
  status: TestSessionStatus, 
  errorMessage?: string
): Promise<void> {
  const { testSessions } = await getCollections();
  
  const updateData: any = {
    status,
    updatedAt: new Date()
  };
  
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await testSessions!.updateOne(
    { sessionId }, 
    { $set: updateData }
  );
}

export async function getTestSessionsByProject(projectId: string): Promise<TestSession[]> {
  const { testSessions } = await getCollections();
  return await testSessions!.find({ projectId }).sort({ createdAt: -1 }).toArray();
}

export async function getTestSessionsByDeveloper(developerId: string): Promise<TestSession[]> {
  const { testSessions } = await getCollections();
  return await testSessions!.find({ developerId }).sort({ createdAt: -1 }).toArray();
}

// Test Case Operations
export async function saveTestCases(testCases: Omit<TestCase, '_id'>[]): Promise<TestCase[]> {
  const { testCases: collection } = await getCollections();
  
  const casesWithTimestamp = testCases.map(testCase => ({
    ...testCase,
    createdAt: new Date()
  }));

  const result = await collection!.insertMany(casesWithTimestamp);
  
  return casesWithTimestamp.map((testCase, index) => ({
    ...testCase,
    _id: result.insertedIds[index].toString()
  }));
}

export async function getTestCasesBySession(sessionId: string): Promise<TestCase[]> {
  const { testCases } = await getCollections();
  return await testCases!.find({ sessionId }).sort({ createdAt: 1 }).toArray();
}

export async function getTestCase(testId: string): Promise<TestCase | null> {
  const { testCases } = await getCollections();
  return await testCases!.findOne({ testId });
}

export async function updateTestCaseStatus(
  testId: string, 
  status: TestCaseStatus, 
  executionTime?: number, 
  errorMessage?: string
): Promise<void> {
  const { testCases } = await getCollections();
  
  const updateData: any = { status };
  
  if (executionTime !== undefined) {
    updateData.executionTime = executionTime;
  }
  
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await testCases!.updateOne(
    { testId }, 
    { $set: updateData }
  );
}

// Test Result Operations
export async function saveTestResults(results: Omit<TestResult, '_id'>[]): Promise<TestResult[]> {
  const { testResults } = await getCollections();
  
  const resultsWithTimestamp = results.map(result => ({
    ...result,
    timestamp: new Date()
  }));

  const insertResult = await testResults!.insertMany(resultsWithTimestamp);
  
  return resultsWithTimestamp.map((result, index) => ({
    ...result,
    _id: insertResult.insertedIds[index].toString()
  }));
}

export async function getTestResultsBySession(sessionId: string): Promise<TestResult[]> {
  const { testResults } = await getCollections();
  return await testResults!.find({ sessionId }).sort({ timestamp: 1 }).toArray();
}

export async function getTestResultsByTestCase(testCaseId: string): Promise<TestResult[]> {
  const { testResults } = await getCollections();
  return await testResults!.find({ testCaseId }).sort({ timestamp: -1 }).toArray();
}

// Audit Log Operations
export async function logAuditAction(
  sessionId: string,
  userId: string,
  action: AuditAction,
  details: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const { auditLogs } = await getCollections();
  
  const auditLog: AuditLog = {
    sessionId,
    userId,
    action,
    details,
    timestamp: new Date(),
    ipAddress,
    userAgent
  };

  await auditLogs!.insertOne(auditLog);
}

export async function getAuditLogs(
  sessionId?: string,
  userId?: string,
  action?: AuditAction,
  limit: number = 100
): Promise<AuditLog[]> {
  const { auditLogs } = await getCollections();
  
  const filter: any = {};
  if (sessionId) filter.sessionId = sessionId;
  if (userId) filter.userId = userId;
  if (action) filter.action = action;

  return await auditLogs!.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Cleanup Operations
export async function cleanupOldSessions(olderThanDays: number = 30): Promise<number> {
  const { testSessions, testCases, testResults, auditLogs } = await getCollections();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  // Get session IDs to delete
  const sessionsToDelete = await testSessions!.find(
    { createdAt: { $lt: cutoffDate } },
    { projection: { sessionId: 1 } }
  ).toArray();
  
  const sessionIds = sessionsToDelete.map(s => s.sessionId);
  
  if (sessionIds.length === 0) {
    return 0;
  }

  // Delete related data
  await Promise.all([
    testCases!.deleteMany({ sessionId: { $in: sessionIds } }),
    testResults!.deleteMany({ sessionId: { $in: sessionIds } }),
    auditLogs!.deleteMany({ sessionId: { $in: sessionIds } }),
    testSessions!.deleteMany({ sessionId: { $in: sessionIds } })
  ]);

  console.log(`Cleaned up ${sessionIds.length} old test sessions`);
  return sessionIds.length;
}

// Analytics and Metrics
export async function getSessionMetrics(developerId?: string): Promise<{
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  avgTestsPerSession: number;
  avgExecutionTime: number;
  testTypeDistribution: Record<string, number>;
}> {
  const { testSessions, testCases, testResults } = await getCollections();
  
  const filter = developerId ? { developerId } : {};
  
  const [
    totalSessions,
    completedSessions,
    failedSessions,
    avgTestsData,
    avgExecutionData,
    testTypeData
  ] = await Promise.all([
    testSessions!.countDocuments(filter),
    testSessions!.countDocuments({ ...filter, status: 'completed' }),
    testSessions!.countDocuments({ ...filter, status: 'failed' }),
    testSessions!.aggregate([
      { $match: filter },
      { $lookup: { from: 'test_cases', localField: 'sessionId', foreignField: 'sessionId', as: 'tests' } },
      { $group: { _id: null, avgTests: { $avg: { $size: '$tests' } } } }
    ]).toArray(),
    testResults!.aggregate([
      { $match: developerId ? { sessionId: { $in: await getSessionIdsByDeveloper(developerId) } } : {} },
      { $group: { _id: null, avgTime: { $avg: '$executionTime' } } }
    ]).toArray(),
    testCases!.aggregate([
      { $match: developerId ? { sessionId: { $in: await getSessionIdsByDeveloper(developerId) } } : {} },
      { $group: { _id: '$testType', count: { $sum: 1 } } }
    ]).toArray()
  ]);

  const testTypeDistribution: Record<string, number> = {};
  testTypeData.forEach(item => {
    testTypeDistribution[item._id] = item.count;
  });

  return {
    totalSessions,
    completedSessions,
    failedSessions,
    avgTestsPerSession: avgTestsData[0]?.avgTests || 0,
    avgExecutionTime: avgExecutionData[0]?.avgTime || 0,
    testTypeDistribution
  };
}

async function getSessionIdsByDeveloper(developerId: string): Promise<string[]> {
  const { testSessions } = await getCollections();
  const sessions = await testSessions!.find(
    { developerId },
    { projection: { sessionId: 1 } }
  ).toArray();
  return sessions.map(s => s.sessionId);
}

// Database Health Check
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  collectionsCount: number;
  indexesCreated: boolean;
  lastError?: string;
}> {
  try {
    const collections = await getCollections();
    const { db } = await connectToDatabase();
    
    const collectionsInfo = await db.listCollections().toArray();
    
    return {
      connected: true,
      collectionsCount: collectionsInfo.length,
      indexesCreated: Object.keys(collections).length === 4,
    };
  } catch (error) {
    return {
      connected: false,
      collectionsCount: 0,
      indexesCreated: false,
      lastError: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
