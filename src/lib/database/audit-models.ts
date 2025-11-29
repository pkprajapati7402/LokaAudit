import { ObjectId } from 'mongodb';

// Enhanced data models for production audit system
export interface AuditJob {
  _id?: ObjectId;
  jobId: string;
  projectId: string;
  status: 'queued' | 'preprocessing' | 'parsing' | 'static_analysis' | 'semantic_analysis' | 'ai_analysis' | 'external_tools' | 'aggregating' | 'completed' | 'failed';
  stage: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  artifactUrl?: string;
  metadataUrl?: string;
  cleanedArtifactUrl?: string;
  errorMessage?: string;
  estimatedCompletionTime?: Date;
}

export interface AuditStage {
  _id?: ObjectId;
  jobId: string;
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  outputUrl?: string;
  findings?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface VulnerabilityPattern {
  _id?: ObjectId;
  patternId: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  language: string[];
  regex?: string;
  astPattern?: Record<string, any>;
  falsePositiveRate: number;
  confidenceScore: number;
  cwe?: string;
  references: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuditMetrics {
  _id?: ObjectId;
  jobId: string;
  totalFiles: number;
  totalLinesOfCode: number;
  complexity: number;
  analysisTime: number;
  findingsPerStage: {
    static: number;
    semantic: number;
    ai: number;
    external: number;
  };
  performanceMetrics: {
    preprocessing: number;
    parsing: number;
    staticAnalysis: number;
    semanticAnalysis: number;
    aiAnalysis: number;
    externalTools: number;
    aggregation: number;
  };
  resourceUsage: {
    memory: number;
    cpu: number;
    disk: number;
  };
  createdAt: Date;
}

export interface AuditTemplate {
  _id?: ObjectId;
  templateId: string;
  name: string;
  description: string;
  language: string;
  auditTypes: string[];
  configuration: {
    enabledAnalyzers: string[];
    severityThreshold: string;
    confidenceThreshold: number;
    customRules: string[];
    externalTools: string[];
  };
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
