import { EventEmitter } from 'events';
import { 
  AuditRequest, 
  JobStatus, 
  StandardAuditReport, 
  NetworkType,
  PipelineStage,
  StageStatus,
  Finding,
  PreprocessResult,
  ParseResult
} from '../types/audit.types';
import { NetworkConfig } from '../utils/network-config';

export abstract class BasePipeline extends EventEmitter {
  protected networkConfig: NetworkConfig;
  protected jobStatus: JobStatus;
  private stopped = false;

  constructor(networkConfig: NetworkConfig, jobId: string) {
    super();
    this.networkConfig = networkConfig;
    this.jobStatus = {
      jobId,
      status: 'queued',
      progress: 0,
      currentStage: null,
      stages: {},
      createdAt: new Date(),
      network: networkConfig.network,
      totalFiles: 0
    };
  }

  // Abstract method for processing audit
  abstract processAudit(request: AuditRequest): Promise<StandardAuditReport>;

  // Execute a pipeline stage with error handling and progress tracking
  protected async executeStage<T>(
    stage: PipelineStage, 
    stageFunction: () => Promise<T>
  ): Promise<T> {
    console.log(`Starting stage: ${stage}`);
    
    if (this.stopped) {
      throw new Error('Pipeline was stopped');
    }
    
    this.jobStatus.currentStage = stage;
    this.jobStatus.stages[stage] = {
      status: 'processing'
    };
    
    this.emit('progress', this.jobStatus.progress, stage);
    
    try {
      const startTime = Date.now();
      const result = await stageFunction();
      const duration = Date.now() - startTime;
      
      this.jobStatus.stages[stage] = {
        status: 'completed',
        duration,
        completedAt: new Date()
      };
      
      // Update progress (each stage is roughly equal weight)
      const completedStages = Object.values(this.jobStatus.stages).filter(s => s.status === 'completed').length;
      const totalStages = 7; // Total number of stages
      this.jobStatus.progress = Math.round((completedStages / totalStages) * 100);
      
      this.emit('stageCompleted', stage, duration);
      this.emit('progress', this.jobStatus.progress, stage);
      
      return result;
    } catch (error) {
      this.jobStatus.stages[stage] = {
        status: 'failed'
      };
      this.jobStatus.status = 'failed';
      this.jobStatus.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('error', stage, error);
      throw error;
    }
  }

  // Stop the pipeline
  async stop(): Promise<void> {
    this.stopped = true;
    this.jobStatus.status = 'cancelled';
    console.log(`Pipeline ${this.jobStatus.jobId} stopped`);
  }

  // Check if pipeline is stopped
  protected isStopped(): boolean {
    return this.stopped;
  }

  // Get current status
  getStatus(): JobStatus {
    return { ...this.jobStatus };
  }

  // Check if stage is completed
  protected isStageCompleted(stage: PipelineStage): boolean {
    return this.jobStatus.stages[stage]?.status === 'completed';
  }

  // Abstract methods for each stage - to be implemented by network-specific pipelines
  protected abstract preprocess(request: AuditRequest): Promise<PreprocessResult>;
  protected abstract parse(preprocessResult: PreprocessResult): Promise<ParseResult>;
  protected abstract staticAnalysis(parseResult: ParseResult): Promise<Finding[]>;
  protected abstract semanticAnalysis(staticResult: Finding[]): Promise<Finding[]>;
  protected abstract aiAnalysis(semanticResult: Finding[]): Promise<Finding[]>;
  protected abstract externalToolsAnalysis(aiResult: Finding[]): Promise<Finding[]>;
  protected abstract aggregateResults(allResults: Finding[]): Promise<StandardAuditReport>;
}
