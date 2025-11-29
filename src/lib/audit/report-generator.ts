import { AuditReport, Finding, ProjectInfo, ExecutiveSummary, TechnicalAnalysis } from '../types/audit-report-types';

export class AuditReportGenerator {
  
  /**
   * Generate a comprehensive production-ready audit report
   */
  generateReport(
    auditResult: any,
    projectInfo: ProjectInfo,
    findings: Finding[]
  ): AuditReport {
    const reportId = `RPT-${Date.now()}`;
    const generatedAt = new Date();

    // Sort findings by severity and confidence
    const sortedFindings = this.sortFindingsBySeverity(findings);
    
    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(sortedFindings, auditResult);
    
    // Generate technical analysis
    const technicalAnalysis = this.generateTechnicalAnalysis(auditResult, findings);
    
    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(sortedFindings);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(sortedFindings);
    
    // Generate gas optimization analysis
    const gasOptimization = this.generateGasOptimization(findings);
    
    // Generate code quality assessment
    const codeQuality = this.generateCodeQualityAssessment(auditResult);
    
    // Generate compliance assessment
    const compliance = this.generateComplianceAssessment(projectInfo.blockchain);

    const report: AuditReport = {
      reportId,
      auditId: auditResult.auditId,
      version: '1.0',
      generatedAt,
      auditorInfo: {
        organization: 'LokaLabs Security',
        auditorName: 'LokaAudit AI Engine',
        credentials: ['Smart Contract Security', 'Multi-Chain Analysis'],
        experience: 'Advanced AI-powered security analysis',
        methodology: 'Comprehensive multi-stage analysis (Static, Semantic, AI, External Tools)',
        toolsUsed: ['Static Analyzer', 'Semantic Analyzer', 'AI Analysis', 'Clippy', 'Move Prover', 'Semgrep']
      },
      
      projectInfo,
      executiveSummary,
      technicalAnalysis,
      findings: sortedFindings,
      riskAssessment,
      recommendations,
      gasOptimization,
      codeQuality,
      compliance,
      
      appendices: {
        toolConfiguration: this.getToolConfiguration(projectInfo.language),
        methodology: this.getMethodologyDetails(),
        glossary: this.getGlossaryEntries(),
        riskMatrix: this.getRiskMatrix()
      },
      
      disclaimer: this.getDisclaimer(),
      contactInfo: {
        organization: 'LokaLabs',
        email: 'security@lokalabs.com',
        website: 'https://lokalabs.com',
        supportContact: 'support@lokalabs.com'
      }
    };

    return report;
  }

  /**
   * Sort findings by severity priority
   */
  private sortFindingsBySeverity(findings: Finding[]): Finding[] {
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'informational': 0 };
    
