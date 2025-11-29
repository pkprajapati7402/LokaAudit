// Core types for LokaAudit Backend Service

export type NetworkType = 'solana' | 'near' | 'aptos' | 'sui' | 'ethereum' | 'starknet';
export type LanguageType = 'rust' | 'move' | 'solidity' | 'cairo';

export interface AuditRequest {
  jobId: string;
  projectName: string;
  network: NetworkType;
  language: LanguageType;
  files: UploadedFile[];
  configuration?: AuditConfiguration;
  metadata?: AuditMetadata;
}

export interface UploadedFile {
  fileName: string;
  content: string;
  size: number;
  mimeType?: string;
  path?: string;
}

export interface AuditConfiguration {
  enabledStages: PipelineStage[];
  severityThreshold: SeverityLevel;
  confidenceThreshold: number;
  aiAnalysisEnabled: boolean;
  externalToolsEnabled: boolean;
  timeoutMs: number;
}

export interface AuditMetadata {
  uploadedAt: Date;
  clientId?: string;
  priority: number;
  tags?: string[];
}

export type PipelineStage = 
  | 'preprocess' 
  | 'parser' 
  | 'static-analysis' 
  | 'semantic-analysis' 
  | 'ai-analysis' 
  | 'external-tools' 
  | 'aggregation';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface StageStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  completedAt?: Date;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStage: PipelineStage | 'initialization' | 'completed' | 'failed' | null;
  stages: Record<string, StageStatus>;
  createdAt: Date;
  completedAt?: Date;
  network: NetworkType;
  totalFiles: number;
  error?: string;
}

export interface StageResult {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  output?: any;
  error?: string;
}

// Pipeline-specific types
export interface PreprocessResult {
  cleanedFiles: ProcessedFile[];
  dependencies: DependencyInfo[];
  metadata: ProjectMetadata;
  artifactUrl: string;
}

export interface ProcessedFile {
  fileName: string;
  content: string;
  size: number;
  type: 'source' | 'config' | 'dependency' | 'documentation';
  language: LanguageType;
  complexity: number;
  hash: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  source: 'crates.io' | 'npm' | 'github' | 'local';
  vulnerabilities?: VulnerabilityInfo[];
}

export interface VulnerabilityInfo {
  id: string;
  severity: SeverityLevel;
  description: string;
  patchedVersions: string[];
}

export interface ProjectMetadata {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  complexity: number;
  languages: LanguageStats[];
  frameworks: string[];
  features: string[];
}

export interface LanguageStats {
  language: LanguageType;
  lines: number;
  files: number;
  percentage: number;
}

// Parser types
export interface ParseResult {
  ast: Record<string, any>;
  syntaxTree: Record<string, any>;
  controlFlow: ControlFlowGraph;
  symbolTable: SymbolTable;
  crossReferences: CrossReference[];
}

export interface ControlFlowGraph {
  nodes: CFGNode[];
  edges: CFGEdge[];
  entryPoints: string[];
  exitPoints: string[];
}

export interface CFGNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'condition' | 'loop';
  content: string;
  file: string;
  line: number;
}

export interface CFGEdge {
  from: string;
  to: string;
  condition?: string;
  type: 'sequential' | 'conditional' | 'loop' | 'function_call';
}

export interface SymbolTable {
  functions: FunctionSymbol[];
  variables: VariableSymbol[];
  types: TypeSymbol[];
  modules: ModuleSymbol[];
}

export interface FunctionSymbol {
  name: string;
  file: string;
  line: number;
  visibility: 'public' | 'private' | 'internal';
  parameters: Parameter[];
  returnType: string;
  modifiers: string[];
  calls: string[];
  calledBy: string[];
}

export interface VariableSymbol {
  name: string;
  file: string;
  line: number;
  type: string;
  scope: string;
  mutable: boolean;
  references: Reference[];
}

export interface TypeSymbol {
  name: string;
  file: string;
  line: number;
  kind: 'struct' | 'enum' | 'trait' | 'interface';
  fields: Field[];
  methods: string[];
}

export interface ModuleSymbol {
  name: string;
  file: string;
  exports: string[];
  imports: string[];
  dependencies: string[];
}

export interface Parameter {
  name: string;
  type: string;
  mutable: boolean;
  optional: boolean;
}

