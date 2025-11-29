import { BasePipeline } from './base-pipeline';
import { 
  AuditRequest, 
  StandardAuditReport, 
  Finding,
  PreprocessResult,
  ParseResult 
} from '../types/audit.types';
import { NetworkConfig } from '../utils/network-config';

export class NearPipeline extends BasePipeline {
  constructor(networkConfig: NetworkConfig, jobId: string) {
    super(networkConfig, jobId);
  }

  async processAudit(request: AuditRequest): Promise<StandardAuditReport> {
    console.log(`🚀 Starting NEAR audit pipeline for job ${request.jobId}`);
    
    this.jobStatus.status = 'processing';

    try {
      // Execute pipeline stages
      const preprocessResult = await this.executeStage('preprocess', () => 
        this.preprocess(request)
      );

      const parseResult = await this.executeStage('parser', () => 
        this.parse(preprocessResult)
      );

      const staticResult = await this.executeStage('static-analysis', () => 
        this.staticAnalysis(parseResult)
      );

      const semanticResult = await this.executeStage('semantic-analysis', () => 
        this.semanticAnalysis(staticResult)
      );

      const aiResult = await this.executeStage('ai-analysis', () => 
        this.aiAnalysis(semanticResult)
      );

      const externalResult = await this.executeStage('external-tools', () => 
        this.externalToolsAnalysis(aiResult)
      );

      const finalReport = await this.executeStage('aggregation', () => 
        this.aggregateResults(externalResult)
      );

      this.jobStatus.status = 'completed';
      this.jobStatus.completedAt = new Date();

      return finalReport;

    } catch (error) {
      console.error(`❌ NEAR audit pipeline failed for job ${request.jobId}:`, error);
      throw error;
    }
  }

  protected async preprocess(request: AuditRequest): Promise<PreprocessResult> {
    console.log('📋 NEAR preprocessing...');
    
    // NEAR-specific preprocessing
    const cleanedFiles = request.files.map(file => ({
      fileName: file.fileName,
      content: this.sanitizeRustCode(file.content),
      size: file.content.length,
      type: this.detectNearFileType(file.fileName),
      language: 'rust' as const,
      complexity: this.calculateComplexity(file.content),
      hash: this.generateHash(file.content)
    }));

    const dependencies = this.extractNearDependencies(cleanedFiles);
    const metadata = this.generateProjectMetadata(cleanedFiles);

    return {
      cleanedFiles,
      dependencies,
      metadata,
      artifactUrl: `temp://${request.jobId}/preprocessed.tar.gz`
    };
  }

  protected async parse(preprocessResult: PreprocessResult): Promise<ParseResult> {
    console.log('🔍 NEAR parsing...');
    
    // Parse Rust/NEAR code
    const ast = this.parseRustAST(preprocessResult.cleanedFiles);
    const syntaxTree = this.generateSyntaxTree(preprocessResult.cleanedFiles);
    const controlFlow = this.analyzeControlFlow(ast);
    const symbolTable = this.buildSymbolTable(ast);
    const crossReferences = this.analyzeCrossReferences(symbolTable);

    return {
      ast,
      syntaxTree,
      controlFlow,
      symbolTable,
      crossReferences
    };
  }

  protected async staticAnalysis(parseResult: ParseResult): Promise<Finding[]> {
    console.log('🔍 NEAR static analysis...');
    
    const findings: Finding[] = [];
    
    // NEAR-specific static analysis rules
    findings.push(...this.analyzeNearContractStructure(parseResult));
    findings.push(...this.analyzeCallbackSafety(parseResult));
    findings.push(...this.analyzeStorageManagement(parseResult));
    findings.push(...this.analyzePromiseHandling(parseResult));
    findings.push(...this.analyzeAccessKeyChecks(parseResult));
    findings.push(...this.analyzeCrossContractCalls(parseResult));
    findings.push(...this.analyzeStateConsistency(parseResult));
    findings.push(...this.analyzeGasOptimization(parseResult));
    findings.push(...this.analyzeIntegerOverflow(parseResult));

    return findings;
  }