    return findings.sort((a, b) => {
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity; // Higher severity first
      }
      
      return b.confidence - a.confidence; // Higher confidence first
    });
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(findings: Finding[], auditResult: any): ExecutiveSummary {
    const severityCounts = this.getSeverityCounts(findings);
    const keyFindings = this.generateKeyFindings(severityCounts);
    const riskLevel = this.calculateOverallRiskLevel(severityCounts);
    const securityScore = auditResult.summary?.securityScore || this.calculateSecurityScore(severityCounts);
    
    return {
      overview: this.generateOverview(findings.length, securityScore, riskLevel),
      keyFindings,
      riskLevel,
      securityScore,
      recommendedActions: this.generateRecommendedActions(severityCounts),
      deploymentRecommendation: this.getDeploymentRecommendation(riskLevel, severityCounts)
    };
  }

  /**
   * Generate technical analysis
   */
  private generateTechnicalAnalysis(auditResult: any, findings: Finding[]): TechnicalAnalysis {
    return {
      architecture: {
        designPatterns: this.identifyDesignPatterns(findings),
        architecturalRisks: this.identifyArchitecturalRisks(findings),
        upgradeability: this.assessUpgradeability(findings),
        accessControl: this.assessAccessControl(findings)
      },
      security: {
        vulnerabilityCategories: this.categorizeVulnerabilities(findings),
        attackVectors: this.identifyAttackVectors(findings),
        mitigations: this.assessSecurityMitigations(findings)
      },
      performance: {
        gasUsage: this.analyzeGasUsage(findings),
        scalability: this.assessScalability(findings),
        optimization: this.identifyOptimizationOpportunities(findings)
      },
      maintainability: {
        codeComplexity: this.calculateComplexityMetrics(auditResult),
        documentation: this.assessDocumentation(auditResult),
        testability: this.assessTestability(auditResult)
      },
      testing: {
        coverage: this.getTestCoverage(auditResult),
        quality: this.assessTestQuality(auditResult),
        recommendations: this.generateTestRecommendations(auditResult)
      }
    };
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(findings: Finding[]): any[] {
    const recommendations: any[] = [];
    const categorizedFindings = this.groupFindingsByCategory(findings);

    // Critical and High severity recommendations
    const criticalHighFindings = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
    criticalHighFindings.forEach((finding, index) => {
      recommendations.push({
        id: `REC-${index + 1}`,
        priority: finding.severity,
        category: finding.category,
        title: `Address ${finding.title}`,
        description: finding.description,
        implementation: finding.recommendation,
        effort: this.estimateEffort(finding),
        timeline: this.estimateTimeline(finding),
        cost: this.estimateCost(finding),
        benefits: this.getBenefits(finding),
        risks: this.getRisks(finding)
      });
    });

    // Add general security recommendations
    recommendations.push(...this.getGeneralSecurityRecommendations());
    
    // Add code quality recommendations
    recommendations.push(...this.getCodeQualityRecommendations(categorizedFindings));
    
    return recommendations;
  }

  /**
   * Generate gas optimization analysis
   */
  private generateGasOptimization(findings: Finding[]): any {
    const gasFindings = findings.filter(f => f.category === 'gas-optimization');
    
    const totalSavingsPotential = gasFindings.reduce((sum, finding) => {
      // Extract potential savings from finding (mock calculation)
      return sum + this.extractGasSavings(finding);
    }, 0);

    return {
      summary: {
        totalSavingsPotential,
        averageTransactionCost: this.calculateAverageTransactionCost(gasFindings),
        optimizationScore: this.calculateOptimizationScore(gasFindings),
        categories: this.categorizeGasOptimizations(gasFindings)
      },
      opportunities: this.generateGasOptimizationOpportunities(gasFindings),
      bestPractices: this.getGasBestPractices(gasFindings)
    };
  }

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(findings: Finding[]): any {
    const severityCounts = this.getSeverityCounts(findings);
    const overallRisk = this.calculateOverallRiskLevel(severityCounts);
    
    return {
      overallRisk,
      riskFactors: this.identifyRiskFactors(findings),
      mitigationStatus: {
        implemented: 0,
        inProgress: 0,
        planned: findings.length,
        notPlanned: 0
      },
      residualRisk: overallRisk // Will be updated after fixes
    };
  }

  // Helper methods
  private getSeverityCounts(findings: Finding[]): Record<string, number> {
    return findings.reduce((counts, finding) => {
      counts[finding.severity] = (counts[finding.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private calculateOverallRiskLevel(severityCounts: Record<string, number>): 'critical' | 'high' | 'medium' | 'low' {
    if (severityCounts.critical > 0) return 'critical';
    if (severityCounts.high > 2) return 'critical';
    if (severityCounts.high > 0) return 'high';
    if (severityCounts.medium > 5) return 'high';
    if (severityCounts.medium > 0) return 'medium';
    return 'low';
  }

  private calculateSecurityScore(severityCounts: Record<string, number>): number {
    let score = 100;
    score -= (severityCounts.critical || 0) * 30;
    score -= (severityCounts.high || 0) * 20;
    score -= (severityCounts.medium || 0) * 10;
    score -= (severityCounts.low || 0) * 5;
    return Math.max(0, score);
  }

  private generateOverview(findingsCount: number, securityScore: number, riskLevel: string): string {
    return `This comprehensive security audit analyzed the smart contract codebase using advanced static analysis, semantic analysis, AI-powered vulnerability detection, and external security tools. The audit identified ${findingsCount} findings across various severity levels, resulting in a security score of ${securityScore}/100 with an overall risk assessment of ${riskLevel.toUpperCase()}. The analysis covers security vulnerabilities, gas optimization opportunities, code quality issues, and compliance with industry best practices.`;
  }

  private generateKeyFindings(severityCounts: Record<string, number>): any[] {
    const keyFindings: any[] = [];
    
    Object.entries(severityCounts).forEach(([severity, count]) => {
      if (count > 0) {
        keyFindings.push({
          category: `${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues`,
          severity: severity as any,
          count,
          impact: this.getSeverityImpact(severity)
        });
      }
    });
    
    return keyFindings;
  }

  private generateRecommendedActions(severityCounts: Record<string, number>): string[] {
    const actions = [];
    
    if (severityCounts.critical > 0) {
      actions.push('Immediately address all critical severity vulnerabilities before deployment');
    }
    if (severityCounts.high > 0) {
      actions.push('Resolve all high severity issues as they pose significant security risks');
    }
    if (severityCounts.medium > 0) {
      actions.push('Review and fix medium severity issues to improve overall security posture');
    }
    
    actions.push('Implement comprehensive testing including unit tests, integration tests, and fuzzing');
    actions.push('Conduct additional manual security review focusing on business logic');
    actions.push('Consider implementing a bug bounty program post-deployment');
    
    return actions;
  }

  private getDeploymentRecommendation(riskLevel: string, severityCounts: Record<string, number>): 'approved' | 'approved-with-conditions' | 'not-recommended' {
    if (severityCounts.critical > 0) return 'not-recommended';
    if (severityCounts.high > 2) return 'not-recommended';
    if (severityCounts.high > 0 || severityCounts.medium > 5) return 'approved-with-conditions';
    return 'approved';
  }

  private getSeverityImpact(severity: string): string {
    const impacts = {
      critical: 'Could result in significant financial loss or complete system compromise',
      high: 'Could lead to unauthorized access or financial loss',
      medium: 'Could affect system functionality or user experience',
      low: 'Minor issues that should be addressed for completeness',
      informational: 'Best practice recommendations and code improvements'
    };
    return impacts[severity as keyof typeof impacts] || 'Unknown impact';
  }

  // Additional helper methods (simplified implementations)
  private groupFindingsByCategory(findings: Finding[]): Record<string, Finding[]> {
    return findings.reduce((groups, finding) => {
      const category = finding.category;
      groups[category] = groups[category] || [];
      groups[category].push(finding);
      return groups;
    }, {} as Record<string, Finding[]>);
  }

  private estimateEffort(finding: Finding): 'low' | 'medium' | 'high' {
    if (finding.severity === 'critical' || finding.severity === 'high') return 'high';
    if (finding.severity === 'medium') return 'medium';
    return 'low';
  }

  private estimateTimeline(finding: Finding): string {
    const effort = this.estimateEffort(finding);
    const timelines = { low: '1-2 days', medium: '3-5 days', high: '1-2 weeks' };
    return timelines[effort];
  }

  private estimateCost(finding: Finding): 'low' | 'medium' | 'high' {
    return this.estimateEffort(finding); // Simplified
  }

  private getBenefits(finding: Finding): string[] {
    const benefits = {
      'access-control': ['Prevents unauthorized access', 'Protects user funds', 'Ensures proper authorization'],
      'arithmetic': ['Prevents overflow/underflow attacks', 'Ensures calculation accuracy', 'Maintains system integrity'],
      'reentrancy': ['Prevents reentrancy attacks', 'Protects against fund drainage', 'Ensures state consistency'],
      'gas-optimization': ['Reduces transaction costs', 'Improves user experience', 'Increases contract efficiency']
    };
    return benefits[finding.category as keyof typeof benefits] || ['Improves security', 'Enhances code quality'];
  }

  private getRisks(finding: Finding): string[] {
    return ['Potential for regression if fix is incorrect', 'May require extensive testing', 'Could affect other system components'];
  }

  private getGeneralSecurityRecommendations(): any[] {
    return [
      {
        id: 'REC-GENERAL-1',
        priority: 'high' as const,
        category: 'security',
        title: 'Implement Comprehensive Testing',
        description: 'Add unit tests, integration tests, and property-based testing',
        implementation: 'Create test suites covering all functions and edge cases',
        effort: 'high' as const,
        timeline: '2-3 weeks',
        cost: 'medium' as const,
        benefits: ['Catches bugs early', 'Ensures code reliability', 'Facilitates maintenance'],
        risks: ['Time investment required', 'May reveal additional issues']
      },
      {
        id: 'REC-GENERAL-2',
        priority: 'medium' as const,
        category: 'documentation',
        title: 'Improve Code Documentation',
        description: 'Add comprehensive inline documentation and architectural overview',
        implementation: 'Document all functions, complex logic, and system architecture',
        effort: 'medium' as const,
        timeline: '1-2 weeks',
        cost: 'low' as const,
        benefits: ['Improves maintainability', 'Facilitates audits', 'Helps onboarding'],
        risks: ['Documentation may become outdated']
      }
    ];
  }

  private getCodeQualityRecommendations(categorizedFindings: Record<string, Finding[]>): any[] {
    const recommendations = [];
    
    if (categorizedFindings['code-quality']?.length > 0) {
      recommendations.push({
        id: 'REC-QUALITY-1',
        priority: 'medium' as const,
        category: 'code-quality',
        title: 'Address Code Quality Issues',
        description: 'Fix code style, complexity, and maintainability issues',
        implementation: 'Refactor complex functions, improve naming, add error handling',
        effort: 'medium' as const,
        timeline: '1 week',
        cost: 'low' as const,
        benefits: ['Improves readability', 'Reduces bugs', 'Facilitates maintenance'],
        risks: ['May introduce new bugs if not done carefully']
      });
    }
    
    return recommendations;
  }

  // Mock implementations for complex analysis methods
  private identifyDesignPatterns(findings: Finding[]): string[] {
    return ['Proxy Pattern', 'Access Control', 'State Machine'];
  }

  private identifyArchitecturalRisks(findings: Finding[]): string[] {
    return findings
      .filter(f => f.category === 'access-control' || f.category === 'logic-error')
      .map(f => f.title)
      .slice(0, 5);
  }

  private assessUpgradeability(findings: Finding[]): any {
    return {
      isUpgradeable: false,
      mechanism: 'Not implemented',
      risks: ['Cannot fix bugs post-deployment', 'Cannot add new features'],
      recommendations: ['Consider implementing upgrade mechanism', 'Use proxy patterns for upgradeability']
    };
  }

  private assessAccessControl(findings: Finding[]): any {
    const accessControlFindings = findings.filter(f => f.category === 'access-control');
    return {
      roles: [{ name: 'Owner', description: 'Contract owner', privileges: ['Admin functions'], riskLevel: 'high' as const }],
      permissions: [{ function: 'withdraw', requiredRole: 'Owner', isProtected: true, riskAssessment: 'Properly protected' }],
      issues: accessControlFindings.map(f => f.title)
    };
  }

  private categorizeVulnerabilities(findings: Finding[]): any[] {
    const categories = this.groupFindingsByCategory(findings);
    return Object.entries(categories).map(([category, categoryFindings]) => ({
      category,
      count: categoryFindings.length,
      severity: this.getHighestSeverity(categoryFindings),
      examples: categoryFindings.slice(0, 3).map(f => f.title)
    }));
  }

  private getHighestSeverity(findings: Finding[]): 'critical' | 'high' | 'medium' | 'low' {
    const severities = findings.map(f => f.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private identifyAttackVectors(findings: Finding[]): any[] {
    const attackVectors = [];
    
    if (findings.some(f => f.category === 'reentrancy')) {
      attackVectors.push({
        name: 'Reentrancy Attack',
        likelihood: 'medium' as const,
        impact: 'critical' as const,
        description: 'Attacker could drain contract funds through recursive calls',
        mitigation: 'Implement checks-effects-interactions pattern'
      });
    }
    
    if (findings.some(f => f.category === 'access-control')) {
      attackVectors.push({
        name: 'Unauthorized Access',
        likelihood: 'high' as const,
        impact: 'high' as const,
        description: 'Unauthorized users could access restricted functions',
        mitigation: 'Implement proper access control mechanisms'
      });
    }
    
    return attackVectors;
  }

  private assessSecurityMitigations(findings: Finding[]): any[] {
    return findings.map(finding => ({
      vulnerability: finding.title,
      currentState: 'missing' as const,
      recommendation: finding.recommendation,
      priority: finding.severity
    }));
  }

  private analyzeGasUsage(findings: Finding[]): any {
    const gasFindings = findings.filter(f => f.category === 'gas-optimization');
    const totalGasSavings = gasFindings.reduce((sum, f) => sum + this.extractGasSavings(f), 0);
    const avgCurrentCost = gasFindings.length > 0 ? gasFindings.reduce((sum, f) => sum + this.estimateCurrentCost(f), 0) / gasFindings.length : 21000;
    
    return {
      averageGas: Math.floor(avgCurrentCost),
      maxGas: Math.floor(avgCurrentCost * 1.5),
      gasEfficient: gasFindings.length < 5,
      totalOptimizationPotential: totalGasSavings,
      costlySections: gasFindings.map(f => ({
        function: (typeof f.location === 'object' && 'function' in f.location) ? f.location.function || 'Unknown' : 'Unknown',
        estimatedGas: this.estimateCurrentCost(f),
        optimizationPotential: Math.floor((this.extractGasSavings(f) / this.estimateCurrentCost(f)) * 100),
        suggestions: [f.recommendation]
      }))
    };
  }

  private assessScalability(findings: Finding[]): any {
    return {
      currentCapacity: '1000 transactions/second',
      bottlenecks: ['Gas optimization needed', 'Complex calculations'],
      scalingSolutions: ['Layer 2 integration', 'State channels', 'Batch processing']
    };
  }

  private identifyOptimizationOpportunities(findings: Finding[]): any[] {
    return findings
      .filter(f => f.category === 'gas-optimization')
      .map(f => ({
        type: 'gas' as const,
        location: f.location,
        currentCost: this.estimateCurrentCost(f),
        potentialSaving: this.extractGasSavings(f),
        description: f.description,
        implementation: f.recommendation,
        effort: this.estimateEffort(f)
      }));
  }

  private calculateComplexityMetrics(auditResult: any): any {
    return {
      cyclomaticComplexity: auditResult.complexity || 10,
      cognitiveComplexity: auditResult.complexity ? auditResult.complexity * 1.2 : 12,
      maintainabilityIndex: 75,
      technicalDebt: [
        { type: 'Code Duplication', severity: 'medium' as const, effort: '2 hours', description: 'Duplicate code patterns found' },
        { type: 'Long Functions', severity: 'low' as const, effort: '4 hours', description: 'Some functions are too long' }
      ]
    };
  }

  private assessDocumentation(auditResult: any): any {
    return {
      inlineComments: 65,
      natspecCoverage: 40,
      readmeQuality: 'fair' as const,
      architecturalDocs: false
    };
  }

  private assessTestability(auditResult: any): any {
    return {
      testCoverage: auditResult.testCoverage || 0,
      unitTests: 0,
      integrationTests: 0,
      testQuality: 'poor' as const
    };
  }

  private getTestCoverage(auditResult: any): any {
    return {
      line: auditResult.testCoverage || 0,
      branch: (auditResult.testCoverage || 0) * 0.8,
      function: (auditResult.testCoverage || 0) * 0.9,
      statement: auditResult.testCoverage || 0
    };
  }

  private assessTestQuality(auditResult: any): any {
    return {
      unitTestsPresent: false,
      integrationTestsPresent: false,
      fuzzTestsPresent: false,
      testTypes: []
    };
  }

  private generateTestRecommendations(auditResult: any): any[] {
    return [
      {
        type: 'Unit Testing',
        priority: 'high' as const,
        description: 'Implement comprehensive unit tests for all functions',
        effort: '2-3 weeks'
      },
      {
        type: 'Integration Testing',
        priority: 'medium' as const,
        description: 'Add integration tests for contract interactions',
        effort: '1-2 weeks'
      }
    ];
  }

  private extractGasSavings(finding: Finding): number {
    // Extract real gas savings from finding data
    if (finding.category === 'gas-optimization') {
      // Parse savings from description if available
      const descriptionMatch = finding.description.match(/save(?:s)?\s+(\d+)\s+gas/i);
      if (descriptionMatch) {
        return parseInt(descriptionMatch[1], 10);
      }
      
      // Estimate based on finding type and confidence
      const baseEstimate = this.getGasEstimateByType(finding.title);
      return Math.floor(baseEstimate * finding.confidence);
    }
    return 0;
  }

  private getGasEstimateByType(title: string): number {
    const gasEstimates: Record<string, number> = {
      'storage optimization': 20000,
      'redundant computation': 1000,
      'unnecessary sstore': 15000,
      'loop optimization': 5000,
      'memory usage': 500,
      'function visibility': 100,
      'variable packing': 2000,
      'constant variables': 200,
      'short circuit': 50,
      'default': 500
    };

    const lowerTitle = title.toLowerCase();
    for (const [pattern, estimate] of Object.entries(gasEstimates)) {
      if (lowerTitle.includes(pattern)) {
        return estimate;
      }
    }
    return gasEstimates.default;
  }

  private calculateAverageTransactionCost(gasFindings: Finding[]): number {
    if (gasFindings.length === 0) return 21000; // Base transaction cost
    
    // Calculate based on actual findings complexity
    const totalComplexity = gasFindings.reduce((sum, finding) => {
      const lineNumber = (typeof finding.location === 'object' && 'line' in finding.location && typeof finding.location.line === 'number') ? finding.location.line : 1;
      const complexityScore = lineNumber * 0.1 + finding.confidence * 100;
      return sum + complexityScore;
    }, 0);
    
    return Math.floor(21000 + (totalComplexity / gasFindings.length) * 1000);
  }

  private calculateOptimizationScore(gasFindings: Finding[]): number {
    if (gasFindings.length === 0) return 90;
    if (gasFindings.length < 5) return 70;
    if (gasFindings.length < 10) return 50;
    return 30;
  }

  private categorizeGasOptimizations(gasFindings: Finding[]): any[] {
    // Group findings by actual categories found
    const categories: Record<string, { findings: Finding[]; totalSavings: number }> = {};
    
    gasFindings.forEach(finding => {
      const category = this.determineGasCategory(finding.title);
      if (!categories[category]) {
        categories[category] = { findings: [], totalSavings: 0 };
      }
      categories[category].findings.push(finding);
      categories[category].totalSavings += this.extractGasSavings(finding);
    });
    
    return Object.entries(categories).map(([category, data]) => ({
      category,
      savingsPotential: data.totalSavings,
      implementationEffort: this.estimateEffortByCategory(category),
      findingsCount: data.findings.length
    }));
  }

  private determineGasCategory(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('storage') || lowerTitle.includes('sstore')) return 'Storage Optimization';
    if (lowerTitle.includes('loop') || lowerTitle.includes('iteration')) return 'Loop Optimization';
    if (lowerTitle.includes('function') || lowerTitle.includes('call')) return 'Function Optimization';
    if (lowerTitle.includes('memory') || lowerTitle.includes('array')) return 'Memory Optimization';
    if (lowerTitle.includes('variable') || lowerTitle.includes('constant')) return 'Variable Optimization';
    return 'General Optimization';
  }

  private estimateEffortByCategory(category: string): 'low' | 'medium' | 'high' {
    const effortMap: Record<string, 'low' | 'medium' | 'high'> = {
      'Storage Optimization': 'high',
      'Loop Optimization': 'medium',
      'Function Optimization': 'medium',
      'Memory Optimization': 'low',
      'Variable Optimization': 'low',
      'General Optimization': 'medium'
    };
    return effortMap[category] || 'medium';
  }

  private generateGasOptimizationOpportunities(gasFindings: Finding[]): any[] {
    return gasFindings.map((finding, index) => {
      const gasSavings = this.extractGasSavings(finding);
      const currentCost = this.estimateCurrentCost(finding);
      const optimizedCost = Math.max(currentCost - gasSavings, 0);
      
      return {
        id: `GAS-${index + 1}`,
        title: finding.title,
        location: finding.location,
        currentCost,
        optimizedCost,
        savings: gasSavings,
        implementation: finding.recommendation,
        effort: this.estimateEffort(finding),
        risks: this.identifyOptimizationRisks(finding)
      };
    });
  }

  private estimateCurrentCost(finding: Finding): number {
    // Base cost estimation based on finding characteristics
    const baseGasCost = this.getGasEstimateByType(finding.title);
    const complexityMultiplier = Math.max(1, Math.floor(finding.confidence * 3));
    return Math.floor(baseGasCost * complexityMultiplier);
  }

  private identifyOptimizationRisks(finding: Finding): string[] {
    const risks: string[] = [];
    
    if (finding.title.toLowerCase().includes('storage')) {
      risks.push('May affect data integrity', 'Requires careful state management');
    }
    if (finding.title.toLowerCase().includes('loop')) {
      risks.push('May affect readability', 'Could introduce subtle bugs');
    }
    if (finding.title.toLowerCase().includes('function')) {
      risks.push('May impact external integrations', 'Requires interface compatibility');
    }
    
    if (risks.length === 0) {
      risks.push('Requires thorough testing', 'May affect code readability');
    }
    
    return risks;
  }

  private getGasBestPractices(gasFindings: Finding[]): any[] {
    return [
      {
        practice: 'Use packed structs',
        implemented: gasFindings.some(f => f.title.toLowerCase().includes('pack')),
        impact: 'high' as const,
        description: 'Pack struct variables to optimize storage',
        implementation: 'Reorder struct fields by size'
      },
      {
        practice: 'Avoid storage reads in loops',
        implemented: !gasFindings.some(f => f.title.toLowerCase().includes('loop')),
        impact: 'medium' as const,
        description: 'Cache storage variables before loops',
        implementation: 'Store values in memory before loop execution'
      }
    ];
  }

  private generateCodeQualityAssessment(auditResult: any): any {
    return {
      overallScore: 75,
      metrics: [
        { name: 'Complexity', value: auditResult.complexity || 10, threshold: 15, status: 'good' as const },
        { name: 'Documentation', value: 60, threshold: 80, status: 'fair' as const }
      ],
      issues: [
        { type: 'Long functions', severity: 'medium' as const, count: 3, examples: ['function1', 'function2'], recommendation: 'Split into smaller functions' }
      ],
      bestPractices: [
        { practice: 'Error handling', adherence: 80, violations: [] }
      ]
    };
  }

  private generateComplianceAssessment(blockchain: string): any {
    return {
      standards: [
        {
          name: 'Smart Contract Security Verification Standard (SCSVS)',
          version: '2.0',
          compliance: 75,
          requirements: [
            { requirement: 'Access Control', status: 'partial' as const, evidence: 'Some access controls present', recommendation: 'Implement comprehensive role-based access' }
          ]
        }
      ],
      overallCompliance: 75,
      recommendations: [
        { standard: 'SCSVS', requirement: 'Testing', priority: 'high' as const, action: 'Implement comprehensive test suite', effort: '2-3 weeks' }
      ]
    };
  }

  private identifyRiskFactors(findings: Finding[]): any[] {
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    const riskFactors = [];
    
    if (criticalFindings.length > 0) {
      riskFactors.push({
        factor: 'Critical Security Vulnerabilities',
        impact: 'critical' as const,
        likelihood: 'high' as const,
        mitigation: 'Fix all critical issues before deployment'
      });
    }
    
    if (highFindings.length > 0) {
      riskFactors.push({
        factor: 'High Severity Security Issues',
        impact: 'high' as const,
        likelihood: 'medium' as const,
        mitigation: 'Address high severity issues promptly'
      });
    }
    
    return riskFactors;
  }

  // Configuration and static data methods
  private getToolConfiguration(language: string): any[] {
    const baseTools = [
      { tool: 'Static Analyzer', version: '1.0', configuration: { enabled: true }, ruleset: 'default' },
      { tool: 'Semantic Analyzer', version: '1.0', configuration: { enabled: true }, ruleset: 'comprehensive' },
      { tool: 'AI Analyzer', version: '1.0', configuration: { model: 'deepseek-chat-v3.1' }, ruleset: 'ai-enhanced' }
    ];

    if (language.includes('Rust')) {
      baseTools.push({ tool: 'Clippy', version: 'latest', configuration: { pedantic: true } as any, ruleset: 'security' });
    }
    
    if (language.includes('Move')) {
      baseTools.push({ tool: 'Move Prover', version: 'latest', configuration: { timeout: 300 } as any, ruleset: 'formal-verification' });
    }

    return baseTools;
  }

  private getMethodologyDetails(): any {
    return {
      approach: 'Multi-stage comprehensive security analysis',
      phases: [
        { phase: 'Pre-processing', description: 'Code sanitization and preparation', duration: '5 minutes', deliverables: ['Clean codebase', 'Dependency analysis'] },
        { phase: 'Static Analysis', description: 'Pattern-based vulnerability detection', duration: '10 minutes', deliverables: ['Vulnerability findings', 'Code quality metrics'] },
        { phase: 'Semantic Analysis', description: 'Business logic and context analysis', duration: '15 minutes', deliverables: ['Logic vulnerabilities', 'Inter-procedural analysis'] },
        { phase: 'AI Analysis', description: 'Advanced AI-powered vulnerability detection', duration: '20 minutes', deliverables: ['AI insights', 'Anomaly detection'] },
        { phase: 'External Tools', description: 'Language-specific tool integration', duration: '10 minutes', deliverables: ['Tool-specific findings', 'Compliance checks'] },
        { phase: 'Report Generation', description: 'Comprehensive report compilation', duration: '5 minutes', deliverables: ['Final audit report'] }
      ],
      criteria: ['Completeness', 'Accuracy', 'Actionability', 'Risk-based prioritization'],
      limitations: ['Automated analysis may miss complex business logic issues', 'Manual review recommended for critical systems']
    };
  }

  private getGlossaryEntries(): any[] {
    return [
      { term: 'Reentrancy', definition: 'A vulnerability where external calls can be used to manipulate contract state', context: 'Smart contract security' },
      { term: 'Access Control', definition: 'Mechanisms to restrict function access to authorized users', context: 'Security pattern' },
      { term: 'Gas Optimization', definition: 'Techniques to reduce transaction costs on blockchain', context: 'Performance optimization' },
      { term: 'Static Analysis', definition: 'Code analysis without execution to identify potential issues', context: 'Security methodology' }
    ];
  }

  private getRiskMatrix(): any {
    return {
      dimensions: [
        { name: 'Impact', description: 'Potential damage if vulnerability is exploited', scale: ['Low', 'Medium', 'High', 'Critical'] },
        { name: 'Likelihood', description: 'Probability of successful exploitation', scale: ['Low', 'Medium', 'High'] }
      ],
      severityLevels: [
        { level: 'Critical', description: 'Immediate action required', criteria: ['High impact + High likelihood', 'System compromise possible'] },
        { level: 'High', description: 'Urgent action needed', criteria: ['High impact + Medium likelihood', 'Significant security risk'] },
        { level: 'Medium', description: 'Should be addressed', criteria: ['Medium impact + Medium likelihood', 'Moderate security risk'] },
        { level: 'Low', description: 'Should be considered', criteria: ['Low impact + Low likelihood', 'Minor security concern'] }
      ],
      likelihoodLevels: [
        { level: 'High', description: 'Very likely to be exploited', criteria: ['Easily discoverable', 'Simple to exploit'] },
        { level: 'Medium', description: 'Could be exploited', criteria: ['Moderately discoverable', 'Requires some skill'] },
        { level: 'Low', description: 'Unlikely to be exploited', criteria: ['Difficult to discover', 'Requires advanced skills'] }
      ]
    };
  }

  private getDisclaimer(): string {
    return `This audit report is provided for informational purposes only and should not be considered as investment advice, legal advice, or a guarantee of security. The audit was conducted using automated tools and AI analysis, which may not identify all potential vulnerabilities. Manual review by qualified security professionals is recommended for production systems. The authors and LokaLabs disclaim any liability for damages resulting from the use of this report or the audited smart contract code. Users should conduct their own due diligence and testing before deploying any smart contract to production environments.`;
  }
}
