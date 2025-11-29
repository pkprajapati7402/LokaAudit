import { EventEmitter } from 'events';
import { PipelineFactory } from '../pipelines/pipeline-factory';
import { BasePipeline } from '../pipelines/base-pipeline';
import { 
  AuditRequest, 
  StandardAuditReport, 
  JobStatus, 
  NetworkType 
} from '../types/audit.types';
import { logger } from '../utils/logger';

// In-memory storage services for job tracking
class DatabaseService {
  private static instance: DatabaseService;
  private jobStatuses: Map<string, JobStatus> = new Map();
  private auditReports: Map<string, StandardAuditReport> = new Map();
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  async saveJobStatus(jobStatus: JobStatus): Promise<void> {
    logger.info('Saving job status', { jobId: jobStatus.jobId, status: jobStatus.status });
    this.jobStatuses.set(jobStatus.jobId, { ...jobStatus });
  }
  
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    logger.info('Getting job status', { jobId });
    const status = this.jobStatuses.get(jobId);
    if (!status) {
      logger.warn('Job status not found', { jobId });
      return null;
    }
    return { ...status };
  }
  
  async updateJobStatus(jobId: string, updates: Partial<JobStatus>): Promise<void> {
    logger.info('Updating job status', { jobId, updates });
    const existing = this.jobStatuses.get(jobId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.jobStatuses.set(jobId, updated);
    }
  }
  
  async saveAuditReport(jobId: string, report: StandardAuditReport): Promise<void> {
    logger.info('Saving audit report', { jobId, reportId: report.report_metadata?.report_id });
    this.auditReports.set(jobId, report);
  }
  
  async getAuditReport(jobId: string): Promise<StandardAuditReport | null> {
    logger.info('Getting audit report', { jobId });
    const report = this.auditReports.get(jobId);
    if (!report) {
      logger.warn('Audit report not found', { jobId });
      return null;
    }
    return report;
  }
  
  async getAuditStatistics(): Promise<{
    totalAudits: number;
    completedAudits: number;
    failedAudits: number;
    activeAudits: number;
    networkBreakdown: Record<NetworkType, number>;
  }> {
    const statuses = Array.from(this.jobStatuses.values());
    return {
      totalAudits: statuses.length,
      completedAudits: statuses.filter(s => s.status === 'completed').length,
      failedAudits: statuses.filter(s => s.status === 'failed').length,
      activeAudits: statuses.filter(s => ['queued', 'processing'].includes(s.status)).length,
      networkBreakdown: {} as Record<NetworkType, number>
    };
  }
}

class RedisService {
  private static instance: RedisService;
  private jobQueue: AuditRequest[] = [];
  
  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }
  
  async addJobToQueue(request: AuditRequest): Promise<void> {
    logger.info('Adding job to queue', { jobId: request.jobId });
    this.jobQueue.push(request);
  }
  
  async removeJobFromQueue(jobId: string): Promise<void> {
    logger.info('Removing job from queue', { jobId });
    const index = this.jobQueue.findIndex(job => job.jobId === jobId);
    if (index > -1) {
      this.jobQueue.splice(index, 1);
    }
  }
  
  getQueueLength(): number {
    return this.jobQueue.length;
  }
}

class WebSocketService {
  private static instance: WebSocketService;
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  notifyProgressUpdate(jobId: string, progress: number, stage: string): void {
    logger.info(`Progress update - Job: ${jobId}, Progress: ${progress}%, Stage: ${stage}`);
  }
  notifyAuditCompleted(jobId: string, report: StandardAuditReport): void {
    logger.info(`Audit completed - Job: ${jobId}`);
  }
  notifyAuditFailed(jobId: string, error: string): void {
    logger.info(`Audit failed - Job: ${jobId}, Error: ${error}`);
  }
}

export class AuditService extends EventEmitter {
  private static instance: AuditService;
  private activePipelines: Map<string, BasePipeline> = new Map();
  private database: DatabaseService;
  private redis: RedisService;
  private websocket: WebSocketService;

