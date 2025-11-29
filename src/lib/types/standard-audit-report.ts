// Standardized Audit Report Format
// This matches the exact JSON structure requested by the user

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
  audit_date: string; // ISO format
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
  security_score: number; // 0-100
  overall_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
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
  confidence?: number; // 0.0-1.0
  cwe?: string;
  exploitability?: number; // 0.0-1.0
}

export interface AuditRecommendations {
  security_best_practices: string[];
  future_improvements: string[];
  immediate_actions?: string[];
  long_term_strategies?: string[];
}

export interface AuditAppendix {
  tools_used: string[];
  glossary: Record<string, string>;
  methodology?: string[];
  analysis_duration?: string;
  code_coverage?: {
    total_lines: number;
    analyzed_lines: number;
    coverage_percentage: number;
  };
}