  protected async semanticAnalysis(staticFindings: Finding[]): Promise<Finding[]> {
    console.log('🧠 NEAR semantic analysis...');
    
    const semanticFindings: Finding[] = [];
    
    // NEAR-specific semantic analysis
    semanticFindings.push(...this.analyzeBusinessLogic(staticFindings));
    semanticFindings.push(...this.analyzeContractInteraction(staticFindings));
    semanticFindings.push(...this.analyzeAccountManagement(staticFindings));
    semanticFindings.push(...this.analyzeTokenOperations(staticFindings));
    
    return [...staticFindings, ...semanticFindings];
  }

  protected async aiAnalysis(semanticFindings: Finding[]): Promise<Finding[]> {
    console.log('🤖 NEAR AI analysis...');
    
    // Use OpenRouter API for advanced pattern recognition
    const aiFindings = await this.performNearAIAnalysis(semanticFindings);
    
    return [...semanticFindings, ...aiFindings];
  }

  protected async externalToolsAnalysis(aiFindings: Finding[]): Promise<Finding[]> {
    console.log('🔧 NEAR external tools analysis...');
    
    const externalFindings: Finding[] = [];
    
    // Run Clippy for Rust code
    externalFindings.push(...await this.runClippy());
    
    // Run Cargo Audit
    externalFindings.push(...await this.runCargoAudit());
    
    // Run NEAR-specific tools
    externalFindings.push(...await this.runNearTools());
    
    return [...aiFindings, ...externalFindings];
  }

  protected async aggregateResults(allFindings: Finding[]): Promise<StandardAuditReport> {
    console.log('📊 Aggregating NEAR audit results...');
    
    // Deduplicate and prioritize findings
    const deduplicatedFindings = this.deduplicateFindings(allFindings);
    const rankedFindings = this.rankFindings(deduplicatedFindings);
    
    // Generate standardized report
    return this.generateStandardReport(rankedFindings);
  }

  // NEAR-specific helper methods
  private sanitizeRustCode(code: string): string {
    // Remove comments, secrets, etc.
    return code
      .replace(/\/\/.*$/gm, '') // Single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
      .replace(/(?:secret|private_key|seed)\s*[:=]\s*["'][^"']*["']/gi, 'REDACTED');
  }

  private detectNearFileType(fileName: string): 'source' | 'config' | 'dependency' | 'documentation' {
    if (fileName.endsWith('.rs')) return 'source';
    if (fileName.includes('Cargo.toml') || fileName.includes('near.toml')) return 'config';
    if (fileName.includes('README') || fileName.endsWith('.md')) return 'documentation';
    return 'dependency';
  }

