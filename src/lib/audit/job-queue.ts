import { connectToDatabase } from '../mongodb';
import { AuditJob, AuditStage } from '../database/audit-models';
import { EventEmitter } from 'events';

export class AuditJobQueue extends EventEmitter {
  private static instance: AuditJobQueue;
  private isProcessing = false;
  private processingQueue: string[] = [];

  static getInstance(): AuditJobQueue {
    if (!AuditJobQueue.instance) {
      AuditJobQueue.instance = new AuditJobQueue();
    }
    return AuditJobQueue.instance;
  }

  async enqueueJob(jobData: {
    projectId: string;
    projectName: string;
    language: string;
    files: any[];
    auditType: string;
    priority?: number;
  }): Promise<string> {
    const { db } = await connectToDatabase();
    const jobId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const auditJob: AuditJob = {
      jobId,
      projectId: jobData.projectId,
      status: 'queued',
      stage: 'intake',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection<AuditJob>('audit_jobs').insertOne(auditJob);

    // Create initial stage records
    const stages = [
      'preprocessing',
      'parsing', 
      'static_analysis',
      'semantic_analysis',
      'ai_analysis',
      'external_tools',
      'aggregation'
    ];

    const stageRecords = stages.map(stage => ({
      jobId,
      stage,
      status: 'pending' as const,
    }));

    await db.collection<AuditStage>('audit_stages').insertMany(stageRecords);

    this.emit('job.enqueued', { jobId, ...jobData });
    this.processNextJob();

    return jobId;
  }

  async updateJobStatus(jobId: string, status: AuditJob['status'], stage?: string, progress?: number): Promise<void> {
    const { db } = await connectToDatabase();
    
    const updateData: Partial<AuditJob> = {
      status,
      updatedAt: new Date()
    };

    if (stage) updateData.stage = stage;
    if (progress !== undefined) updateData.progress = progress;

    await db.collection<AuditJob>('audit_jobs').updateOne(
      { jobId },
      { $set: updateData }
    );

    this.emit('job.updated', { jobId, status, stage, progress });
  }

  async updateStageStatus(jobId: string, stage: string, status: AuditStage['status'], metadata?: Record<string, any>): Promise<void> {
    const { db } = await connectToDatabase();
    
    const updateData: Partial<AuditStage> = {
      status,
    };

    if (status === 'running') {
      updateData.startTime = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.endTime = new Date();
      const stageRecord = await db.collection<AuditStage>('audit_stages').findOne({ jobId, stage });
      if (stageRecord?.startTime) {
        updateData.duration = Date.now() - stageRecord.startTime.getTime();
      }
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    await db.collection<AuditStage>('audit_stages').updateOne(
      { jobId, stage },
      { $set: updateData }
    );

    this.emit('stage.updated', { jobId, stage, status, metadata });
  }

  async getJobStatus(jobId: string): Promise<AuditJob | null> {
    const { db } = await connectToDatabase();
    return await db.collection<AuditJob>('audit_jobs').findOne({ jobId });
  }

  async getJobStages(jobId: string): Promise<AuditStage[]> {
    const { db } = await connectToDatabase();
    return await db.collection<AuditStage>('audit_stages').find({ jobId }).toArray();
  }

  async getQueueLength(): Promise<number> {
    const { db } = await connectToDatabase();
    return await db.collection<AuditJob>('audit_jobs').countDocuments({ 
      status: { $in: ['queued', 'preprocessing', 'parsing', 'static_analysis', 'semantic_analysis', 'ai_analysis', 'external_tools', 'aggregating'] } 
    });
  }

  async processNextJob(): Promise<void> {
    if (this.isProcessing) return;

    const { db } = await connectToDatabase();
    const nextJob = await db.collection<AuditJob>('audit_jobs').findOne(
      { status: 'queued' },
      { sort: { createdAt: 1 } }
    );

    if (!nextJob) return;

    this.isProcessing = true;
    this.processingQueue.push(nextJob.jobId);

    try {
      await this.processJob(nextJob.jobId);
    } catch (error) {
      console.error(`Job ${nextJob.jobId} failed:`, error);
      await this.updateJobStatus(nextJob.jobId, 'failed');
    } finally {
      this.isProcessing = false;
      this.processingQueue = this.processingQueue.filter(id => id !== nextJob.jobId);
      
      // Process next job if any
      setTimeout(() => this.processNextJob(), 1000);
    }
  }

  private async processJob(jobId: string): Promise<void> {
    console.log(`Processing audit job: ${jobId}`);
    
    // This would integrate with your existing AuditProcessor
    // For now, simulate the processing stages
    
    const stages = [
      'preprocessing',
      'parsing',
      'static_analysis', 
      'semantic_analysis',
      'ai_analysis',
      'external_tools',
      'aggregation'
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const progress = Math.round(((i + 1) / stages.length) * 100);

      await this.updateJobStatus(jobId, 'preprocessing', stage, progress);
      await this.updateStageStatus(jobId, stage, 'running');

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.updateStageStatus(jobId, stage, 'completed', { 
        findings: Math.floor(Math.random() * 10),
        processingTime: 2000
      });
    }

    await this.updateJobStatus(jobId, 'completed', 'completed', 100);
    this.emit('job.completed', { jobId });
  }

  // WebSocket integration for real-time updates
  setupWebSocketUpdates(io: any): void {
    this.on('job.enqueued', (data) => {
      io.emit('audit:job:enqueued', data);
    });

    this.on('job.updated', (data) => {
      io.emit('audit:job:updated', data);
    });

    this.on('stage.updated', (data) => {
      io.emit('audit:stage:updated', data);
    });

    this.on('job.completed', (data) => {
      io.emit('audit:job:completed', data);
    });
  }
}
