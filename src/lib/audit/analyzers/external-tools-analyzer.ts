import { ParsedData } from '../parsers/code-parser';
import { Finding } from '../audit-processor';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class ExternalToolsAnalyzer {
  private tempDir: string;

  constructor() {
    this.tempDir = process.env.TEMP || '/tmp';
  }

  async analyze(preprocessedData: any): Promise<Finding[]> {
    console.log(`Running external tools analysis for project ${preprocessedData.projectId}`);
    
    const findings: Finding[] = [];
    
    try {
      // Convert preprocessed data to ParsedData format for compatibility
      const parseData = this.convertToParseData(preprocessedData);
      
      // Run language-specific external tools
      switch (parseData.language) {
        case 'rust':
          const rustFindings = await this.analyzeRust(parseData);
          findings.push(...rustFindings);
          break;
        case 'move':
          const moveFindings = await this.analyzeMove(parseData);
          findings.push(...moveFindings);
          break;
        case 'cairo':
          const cairoFindings = await this.analyzeCairo(parseData);
          findings.push(...cairoFindings);
          break;
        default:
          console.log(`No external tools configured for language: ${parseData.language}`);
      }

      // Run generic security tools
      const genericFindings = await this.runGenericSecurityTools(parseData);
      findings.push(...genericFindings);

    } catch (error) {
      console.error('External tools analysis failed:', error);
    }

    console.log(`External tools analysis found ${findings.length} issues`);
    return findings;
  }

  private convertToParseData(preprocessedData: any): ParsedData {
    // Convert preprocessed data to ParsedData format
    const ast: Record<string, any> = {};
    
    if (preprocessedData.files) {
      for (const file of preprocessedData.files) {
        ast[file.fileName] = {
          content: file.content,
          size: file.size
        };
      }
    }

    return {
      projectId: preprocessedData.projectId,
      language: this.mapLanguageFormat(preprocessedData.language),
      ast,
      symbols: {
        functions: [],
        variables: [],
        structs: []
      },
      controlFlow: {
        nodes: [],
        edges: []
      },
      complexity: 0,
      functions: [],
      imports: [],
      contracts: []
    };
  }

  private async analyzeRust(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Clippy (Rust linter)
      const clippyFindings = await this.runClippy(parseData);
      findings.push(...clippyFindings);

      // Run Cargo audit (security vulnerabilities)
      const auditFindings = await this.runCargoAudit(parseData);
      findings.push(...auditFindings);

      // Run custom Rust security checks
      const securityFindings = await this.runRustSecurityChecks(parseData);
      findings.push(...securityFindings);

    } catch (error) {
      console.error('Rust external tools analysis failed:', error);
    }

    return findings;
  }

  private async analyzeMove(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Move prover
      const proverFindings = await this.runMoveProver(parseData);
      findings.push(...proverFindings);

      // Run Move static analyzer
      const staticFindings = await this.runMoveStaticAnalyzer(parseData);
      findings.push(...staticFindings);

    } catch (error) {
      console.error('Move external tools analysis failed:', error);
    }

    return findings;
  }

  private async analyzeCairo(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Cairo static analyzer
      const staticFindings = await this.runCairoStaticAnalyzer(parseData);
      findings.push(...staticFindings);

      // Run StarkNet security checks
      const securityFindings = await this.runStarkNetSecurityChecks(parseData);
      findings.push(...securityFindings);

    } catch (error) {
      console.error('Cairo external tools analysis failed:', error);
    }

    return findings;
  }

  private async runClippy(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Create temporary Cargo project
      const tempProjectPath = await this.createTempRustProject(parseData);
      
      // Run clippy
      const { stdout, stderr } = await execAsync('cargo clippy --message-format json', {
        cwd: tempProjectPath,
        timeout: 30000
      });

      // Parse clippy output
      const clippyMessages = this.parseClippyOutput(stdout);
      
      for (const message of clippyMessages) {
        if (message.level === 'warning' || message.level === 'error') {
          findings.push({
            id: `clippy-${message.code?.code || 'unknown'}-${message.spans?.[0]?.line_start || 0}`,
            title: `Clippy: ${message.message}`,
            description: message.message,
            severity: message.level === 'error' ? 'high' : 'medium',
            confidence: 0.9,
            category: 'Code Quality',
            location: {
              file: message.spans?.[0]?.file_name || '',
              line: message.spans?.[0]?.line_start || 0
            },
            code: message.spans?.[0]?.text?.[0]?.text || '',
            recommendation: message.rendered || 'Follow Clippy suggestions to improve code quality',
            references: ['https://rust-lang.github.io/rust-clippy/'],
            cwe: this.mapClippyToCWE(message.code?.code),
            exploitability: message.level === 'error' ? 0.6 : 0.2
          });
        }
      }

      // Cleanup
      await this.cleanupTempProject(tempProjectPath);

    } catch (error) {
      console.error('Clippy analysis failed:', error);
    }

    return findings;
  }

  private async runCargoAudit(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Create temporary Cargo project
      const tempProjectPath = await this.createTempRustProject(parseData);
      
      // Run cargo audit
      const { stdout } = await execAsync('cargo audit --json', {
        cwd: tempProjectPath,
        timeout: 30000
      });

      // Parse audit output
      const auditData = JSON.parse(stdout);
      
      if (auditData.vulnerabilities) {
        for (const vuln of auditData.vulnerabilities.list) {
          findings.push({
            id: `cargo-audit-${vuln.advisory.id}`,
            title: `Vulnerability: ${vuln.advisory.title}`,
            description: vuln.advisory.description,
            severity: this.mapAuditSeverity(vuln.advisory.severity) as 'critical' | 'high' | 'medium' | 'low',
            confidence: 0.95,
            category: 'Dependency Vulnerability',
            location: {
              file: 'Cargo.toml',
              line: 0
            },
            code: `${vuln.package.name} ${vuln.package.version}`,
            recommendation: `Update ${vuln.package.name} to version ${vuln.advisory.patched_versions?.[0] || 'latest'}`,
            references: [vuln.advisory.url],
            cwe: vuln.advisory.cwe || '',
            exploitability: 0.8
          });
        }
      }

      // Cleanup
      await this.cleanupTempProject(tempProjectPath);

    } catch (error) {
      console.error('Cargo audit failed:', error);
    }

    return findings;
  }

  private async runRustSecurityChecks(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run custom security patterns
      for (const [fileName, fileData] of Object.entries(parseData.ast)) {
        if (fileName.endsWith('.rs') && fileData.content) {
          const fileFindings = await this.analyzeRustSecurityPatterns(fileName, fileData.content);
          findings.push(...fileFindings);
        }
      }

    } catch (error) {
      console.error('Rust security checks failed:', error);
    }

    return findings;
  }

  private async runMoveProver(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Create temporary Move project
      const tempProjectPath = await this.createTempMoveProject(parseData);
      
      // Run Move prover
      const { stdout, stderr } = await execAsync('move prove', {
        cwd: tempProjectPath,
        timeout: 60000
      });

      // Parse prover output
      const proverResults = this.parseMoveProverOutput(stdout + stderr);
      
      for (const result of proverResults) {
        if (!result.success) {
          findings.push({
            id: `move-prover-${result.function}-${result.line}`,
            title: `Move Prover: ${result.error}`,
            description: `Formal verification failed: ${result.error}`,
            severity: 'high',
            confidence: 0.95,
            category: 'Formal Verification',
            location: {
              file: result.file,
              line: result.line
            },
            code: result.code || '',
            recommendation: 'Fix the invariant violation or add proper specifications',
            references: ['https://github.com/move-language/move/tree/main/language/move-prover'],
            cwe: 'CWE-697',
            exploitability: 0.7
          });
        }
      }

      // Cleanup
      await this.cleanupTempProject(tempProjectPath);

    } catch (error) {
      console.error('Move prover failed:', error);
    }

    return findings;
  }

  private async runMoveStaticAnalyzer(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Move static analysis patterns
      for (const [fileName, fileData] of Object.entries(parseData.ast)) {
        if (fileName.endsWith('.move') && fileData.content) {
          const fileFindings = await this.analyzeMoveSecurityPatterns(fileName, fileData.content);
          findings.push(...fileFindings);
        }
      }

    } catch (error) {
      console.error('Move static analysis failed:', error);
    }

    return findings;
  }

  private async runCairoStaticAnalyzer(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Cairo static analysis
      for (const [fileName, fileData] of Object.entries(parseData.ast)) {
        if (fileName.endsWith('.cairo') && fileData.content) {
          const fileFindings = await this.analyzeCairoSecurityPatterns(fileName, fileData.content);
          findings.push(...fileFindings);
        }
      }

    } catch (error) {
      console.error('Cairo static analysis failed:', error);
    }

    return findings;
  }

  private async runStarkNetSecurityChecks(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run StarkNet-specific security checks
      for (const [fileName, fileData] of Object.entries(parseData.ast)) {
        if (fileName.endsWith('.cairo') && fileData.content) {
          const fileFindings = await this.analyzeStarkNetPatterns(fileName, fileData.content);
          findings.push(...fileFindings);
        }
      }

    } catch (error) {
      console.error('StarkNet security checks failed:', error);
    }

    return findings;
  }

  private async runGenericSecurityTools(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Run Semgrep (if available)
      const semgrepFindings = await this.runSemgrep(parseData);
      findings.push(...semgrepFindings);

      // Run custom regex patterns
      const regexFindings = await this.runRegexPatterns(parseData);
      findings.push(...regexFindings);

    } catch (error) {
      console.error('Generic security tools failed:', error);
    }

    return findings;
  }

  private async runSemgrep(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      // Create temporary directory with files
      const tempDir = await this.createTempDirectory(parseData);
      
      // Run semgrep with security rules
      const { stdout } = await execAsync(`semgrep --config=auto --json ${tempDir}`, {
        timeout: 60000
      });

      // Parse semgrep output
      const semgrepResults = JSON.parse(stdout);
      
      for (const result of semgrepResults.results || []) {
        findings.push({
          id: `semgrep-${result.check_id}-${result.start.line}`,
          title: `Semgrep: ${result.extra.message}`,
          description: result.extra.message,
          severity: this.mapSemgrepSeverity(result.extra.severity) as 'critical' | 'high' | 'medium' | 'low',
          confidence: 0.8,
          category: 'Static Analysis',
          location: {
            file: result.path,
            line: result.start.line
          },
          code: result.extra.lines || '',
          recommendation: result.extra.fix || 'Follow Semgrep recommendations',
          references: result.extra.references || [],
          cwe: result.extra.cwe || '',
          exploitability: 0.6
        });
      }

      // Cleanup
      await this.cleanupTempProject(tempDir);

    } catch (error) {
      // Semgrep might not be installed, skip silently
      console.log('Semgrep not available, skipping...');
    }

    return findings;
  }

  private async runRegexPatterns(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    const securityPatterns = [
      {
        pattern: /unsafe\s*\{[^}]*\}/g,
        severity: 'high',
        title: 'Unsafe Code Block',
        description: 'Unsafe code block detected',
        cwe: 'CWE-119'
      },
      {
        pattern: /\.unwrap\(\)/g,
        severity: 'medium', 
        title: 'Unwrap Usage',
        description: 'Direct unwrap() call can cause panic',
        cwe: 'CWE-248'
      },
      {
        pattern: /panic!/g,
        severity: 'medium',
        title: 'Panic Macro',
        description: 'Panic macro can cause DoS',
        cwe: 'CWE-248'
      },
      {
        pattern: /todo!/g,
        severity: 'low',
        title: 'TODO Marker',
        description: 'Unfinished code marked with todo!',
        cwe: 'CWE-561'
      }
    ];

    for (const [fileName, fileData] of Object.entries(parseData.ast)) {
      if (fileData.content) {
        for (const secPattern of securityPatterns) {
          const matches = [...fileData.content.matchAll(secPattern.pattern)];
          
          for (const match of matches) {
            const line = this.getLineNumber(fileData.content, match.index || 0);
            
            findings.push({
              id: `regex-${secPattern.title.replace(/\s+/g, '-').toLowerCase()}-${fileName}-${line}`,
              title: secPattern.title,
              description: secPattern.description,
              severity: secPattern.severity as any,
              confidence: 0.7,
              category: 'Pattern Matching',
              location: {
                file: fileName,
                line: line
              },
              code: match[0],
              recommendation: 'Review and fix the identified pattern',
              references: [],
              cwe: secPattern.cwe,
              exploitability: 0.4
            });
          }
        }
      }
    }

    return findings;
  }

  // Helper methods for creating temporary projects
  private async createTempRustProject(parseData: ParsedData): Promise<string> {
    const projectPath = path.join(this.tempDir, `rust-project-${Date.now()}`);
    
    // Create basic Cargo.toml
    const cargoToml = `[package]
name = "temp_project"
version = "0.1.0"
edition = "2021"

[dependencies]
`;

    await writeFile(path.join(projectPath, 'Cargo.toml'), cargoToml);
    
    // Write source files
    for (const [fileName, fileData] of Object.entries(parseData.ast)) {
      if (fileName.endsWith('.rs') && fileData.content) {
        await writeFile(path.join(projectPath, fileName), fileData.content);
      }
    }

    return projectPath;
  }

  private async createTempMoveProject(parseData: ParsedData): Promise<string> {
    const projectPath = path.join(this.tempDir, `move-project-${Date.now()}`);
    
    // Create basic Move.toml
    const moveToml = `[package]
name = "TempProject"
version = "1.0.0"

[dependencies]
`;

    await writeFile(path.join(projectPath, 'Move.toml'), moveToml);
    
    // Write source files
    for (const [fileName, fileData] of Object.entries(parseData.ast)) {
      if (fileName.endsWith('.move') && fileData.content) {
        await writeFile(path.join(projectPath, fileName), fileData.content);
      }
    }

    return projectPath;
  }

  private async createTempDirectory(parseData: ParsedData): Promise<string> {
    const tempPath = path.join(this.tempDir, `analysis-${Date.now()}`);
    
    // Write all files
    for (const [fileName, fileData] of Object.entries(parseData.ast)) {
      if (fileData.content) {
        await writeFile(path.join(tempPath, fileName), fileData.content);
      }
    }

    return tempPath;
  }

  private async cleanupTempProject(projectPath: string): Promise<void> {
    try {
      await execAsync(`rm -rf "${projectPath}"`);
    } catch (error) {
      console.warn(`Failed to cleanup temp project: ${projectPath}`);
    }
  }

  // Output parsing methods
  private parseClippyOutput(output: string): any[] {
    const messages = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const message = JSON.parse(line);
          if (message.reason === 'compiler-message') {
            messages.push(message.message);
          }
        } catch (error) {
          // Skip invalid JSON lines
        }
      }
    }

    return messages;
  }

  private parseMoveProverOutput(output: string): any[] {
    const results = [];
    const lines = output.split('\n');
    
    // Simple parsing - would need more sophisticated logic for real implementation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('FAILED') || line.includes('ERROR')) {
        results.push({
          success: false,
          error: line.trim(),
          function: 'unknown',
          file: 'unknown',
          line: 0,
          code: line.trim()
        });
      }
    }

    return results;
  }

  // Security pattern analyzers
  private async analyzeRustSecurityPatterns(fileName: string, content: string): Promise<Finding[]> {
    const findings = [];
    
    // Look for common Rust security anti-patterns
    if (content.includes('transmute')) {
      findings.push({
        id: `rust-transmute-${fileName}`,
        title: 'Unsafe Transmute Usage',
        description: 'Use of mem::transmute can lead to undefined behavior',
        severity: 'high',
        confidence: 0.8,
        category: 'Memory Safety',
        location: { file: fileName, line: 0 },
        code: 'transmute',
        recommendation: 'Use safe alternatives to transmute',
        references: [],
        cwe: 'CWE-119',
        exploitability: 0.7,
        toolGenerated: true
      });
    }

    return findings as Finding[];
  }

  private async analyzeMoveSecurityPatterns(fileName: string, content: string): Promise<Finding[]> {
    const findings = [];
    
    // Look for Move-specific patterns
    if (content.includes('move_from') && !content.includes('assert')) {
      findings.push({
        id: `move-unvalidated-move-from-${fileName}`,
        title: 'Unvalidated move_from',
        description: 'move_from without proper validation',
        severity: 'medium',
        confidence: 0.7,
        category: 'Resource Management',
        location: { file: fileName, line: 0 },
        code: 'move_from',
        recommendation: 'Add proper validation before move_from',
        references: [],
        cwe: 'CWE-20',
        exploitability: 0.5,
        toolGenerated: true
      });
    }

    return findings as Finding[];
  }

  private async analyzeCairoSecurityPatterns(fileName: string, content: string): Promise<Finding[]> {
    const findings = [];
    
    // Look for Cairo-specific patterns
    if (content.includes('assert') && content.includes('0')) {
      findings.push({
        id: `cairo-assert-zero-${fileName}`,
        title: 'Potential Assert Zero',
        description: 'Assert with zero value detected',
        severity: 'low',
        confidence: 0.5,
        category: 'Assertion',
        location: { file: fileName, line: 0 },
        code: 'assert',
        recommendation: 'Review assert conditions',
        references: [],
        cwe: 'CWE-617',
        exploitability: 0.2,
        toolGenerated: true
      });
    }

    return findings as Finding[];
  }

  private async analyzeStarkNetPatterns(fileName: string, content: string): Promise<Finding[]> {
    // StarkNet-specific security patterns
    return [];
  }

  // Utility methods
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private mapClippyToCWE(clippyCode?: string): string {
    const mapping: { [key: string]: string } = {
      'clippy::unwrap_used': 'CWE-248',
      'clippy::panic': 'CWE-248', 
      'clippy::unreachable': 'CWE-561',
      'clippy::integer_arithmetic': 'CWE-190'
    };
    
    return mapping[clippyCode || ''] || '';
  }

  private mapAuditSeverity(severity: string): string {
    const mapping: { [key: string]: string } = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'informational': 'low'
    };
    
    return mapping[severity] || 'medium';
  }

  private mapSemgrepSeverity(severity: string): string {
    const mapping: { [key: string]: string } = {
      'ERROR': 'high',
      'WARNING': 'medium',
      'INFO': 'low'
    };
    
    return mapping[severity] || 'medium';
  }

  private mapLanguageFormat(networkLanguage: string): string {
    // Map network-based language format to analyzer-compatible format
    const mapping: { [key: string]: string } = {
      'Solana (Rust)': 'rust',
      'Near (Rust)': 'rust', 
      'Aptos (Move)': 'move',
      'Sui (Move)': 'move',
      'StarkNet (Cairo)': 'cairo'
    };
    
    return mapping[networkLanguage] || networkLanguage.toLowerCase();
  }
}