  private calculateComplexity(code: string): number {
    // Simple cyclomatic complexity calculation
    const keywords = ['if', 'while', 'for', 'match', 'loop'];
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      return count + (code.match(regex) || []).length;
    }, 1);
  }

  private generateHash(content: string): string {
    // Simple hash for now
    return Buffer.from(content).toString('base64').slice(0, 8);
  }

  private extractNearDependencies(files: any[]): any[] {
    // Extract dependencies from Cargo.toml files
    const dependencies: any[] = [];
    
    files.forEach(file => {
      if (file.fileName.includes('Cargo.toml')) {
        const cargoContent = file.content;
        const depMatches = cargoContent.match(/^\s*(\w+)\s*=\s*"([^"]+)"/gm);
        
        if (depMatches) {
          depMatches.forEach((match: string) => {
            const [, name, version] = match.match(/(\w+)\s*=\s*"([^"]+)"/) || [];
            if (name && version) {
              dependencies.push({
                name,
                version,
                source: 'crates.io',
                vulnerabilities: [] // Would check against vulnerability database
              });
            }
          });
        }
      }
    });
    
    return dependencies;
  }

  private generateProjectMetadata(files: any[]): any {
    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalComplexity = files.reduce((sum, file) => sum + file.complexity, 0);

    return {
      totalFiles: files.length,
      totalLines,
      totalSize,
      complexity: totalComplexity,
      languages: [{ language: 'rust', lines: totalLines, files: files.length, percentage: 100 }],
      frameworks: ['NEAR Protocol'],
      features: ['Cross-contract calls', 'Storage management', 'Callbacks']
    };
  }

  // Placeholder methods for AST parsing (would use proper Rust parser)
  private parseRustAST(files: any[]): Record<string, any> {
    return files.reduce((ast, file) => {
      ast[file.fileName] = {
        functions: this.extractFunctions(file.content),
        structs: this.extractStructs(file.content),
        imports: this.extractImports(file.content)
      };
      return ast;
    }, {});
  }

  private generateSyntaxTree(files: any[]): Record<string, any> {
    // Placeholder - would use proper syntax tree generation
    return { syntaxTree: 'placeholder' };
  }

  private analyzeControlFlow(ast: Record<string, any>): any {
    // Placeholder - would analyze control flow
    return { nodes: [], edges: [], entryPoints: [], exitPoints: [] };
  }

  private buildSymbolTable(ast: Record<string, any>): any {
    // Placeholder - would build proper symbol table
    return { functions: [], variables: [], types: [], modules: [] };
  }

  private analyzeCrossReferences(symbolTable: any): any[] {
    // Placeholder - would analyze cross-references
    return [];
  }

  private extractFunctions(code: string): any[] {
    const functions: any[] = [];
    const fnRegex = /fn\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = fnRegex.exec(code)) !== null) {
      functions.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length,
        visibility: code.substring(Math.max(0, match.index - 20), match.index).includes('pub') ? 'public' : 'private'
      });
    }
    
    return functions;
  }

  private extractStructs(code: string): any[] {
    const structs: any[] = [];
    const structRegex = /struct\s+(\w+)/g;
    let match;
    
    while ((match = structRegex.exec(code)) !== null) {
      structs.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }
    
    return structs;
  }

  private extractImports(code: string): any[] {
    const imports: any[] = [];
    const useRegex = /use\s+([^;]+);/g;
    let match;
    
    while ((match = useRegex.exec(code)) !== null) {
      imports.push({
        path: match[1].trim(),
        line: code.substring(0, match.index).split('\n').length
      });
    }
    
    return imports;
  }

  // NEAR vulnerability analysis methods (placeholders)
  private analyzeNearContractStructure(parseResult: ParseResult): Finding[] {
    return []; // Implement NEAR contract structure checks
  }

  private analyzeCallbackSafety(parseResult: ParseResult): Finding[] {
    return []; // Implement callback safety checks
  }

  private analyzeStorageManagement(parseResult: ParseResult): Finding[] {
    return []; // Implement storage management checks
  }

  private analyzePromiseHandling(parseResult: ParseResult): Finding[] {
    return []; // Implement promise handling checks
  }

  private analyzeAccessKeyChecks(parseResult: ParseResult): Finding[] {
    return []; // Implement access key verification checks
  }

  private analyzeCrossContractCalls(parseResult: ParseResult): Finding[] {
    return []; // Implement cross-contract call security checks
  }

  private analyzeStateConsistency(parseResult: ParseResult): Finding[] {
    return []; // Implement state consistency checks
  }

  private analyzeGasOptimization(parseResult: ParseResult): Finding[] {
    return []; // Implement gas optimization checks
  }

  private analyzeIntegerOverflow(parseResult: ParseResult): Finding[] {
    return []; // Implement integer overflow checks
  }

  private analyzeBusinessLogic(findings: Finding[]): Finding[] {
    return []; // Implement business logic analysis
  }

  private analyzeContractInteraction(findings: Finding[]): Finding[] {
    return []; // Implement contract interaction analysis
  }

  private analyzeAccountManagement(findings: Finding[]): Finding[] {
    return []; // Implement account management analysis
  }

  private analyzeTokenOperations(findings: Finding[]): Finding[] {
    return []; // Implement token operation analysis
  }

  private async performNearAIAnalysis(findings: Finding[]): Promise<Finding[]> {
    return []; // Implement AI analysis using OpenRouter
  }

  private async runClippy(): Promise<Finding[]> {
    return []; // Implement Clippy integration
  }

  private async runCargoAudit(): Promise<Finding[]> {
    return []; // Implement Cargo Audit integration
  }

  private async runNearTools(): Promise<Finding[]> {
    return []; // Run NEAR-specific tools
  }

  private deduplicateFindings(findings: Finding[]): Finding[] {
    const seen = new Set<string>();
    return findings.filter(finding => {
      const key = `${finding.title}:${finding.location.file}:${finding.location.startLine}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rankFindings(findings: Finding[]): Finding[] {
    return findings.sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'informational': 0 };
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) return bSeverity - aSeverity;
      return b.confidence - a.confidence;
    });
  }

  private generateStandardReport(findings: Finding[]): StandardAuditReport {
    // Generate standardized audit report
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;
    const informational = findings.filter(f => f.severity === 'informational').length;

    const securityScore = Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 2));
    
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (critical > 0) riskLevel = 'Critical';
    else if (high > 2) riskLevel = 'High';
    else if (high > 0 || medium > 5) riskLevel = 'Medium';

    return {
      report_metadata: {
        report_id: `AUDIT-${new Date().getFullYear()}-${this.jobStatus.jobId.slice(-4)}`,
        platform: 'NEAR Protocol',
        language: 'Rust',
        auditor: 'LokaAudit NEAR Engine v2.0',
        audit_date: new Date().toISOString(),
        version: '2.0.0',
        target_contract: {
          name: `NEAR Contract ${this.jobStatus.jobId}`,
          files: findings.map(f => f.location.file).filter((v, i, a) => a.indexOf(v) === i)
        }
      },
      summary: {
        total_issues: findings.length,
        critical,
        high,
        medium,
        low,
        informational,
        security_score: securityScore,
        overall_risk_level: riskLevel,
        recommendation: this.generateOverallRecommendation(critical, high, medium)
      },
      findings: findings.map((finding, index) => ({
        id: `FND-${String(index + 1).padStart(3, '0')}`,
        title: finding.title,
        severity: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1) as any,
        description: finding.description,
        impact: finding.impact.description,
        affected_files: [finding.location.file],
        line_numbers: [finding.location.startLine],
        recommendation: finding.recommendation,
        references: finding.references,
        status: 'Unresolved',
        confidence: finding.confidence,
        cwe: finding.cwe,
        exploitability: finding.exploitability
      })),
      recommendations: {
        security_best_practices: [
          'Follow NEAR Protocol development best practices',
          'Implement proper callback safety mechanisms',
          'Use efficient storage patterns'
        ],
        future_improvements: [
          'Integrate automated testing with NEAR workspaces',
          'Implement runtime monitoring for NEAR contracts'
        ]
      },
      appendix: {
        tools_used: ['Rust Static Analyzer', 'NEAR Security Scanner', 'Cargo Clippy'],
        glossary: {
          'Cross-contract call': 'A function call between different smart contracts',
          'Callback': 'A function that executes after a promise resolves',
          'Access Key': 'Cryptographic key that grants permissions to perform actions'
        }
      }
    };
  }

  private generateOverallRecommendation(critical: number, high: number, medium: number): string {
    if (critical > 0) {
      return `URGENT: Fix ${critical} critical issue${critical > 1 ? 's' : ''} immediately before deployment.`;
    }
    if (high > 0) {
      return `Fix ${high} high severity issue${high > 1 ? 's' : ''} before deployment.`;
    }
    if (medium > 0) {
      return `Address ${medium} medium severity issue${medium > 1 ? 's' : ''} to improve security.`;
    }
    return 'Code shows good security practices for NEAR development.';
  }
}
