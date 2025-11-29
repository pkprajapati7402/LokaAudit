import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const DB_NAME = 'lokaaudit';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.log('💡 Make sure MongoDB is running on localhost:27017');
    console.log('📥 To install MongoDB on Windows:');
    console.log('   1. Download from: https://www.mongodb.com/try/download/community');
    console.log('   2. Or use chocolatey: choco install mongodb');
    console.log('   3. Start MongoDB: net start MongoDB');
    throw new Error('MongoDB connection failed. Please ensure MongoDB is installed and running.');
  }
}

export interface ProjectFile {
  fileName: string;
  content: string;
  size: number;
  uploadDate: Date;
}

export interface Project {
  _id?: string;
  projectName: string;
  developerId: string;
  language: string;
  createdDate: Date;
  lastUpdated: Date;
  files: ProjectFile[];
}

export async function saveProject(projectData: Omit<Project, '_id' | 'lastUpdated'>) {
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection<Project>('projects');

  // Check if project with same name and developer ID exists
  const existingProject = await projectsCollection.findOne({
    projectName: projectData.projectName,
    developerId: projectData.developerId
  });

  if (existingProject) {
    // Add new files to existing project
    const result = await projectsCollection.updateOne(
      { 
        projectName: projectData.projectName,
        developerId: projectData.developerId 
      },
      {
        $push: { files: { $each: projectData.files } },
        $set: { 
          lastUpdated: new Date(),
          language: projectData.language // Update language if different
        }
      }
    );
    return { success: true, projectId: existingProject._id, updated: true };
  } else {
    // Create new project
    const newProject = {
      ...projectData,
      lastUpdated: new Date()
    };
    
    const result = await projectsCollection.insertOne(newProject);
    return { success: true, projectId: result.insertedId, updated: false };
  }
}

export async function getProject(projectName: string, developerId: string) {
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection<Project>('projects');
  
  const project = await projectsCollection.findOne({
    projectName,
    developerId
  });
  
  return project;
}

export async function getAllProjects(developerId?: string) {
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection<Project>('projects');
  
  const filter = developerId ? { developerId } : {};
  const projects = await projectsCollection.find(filter).sort({ lastUpdated: -1 }).toArray();
  
  return projects;
}

export async function getProjectById(projectId: string) {
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection<Project>('projects');
  
  const project = await projectsCollection.findOne({ _id: projectId });
  return project;
}

export interface AuditResult {
  _id?: string;
  projectId: string;
  auditId: string;
  result: any;
  status: 'completed' | 'failed' | 'processing';
  completedAt: Date;
  createdAt?: Date;
}

export async function saveAuditResult(auditData: Omit<AuditResult, '_id' | 'createdAt'>) {
  const { db } = await connectToDatabase();
  const auditsCollection = db.collection<AuditResult>('audits');

  const newAudit = {
    ...auditData,
    createdAt: new Date()
  };
  
  const result = await auditsCollection.insertOne(newAudit);
  return { success: true, auditId: result.insertedId };
}

export async function getAuditResult(auditId: string) {
  const { db } = await connectToDatabase();
  const auditsCollection = db.collection<AuditResult>('audits');
  
  const audit = await auditsCollection.findOne({ auditId });
  return audit;
}

export async function getAuditsByProject(projectId: string) {
  const { db } = await connectToDatabase();
  const auditsCollection = db.collection<AuditResult>('audits');
  
  const audits = await auditsCollection.find({ projectId }).sort({ createdAt: -1 }).toArray();
  return audits;
}

// Keep the original connectDB function for backward compatibility
export const connectDB = connectToDatabase;
