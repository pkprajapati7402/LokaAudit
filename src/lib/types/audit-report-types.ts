// Production-ready Audit Report Structure
// Comprehensive types for smart contract security audit reports

export interface AuditReport {
  // Report Metadata
  reportId: string;
  auditId: string;
  version: string;
  generatedAt: Date;
  auditorInfo: AuditorInfo;
  
  // Project Information
  projectInfo: ProjectInfo;
  
  // Executive Summary
  executiveSummary: ExecutiveSummary;
  
  // Technical Analysis
  technicalAnalysis: TechnicalAnalysis;
  
  // Findings
  findings: Finding[];
  
  // Risk Assessment
  riskAssessment: RiskAssessment;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Gas Optimization
  gasOptimization: GasOptimization;
  
  // Code Quality Assessment
  codeQuality: CodeQualityAssessment;
  
  // Compliance & Standards
  compliance: ComplianceAssessment;
  
  // Appendices
  appendices: Appendices;
  
  // Report Footer
  disclaimer: string;
  contactInfo: ContactInfo;
}

export interface AuditorInfo {
  organization: string;
  auditorName: string;
  credentials: string[];
  experience: string;
  methodology: string;
  toolsUsed: string[];
}

export interface ProjectInfo {
  projectName: string;
  version: string;
  blockchain: string;
  language: string;
  framework?: string;
  codebase: CodebaseInfo;
  scope: AuditScope;
  timeline: AuditTimeline;
}

export interface CodebaseInfo {
  totalLines: number;
  totalFiles: number;
  languages: LanguageBreakdown[];
  dependencies: Dependency[];
  testCoverage?: number;
  documentation?: DocumentationStatus;
}

export interface LanguageBreakdown {
  language: string;
  lines: number;
  files: number;
  percentage: number;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'indirect';
  vulnerabilities?: DependencyVulnerability[];
}

export interface DependencyVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fixedIn?: string;
}

export interface DocumentationStatus {
  present: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  coverage: number;
}

export interface AuditScope {
  includedContracts: string[];
  excludedContracts: string[];
  focusAreas: string[];
  limitations: string[];
}

export interface AuditTimeline {
  startDate: Date;
  endDate: Date;
  duration: string;
  effort: string; // e.g., "40 person-hours"
}

export interface ExecutiveSummary {
  overview: string;
  keyFindings: KeyFinding[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  securityScore: number; // 0-100
  recommendedActions: string[];
  deploymentRecommendation: 'approved' | 'approved-with-conditions' | 'not-recommended';
}

export interface KeyFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  count: number;
  impact: string;
}

export interface TechnicalAnalysis {
  architecture: ArchitectureAnalysis;
  security: SecurityAnalysis;
  performance: PerformanceAnalysis;
  maintainability: MaintainabilityAnalysis;
  testing: TestingAnalysis;
}

export interface ArchitectureAnalysis {
  designPatterns: string[];
  architecturalRisks: string[];
  upgradeability: UpgradeabilityAssessment;
  accessControl: AccessControlAssessment;
}

export interface UpgradeabilityAssessment {
  isUpgradeable: boolean;
  mechanism?: string;
  risks: string[];
  recommendations: string[];
}

export interface AccessControlAssessment {
  roles: Role[];
  permissions: Permission[];
  issues: string[];
}

