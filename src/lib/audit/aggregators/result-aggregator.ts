import { Finding, GasOptimization, AuditResult } from '../audit-processor';
import { AuditReportGenerator } from '../report-generator';
import { StandardAuditReportGenerator } from '../standard-report-generator';
import { ProjectInfo, Finding as ReportFinding } from '../../types/audit-report-types';
import { StandardAuditReport } from '../../types/standard-audit-report';

export class ResultAggregator {
  private reportGenerator: AuditReportGenerator;
  private standardReportGenerator: StandardAuditReportGenerator;

  constructor() {
    this.reportGenerator = new AuditReportGenerator();
    this.standardReportGenerator = new StandardAuditReportGenerator();
  }

  async aggregate(params: {
    auditId: string;
    projectId: string;
    findings: Finding[];
    parseData: any;
    metadata: {
      analysisTime: number;
      linesOfCode: number;
      complexity: number;
      auditedAt: Date;
      language: string;
      tools: string[];
    };
  }): Promise<AuditResult & { detailedReport?: any }> {
    console.log(`Aggregating results for audit ${params.auditId}`);

    // Deduplicate findings
    const deduplicatedFindings = this.deduplicateFindings(params.findings);

    // Filter false positives
    const filteredFindings = this.filterFalsePositives(deduplicatedFindings);

    // Rank and prioritize
    const rankedFindings = this.rankFindings(filteredFindings);

    // Extract gas optimizations
    const gasOptimizations = this.extractGasOptimizations(rankedFindings);

    // Generate summary
    const summary = this.generateSummary(rankedFindings, gasOptimizations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(rankedFindings);

    // Generate basic report
    const report = this.generateReport(rankedFindings, summary, gasOptimizations);

    // Generate comprehensive detailed report
    const detailedReport = this.generateDetailedReport(params, rankedFindings, summary);

    console.log(`Aggregation complete: ${rankedFindings.length} findings, ${gasOptimizations.length} optimizations`);

    const result: AuditResult & { detailedReport?: any } = {
      auditId: params.auditId,
      projectId: params.projectId,
      status: 'completed',
      summary,
      findings: rankedFindings,
      recommendations,
      gasOptimizations,
      metadata: params.metadata,
      report,
      detailedReport
    };

    return result;
  }

  async aggregateResults(
    projectId: string,
    staticFindings: Finding[],
    semanticFindings: Finding[],
    aiFindings: Finding[],
    externalFindings: Finding[]
  ): Promise<{
    findings: Finding[];
    gasOptimizations: GasOptimization[];
    summary: AuditResult['summary'];
    recommendations: string[];
    report: AuditResult['report'];
  }> {
    console.log(`Aggregating results for project ${projectId}`);

    // Combine all findings
    const allFindings = [
      ...staticFindings,
      ...semanticFindings,
      ...aiFindings,
      ...externalFindings
    ];

    // Deduplicate findings
    const deduplicatedFindings = this.deduplicateFindings(allFindings);

    // Filter false positives
    const filteredFindings = this.filterFalsePositives(deduplicatedFindings);

    // Rank and prioritize
    const rankedFindings = this.rankFindings(filteredFindings);

    // Extract gas optimizations
    const gasOptimizations = this.extractGasOptimizations(rankedFindings);

    // Generate summary
    const summary = this.generateSummary(rankedFindings, gasOptimizations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(rankedFindings);

    // Generate report
    const report = this.generateReport(rankedFindings, summary, gasOptimizations);

    console.log(`Aggregation complete: ${rankedFindings.length} findings, ${gasOptimizations.length} optimizations`);

    return {
      findings: rankedFindings,
      gasOptimizations,
      summary,
      recommendations,
      report
    };
  }

  private deduplicateFindings(findings: Finding[]): Finding[] {
    const seen = new Map<string, Finding>();

    for (const finding of findings) {
      // Create a signature for deduplication
      const signature = this.createFindingSignature(finding);
      
      if (!seen.has(signature)) {
        seen.set(signature, finding);
      } else {
        // Merge confidence scores for duplicate findings
        const existing = seen.get(signature)!;
        existing.confidence = Math.max(existing.confidence, finding.confidence);
      }
    }

    return Array.from(seen.values());
  }

  private createFindingSignature(finding: Finding): string {
    // Create a signature based on key attributes for deduplication
    return `${finding.category}-${finding.location.file}-${finding.location.line}-${this.normalizeCode(finding.code)}`;
  }

  private normalizeCode(code: string): string {
    // Normalize code for comparison (remove whitespace, etc.)
    return code.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  private filterFalsePositives(findings: Finding[]): Finding[] {
    return findings.filter(finding => {
      // Filter low confidence findings
      if (finding.confidence < 0.3) {
        return false;
      }

      // Filter specific false positive patterns
      if (this.isFalsePositive(finding)) {
        return false;
      }

      return true;
    });
  }

  private isFalsePositive(finding: Finding): boolean {
    // Common false positive patterns
    const falsePositivePatterns = [
      // Test files
      /test.*\.rs$/i,
      /.*test.*\.move$/i,
      /.*_test\.cairo$/i,
      
      // Example/demo code
      /example/i,
      /demo/i,
      /sample/i,
      
      // Documentation
      /readme/i,
      /doc/i
    ];

    return falsePositivePatterns.some(pattern => 
      pattern.test(finding.location.file) || pattern.test(finding.title)
    );
  }

  private rankFindings(findings: Finding[]): Finding[] {
    return findings.sort((a, b) => {
      // Primary sort: severity
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) {
        return severityDiff;
      }

      // Secondary sort: exploitability
      const exploitabilityDiff = b.exploitability - a.exploitability;
      if (exploitabilityDiff !== 0) {
        return exploitabilityDiff;
      }

      // Tertiary sort: confidence
      return b.confidence - a.confidence;
    });
  }

  private extractGasOptimizations(findings: Finding[]): GasOptimization[] {
    const optimizations: GasOptimization[] = [];

    for (const finding of findings) {
      if (this.isGasOptimization(finding)) {
        const optimization = this.convertToGasOptimization(finding);
        if (optimization) {
          optimizations.push(optimization);
        }
      }
    }

    return optimizations;
  }

  private isGasOptimization(finding: Finding): boolean {
    const gasCategories = [
      'Gas Optimization',
      'Performance',
      'Efficiency'
    ];

    return gasCategories.includes(finding.category) ||
           finding.title.toLowerCase().includes('gas') ||
           finding.description.toLowerCase().includes('gas');
  }

  private convertToGasOptimization(finding: Finding): GasOptimization | null {
    // Extract gas savings estimate
    const gasSavings = this.estimateGasSavings(finding);
    if (gasSavings === 0) {
      return null;
    }

    return {
      id: `gas-opt-${finding.id}`,
      title: finding.title,
      description: finding.description,
      location: finding.location,
      originalCode: finding.code,
      optimizedCode: this.generateOptimizedCode(finding),
      gasSavings,
      effort: this.estimateEffort(finding)
    };
  }

  private estimateGasSavings(finding: Finding): number {
    // Estimate gas savings based on finding type
    const gasSavingsMap: { [key: string]: number } = {
      'loop optimization': 1000,
      'storage optimization': 2000,
      'function optimization': 500,
      'arithmetic optimization': 200,
      'memory optimization': 800
    };

    const findingText = (finding.title + ' ' + finding.description).toLowerCase();
    
    for (const [pattern, savings] of Object.entries(gasSavingsMap)) {
      if (findingText.includes(pattern)) {
        return savings;
      }
    }

    return 0;
  }

  private generateOptimizedCode(finding: Finding): string {
    // Generate optimized code suggestion
    // This is a simplified version - real implementation would be more sophisticated
    
    if (finding.recommendation.includes('use')) {
      const match = finding.recommendation.match(/use (.+)/i);
      return match ? match[1] : finding.code;
    }

    return finding.code + ' // Optimized version';
  }

  private estimateEffort(finding: Finding): 'low' | 'medium' | 'high' {
    const effortKeywords = {
      low: ['replace', 'change', 'use'],
      medium: ['refactor', 'modify', 'update'],
      high: ['redesign', 'rewrite', 'restructure']
    };

    const recommendationText = finding.recommendation.toLowerCase();

    for (const [effort, keywords] of Object.entries(effortKeywords)) {
      if (keywords.some(keyword => recommendationText.includes(keyword))) {
        return effort as 'low' | 'medium' | 'high';
      }
    }

    // Default based on severity
    switch (finding.severity) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateSummary(findings: Finding[], gasOptimizations: GasOptimization[]): AuditResult['summary'] {
    const severityCounts = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const securityScore = this.calculateSecurityScore(findings);
    const gasOptimizationScore = this.calculateGasOptimizationScore(gasOptimizations);

    return {
      totalVulnerabilities: findings.length,
      criticalIssues: severityCounts.critical || 0,
      highIssues: severityCounts.high || 0,
      mediumIssues: severityCounts.medium || 0,
      lowIssues: severityCounts.low || 0,
      securityScore,
      gasOptimizationScore
    };
  }

  private calculateSecurityScore(findings: Finding[]): number {
    if (findings.length === 0) {
      return 100;
    }

    // Weight findings by severity
    const severityWeights = { critical: 40, high: 20, medium: 10, low: 5 };
    const totalDeductions = findings.reduce((sum, finding) => {
      return sum + (severityWeights[finding.severity] || 0);
    }, 0);

    // Cap the score between 0 and 100
    return Math.max(0, Math.min(100, 100 - totalDeductions));
  }

  private calculateGasOptimizationScore(optimizations: GasOptimization[]): number {
    if (optimizations.length === 0) {
      return 100;
    }

    // Score based on potential gas savings
    const totalSavings = optimizations.reduce((sum, opt) => sum + opt.gasSavings, 0);
    
    // Normalize to 0-100 scale (10,000 gas = 50 points deduction)
    const deduction = Math.min(50, totalSavings / 200);
    
    return Math.max(0, 100 - deduction);
  }

  private generateRecommendations(findings: Finding[]): string[] {
    const recommendations = new Set<string>();

    // High-level recommendations based on finding patterns
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.add('Critical security vulnerabilities detected. Immediate remediation required before deployment.');
    }

    if (highFindings.length > 0) {
      recommendations.add('High-severity issues found. Address these before production deployment.');
    }

    // Category-specific recommendations
    const categories = [...new Set(findings.map(f => f.category))];
    
    for (const category of categories) {
      const categoryFindings = findings.filter(f => f.category === category);
      if (categoryFindings.length >= 3) {
        recommendations.add(`Multiple ${category.toLowerCase()} issues detected. Consider a comprehensive review of ${category.toLowerCase()} patterns.`);
      }
    }

    // General recommendations
    recommendations.add('Implement comprehensive testing including unit tests, integration tests, and security tests.');
    recommendations.add('Consider formal verification for critical functions.');
    recommendations.add('Implement proper access controls and input validation.');
    recommendations.add('Follow secure coding best practices for your blockchain platform.');

    return Array.from(recommendations);
  }

  private generateReport(
    findings: Finding[],
    summary: AuditResult['summary'],
    gasOptimizations: GasOptimization[]
  ): AuditResult['report'] {
    const executiveSummary = this.generateExecutiveSummary(summary, findings);
    const technicalDetails = this.generateTechnicalDetails(findings);
    const riskAssessment = this.generateRiskAssessment(findings, summary);

    return {
      executiveSummary,
      technicalDetails,
      riskAssessment
    };
  }

  private generateExecutiveSummary(summary: AuditResult['summary'], findings: Finding[]): string {
    const criticalCount = summary.criticalIssues;
    const highCount = summary.highIssues;
    const totalCount = summary.totalVulnerabilities;

    let riskLevel = 'Low';
    if (criticalCount > 0) {
      riskLevel = 'Critical';
    } else if (highCount > 0) {
      riskLevel = 'High';
    } else if (summary.mediumIssues > 0) {
      riskLevel = 'Medium';
    }

    return `
**Executive Summary**

The security audit identified ${totalCount} potential issues in the smart contract code. 

**Risk Assessment:** ${riskLevel}
**Security Score:** ${summary.securityScore}/100
**Gas Optimization Score:** ${summary.gasOptimizationScore}/100

**Issue Breakdown:**
- Critical: ${summary.criticalIssues}
- High: ${summary.highIssues}  
- Medium: ${summary.mediumIssues}
- Low: ${summary.lowIssues}

${criticalCount > 0 ? '⚠️ **CRITICAL**: Immediate action required before deployment.' : ''}
${highCount > 0 ? '⚠️ **HIGH PRIORITY**: Address these issues before production.' : ''}

**Key Recommendations:**
${this.getTopRecommendations(findings).map(rec => `- ${rec}`).join('\n')}
    `.trim();
  }

  private generateTechnicalDetails(findings: Finding[]): string {
    const categories = [...new Set(findings.map(f => f.category))];
    
    let technicalDetails = '**Technical Analysis**\n\n';
    
    for (const category of categories) {
      const categoryFindings = findings.filter(f => f.category === category);
      technicalDetails += `**${category}** (${categoryFindings.length} issues)\n`;
      
      for (const finding of categoryFindings.slice(0, 3)) { // Top 3 per category
        technicalDetails += `- ${finding.title} (${finding.severity})\n`;
        technicalDetails += `  Location: ${finding.location.file}:${finding.location.line}\n`;
        technicalDetails += `  ${finding.description}\n\n`;
      }
    }

    return technicalDetails;
  }

  private generateRiskAssessment(findings: Finding[], summary: AuditResult['summary']): string {
    const highRiskFindings = findings.filter(f => 
      (f.severity === 'critical' || f.severity === 'high') && 
      f.exploitability > 0.6
    );

    let assessment = '**Risk Assessment**\n\n';
    
    if (highRiskFindings.length > 0) {
      assessment += `**HIGH RISK VULNERABILITIES DETECTED**\n\n`;
      assessment += `${highRiskFindings.length} vulnerabilities pose significant risk:\n\n`;
      
      for (const finding of highRiskFindings.slice(0, 5)) {
        assessment += `- **${finding.title}** (${finding.severity})\n`;
        assessment += `  Exploitability: ${(finding.exploitability * 100).toFixed(0)}%\n`;
        assessment += `  Impact: ${finding.description}\n\n`;
      }
    }

    assessment += `**Overall Security Posture:** ${this.getSecurityPosture(summary.securityScore)}\n\n`;
    assessment += `**Deployment Recommendation:** ${this.getDeploymentRecommendation(summary)}\n`;

    return assessment;
  }

  private getTopRecommendations(findings: Finding[]): string[] {
    const recommendations = findings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 5)
      .map(f => f.recommendation);
      
    return [...new Set(recommendations)];
  }

  private getSecurityPosture(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  private getDeploymentRecommendation(summary: AuditResult['summary']): string {
    if (summary.criticalIssues > 0) {
      return 'DO NOT DEPLOY - Critical vulnerabilities must be fixed first';
    }
    if (summary.highIssues > 0) {
      return 'DELAY DEPLOYMENT - Address high-severity issues before production';
    }
    if (summary.mediumIssues > 3) {
      return 'CAUTION - Consider fixing medium-severity issues before deployment';
    }
    return 'READY FOR DEPLOYMENT - No critical issues found';
  }

  private generateDetailedReport(params: any, findings: Finding[], summary: any): StandardAuditReport {
    try {
      // Extract project info from params
      const projectName = this.extractProjectName(params);
      const language = params.metadata?.language || 'Unknown';
      const files = this.extractFileNames(findings);

      // Generate standardized audit report using the new format
      const standardReport = this.standardReportGenerator.generateStandardReport(
        params.auditId,
        params.projectId,
        projectName,
        language,
        findings,
        files,
        params.metadata
      );

      console.log(`Generated standardized audit report: ${standardReport.report_metadata.report_id}`);
      return standardReport;

    } catch (error) {
      console.error('Failed to generate detailed report:', error);
      
      // Return fallback report structure
      return this.generateFallbackReport(params, findings, summary);
    }
  }

  private extractProjectName(params: any): string {
    if (params.projectName) return params.projectName;
    if (params.parseData?.projectName) return params.parseData.projectName;
    return `Project-${params.projectId?.slice(-8) || 'Unknown'}`;
  }

  private extractFileNames(findings: Finding[]): string[] {
    const files = new Set<string>();
    findings.forEach(finding => {
      if (finding.location?.file) {
        files.add(finding.location.file);
      }
    });
    return Array.from(files);
  }

  private generateFallbackReport(params: any, findings: Finding[], summary: any): StandardAuditReport {
    return {
      report_metadata: {
        report_id: `AUDIT-${new Date().getFullYear()}-${params.auditId?.slice(-4) || '0000'}`,
        platform: "Multi-Chain",
        language: params.metadata?.language || 'Unknown',
        auditor: "LokaAudit AI Engine v2.0",
        audit_date: new Date().toISOString(),
        version: "2.0.0",
        target_contract: {
          name: this.extractProjectName(params),
          files: this.extractFileNames(findings)
        }
      },
      summary: {
        total_issues: findings.length,
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length,
        informational: 0,
        security_score: summary?.securityScore || 50,
        overall_risk_level: findings.some(f => f.severity === 'critical') ? 'Critical' : 'Medium',
        recommendation: "Review findings and implement recommended fixes."
      },
      findings: [],
      recommendations: {
        security_best_practices: ["Implement secure coding practices"],
        future_improvements: ["Regular security audits"]
      },
      appendix: {
        tools_used: params.metadata?.tools || ['Static Analysis'],
        glossary: {}
      }
    };
  }

  private mapLanguageToBlockchain(language: string): string {
    if (language.includes('Solana')) return 'Solana';
    if (language.includes('Near')) return 'Near Protocol';
    if (language.includes('Aptos')) return 'Aptos';
    if (language.includes('Sui')) return 'Sui';
    if (language.includes('StarkNet')) return 'StarkNet';
    if (language.includes('Rust')) return 'Solana';
    if (language.includes('Move')) return 'Aptos';
    if (language.includes('Cairo')) return 'StarkNet';
    return 'Unknown';
  }

  private detectFramework(language: string): string | undefined {
    if (language.includes('Solana') || language.includes('Rust')) return 'Anchor Framework';
    if (language.includes('Move')) return 'Move Framework';
    if (language.includes('Cairo')) return 'Cairo Framework';
    return undefined;
  }

  private countFiles(params: any): number {
    return params.parseData?.ast ? Object.keys(params.parseData.ast).length : 1;
  }
}
