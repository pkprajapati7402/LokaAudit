import { v4 as uuidv4 } from 'uuid';
import { StaticAnalyzer } from './analyzers/static-analyzer';
import { SemanticAnalyzer } from './analyzers/semantic-analyzer';
import { AIAnalyzer } from './analyzers/ai-analyzer';
import { ExternalToolsAnalyzer } from './analyzers/external-tools-analyzer';
import { ResultAggregator } from './aggregators/result-aggregator';
import { CodeParser } from './parsers/code-parser';
import { PreProcessor } from './preprocessors/pre-processor';
import { AuditJobQueue } from './job-queue';
import { vulnerabilityDB } from './vulnerability-database';
import { AuditReportGenerator } from './report-generator';
import { AuditReport } from '../types/audit-report-types';

export interface AuditRequest {
  projectId: string;
  projectName: string;
  language: string;
  files: Array<{
    fileName: string;
    content: string;
    size: number;
    uploadDate: Date;
  }>;
  auditType: string;
  priority?: number;
  configuration?: {
    enabledAnalyzers?: string[];
    severityThreshold?: string;
    confidenceThreshold?: number;
    aiAnalysisEnabled?: boolean;
    externalToolsEnabled?: boolean;
  };
}

export interface AuditResult {
  auditId: string;
  projectId: string;
  status: 'completed' | 'failed' | 'processing';
  summary: {
    totalVulnerabilities: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    securityScore: number;
    gasOptimizationScore: number;
  };
  findings: Finding[];
  recommendations: string[];
  gasOptimizations: GasOptimization[];
  metadata: {
    analysisTime: number;
    linesOfCode: number;
    complexity: number;
    auditedAt: Date;
    language: string;
    tools: string[];
  };
  report: {
    executiveSummary: string;
    technicalDetails: string;
    riskAssessment: string;
  };
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  code: string;
  recommendation: string;
  references: string[];
  cwe?: string;
  exploitability: number;
}

export interface GasOptimization {
  id: string;
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
  };
  originalCode: string;
  optimizedCode: string;
  gasSavings: number;
  effort: 'low' | 'medium' | 'high';
}

export class AuditProcessor {
  private preProcessor: PreProcessor;
  private codeParser: CodeParser;
  private staticAnalyzer: StaticAnalyzer;
  private semanticAnalyzer: SemanticAnalyzer;
  private aiAnalyzer: AIAnalyzer;
  private externalToolsAnalyzer: ExternalToolsAnalyzer;
  private resultAggregator: ResultAggregator;
  private jobQueue: AuditJobQueue;

  constructor() {
    this.preProcessor = new PreProcessor();
    this.codeParser = new CodeParser();
    this.staticAnalyzer = new StaticAnalyzer();
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.aiAnalyzer = new AIAnalyzer();
    this.externalToolsAnalyzer = new ExternalToolsAnalyzer();
    this.resultAggregator = new ResultAggregator();
    this.jobQueue = AuditJobQueue.getInstance();
  }

