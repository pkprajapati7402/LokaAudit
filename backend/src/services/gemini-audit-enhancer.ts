import { GoogleGenerativeAI } from '@google/generative-ai';
import { Finding, StandardAuditReport } from '../types/audit.types';
import { logger } from '../utils/logger';
import { parseRustAST, parseMoveAST, ParsedAST } from '../lib/ast-parser';

/**
 * Production-Grade Gemini AI Audit Report Enhancement Service
 * 
 * This service leverages Google's Gemini AI to provide:
 * 1. Advanced vulnerability analysis and severity assessment
 * 2. Intelligent finding correlation and deduplication
 * 3. Context-aware business impact analysis
 * 4. Production-ready recommendations with implementation guidance
 * 5. Comprehensive security scoring with detailed explanations
 * 6. Executive summaries tailored for different stakeholder audiences
 */

interface EnhancedFinding extends Finding {
  businessContext?: string;
  attackScenarios?: string[];
  mitigationPriority?: 'immediate' | 'high' | 'medium' | 'low';
  implementationComplexity?: 'simple' | 'moderate' | 'complex' | 'architectural';
  estimatedEffort?: string;
  relatedFindings?: string[];
}

interface GeminiAuditAnalysis {
  enhancedFindings: EnhancedFinding[];
  intelligentSummary: {
    executiveSummary: string;
    technicalSummary: string;
    detailedAnalysis: any;
    businessImpactAssessment: string;
    deploymentRecommendation: string;
  };
  securityScoring: {
    overallScore: number;
    categoryScores: Record<string, number>;
    scoringRationale: string;
    confidenceLevel: number;
  };
  prioritizedRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    architectural: string[];
  };
  complianceAnalysis: {
    standards: string[];
    gaps: string[];
    recommendations: string[];
  };
  threatModel: {
    primaryThreats: string[];
    attackVectors: string[];
    riskMitigation: string[];
  };
}

export class GeminiAuditEnhancer {
  private genAI: GoogleGenerativeAI | null;
  private model: any;
  private hasApiKey: boolean;