  private constructor() {
    super();
    this.database = DatabaseService.getInstance();
    this.redis = RedisService.getInstance();
    this.websocket = WebSocketService.getInstance();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Start a new audit job
   */
  async startAudit(request: AuditRequest): Promise<{ jobId: string; message: string }> {
    try {
      logger.info(`Starting audit for network: ${request.network}`, { jobId: request.jobId });

      // Validate request
      this.validateAuditRequest(request);

      // Check if network is supported
      if (!PipelineFactory.isNetworkSupported(request.network)) {
        throw new Error(`Unsupported network: ${request.network}`);
      }

      // Create pipeline for the network
      const pipeline = PipelineFactory.createPipeline(request.network, request.jobId);
      
      // Store pipeline reference
      this.activePipelines.set(request.jobId, pipeline);

      // Initialize job status
      const jobStatus: JobStatus = {
        jobId: request.jobId,
        status: 'queued',
        progress: 0,
        currentStage: 'initialization',
        stages: {},
        createdAt: new Date(),
        network: request.network,
        totalFiles: request.files.length
      };

      // Save job to database
      await this.database.saveJobStatus(jobStatus);

      // Add job to Redis queue
      await this.redis.addJobToQueue(request);

      // Process audit asynchronously
      this.processAuditAsync(pipeline, request);

      logger.info(`Audit job queued successfully`, { jobId: request.jobId });

      return {
        jobId: request.jobId,
        message: `Audit started for ${request.network} network. Use job ID to track progress.`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to start audit`, { jobId: request.jobId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const status = await this.database.getJobStatus(jobId);
      if (!status) {
        logger.warn(`Job status not found`, { jobId });
        return null;
      }

      // If job is active, get real-time status from pipeline
      const pipeline = this.activePipelines.get(jobId);
      if (pipeline) {
        const pipelineStatus = pipeline.getStatus();
        return { ...status, ...pipelineStatus };
      }

      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error';
      logger.error(`Failed to get job status`, { jobId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get audit report
   */
  async getAuditReport(jobId: string): Promise<StandardAuditReport | null> {
    try {
      const report = await this.database.getAuditReport(jobId);
      if (!report) {
        logger.warn(`Audit report not found`, { jobId });
        return null;
      }

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error';
      logger.error(`Failed to get audit report`, { jobId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Cancel audit job
   */
  async cancelAudit(jobId: string): Promise<{ message: string }> {
    try {
      const pipeline = this.activePipelines.get(jobId);
      if (pipeline) {
        // Stop the pipeline
        await pipeline.stop();
        this.activePipelines.delete(jobId);
      }

      // Update job status
      await this.database.updateJobStatus(jobId, {
        status: 'cancelled',
        error: 'Job cancelled by user'
      });

      // Remove from Redis queue
      await this.redis.removeJobFromQueue(jobId);

      logger.info(`Audit job cancelled`, { jobId });

      return { message: 'Audit job cancelled successfully' };
    } catch (error) {
      logger.error(`Failed to cancel audit`, { jobId, error: (error instanceof Error ? error.message : "Unknown error") });
      throw error;
    }
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): { 
    networks: NetworkType[];
    capabilities: Record<NetworkType, any>;
  } {
    const networks = PipelineFactory.getSupportedNetworks();
    const capabilities = networks.reduce((acc, network) => {
      acc[network] = PipelineFactory.getNetworkCapabilities(network);
      return acc;
    }, {} as Record<NetworkType, any>);

    return { networks, capabilities };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(): Promise<{
    totalAudits: number;
    completedAudits: number;
    failedAudits: number;
    activeAudits: number;
    networkBreakdown: Record<NetworkType, number>;
  }> {
    try {
      return await this.database.getAuditStatistics();
    } catch (error) {
      logger.error(`Failed to get audit statistics`, { error: (error instanceof Error ? error.message : "Unknown error") });
      throw error;
    }
  }

  /**
   * Process audit asynchronously
   */
  private async processAuditAsync(pipeline: BasePipeline, request: AuditRequest): Promise<void> {
    try {
      logger.info(`Processing audit asynchronously`, { jobId: request.jobId, network: request.network });

      // Update status to processing
      await this.database.updateJobStatus(request.jobId, {
        status: 'processing',
        progress: 5,
        currentStage: 'initialization'
      });

      // Set up pipeline event listeners
      this.setupPipelineListeners(pipeline, request.jobId);

      logger.info(`Starting pipeline processing for ${request.network}`, { jobId: request.jobId });

      // Start the audit pipeline
      const report = await pipeline.processAudit(request);

      logger.info(`Pipeline processing completed`, { jobId: request.jobId, reportId: report.report_metadata?.report_id });

      // Save the report
      await this.database.saveAuditReport(request.jobId, report);

      // Update final job status
      await this.database.updateJobStatus(request.jobId, {
        status: 'completed',
        progress: 100,
        currentStage: 'completed',
        completedAt: new Date()
      });

      // Notify via WebSocket
      this.websocket.notifyAuditCompleted(request.jobId, report);

      // Clean up
      this.activePipelines.delete(request.jobId);

      logger.info(`Audit completed successfully`, { jobId: request.jobId });

    } catch (error) {
      logger.error(`Audit processing failed`, { jobId: request.jobId, error: (error instanceof Error ? error.message : "Unknown error") });

      // Update job status with error
      await this.database.updateJobStatus(request.jobId, {
        status: 'failed',
        progress: 0,
        currentStage: 'failed',
        error: (error instanceof Error ? error.message : "Unknown error"),
        completedAt: new Date()
      });

      // Notify via WebSocket
      this.websocket.notifyAuditFailed(request.jobId, (error instanceof Error ? error.message : "Unknown error"));

      // Clean up
      this.activePipelines.delete(request.jobId);
    }
  }

  /**
   * Set up pipeline event listeners
   */
  private setupPipelineListeners(pipeline: BasePipeline, jobId: string): void {
    pipeline.on('progress', async (progress: number, stage: string) => {
      await this.database.updateJobStatus(jobId, {
        progress,
        currentStage: stage as any
      });
      
      this.websocket.notifyProgressUpdate(jobId, progress, stage);
    });

    pipeline.on('stageCompleted', async (stage: string, duration: number) => {
      const jobStatus = await this.database.getJobStatus(jobId);
      if (jobStatus) {
        jobStatus.stages[stage] = {
          status: 'completed',
          duration,
          completedAt: new Date()
        };
        
        await this.database.updateJobStatus(jobId, {
          stages: jobStatus.stages
        });
      }
    });

    pipeline.on('error', async (stage: string, error: Error) => {
      logger.error(`Pipeline error in stage ${stage}`, { jobId, error: (error instanceof Error ? error.message : "Unknown error") });
      
      await this.database.updateJobStatus(jobId, {
        status: 'failed',
        error: `Error in ${stage}: ${(error instanceof Error ? error.message : "Unknown error")}`
      });
    });
  }

  /**
   * Set up service event listeners
   */
  private setupEventListeners(): void {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    logger.info('Initiating graceful shutdown...');

    // Cancel all active pipelines
    const activeJobs = Array.from(this.activePipelines.keys());
    
    for (const jobId of activeJobs) {
      try {
        await this.cancelAudit(jobId);
      } catch (error) {
        logger.error(`Failed to cancel job during shutdown`, { jobId, error: (error instanceof Error ? error.message : "Unknown error") });
      }
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }

  /**
   * Validate audit request
   */
  private validateAuditRequest(request: AuditRequest): void {
    if (!request.jobId || typeof request.jobId !== 'string') {
      throw new Error('Invalid jobId');
    }

    if (!request.network || typeof request.network !== 'string') {
      throw new Error('Invalid network');
    }

    if (!request.files || !Array.isArray(request.files) || request.files.length === 0) {
      throw new Error('No files provided for audit');
    }

    for (const file of request.files) {
      if (!file.fileName || !file.content) {
        throw new Error('Invalid file format - fileName and content required');
      }
    }

    // Network-specific validation
    this.validateNetworkSpecificRequirements(request);
  }

  /**
   * Validate network-specific requirements
   */
  private validateNetworkSpecificRequirements(request: AuditRequest): void {
    const capabilities = PipelineFactory.getNetworkCapabilities(request.network);
    
    if (!capabilities.implemented) {
      throw new Error(`${request.network} audits are not yet implemented`);
    }

    // Check file extensions match network language
    const expectedLanguage = capabilities.language.toLowerCase();
    const validExtensions = this.getValidExtensions(expectedLanguage);
    
    const hasValidFiles = request.files.some(file => 
      validExtensions.some(ext => file.fileName.endsWith(ext))
    );

    if (!hasValidFiles) {
      throw new Error(`No valid ${expectedLanguage} files found for ${request.network} audit`);
    }
  }

  /**
   * Get valid file extensions for language
   */
  private getValidExtensions(language: string): string[] {
    const extensionMap: Record<string, string[]> = {
      rust: ['.rs'],
      move: ['.move'],
      solidity: ['.sol'],
      cairo: ['.cairo']
    };

    return extensionMap[language] || [];
  }
}