export interface Reference {
  file: string;
  line: number;
  column: number;
  type: 'read' | 'write' | 'declaration';
}

export interface Field {
  name: string;
  type: string;
  visibility: 'public' | 'private';
  mutable: boolean;
}

export interface CrossReference {
  from: Location;
  to: Location;
  type: 'function_call' | 'variable_access' | 'type_usage' | 'import';
  symbol: string;
}

export interface Location {
  file: string;
  line: number;
  column: number;
}

// Analysis results
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  category: string;
  location: FindingLocation;
  code: string;
  recommendation: string;
  references: string[];
  cwe?: string;
  owasp?: string;
  exploitability: number;
  impact: Impact;
  source: 'static' | 'semantic' | 'ai' | 'external';
  tool?: string;
}

export interface FindingLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
  function?: string;
  snippet: string;
}

export interface Impact {
  financial: 'low' | 'medium' | 'high';
  operational: 'low' | 'medium' | 'high';
  reputational: 'low' | 'medium' | 'high';
  description: string;
}

// Final audit report (matches the standardized format)
export interface StandardAuditReport {
  report_metadata: ReportMetadata;
  summary: AuditSummary;
  findings: StandardFinding[];
  recommendations: AuditRecommendations;
  appendix: AuditAppendix;
}

export interface ReportMetadata {
  report_id: string;
  platform: string;
  language: string;
  auditor: string;
  audit_date: string;
  version: string;
  target_contract: TargetContract;
}

export interface TargetContract {
  name: string;
  address?: string;
  commit_hash?: string;
  files: string[];
}

export interface AuditSummary {
  total_issues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  security_score: number;
  overall_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  
  // AI Enhancement fields (optional)
  executive_summary?: {
    overallRecommendation: string;
    risk_assessment: {
      overall_risk_level: string;
      risk_factors: string[];
      business_impact: string;
      deployment_readiness: string;
    };
    key_findings: {
      total_vulnerabilities: number;
      critical_vulnerabilities: number;
      high_risk_vulnerabilities: number;
      medium_risk_vulnerabilities: number;
      low_risk_vulnerabilities: number;
      informational_findings: number;
      security_score: number;
      score_interpretation: string;
      confidence_level?: number;
    };
    immediate_actions: string[];
  };
  technical_summary?: any;
  detailed_analysis?: any;
}

export interface StandardFinding {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
  impact: string;
  affected_files: string[];
  line_numbers: number[];
  recommendation: string;
  references: string[];
  status: 'Unresolved' | 'Acknowledged' | 'Fixed' | 'Wont_Fix';
  confidence?: number;
  cwe?: string;
  exploitability?: number;
  category?: string;
  code_snippet?: string;
  
  // AI Enhancement fields (optional)
  business_context?: string;
  attack_scenarios?: string[];
  mitigation_priority?: 'immediate' | 'high' | 'medium' | 'low';
  implementation_complexity?: 'simple' | 'moderate' | 'complex' | 'architectural';
  estimated_effort?: string;
  related_findings?: string[];
  technical_details?: any;
  business_impact?: any;
  remediation_guidance?: any;
}

export interface AuditRecommendations {
  security_best_practices: string[];
  future_improvements: string[];
  immediate_actions?: string[];
  long_term_strategies?: string[];
  
  // AI Enhancement fields (optional)
  high_priority_fixes?: string[];
  testing_and_validation?: string[];
  architectural_improvements?: string[];
  gemini_insights?: {
    threat_model_recommendations: string[];
    compliance_recommendations: string[];
    business_process_improvements: string[];
    continuous_monitoring: string[];
  };
}

export interface AuditAppendix {
  tools_used: string[];
  glossary: Record<string, string>;
  methodology?: string[];
  analysis_duration?: string;
  code_coverage?: CodeCoverage;
  
  // AI Enhancement fields (optional)
  ai_enhancement_details?: {
    gemini_model_used: string;
    analysis_timestamp: string;
    findings_enhanced: number;
    confidence_score: number;
    analysis_capabilities: string[];
  };
  security_scoring_methodology?: {
    base_scoring: string;
    ai_enhancements: string;
    confidence_factors: string[];
  };
  enhancement_status?: string;
  fallback_applied?: boolean;
}

export interface CodeCoverage {
  total_lines: number;
  analyzed_lines: number;
  coverage_percentage: number;
}