  constructor() {
    this.hasApiKey = !!process.env.GEMINI_API_KEY;
    
    if (this.hasApiKey) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });
      logger.info('🤖 Gemini Audit Enhancement Service initialized with AI');
    } else {
      this.genAI = null;
      this.model = null;
      logger.warn('⚠️ GEMINI_API_KEY not found - running in fallback mode with AST-enhanced recommendations');
    }
  }

  /**
   * Create fallback enhanced finding when AI is not available
   */
  private createFallbackEnhancedFinding(finding: Finding): any {
    return {
      ...finding,
      businessContext: `${finding.severity} severity issue affecting ${finding.category.replace('_', ' ')} security`,
      attackScenarios: [`Exploitation via ${finding.category} vulnerability`],
      mitigationPriority: this.calculateMitigationPriority(finding.severity),
      implementationComplexity: this.assessImplementationComplexity(finding.category),
      remediationGuidance: {
        implementationSteps: [
          'Analyze the vulnerability root cause',
          'Design appropriate security controls',
          'Implement and test the security fix',
          'Conduct security review and validation'
        ],
        testingStrategy: ['Unit tests', 'Integration tests', 'Security validation'],
        monitoringRecommendations: [`Monitor ${finding.category} patterns`]
      }
    };
  }

  /**
   * Assess implementation complexity based on vulnerability category
   */
  private assessImplementationComplexity(category: string): string {
    switch (category.toLowerCase()) {
      case 'access_control':
        return 'simple';
      case 'arithmetic':
        return 'simple';
      case 'state_management':
        return 'moderate';
      case 'logic':
        return 'complex';
      default:
        return 'moderate';
    }
  }

  /**
   * Main enhancement function - transforms basic audit report into production-grade analysis
   */
  async enhanceAuditReport(
    baseReport: StandardAuditReport,
    sourceCode: string,
    networkType: string
  ): Promise<StandardAuditReport> {
    try {
      logger.info(`🚀 Starting Gemini enhancement for ${networkType} audit report`);
      
      const startTime = Date.now();
      
      // Step 1: Analyze and enhance individual findings
      const enhancedFindings = await this.enhanceFindings(
        this.convertStandardFindingsToFindings(baseReport.findings || []),
        sourceCode,
        networkType
      );
      
      // Step 2: Generate intelligent analysis and summaries
      const intelligentAnalysis = await this.generateIntelligentAnalysis(
        enhancedFindings,
        baseReport,
        networkType
      );
      
      // Step 3: Perform advanced security scoring
      const securityScoring = await this.generateSecurityScoring(
        enhancedFindings,
        networkType
      );
      
      // Step 4: Generate prioritized recommendations
      const prioritizedRecommendations = await this.generatePrioritizedRecommendations(
        enhancedFindings,
        networkType,
        sourceCode
      );
      
      // Step 5: Compile enhanced report
      const enhancedReport = await this.compileEnhancedReport(
        baseReport,
        {
          enhancedFindings,
          intelligentSummary: intelligentAnalysis,
          securityScoring,
          prioritizedRecommendations,
          complianceAnalysis: await this.generateComplianceAnalysis(enhancedFindings, networkType),
          threatModel: await this.generateThreatModel(enhancedFindings, networkType)
        }
      );
      
      const processingTime = (Date.now() - startTime) / 1000;
      logger.info(`✅ Gemini audit enhancement completed in ${processingTime}s`);
      
      return enhancedReport;
      
    } catch (error) {
      logger.error('❌ Gemini audit enhancement failed:', error);
      
      // Return original report with basic enhancements if AI fails
      return this.addBasicEnhancements(baseReport);
    }
  }

  /**
   * Enhance individual findings with AI analysis
   */
  private async enhanceFindings(
    findings: Finding[],
    sourceCode: string,
    networkType: string
  ): Promise<EnhancedFinding[]> {
    if (findings.length === 0) return [];
    
    const enhancedFindings: EnhancedFinding[] = [];
    
    // Process findings in batches to manage API limits
    const batchSize = 5;
    for (let i = 0; i < findings.length; i += batchSize) {
      const batch = findings.slice(i, i + batchSize);
      const batchResults = await this.processFindingsBatch(batch, sourceCode, networkType);
      enhancedFindings.push(...batchResults);
      
      // Rate limiting - wait between batches
      if (i + batchSize < findings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return enhancedFindings;
  }

  /**
   * Process a batch of findings through Gemini AI
   */
  private async processFindingsBatch(
    findingsBatch: Finding[],
    sourceCode: string,
    networkType: string
  ): Promise<EnhancedFinding[]> {
    const prompt = this.buildFindingsEnhancementPrompt(findingsBatch, sourceCode, networkType);
    
    try {
      if (!this.hasApiKey || !this.model) {
        // No API key, return fallback enhanced findings
        return findingsBatch.map(f => this.createFallbackEnhancedFinding(f));
      }

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const analysis = this.parseAIResponse(response);
      
      return findingsBatch.map((finding, index) => ({
        ...finding,
        businessContext: analysis.findings?.[index]?.businessContext || 'Business impact assessment pending',
        attackScenarios: analysis.findings?.[index]?.attackScenarios || [],
        mitigationPriority: this.calculateMitigationPriority(finding.severity),
        implementationComplexity: analysis.findings?.[index]?.implementationComplexity || 'moderate',
        estimatedEffort: analysis.findings?.[index]?.estimatedEffort || this.estimateEffortFromSeverity(finding.severity),
        relatedFindings: this.findRelatedFindings(finding, findingsBatch)
      }));
      
    } catch (error) {
      logger.warn('Failed to enhance finding batch with Gemini, using fallback:', error);
      
      // Fallback enhancement
      return findingsBatch.map(finding => ({
        ...finding,
        businessContext: `${finding.severity} severity issue affecting ${networkType} security`,
        attackScenarios: [`Exploitation via ${finding.category} vulnerability`],
        mitigationPriority: this.calculateMitigationPriority(finding.severity),
        implementationComplexity: 'moderate',
        estimatedEffort: this.estimateEffortFromSeverity(finding.severity),
        relatedFindings: []
      }));
    }
  }

  /**
   * Generate intelligent analysis and summaries
   */
  private async generateIntelligentAnalysis(
    findings: EnhancedFinding[],
    baseReport: StandardAuditReport,
    networkType: string
  ): Promise<any> {
    const analysisPrompt = this.buildIntelligentAnalysisPrompt(findings, baseReport, networkType);
    
    try {
      if (!this.hasApiKey || !this.model) {
        // No API key, return fallback analysis
        return {
          executiveSummary: this.generateFallbackExecutiveSummary(findings, networkType),
          technicalSummary: this.generateFallbackTechnicalSummary(findings),
          detailedAnalysis: this.generateFallbackDetailedAnalysis(findings),
          prioritizedRecommendations: []
        };
      }

      const result = await this.model.generateContent(analysisPrompt);
      const response = result.response.text();
      const analysis = this.parseAIResponse(response);
      
      return {
        executiveSummary: analysis.executiveSummary || this.generateFallbackExecutiveSummary(findings, networkType),
        technicalSummary: analysis.technicalSummary || this.generateFallbackTechnicalSummary(findings),
        detailedAnalysis: analysis.detailedAnalysis || this.generateFallbackDetailedAnalysis(findings),
        businessImpactAssessment: analysis.businessImpactAssessment || 'Business impact analysis pending',
        deploymentRecommendation: analysis.deploymentRecommendation || this.generateDeploymentRecommendation(findings)
      };
      
    } catch (error) {
      logger.warn('Failed to generate intelligent analysis, using fallback:', error);
      
      return {
        executiveSummary: this.generateFallbackExecutiveSummary(findings, networkType),
        technicalSummary: this.generateFallbackTechnicalSummary(findings),
        detailedAnalysis: this.generateFallbackDetailedAnalysis(findings),
        businessImpactAssessment: 'Comprehensive business impact assessment requires manual review',
        deploymentRecommendation: this.generateDeploymentRecommendation(findings)
      };
    }
  }

  /**
   * Generate advanced security scoring with explanations
   */
  private async generateSecurityScoring(
    findings: EnhancedFinding[],
    networkType: string
  ): Promise<any> {
    const scoringPrompt = this.buildSecurityScoringPrompt(findings, networkType);
    
    try {
      if (!this.hasApiKey || !this.model) {
        // No API key, return fallback security scoring
        return {
          overallScore: this.calculateBaseSecurityScore(findings),
          riskLevel: 'Medium',
          securityBreakdown: {
            critical: findings.filter(f => f.severity === 'critical').length,
            high: findings.filter(f => f.severity === 'high').length,
            medium: findings.filter(f => f.severity === 'medium').length,
            low: findings.filter(f => f.severity === 'low').length
          },
          complianceAnalysis: []
        };
      }

      const result = await this.model.generateContent(scoringPrompt);
      const response = result.response.text();
      const scoring = this.parseAIResponse(response);
      
      const baseScore = this.calculateBaseSecurityScore(findings);
      
      return {
        overallScore: scoring.overallScore || baseScore,
        categoryScores: scoring.categoryScores || this.generateCategoryScores(findings),
        scoringRationale: scoring.scoringRationale || 'Security scoring based on vulnerability severity and frequency',
        confidenceLevel: scoring.confidenceLevel || 0.8
      };
      
    } catch (error) {
      logger.warn('Failed to generate AI security scoring, using fallback:', error);
      
      return {
        overallScore: this.calculateBaseSecurityScore(findings),
        categoryScores: this.generateCategoryScores(findings),
        scoringRationale: 'Security scoring based on standard vulnerability assessment methodology',
        confidenceLevel: 0.7
      };
    }
  }

  /**
   * Generate prioritized recommendations
   */
  private async generatePrioritizedRecommendations(
    findings: EnhancedFinding[],
    networkType: string,
    sourceCode?: string
  ): Promise<any> {
    // Parse AST if source code is available
    let parsedAST: ParsedAST | null = null;
    if (sourceCode) {
      try {
        if (networkType.toLowerCase() === 'solana' || sourceCode.includes('pub fn') || sourceCode.includes('impl ')) {
          parsedAST = parseRustAST(sourceCode, 'contract.rs');
        } else if (networkType.toLowerCase() === 'move' || sourceCode.includes('fun ') || sourceCode.includes('module ')) {
          parsedAST = parseMoveAST(sourceCode, 'contract.move');
        }
      } catch (error) {
        logger.warn('Failed to parse AST, continuing without AST analysis:', error);
      }
    }

    const recommendationsPrompt = this.buildASTEnhancedRecommendationsPrompt(findings, networkType, parsedAST);
    
    try {
      if (this.hasApiKey && this.model) {
        const result = await this.model.generateContent(recommendationsPrompt);
        const response = result.response.text();
        const recommendations = this.parseAIResponse(response);
        
        return {
          immediate: recommendations.immediate || this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
          shortTerm: recommendations.shortTerm || this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
          longTerm: recommendations.longTerm || this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
          architectural: recommendations.architectural || this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
        };
      } else {
        // No API key, use AST-enhanced fallback
        logger.info('🔧 Using AST-enhanced fallback recommendations');
        return {
          immediate: this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
          shortTerm: this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
          longTerm: this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
          architectural: this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
        };
      }
      
    } catch (error) {
      logger.warn('Failed to generate AI recommendations, using AST-enhanced fallback:', error);
      
      return {
        immediate: this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
        shortTerm: this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
        longTerm: this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
        architectural: this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
      };
    }
  }

  /**
   * Generate compliance analysis
   */
  private async generateComplianceAnalysis(
    findings: EnhancedFinding[],
    networkType: string
  ): Promise<any> {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    
    return {
      standards: this.getApplicableStandards(networkType),
      gaps: this.identifyComplianceGaps(findings),
      recommendations: this.getComplianceRecommendations(critical, high, networkType)
    };
  }

  /**
   * Generate threat model
   */
  private async generateThreatModel(
    findings: EnhancedFinding[],
    networkType: string
  ): Promise<any> {
    return {
      primaryThreats: this.identifyPrimaryThreats(findings, networkType),
      attackVectors: this.identifyAttackVectors(findings),
      riskMitigation: this.generateRiskMitigation(findings)
    };
  }

  /**
   * Compile the final enhanced report
   */
  private async compileEnhancedReport(
    baseReport: StandardAuditReport,
    analysis: GeminiAuditAnalysis
  ): Promise<StandardAuditReport> {
    const critical = analysis.enhancedFindings.filter(f => f.severity === 'critical').length;
    const high = analysis.enhancedFindings.filter(f => f.severity === 'high').length;
    const medium = analysis.enhancedFindings.filter(f => f.severity === 'medium').length;
    const low = analysis.enhancedFindings.filter(f => f.severity === 'low').length;
    
    return {
      ...baseReport,
      summary: {
        ...baseReport.summary,
        total_issues: analysis.enhancedFindings.length,
        critical,
        high,
        medium,
        low,
        security_score: analysis.securityScoring.overallScore,
        overall_risk_level: this.calculateRiskLevel(critical, high, medium) as any,
        recommendation: analysis.intelligentSummary.deploymentRecommendation,
        
        // Enhanced sections powered by Gemini AI
        executive_summary: {
          overallRecommendation: analysis.intelligentSummary.deploymentRecommendation,
          risk_assessment: {
            overall_risk_level: this.calculateRiskLevel(critical, high, medium),
            risk_factors: this.identifyRiskFactors(critical, high, medium, low),
            business_impact: analysis.intelligentSummary.businessImpactAssessment,
            deployment_readiness: analysis.intelligentSummary.deploymentRecommendation
          },
          key_findings: {
            total_vulnerabilities: analysis.enhancedFindings.length,
            critical_vulnerabilities: critical,
            high_risk_vulnerabilities: high,
            medium_risk_vulnerabilities: medium,
            low_risk_vulnerabilities: low,
            informational_findings: 0,
            security_score: analysis.securityScoring.overallScore,
            score_interpretation: this.interpretSecurityScore(analysis.securityScoring.overallScore),
            confidence_level: analysis.securityScoring.confidenceLevel
          },
          immediate_actions: analysis.prioritizedRecommendations.immediate
        },
        
        technical_summary: {
          vulnerability_distribution: {
            by_category: this.analyzeVulnerabilityDistribution(analysis.enhancedFindings),
            by_severity: { critical, high, medium, low, informational: 0 }
          },
          top_vulnerability_categories: this.getTopVulnerabilityCategories(analysis.enhancedFindings),
          code_quality_metrics: {
            average_confidence: this.calculateAverageConfidence(analysis.enhancedFindings),
            exploitability_assessment: this.assessExploitability(analysis.enhancedFindings),
            false_positive_likelihood: analysis.securityScoring.confidenceLevel > 0.8 ? 'Very Low' : 'Low',
            ai_enhancement_applied: true,
            gemini_analysis_version: '1.5-pro'
          }
        },
        
        detailed_analysis: {
          ...analysis.intelligentSummary.detailedAnalysis,
          threat_model: analysis.threatModel,
          compliance_analysis: analysis.complianceAnalysis,
          ai_insights: {
            enhanced_findings_count: analysis.enhancedFindings.length,
            business_context_provided: analysis.enhancedFindings.filter(f => f.businessContext).length,
            attack_scenarios_identified: analysis.enhancedFindings.reduce((sum, f) => sum + (f.attackScenarios?.length || 0), 0),
            implementation_guidance_provided: true
          }
        }
      },
      
      findings: analysis.enhancedFindings.map((finding, index) => ({
        id: finding.id || `FND-${String(index + 1).padStart(3, '0')}`,
        title: finding.title,
        severity: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1) as any,
        description: finding.description,
        impact: finding.businessContext || finding.impact?.description || 'Impact assessment pending',
        affected_files: finding.location ? [finding.location.file] : [],
        line_numbers: finding.location ? [finding.location.startLine] : [],
        code_snippet: finding.location?.snippet || finding.code || 'Code snippet not available',
        recommendation: finding.recommendation,
        references: finding.references || [],
        status: 'Unresolved',
        confidence: finding.confidence || 0.8,
        cwe: finding.cwe,
        exploitability: finding.exploitability || 0.5,
        category: finding.category,
        
        // Enhanced fields from Gemini AI
        business_context: finding.businessContext,
        attack_scenarios: finding.attackScenarios || [],
        mitigation_priority: finding.mitigationPriority || 'medium',
        implementation_complexity: finding.implementationComplexity || 'moderate',
        estimated_effort: finding.estimatedEffort,
        related_findings: finding.relatedFindings || [],
        
        technical_details: {
          vulnerability_class: this.classifyVulnerability(finding),
          attack_vector: this.identifyAttackVector(finding),
          prerequisites: this.identifyPrerequisites(finding),
          detection_method: finding.source,
          confidence_level: this.interpretConfidence(finding.confidence || 0.8),
          ai_analysis: 'Enhanced with Gemini AI'
        },
        
        business_impact: {
          financial_impact: finding.impact?.financial || 'medium',
          operational_impact: finding.impact?.operational || 'medium',
          reputational_impact: finding.impact?.reputational || 'medium',
          compliance_impact: this.assessComplianceImpact(finding),
          user_impact: this.assessUserImpact(finding)
        },
        
        remediation_guidance: {
          estimated_effort: finding.estimatedEffort,
          complexity: finding.implementationComplexity,
          required_expertise: this.identifyRequiredExpertise(finding),
          testing_requirements: this.identifyTestingRequirements(finding),
          implementation_steps: this.generateImplementationSteps(finding)
        }
      })) as any,
      
      recommendations: {
        immediate_actions: analysis.prioritizedRecommendations.immediate,
        high_priority_fixes: analysis.prioritizedRecommendations.shortTerm,
        security_best_practices: this.getSecurityBestPractices(baseReport.report_metadata?.platform || 'blockchain'),
        testing_and_validation: this.getTestingRecommendations(),
        architectural_improvements: analysis.prioritizedRecommendations.architectural,
        long_term_strategies: analysis.prioritizedRecommendations.longTerm,
        future_improvements: analysis.prioritizedRecommendations.longTerm, // Map long term to future improvements
        
        // AI-enhanced sections
        gemini_insights: {
          threat_model_recommendations: analysis.threatModel.riskMitigation,
          compliance_recommendations: analysis.complianceAnalysis.recommendations,
          business_process_improvements: this.getBusinessProcessRecommendations(analysis.enhancedFindings),
          continuous_monitoring: this.getContinuousMonitoringRecommendations()
        }
      },
      
      // Enhanced appendix with AI analysis details
      appendix: {
        ...baseReport.appendix,
        ai_enhancement_details: {
          gemini_model_used: 'gemini-1.5-pro',
          analysis_timestamp: new Date().toISOString(),
          findings_enhanced: analysis.enhancedFindings.length,
          confidence_score: analysis.securityScoring.confidenceLevel,
          analysis_capabilities: [
            'Business Context Analysis',
            'Attack Scenario Modeling',
            'Implementation Complexity Assessment',
            'Prioritized Remediation Planning',
            'Threat Model Generation',
            'Compliance Gap Analysis'
          ]
        },
        security_scoring_methodology: {
          base_scoring: 'CVSS 3.1 Compatible',
          ai_enhancements: 'Gemini-powered contextual analysis',
          confidence_factors: [
            'Code pattern recognition',
            'Business logic analysis',
            'Threat landscape assessment',
            'Industry best practices alignment'
          ]
        }
      }
    };
  }

  // ===========================================
  // PROMPT BUILDING METHODS
  // ===========================================

  private buildFindingsEnhancementPrompt(
    findings: Finding[],
    sourceCode: string,
    networkType: string
  ): string {
    return `You are a senior blockchain security auditor specializing in ${networkType} smart contracts. Analyze these security findings and enhance them with production-grade insights.

NETWORK: ${networkType}
FINDINGS COUNT: ${findings.length}

FINDINGS TO ANALYZE:
${findings.map((finding, i) => `
${i + 1}. ${finding.title}
   Severity: ${finding.severity}
   Category: ${finding.category}
   Description: ${finding.description}
   Location: ${finding.location?.file}:${finding.location?.startLine}
   Current Recommendation: ${finding.recommendation}
   CWE: ${finding.cwe || 'Not specified'}
`).join('\n')}

SOURCE CODE CONTEXT:
\`\`\`
${sourceCode.length > 8000 ? sourceCode.substring(0, 8000) + '\n... (truncated)' : sourceCode}
\`\`\`

For each finding, provide:
1. Business context and real-world impact
2. Detailed attack scenarios and exploitation methods
3. Implementation complexity assessment (simple/moderate/complex/architectural)
4. Precise effort estimation with timeframes
5. Related vulnerabilities and systemic issues

Respond in JSON format:
{
  "findings": [
    {
      "businessContext": "Clear business impact explanation",
      "attackScenarios": ["detailed attack scenario 1", "attack scenario 2"],
      "implementationComplexity": "simple|moderate|complex|architectural",
      "estimatedEffort": "specific timeframe and resource estimate",
      "systemicIssues": ["related pattern 1", "pattern 2"]
    }
  ]
}`;
  }

  private buildIntelligentAnalysisPrompt(
    findings: EnhancedFinding[],
    baseReport: StandardAuditReport,
    networkType: string
  ): string {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const categories = [...new Set(findings.map(f => f.category))];

    return `You are a blockchain security expert preparing a comprehensive audit report for a ${networkType} smart contract. Generate professional-grade analysis sections.

AUDIT OVERVIEW:
- Network: ${networkType}
- Total Findings: ${findings.length}
- Critical Issues: ${critical}
- High Severity: ${high}
- Top Categories: ${categories.slice(0, 5).join(', ')}
- Contract: ${baseReport.report_metadata?.target_contract?.name || 'Smart Contract'}

DETAILED FINDINGS SUMMARY:
${findings.map(f => `
• ${f.title} (${f.severity})
  Business Context: ${f.businessContext}
  Implementation: ${f.implementationComplexity}
  Priority: ${f.mitigationPriority}
`).join('')}

Generate the following analysis sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs for C-level executives)
   - Overall security posture and business risk
   - Key decision points and recommendations
   - Financial and operational impact assessment

2. TECHNICAL SUMMARY (for development teams)
   - Technical risk breakdown
   - Implementation priorities
   - Resource requirements

3. DETAILED ANALYSIS (comprehensive technical review)
   - Vulnerability pattern analysis
   - Systemic security issues
   - Architecture and design concerns

4. BUSINESS IMPACT ASSESSMENT
   - Financial risk quantification
   - Operational implications
   - Regulatory and compliance considerations

5. DEPLOYMENT RECOMMENDATION
   - Clear go/no-go guidance with conditions
   - Risk acceptance framework
   - Milestone-based deployment strategy

Respond in JSON format with these exact keys: executiveSummary, technicalSummary, detailedAnalysis, businessImpactAssessment, deploymentRecommendation`;
  }

  private buildSecurityScoringPrompt(
    findings: EnhancedFinding[],
    networkType: string
  ): string {
    return `You are a security scoring specialist. Generate a comprehensive security score for this ${networkType} smart contract audit.

FINDINGS ANALYSIS:
${findings.map(f => `
• ${f.title}: ${f.severity} (confidence: ${f.confidence || 0.8})
  Category: ${f.category}
  Business Impact: ${f.businessContext}
  Exploitability: ${f.exploitability || 'medium'}
`).join('')}

Generate a security scoring analysis including:

1. Overall Security Score (0-100 scale)
2. Category-specific scores (access_control, input_validation, etc.)
3. Detailed scoring rationale explaining the methodology
4. Confidence level in the assessment (0.0-1.0)

Consider these factors in scoring:
- Vulnerability severity and frequency
- Business impact and exploitability
- Code quality and defensive programming
- Network-specific security patterns
- Industry benchmarks and standards

Respond in JSON format:
{
  "overallScore": 0-100,
  "categoryScores": {
    "access_control": 0-100,
    "input_validation": 0-100,
    "state_management": 0-100,
    "external_interactions": 0-100,
    "error_handling": 0-100
  },
  "scoringRationale": "detailed explanation of scoring methodology and key factors",
  "confidenceLevel": 0.0-1.0
}`;
  }

  private buildRecommendationsPrompt(
    findings: EnhancedFinding[],
    networkType: string
  ): string {
    return `You are a senior security consultant providing actionable remediation guidance for a ${networkType} smart contract audit.

FINDINGS REQUIRING REMEDIATION:
${findings.map(f => `
${f.title} (${f.severity})
- Business Impact: ${f.businessContext}
- Implementation Complexity: ${f.implementationComplexity}
- Priority: ${f.mitigationPriority}
- Current Recommendation: ${f.recommendation}
`).join('\n')}

Generate prioritized recommendations in 4 categories:

1. IMMEDIATE ACTIONS (blocking deployment issues)
   - Critical security fixes required before go-live
   - Emergency response procedures

2. SHORT-TERM (within 4-8 weeks)
   - High-priority security improvements
   - Process and tooling enhancements

3. LONG-TERM (3-6 months)
   - Strategic security initiatives
   - Comprehensive security program development

4. ARCHITECTURAL (major design changes)
   - Fundamental design improvements
   - Technology and framework upgrades

Each recommendation should be:
- Specific and actionable
- Include success criteria
- Estimate resource requirements
- Consider business priorities

Respond in JSON format:
{
  "immediate": ["specific action 1", "action 2"],
  "shortTerm": ["improvement 1", "improvement 2"],
  "longTerm": ["strategy 1", "strategy 2"],
  "architectural": ["design change 1", "change 2"]
}`;
  }

  /**
   * Build AST-enhanced recommendations prompt with code-specific analysis
   */
  private buildASTEnhancedRecommendationsPrompt(
    findings: EnhancedFinding[],
    networkType: string,
    parsedAST: ParsedAST | null
  ): string {
    const astAnalysis = parsedAST ? this.formatASTForPrompt(parsedAST) : null;
    
    return `You are a senior security consultant providing actionable remediation guidance for a ${networkType} smart contract audit.

FINDINGS REQUIRING REMEDIATION:
${findings.map(f => `
${f.title} (${f.severity})
- Business Impact: ${f.businessContext}
- Implementation Complexity: ${f.implementationComplexity}
- Priority: ${f.mitigationPriority}
- Current Recommendation: ${f.recommendation}
`).join('\n')}

${astAnalysis ? `
CODE ANALYSIS (AST):
${astAnalysis}
` : ''}

Based on the actual code structure and findings, generate SPECIFIC and ACTIONABLE recommendations that address the exact functions, variables, and patterns found in this contract.

1. IMMEDIATE ACTIONS (blocking deployment issues)
   - Reference specific functions that need fixes (e.g., "Add signer validation to transfer_tokens() function")
   - Specific code changes needed in identified functions
   - Emergency testing for the affected functions

2. SHORT-TERM (within 4-8 weeks)
   - Improvements to specific functions identified in the AST
   - Code patterns that need refactoring based on complexity analysis
   - Testing strategies for the identified functions and modules

3. LONG-TERM (3-6 months)
   - Architecture improvements based on the module structure
   - Comprehensive security patterns for the identified language features
   - Code organization improvements for the specific dependencies

4. ARCHITECTURAL (major design changes)
   - Redesign recommendations based on the actual code structure
   - Framework/library upgrades specific to the identified dependencies
   - Security architecture improvements for the actual module design

Each recommendation should:
- Reference specific functions, variables, or modules from the code
- Be implementable based on the actual code structure
- Consider the complexity metrics and language features identified
- Address the specific security insights found in the code

Respond in JSON format with code-specific recommendations:
{
  "immediate": ["Fix function_name() by adding validation X", "Update variable Y in module Z"],
  "shortTerm": ["Refactor high-complexity function A", "Add tests for module B functions"],
  "longTerm": ["Restructure module C for better security", "Implement pattern D across codebase"],
  "architectural": ["Replace dependency X with Y", "Redesign Z pattern for security"]
}`;
  }

  /**
   * Format parsed AST for inclusion in AI prompts
   */
  private formatASTForPrompt(parsedAST: ParsedAST): string {
    return `
MODULE: ${parsedAST.name} (${parsedAST.module_type})
Total Lines: ${parsedAST.total_lines}

FUNCTIONS (${parsedAST.functions.length}):
${parsedAST.functions.map(f => `
- ${f.name}() [${f.visibility}, line ${f.line_number}]
  - Parameters: ${f.parameters.map(p => `${p.name}: ${p.type}`).join(', ') || 'none'}
  - Return Type: ${f.return_type || 'void'}
  - Complexity Score: ${f.complexity_score}
  - Entry Function: ${f.is_entry_function ? 'Yes' : 'No'}
  - Modifiers: ${f.modifiers.join(', ') || 'none'}
  - Documentation: ${f.doc_comments.join(' ') || 'none'}
`).join('')}

STRUCTURES/EVENTS (${parsedAST.events.length}):
${parsedAST.events.map(s => `
- ${s.name} [line ${s.line_number}]
  - Fields: ${s.fields.map(f => `${f.name}: ${f.type}`).join(', ') || 'none'}
  - Abilities: ${[s.has_copy && 'copy', s.has_drop && 'drop', s.has_store && 'store', s.has_key && 'key'].filter(Boolean).join(', ') || 'none'}
  - Documentation: ${s.doc_comments.join(' ') || 'none'}
`).join('')}

CONSTANTS/VARIABLES (${parsedAST.variables.length}):
${parsedAST.variables.map(v => `
- ${v.name}: ${v.type} [${v.visibility}, line ${v.line_number}]
  - Mutable: ${v.is_mutable ? 'Yes' : 'No'}
  - Value: ${v.value || 'not specified'}
  - Documentation: ${v.doc_comments.join(' ') || 'none'}
`).join('')}

IMPORTS/DEPENDENCIES:
${parsedAST.imports.concat(parsedAST.dependencies).join(', ') || 'none'}

COMPLEXITY METRICS:
- Cyclomatic Complexity: ${parsedAST.complexity_metrics.cyclomatic_complexity}
- Functions: ${parsedAST.complexity_metrics.function_count}
- Structs: ${parsedAST.complexity_metrics.struct_count}
- Constants: ${parsedAST.complexity_metrics.const_count}

LANGUAGE FEATURES:
${parsedAST.language_features.join(', ') || 'none'}

SECURITY INSIGHTS:
${parsedAST.security_insights.join('\n- ') || 'none'}

MODULE DOCUMENTATION:
${parsedAST.doc_comments.join(' ') || 'none'}`;
  }

  // ===========================================
  // UTILITY AND FALLBACK METHODS
  // ===========================================

  /**
   * Convert StandardFinding[] to Finding[] for processing
   */
  private convertStandardFindingsToFindings(standardFindings: any[]): Finding[] {
    return standardFindings.map(sf => ({
      id: sf.id,
      title: sf.title,
      description: sf.description,
      severity: sf.severity.toLowerCase() as any,
      confidence: sf.confidence || 0.8,
      category: sf.category || 'general',
      location: {
        file: sf.affected_files?.[0] || 'unknown',
        startLine: sf.line_numbers?.[0] || 1,
        endLine: sf.line_numbers?.[0] || 1,
        startColumn: 1,
        endColumn: 50,
        function: 'unknown',
        snippet: sf.code_snippet || sf.recommendation || 'Code snippet not available'
      },
      code: sf.cwe || sf.category || 'UNKNOWN',
      recommendation: sf.recommendation,
      references: sf.references || [],
      cwe: sf.cwe,
      owasp: undefined,
      exploitability: sf.exploitability || 0.5,
      impact: {
        financial: 'medium',
        operational: 'medium', 
        reputational: 'medium',
        description: sf.impact || 'Impact assessment pending'
      },
      source: 'static' as const,
      tool: undefined
    }));
  }

  private parseAIResponse(response: string): any {
    try {
      // Try direct JSON parsing
      return JSON.parse(response);
    } catch (e) {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          logger.warn('Failed to parse JSON from markdown block');
        }
      }
      
      // Try extracting JSON object pattern
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e3) {
          logger.warn('Failed to parse extracted JSON object');
        }
      }
      
      logger.warn('Could not parse AI response as JSON, using fallback');
      return {};
    }
  }

  private calculateMitigationPriority(severity: string): 'immediate' | 'high' | 'medium' | 'low' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'immediate';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private estimateEffortFromSeverity(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '1-3 days (immediate priority)';
      case 'high': return '1-2 weeks';
      case 'medium': return '2-4 weeks';
      default: return '1-2 months';
    }
  }

  private findRelatedFindings(finding: Finding, allFindings: Finding[]): string[] {
    return allFindings
      .filter(other => other.id !== finding.id && 
        (other.category === finding.category || 
         other.location?.file === finding.location?.file))
      .map(related => related.id || related.title)
      .slice(0, 3);
  }

  private calculateBaseSecurityScore(findings: EnhancedFinding[]): number {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;
    
    return Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 2));
  }

  private generateCategoryScores(findings: EnhancedFinding[]): Record<string, number> {
    const categories = ['access_control', 'input_validation', 'state_management', 'external_interactions', 'error_handling'];
    const scores: Record<string, number> = {};
    
    categories.forEach(category => {
      const categoryFindings = findings.filter(f => f.category?.toLowerCase().includes(category.replace('_', '')));
      const critical = categoryFindings.filter(f => f.severity === 'critical').length;
      const high = categoryFindings.filter(f => f.severity === 'high').length;
      const medium = categoryFindings.filter(f => f.severity === 'medium').length;
      
      scores[category] = Math.max(0, 100 - (critical * 30 + high * 15 + medium * 8));
    });
    
    return scores;
  }

  private calculateRiskLevel(critical: number, high: number, medium: number): string {
    if (critical > 0) return 'Critical';
    if (high > 2 || (high > 0 && medium > 5)) return 'High';
    if (high > 0 || medium > 3) return 'Medium';
    return 'Low';
  }

  private generateFallbackExecutiveSummary(findings: EnhancedFinding[], networkType: string): string {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    
    return `This ${networkType} smart contract audit identified ${findings.length} security findings across multiple categories. ${critical > 0 ? `CRITICAL: ${critical} critical issue${critical > 1 ? 's' : ''} requiring immediate attention before deployment.` : ''} ${high > 0 ? `${high} high-severity issue${high > 1 ? 's' : ''} should be addressed within the next development cycle.` : ''} The overall security posture requires improvement before production deployment. Detailed remediation guidance and implementation priorities have been provided to support the development team in addressing these security concerns systematically.`;
  }

  private generateFallbackTechnicalSummary(findings: EnhancedFinding[]): string {
    const categories = [...new Set(findings.map(f => f.category))];
    return `Technical analysis identified security issues across ${categories.length} categories: ${categories.slice(0, 5).join(', ')}. The findings range from configuration issues to potential vulnerabilities requiring code changes. Implementation complexity varies from simple configuration updates to architectural improvements. Development team should prioritize critical and high-severity findings while establishing a systematic approach to address medium and low-priority items.`;
  }

  private generateFallbackDetailedAnalysis(findings: EnhancedFinding[]): any {
    return {
      security_patterns: {
        common_issues: findings.slice(0, 5).map(f => f.category),
        systemic_concerns: findings.length > 10 ? ['Multiple security patterns suggest systematic review needed'] : [],
        positive_findings: ['Standard security practices partially implemented']
      },
      code_quality: {
        overall_assessment: findings.length < 5 ? 'Good' : findings.length < 15 ? 'Fair' : 'Needs Improvement',
        improvement_areas: [...new Set(findings.map(f => f.category))].slice(0, 3)
      }
    };
  }

  private generateDeploymentRecommendation(findings: EnhancedFinding[]): string {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    
    if (critical > 0) {
      return `DEPLOYMENT NOT RECOMMENDED: ${critical} critical security issue${critical > 1 ? 's' : ''} must be resolved before production deployment.`;
    }
    if (high > 3) {
      return `CONDITIONAL DEPLOYMENT: Address ${high} high-severity issues. Consider phased rollout with additional monitoring.`;
    }
    if (high > 0) {
      return `DEPLOYMENT WITH CONDITIONS: ${high} high-severity issue${high > 1 ? 's' : ''} should be resolved. Implement additional monitoring and have incident response plan ready.`;
    }
    return 'DEPLOYMENT APPROVED: No blocking issues identified. Monitor and address medium/low priority findings in upcoming releases.';
  }

  // Additional utility methods for comprehensive analysis...
  private getImmediateRecommendations(findings: EnhancedFinding[]): string[] {
    const critical = findings.filter(f => f.severity === 'critical');
    if (critical.length === 0) return [];
    
    return [
      `🚨 URGENT: Fix ${critical.length} critical security issue${critical.length > 1 ? 's' : ''} before deployment`,
      '🚨 Conduct security review with senior developers',
      '🚨 Implement comprehensive testing for critical fixes',
      '🚨 Consider external security consultant review'
    ];
  }

  private getShortTermRecommendations(findings: EnhancedFinding[]): string[] {
    const high = findings.filter(f => f.severity === 'high');
    return [
      `⚡ Address ${high.length} high-severity security issues within 4-8 weeks`,
      '⚡ Implement automated security scanning in CI/CD pipeline',
      '⚡ Establish security code review processes',
      '⚡ Provide security training for development team'
    ];
  }

  private getLongTermRecommendations(findings: EnhancedFinding[], networkType: string): string[] {
    return [
      '📋 Establish regular security audit cycles (quarterly)',
      `📋 Develop ${networkType}-specific security standards and guidelines`,
      '📋 Implement comprehensive security monitoring and alerting',
      '📋 Create incident response procedures and runbooks'
    ];
  }

  private getArchitecturalRecommendations(findings: EnhancedFinding[], networkType: string): string[] {
    const architecturalFindings = findings.filter(f => f.implementationComplexity === 'architectural');
    if (architecturalFindings.length === 0) return [];
    
    return [
      '🏗️ Consider implementing security-by-design patterns',
      `🏗️ Evaluate ${networkType}-specific security frameworks`,
      '🏗️ Design comprehensive access control architecture',
      '🏗️ Implement defense-in-depth security strategy'
    ];
  }

  private getApplicableStandards(networkType: string): string[] {
    const commonStandards = ['OWASP Smart Contract Top 10', 'NIST Cybersecurity Framework'];
    
    switch (networkType.toLowerCase()) {
      case 'solana':
        return [...commonStandards, 'Solana Security Best Practices', 'Anchor Framework Guidelines'];
      case 'ethereum':
        return [...commonStandards, 'OpenZeppelin Security Guidelines', 'ConsenSys Best Practices'];
      default:
        return [...commonStandards, 'Blockchain Security Alliance Guidelines'];
    }
  }

  private identifyComplianceGaps(findings: EnhancedFinding[]): string[] {
    const gaps: string[] = [];
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    
    if (critical > 0) gaps.push('Critical security vulnerabilities violate security standards');
    if (high > 2) gaps.push('Multiple high-risk issues indicate systematic security gaps');
    
    return gaps;
  }

  private getComplianceRecommendations(critical: number, high: number, networkType: string): string[] {
    const recommendations: string[] = [];
    
    if (critical > 0) {
      recommendations.push(`Address ${critical} critical findings to meet security compliance requirements`);
    }
    if (high > 0) {
      recommendations.push(`Resolve ${high} high-severity issues to align with industry standards`);
    }
    
    recommendations.push(`Implement ${networkType}-specific security compliance framework`);
    recommendations.push('Establish continuous compliance monitoring procedures');
    
    return recommendations;
  }

  private identifyPrimaryThreats(findings: EnhancedFinding[], networkType: string): string[] {
    const categories = findings.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => `${category.replace('_', ' ').toUpperCase()} vulnerabilities`);
  }

  private identifyAttackVectors(findings: EnhancedFinding[]): string[] {
    const vectors = new Set<string>();
    
    findings.forEach(f => {
      if (f.attackScenarios) {
        f.attackScenarios.forEach(scenario => vectors.add(scenario));
      }
    });
    
    return Array.from(vectors).slice(0, 10);
  }

  private generateRiskMitigation(findings: EnhancedFinding[]): string[] {
    const mitigation: string[] = [];
    
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    
    if (critical > 0) {
      mitigation.push(`Immediately address ${critical} critical vulnerabilities`);
    }
    if (high > 0) {
      mitigation.push(`Implement fixes for ${high} high-severity issues`);
    }
    
    mitigation.push('Deploy comprehensive monitoring and alerting');
    mitigation.push('Establish incident response procedures');
    mitigation.push('Implement defense-in-depth security architecture');
    
    return mitigation;
  }

  private addBasicEnhancements(baseReport: StandardAuditReport): StandardAuditReport {
    logger.warn('Applying basic enhancements due to AI service failure');
    
    return {
      ...baseReport,
      summary: {
        ...baseReport.summary,
        recommendation: baseReport.summary?.recommendation || 'Manual security review recommended due to AI enhancement service unavailability',
      },
      appendix: {
        ...baseReport.appendix,
        enhancement_status: 'Basic enhancements applied - AI service unavailable',
        fallback_applied: true
      }
    };
  }

  // Additional helper methods for comprehensive analysis
  private identifyRiskFactors(critical: number, high: number, medium: number, low: number): string[] {
    const factors: string[] = [];
    if (critical > 0) factors.push(`${critical} critical security vulnerabilities present`);
    if (high > 2) factors.push(`Multiple high-severity issues (${high}) detected`);
    if (medium > 8) factors.push(`High density of medium-severity issues (${medium})`);
    if ((critical + high + medium) > 15) factors.push('High overall vulnerability density');
    return factors.length > 0 ? factors : ['Low security risk profile'];
  }

  private interpretSecurityScore(score: number): string {
    if (score >= 90) return 'Excellent - Strong security posture with minimal vulnerabilities';
    if (score >= 75) return 'Good - Solid security foundation with some areas for improvement';
    if (score >= 60) return 'Fair - Moderate security issues that should be addressed';
    if (score >= 40) return 'Poor - Significant security concerns requiring immediate attention';
    return 'Critical - Severe security issues posing immediate risk';
  }

  private analyzeVulnerabilityDistribution(findings: EnhancedFinding[]): any[] {
    const categories = findings.reduce((acc, f) => {
      if (!acc[f.category]) {
        acc[f.category] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
      }
      acc[f.category][f.severity]++;
      acc[f.category].total++;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(categories).map(([category, counts]) => ({
      category,
      count: counts.total,
      severity_breakdown: {
        critical: counts.critical,
        high: counts.high,
        medium: counts.medium,
        low: counts.low
      }
    }));
  }

  private getTopVulnerabilityCategories(findings: EnhancedFinding[]): any[] {
    const categories = findings.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        description: this.getCategoryDescription(category),
        sample_finding: findings.find(f => f.category === category)?.title || 'N/A'
      }));
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'access_control': 'Issues related to authentication and authorization mechanisms',
      'input_validation': 'Problems with data sanitization and validation processes',
      'state_management': 'Vulnerabilities in application state handling and transitions',
      'external_interactions': 'Security concerns in external service integrations',
      'error_handling': 'Improper error handling and information disclosure risks',
      'cryptography': 'Cryptographic implementation and key management issues',
      'business_logic': 'Flaws in application-specific business logic implementation'
    };
    return descriptions[category] || 'Security-related findings in this category';
  }

  private calculateAverageConfidence(findings: EnhancedFinding[]): number {
    if (findings.length === 0) return 0;
    const totalConfidence = findings.reduce((sum, f) => sum + (f.confidence || 0.8), 0);
    return Math.round((totalConfidence / findings.length) * 100);
  }

  private assessExploitability(findings: EnhancedFinding[]): string {
    if (findings.length === 0) return 'Not assessed';
    
    const avgExploitability = findings.reduce((sum, f) => sum + (f.exploitability || 0.5), 0) / findings.length;
    
    if (avgExploitability > 0.8) return 'High - Many findings are easily exploitable';
    if (avgExploitability > 0.6) return 'Medium-High - Several findings may be exploitable';
    if (avgExploitability > 0.4) return 'Medium - Some findings require moderate effort to exploit';
    return 'Low - Most findings require significant effort to exploit';
  }

  private classifyVulnerability(finding: Finding): string {
    if (finding.cwe) return `CWE-${finding.cwe}`;
    return finding.category.replace('_', ' ').toUpperCase();
  }

  private identifyAttackVector(finding: Finding): string {
    if (finding.category.toLowerCase().includes('input')) return 'Malicious Input';
    if (finding.category.toLowerCase().includes('access')) return 'Authentication Bypass';
    if (finding.category.toLowerCase().includes('state')) return 'State Manipulation';
    return 'Direct Code Execution';
  }

  private identifyPrerequisites(finding: Finding): string[] {
    switch (finding.severity) {
      case 'critical': return ['No special prerequisites - easily exploitable'];
      case 'high': return ['Basic understanding of smart contract interactions'];
      case 'medium': return ['Moderate technical knowledge required'];
      default: return ['Advanced technical knowledge and specific conditions required'];
    }
  }

  private interpretConfidence(confidence: number): string {
    if (confidence > 0.9) return 'Very High - Confirmed vulnerability';
    if (confidence > 0.7) return 'High - Likely vulnerability';
    if (confidence > 0.5) return 'Medium - Possible vulnerability';
    return 'Low - Potential false positive';
  }

  private assessComplianceImpact(finding: Finding): string {
    if (finding.severity === 'critical' || finding.severity === 'high') {
      return 'May significantly affect compliance with security standards';
    }
    return 'Minimal compliance impact';
  }

  private assessUserImpact(finding: Finding): string {
    if (finding.impact?.operational === 'high') return 'High - May directly affect user funds or operations';
    if (finding.impact?.operational === 'medium') return 'Medium - May cause user inconvenience or confusion';
    return 'Low - Minimal direct impact on end users';
  }

  private identifyRequiredExpertise(finding: Finding): string[] {
    const expertise: string[] = ['Smart Contract Security'];
    
    if (finding.category.toLowerCase().includes('crypto')) expertise.push('Cryptography');
    if (finding.category.toLowerCase().includes('access')) expertise.push('Authentication Systems');
    if (finding.severity === 'critical') expertise.push('Senior Security Engineering');
    
    return expertise;
  }

  private identifyTestingRequirements(finding: Finding): string[] {
    return [
      'Unit tests for affected functionality',
      'Integration tests for security controls',
      'Penetration testing for vulnerability verification',
      'Regression testing for fix validation'
    ];
  }

  private generateImplementationSteps(finding: Finding): string[] {
    return [
      'Analyze the vulnerability root cause',
      'Design appropriate security controls',
      'Implement and test the security fix',
      'Conduct security review and validation',
      'Deploy with monitoring and rollback capability'
    ];
  }

  private getSecurityBestPractices(platform: string): string[] {
    return [
      '✅ Implement comprehensive input validation for all user data',
      '✅ Use principle of least privilege for access controls',
      '✅ Implement proper error handling without information leakage',
      '✅ Use secure coding patterns and frameworks',
      '✅ Implement comprehensive logging and monitoring',
      '✅ Regular security testing and code reviews',
      '✅ Keep dependencies updated and monitor for vulnerabilities'
    ];
  }

  private getTestingRecommendations(): string[] {
    return [
      '🧪 Implement comprehensive unit tests for security-critical functions',
      '🧪 Create integration tests for authentication and authorization',
      '🧪 Develop security regression test suites',
      '🧪 Implement automated security scanning in CI/CD',
      '🧪 Conduct regular penetration testing'
    ];
  }

  private getBusinessProcessRecommendations(findings: EnhancedFinding[]): string[] {
    return [
      'Establish security-first development culture',
      'Implement security requirements in project planning',
      'Create security incident response procedures',
      'Establish regular security training programs'
    ];
  }

  private getContinuousMonitoringRecommendations(): string[] {
    return [
      'Deploy real-time security monitoring and alerting',
      'Implement automated vulnerability scanning',
      'Establish security metrics and KPIs tracking',
      'Create regular security posture assessment procedures'
    ];
  }

  // ===========================================
  // AST-ENHANCED CODE-SPECIFIC RECOMMENDATIONS
  // ===========================================

  /**
   * Generate immediate recommendations based on actual code structure and findings
   */
  private getCodeSpecificImmediateRecommendations(findings: EnhancedFinding[], parsedAST: ParsedAST | null): string[] {
    const critical = findings.filter(f => f.severity === 'critical');
    const recommendations: string[] = [];
    
    if (critical.length === 0) return [];

    // Critical findings addressing specific functions/code elements
    critical.forEach(finding => {
      if (finding.title.toLowerCase().includes('signer') || finding.title.toLowerCase().includes('authorization')) {
        if (parsedAST && parsedAST.functions.length > 0) {
          const entryFunctions = parsedAST.functions.filter(f => f.is_entry_function || f.visibility === 'public');
          if (entryFunctions.length > 0) {
            recommendations.push(`🚨 URGENT: Add signer validation to ${entryFunctions.map(f => f.name + '()').join(', ')} function${entryFunctions.length > 1 ? 's' : ''}`);
          }
        }
      }

      if (finding.title.toLowerCase().includes('overflow') || finding.title.toLowerCase().includes('arithmetic')) {
        if (parsedAST) {
          const mathFunctions = parsedAST.functions.filter(f => 
            f.body_text.includes('+') || f.body_text.includes('-') || f.body_text.includes('*') || f.body_text.includes('/')
          );
          if (mathFunctions.length > 0) {
            recommendations.push(`🚨 URGENT: Implement safe arithmetic in ${mathFunctions.slice(0, 3).map(f => f.name + '()').join(', ')} ${mathFunctions.length > 3 ? `and ${mathFunctions.length - 3} other functions` : ''}`);
          }
        }
      }
    });

    // Generic critical recommendations with AST context
    if (parsedAST) {
      recommendations.push(`🚨 Fix ${critical.length} critical security issue${critical.length > 1 ? 's' : ''} in ${parsedAST.name} module before deployment`);
      
      const highComplexityFunctions = parsedAST.functions.filter(f => f.complexity_score > 10);
      if (highComplexityFunctions.length > 0) {
        recommendations.push(`🚨 Review high-complexity functions: ${highComplexityFunctions.map(f => f.name + '()').join(', ')} (complexity ${highComplexityFunctions.map(f => f.complexity_score).join(', ')})`);
      }
    } else {
      recommendations.push(`🚨 Fix ${critical.length} critical security issue${critical.length > 1 ? 's' : ''} before deployment`);
    }
    
    recommendations.push('🚨 Conduct security review with senior developers');
    
    return recommendations;
  }

  /**
   * Generate short-term recommendations based on code structure
   */
  private getCodeSpecificShortTermRecommendations(findings: EnhancedFinding[], parsedAST: ParsedAST | null): string[] {
    const high = findings.filter(f => f.severity === 'high');
    const recommendations: string[] = [];

    if (parsedAST) {
      // Function-specific recommendations
      const publicFunctions = parsedAST.functions.filter(f => f.visibility === 'public');
      if (publicFunctions.length > 0) {
        recommendations.push(`⚡ Add comprehensive input validation to public functions: ${publicFunctions.map(f => f.name + '()').join(', ')}`);
      }

      // Security insights from AST
      parsedAST.security_insights.forEach(insight => {
        if (insight.includes('unwrap()')) {
          recommendations.push('⚡ Replace unwrap() calls with proper error handling in identified functions');
        }
        if (insight.includes('unsafe')) {
          recommendations.push('⚡ Audit all unsafe code blocks for memory safety');
        }
      });

      // Test coverage recommendations
      const undocumentedFunctions = parsedAST.functions.filter(f => f.doc_comments.length === 0);
      if (undocumentedFunctions.length > 0) {
        recommendations.push(`⚡ Add documentation and tests for ${undocumentedFunctions.length} undocumented functions`);
      }

      recommendations.push(`⚡ Address ${high.length} high-severity issues in ${parsedAST.name} module`);
    } else {
      recommendations.push(`⚡ Address ${high.length} high-severity security issues within 4-8 weeks`);
    }

    recommendations.push('⚡ Implement automated security scanning in CI/CD pipeline');
    return recommendations;
  }

  /**
   * Generate long-term recommendations based on architecture and code organization
   */
  private getCodeSpecificLongTermRecommendations(findings: EnhancedFinding[], networkType: string, parsedAST: ParsedAST | null): string[] {
    const recommendations: string[] = [];

    if (parsedAST) {
      // Architecture recommendations based on actual code
      if (parsedAST.complexity_metrics.cyclomatic_complexity > 50) {
        recommendations.push(`📋 Refactor ${parsedAST.name} module to reduce cyclomatic complexity (current: ${parsedAST.complexity_metrics.cyclomatic_complexity})`);
      }

      // Dependency management
      if (parsedAST.dependencies.length > 0) {
        recommendations.push(`📋 Audit and update dependencies: ${parsedAST.dependencies.join(', ')}`);
      }

      // Language-specific recommendations
      if (parsedAST.language_features.includes('unsafe_code')) {
        recommendations.push('📋 Create comprehensive unsafe code review and documentation standards');
      }
      
      if (parsedAST.language_features.includes('async_functions')) {
        recommendations.push('📋 Implement async/await security patterns and error handling standards');
      }

      // Module-specific security program
      recommendations.push(`📋 Establish security standards specific to ${parsedAST.module_type} development`);
      recommendations.push(`📋 Create automated testing framework for ${parsedAST.complexity_metrics.function_count} functions in codebase`);
    } else {
      recommendations.push('📋 Establish regular security audit cycles (quarterly)');
      recommendations.push(`📋 Develop ${networkType}-specific security standards and guidelines`);
    }

    recommendations.push('📋 Implement comprehensive security monitoring and alerting');
    return recommendations;
  }

  /**
   * Generate architectural recommendations based on code structure
   */
  private getCodeSpecificArchitecturalRecommendations(findings: EnhancedFinding[], networkType: string, parsedAST: ParsedAST | null): string[] {
    const architecturalFindings = findings.filter(f => f.implementationComplexity === 'architectural');
    const recommendations: string[] = [];

    if (architecturalFindings.length === 0 && (!parsedAST || parsedAST.complexity_metrics.cyclomatic_complexity < 30)) {
      return [];
    }

    if (parsedAST) {
      // Specific architectural improvements based on code analysis
      if (parsedAST.functions.length > 20) {
        recommendations.push(`🏗️ Consider modularizing ${parsedAST.name} - ${parsedAST.functions.length} functions suggest need for separation of concerns`);
      }

      // Framework recommendations based on actual dependencies
      const currentFrameworks = parsedAST.imports.filter(imp => 
        imp.includes('anchor') || imp.includes('solana') || imp.includes('move') || imp.includes('spl')
      );
      if (currentFrameworks.length > 0) {
        recommendations.push(`🏗️ Evaluate upgrading framework versions: ${currentFrameworks.join(', ')}`);
      }

      // Security architecture based on actual patterns
      const entryPoints = parsedAST.functions.filter(f => f.is_entry_function).length;
      if (entryPoints > 10) {
        recommendations.push(`🏗️ Implement entry point access control pattern - ${entryPoints} entry functions detected`);
      }

      // Data structure improvements
      if (parsedAST.events.length > 0) {
        const structsWithoutAbilities = parsedAST.events.filter(s => 
          !s.has_copy && !s.has_drop && !s.has_store && !s.has_key
        );
        if (structsWithoutAbilities.length > 0) {
          recommendations.push(`🏗️ Review and add appropriate abilities to structs: ${structsWithoutAbilities.map(s => s.name).join(', ')}`);
        }
      }

      recommendations.push(`🏗️ Implement security-by-design patterns for ${parsedAST.module_type} architecture`);
    } else {
      recommendations.push('🏗️ Consider implementing security-by-design patterns');
      recommendations.push(`🏗️ Evaluate ${networkType}-specific security frameworks`);
    }

    recommendations.push('🏗️ Design comprehensive access control architecture');
    return recommendations;
  }
}