export interface Role {
  name: string;
  description: string;
  privileges: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface Permission {
  function: string;
  requiredRole: string;
  isProtected: boolean;
  riskAssessment: string;
}

export interface SecurityAnalysis {
  vulnerabilityCategories: VulnerabilityCategory[];
  attackVectors: AttackVector[];
  mitigations: SecurityMitigation[];
}

export interface VulnerabilityCategory {
  category: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  examples: string[];
}

export interface AttackVector {
  name: string;
  likelihood: 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
}

export interface SecurityMitigation {
  vulnerability: string;
  currentState: 'implemented' | 'partial' | 'missing';
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PerformanceAnalysis {
  gasUsage: GasUsageAnalysis;
  scalability: ScalabilityAssessment;
  optimization: OptimizationOpportunity[];
}

export interface GasUsageAnalysis {
  averageGas: number;
  maxGas: number;
  gasEfficient: boolean;
  costlySections: GasCostlySection[];
}

export interface GasCostlySection {
  function: string;
  estimatedGas: number;
  optimizationPotential: number;
  suggestions: string[];
}

export interface ScalabilityAssessment {
  currentCapacity: string;
  bottlenecks: string[];
  scalingSolutions: string[];
}

export interface OptimizationOpportunity {
  type: 'gas' | 'performance' | 'storage';
  location: CodeLocation;
  currentCost: number;
  potentialSaving: number;
  description: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

export interface MaintainabilityAnalysis {
  codeComplexity: ComplexityMetrics;
  documentation: DocumentationQuality;
  testability: TestabilityAssessment;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: TechnicalDebt[];
}

export interface TechnicalDebt {
  type: string;
  severity: 'high' | 'medium' | 'low';
  effort: string;
  description: string;
}

export interface DocumentationQuality {
  inlineComments: number;
  natspecCoverage: number;
  readmeQuality: 'excellent' | 'good' | 'fair' | 'poor';
  architecturalDocs: boolean;
}

export interface TestabilityAssessment {
  testCoverage: number;
  unitTests: number;
  integrationTests: number;
  testQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TestingAnalysis {
  coverage: TestCoverage;
  quality: TestQuality;
  recommendations: TestRecommendation[];
}

export interface TestCoverage {
  line: number;
  branch: number;
  function: number;
  statement: number;
}

export interface TestQuality {
  unitTestsPresent: boolean;
  integrationTestsPresent: boolean;
  fuzzTestsPresent: boolean;
  testTypes: TestType[];
}

export interface TestType {
  type: string;
  count: number;
  coverage: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TestRecommendation {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  effort: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  category: FindingCategory;
  location: CodeLocation;
  description: string;
  impact: ImpactAssessment;
  exploitability: ExploitabilityAssessment;
  recommendation: string;
  references: Reference[];
  status: FindingStatus;
  confidence: number; // 0-1
  source: AnalysisSource;
  cweId?: string;
  owasp?: string;
  tags: string[];
}

export type FindingCategory = 
  | 'access-control'
  | 'arithmetic'
  | 'reentrancy'
  | 'gas-optimization'
  | 'logic-error'
  | 'information-disclosure'
  | 'denial-of-service'
  | 'code-quality'
  | 'best-practices'
  | 'compliance'
  | 'dependency'
  | 'configuration';

export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  function?: string;
  snippet: string;
}

export interface ImpactAssessment {
  financial: 'high' | 'medium' | 'low' | 'none';
  operational: 'high' | 'medium' | 'low' | 'none';
  reputational: 'high' | 'medium' | 'low' | 'none';
  description: string;
  affectedUsers: string;
}

export interface ExploitabilityAssessment {
  attackComplexity: 'low' | 'medium' | 'high';
  privilegesRequired: 'none' | 'low' | 'high';
  userInteraction: 'none' | 'required';
  exploitabilityScore: number; // 0-10
  proofOfConcept?: string;
}

export interface FindingStatus {
  current: 'open' | 'acknowledged' | 'fixed' | 'mitigated' | 'false-positive';
  resolution?: string;
  fixCommit?: string;
}

export type AnalysisSource = 
  | 'static-analysis'
  | 'semantic-analysis'
  | 'ai-analysis'
  | 'external-tools'
  | 'manual-review';

export interface Reference {
  title: string;
  url: string;
  type: 'documentation' | 'vulnerability-database' | 'best-practice' | 'tool';
}

export interface RiskAssessment {
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: RiskFactor[];
  mitigationStatus: MitigationStatus;
  residualRisk: 'critical' | 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  factor: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface MitigationStatus {
  implemented: number;
  inProgress: number;
  planned: number;
  notPlanned: number;
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  cost: 'low' | 'medium' | 'high';
  benefits: string[];
  risks: string[];
}

export interface GasOptimization {
  summary: GasOptimizationSummary;
  opportunities: GasOptimizationOpportunity[];
  bestPractices: GasBestPractice[];
}

export interface GasOptimizationSummary {
  totalSavingsPotential: number;
  averageTransactionCost: number;
  optimizationScore: number; // 0-100
  categories: OptimizationCategory[];
}

export interface OptimizationCategory {
  category: string;
  savingsPotential: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface GasOptimizationOpportunity {
  id: string;
  title: string;
  location: CodeLocation;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
  risks: string[];
}

export interface GasBestPractice {
  practice: string;
  implemented: boolean;
  impact: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
}

export interface CodeQualityAssessment {
  overallScore: number; // 0-100
  metrics: QualityMetric[];
  issues: QualityIssue[];
  bestPractices: BestPracticeAdherence[];
}

export interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface QualityIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  examples: string[];
  recommendation: string;
}

export interface BestPracticeAdherence {
  practice: string;
  adherence: number; // 0-100
  violations: BestPracticeViolation[];
}

export interface BestPracticeViolation {
  location: CodeLocation;
  description: string;
  impact: string;
  fix: string;
}

export interface ComplianceAssessment {
  standards: ComplianceStandard[];
  overallCompliance: number; // 0-100
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceStandard {
  name: string;
  version: string;
  compliance: number; // 0-100
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  requirement: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  evidence: string;
  recommendation?: string;
}

export interface ComplianceRecommendation {
  standard: string;
  requirement: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  effort: string;
}

export interface Appendices {
  toolConfiguration: ToolConfiguration[];
  methodology: MethodologyDetails;
  glossary: GlossaryEntry[];
  riskMatrix: RiskMatrix;
}

export interface ToolConfiguration {
  tool: string;
  version: string;
  configuration: Record<string, any>;
  ruleset: string;
}

export interface MethodologyDetails {
  approach: string;
  phases: MethodologyPhase[];
  criteria: string[];
  limitations: string[];
}

export interface MethodologyPhase {
  phase: string;
  description: string;
  duration: string;
  deliverables: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  context?: string;
}

export interface RiskMatrix {
  dimensions: RiskDimension[];
  severityLevels: SeverityLevel[];
  likelihoodLevels: LikelihoodLevel[];
}

export interface RiskDimension {
  name: string;
  description: string;
  scale: string[];
}

export interface SeverityLevel {
  level: string;
  description: string;
  criteria: string[];
}

export interface LikelihoodLevel {
  level: string;
  description: string;
  criteria: string[];
}

export interface ContactInfo {
  organization: string;
  email: string;
  website: string;
  supportContact: string;
}