  async processAudit(request: AuditRequest): Promise<AuditResult> {
    const auditId = uuidv4();
    const startTime = Date.now();

    console.log(`Starting audit ${auditId} for project ${request.projectId}`);
    
    try {
      // Initialize vulnerability database
      await vulnerabilityDB.initializePatterns();

      // Step 1: Pre-processing
      console.log('Step 1: Pre-processing...');
      const preprocessedData = await this.preProcessor.process(request);

      // Step 2: Code parsing
      console.log('Step 2: Parsing code...');
      const parseData = await this.codeParser.parse(preprocessedData);

      let findings: Finding[] = [];
      const config = request.configuration || {};

      // Step 3: Static Analysis (always enabled)
      if (!config.enabledAnalyzers || config.enabledAnalyzers.includes('static')) {
        console.log('Step 3: Static analysis...');
        try {
          const staticFindings = await this.staticAnalyzer.analyze(parseData);
          findings.push(...staticFindings);
        } catch (error) {
          console.warn('Static analysis failed:', error);
        }
      }

      // Step 4: Semantic Analysis
      if (!config.enabledAnalyzers || config.enabledAnalyzers.includes('semantic')) {
        console.log('Step 4: Semantic analysis...');
        try {
          const semanticFindings = await this.semanticAnalyzer.analyze(parseData, findings);
          findings.push(...semanticFindings);
        } catch (error) {
          console.warn('Semantic analysis failed:', error);
        }
      }

      // Step 5: AI Analysis (optional)
      if (config.aiAnalysisEnabled !== false && (!config.enabledAnalyzers || config.enabledAnalyzers.includes('ai'))) {
        console.log('Step 5: AI analysis...');
        try {
          const aiFindings = await this.aiAnalyzer.analyze(parseData, findings);
          findings.push(...aiFindings);
        } catch (error) {
          console.warn('AI analysis failed:', error);
        }
      }

      // Step 6: External Tools Analysis (optional)
      if (config.externalToolsEnabled !== false && (!config.enabledAnalyzers || config.enabledAnalyzers.includes('external'))) {
        console.log('Step 6: External tools analysis...');
        try {
          const externalFindings = await this.externalToolsAnalyzer.analyze(preprocessedData);
          findings.push(...externalFindings);
        } catch (error) {
          console.warn('External tools analysis failed:', error);
        }
      }

      // Step 7: Result Aggregation
      console.log('Step 7: Aggregating results...');
      
      // Filter by confidence threshold if specified
      if (config.confidenceThreshold) {
        findings = findings.filter(f => f.confidence >= config.confidenceThreshold!);
      }

      // Filter by severity threshold if specified
      if (config.severityThreshold) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const threshold = severityOrder[config.severityThreshold as keyof typeof severityOrder];
        if (threshold) {
          findings = findings.filter(f => severityOrder[f.severity] >= threshold);
        }
      }

      const finalResult = await this.resultAggregator.aggregate({
        auditId,
        projectId: request.projectId,
        findings,
        parseData,
        metadata: {
          analysisTime: Date.now() - startTime,
          linesOfCode: this.calculateLinesOfCode(request.files),
          complexity: parseData.complexity || 0,
          auditedAt: new Date(),
          language: request.language,
          tools: this.getEnabledTools(config)
        }
      });

      console.log(`Audit ${auditId} completed successfully in ${Date.now() - startTime}ms`);
      return finalResult;

    } catch (error) {
      console.error(`Audit ${auditId} failed:`, error);
      
      // Return error result
      return {
        auditId,
        projectId: request.projectId,
        status: 'failed',
        summary: {
          totalVulnerabilities: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
          securityScore: 0,
          gasOptimizationScore: 0
        },
        findings: [],
        recommendations: [`Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        gasOptimizations: [],
        metadata: {
          analysisTime: Date.now() - startTime,
          linesOfCode: this.calculateLinesOfCode(request.files),
          complexity: 0,
          auditedAt: new Date(),
          language: request.language,
          tools: []
        },
        report: {
          executiveSummary: 'Audit failed to complete due to an error.',
          technicalDetails: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          riskAssessment: 'Unable to assess risk due to audit failure.'
        }
      };
    }
  }

  // Queue-based processing for scalability
  async enqueueAudit(request: AuditRequest): Promise<string> {
    const jobId = await this.jobQueue.enqueueJob({
      projectId: request.projectId,
      projectName: request.projectName,
      language: request.language,
      files: request.files,
      auditType: request.auditType,
      priority: request.priority
    });

    console.log(`Audit job ${jobId} enqueued for project ${request.projectId}`);
    return jobId;
  }

  private getFileType(fileName: string): 'source' | 'config' | 'documentation' | 'test' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['rs', 'move', 'cairo', 'sol'].includes(ext || '')) {
      return 'source';
    } else if (['toml', 'json', 'yaml', 'yml'].includes(ext || '')) {
      return 'config';
    } else if (['md', 'txt', 'rst'].includes(ext || '')) {
      return 'documentation';
    } else if (fileName.includes('test') || fileName.includes('spec')) {
      return 'test';
    }
    
    return 'other';
  }

  private getEnabledTools(config: AuditRequest['configuration']): string[] {
    const tools = ['static-analyzer'];
    
    if (!config?.enabledAnalyzers || config.enabledAnalyzers.includes('semantic')) {
      tools.push('semantic-analyzer');
    }
    
    if (config?.aiAnalysisEnabled !== false && (!config?.enabledAnalyzers || config.enabledAnalyzers.includes('ai'))) {
      tools.push('ai-analyzer');
    }
    
    if (config?.externalToolsEnabled !== false && (!config?.enabledAnalyzers || config.enabledAnalyzers.includes('external'))) {
      tools.push('external-tools');
    }
    
    return tools;
  }

  private calculateLinesOfCode(files: Array<{ content: string }>): number {
    return files.reduce((total, file) => {
      return total + file.content.split('\n').length;
    }, 0);
  }
}
