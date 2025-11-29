import { ParsedData } from '../parsers/code-parser';
import { Finding } from '../audit-processor';

export class AIAnalyzer {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async analyze(parseData: ParsedData, previousFindings?: Finding[]): Promise<Finding[]> {
    console.log(`Running AI analysis for project ${parseData.projectId}`);
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found, skipping AI analysis');
      return [];
    }

    const findings: Finding[] = [];
    
    try {
      // Analyze each file with AI
      for (const [fileName, fileData] of Object.entries(parseData.ast)) {
        if (fileData.content && this.shouldAnalyzeFile(fileName)) {
          const fileFindings = await this.analyzeFileWithAI(parseData, fileName, fileData.content, previousFindings);
          findings.push(...fileFindings);
        }
      }

      // Perform cross-file analysis
      const crossFileFindings = await this.analyzeCrossFilePatterns(parseData);
      findings.push(...crossFileFindings);

      // Analyze business logic patterns
      const businessLogicFindings = await this.analyzeBusinessLogicPatterns(parseData);
      findings.push(...businessLogicFindings);

      // If previous findings exist, enhance analysis
      if (previousFindings && previousFindings.length > 0) {
        const enhancedFindings = await this.enhanceWithPreviousFindings(parseData, previousFindings);
        findings.push(...enhancedFindings);
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
    }

    console.log(`AI analysis found ${findings.length} potential issues`);
    return findings;
  }

  private async enhanceWithPreviousFindings(parseData: ParsedData, previousFindings: Finding[]): Promise<Finding[]> {
    // Use previous findings to guide AI analysis
    const criticalFindings = previousFindings.filter(f => f.severity === 'critical' || f.severity === 'high');
    
    if (criticalFindings.length === 0) {
      return [];
    }

    const prompt = `You are an expert smart contract security auditor. Based on the following critical findings from static and semantic analysis, provide additional insights and potential related vulnerabilities:

**Project:** ${parseData.projectId}
**Language:** ${parseData.language}

**Critical Findings Found:**
${criticalFindings.map(f => `- ${f.title}: ${f.description} (${f.location.file}:${f.location.line})`).join('\n')}

**Task:** Analyze if these findings indicate broader security patterns or related vulnerabilities that might have been missed. Focus on:
1. Root cause analysis
2. Related attack vectors
3. Exploitation chains
4. Mitigation strategies

Return findings as JSON array with same format as previous analysis.`;

    try {
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, 'enhanced-analysis');
    } catch (error) {
      console.error('Enhanced AI analysis failed:', error);
      return [];
    }
  }

  private async analyzeFileWithAI(parseData: ParsedData, fileName: string, content: string, previousFindings?: Finding[]): Promise<Finding[]> {
    const prompt = this.createAnalysisPrompt(parseData, fileName, content);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, fileName);
    } catch (error) {
      console.error(`AI analysis failed for file ${fileName}:`, error);
      return [];
    }
  }

  private createAnalysisPrompt(parseData: ParsedData, fileName: string, content: string): string {
    const language = this.detectLanguage(fileName);
    const chain = parseData.language || 'unknown';

    return `You are an expert smart contract security auditor specializing in ${chain} blockchain and ${language} programming language.

Please analyze the following smart contract code for security vulnerabilities, business logic flaws, and potential exploits:

**Chain:** ${chain}
**Language:** ${language}
**File:** ${fileName}
**Project:** ${parseData.projectId}

**Code to analyze:**
\`\`\`${language}
${content}
\`\`\`

**Analysis Requirements:**
1. Identify security vulnerabilities (reentrancy, overflow, access control, etc.)
2. Check for business logic flaws
3. Look for economic exploits (MEV, flash loan attacks, etc.)
4. Identify code quality issues
5. Check for compliance with best practices

**Output Format:**
For each finding, provide a JSON object with:
- id: unique identifier
- title: short descriptive title
- description: detailed explanation
- severity: "critical", "high", "medium", or "low"
- confidence: 0.0 to 1.0
- category: vulnerability category
- line: approximate line number (if identifiable)
- code: relevant code snippet
- recommendation: how to fix
- cwe: relevant CWE identifier
- exploitability: 0.0 to 1.0

Return findings as a JSON array. If no issues found, return empty array.

Focus on practical exploitable vulnerabilities and avoid false positives.`;
  }

  private async analyzeCrossFilePatterns(parseData: ParsedData): Promise<Finding[]> {
    const fileContents = Object.entries(parseData.ast)
      .filter(([fileName]) => this.shouldAnalyzeFile(fileName))
      .map(([fileName, data]) => `File: ${fileName}\n${data.content}`)
      .join('\n\n---\n\n');

    if (!fileContents) return [];

    const prompt = `You are an expert smart contract security auditor. Analyze the following multi-file smart contract project for cross-file vulnerabilities and architectural issues:

**Project:** ${parseData.projectId}
**Chain:** ${parseData.language || 'unknown'}

**Files to analyze:**
${fileContents}

**Focus on:**
1. Cross-contract reentrancy
2. Inconsistent access control across files
3. State synchronization issues
4. Architectural vulnerabilities
5. Module interaction flaws
6. Privilege escalation through file boundaries
7. Data flow vulnerabilities across modules

Return findings as JSON array with same format as previous analysis.
Limit to the most critical cross-file issues.`;

    try {
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, 'cross-file-analysis');
    } catch (error) {
      console.error('Cross-file AI analysis failed:', error);
      return [];
    }
  }

  private async analyzeBusinessLogicPatterns(parseData: ParsedData): Promise<Finding[]> {
    // Extract function signatures and relationships
    const functionsInfo = parseData.functions.map(func => ({
      name: func.name,
      visibility: func.visibility,
      parameters: func.parameters,
      file: func.file
    }));

    const prompt = `You are an expert smart contract auditor specializing in business logic vulnerabilities.

Analyze the following smart contract functions for business logic flaws:

**Project:** ${parseData.projectId}
**Chain:** ${parseData.language || 'unknown'}

**Functions:**
${JSON.stringify(functionsInfo, null, 2)}

**Imports:**
${JSON.stringify(parseData.imports, null, 2)}

**Look for:**
1. Missing authorization checks
2. Inconsistent state validation
3. Economic logic flaws
4. Governance vulnerabilities
5. Time-based manipulation
6. Oracle manipulation
7. Flash loan attack vectors
8. MEV vulnerabilities
9. Admin privilege abuse
10. Token mechanics flaws

Focus on exploitable business logic issues that could lead to financial loss.
Return findings as JSON array.`;

    try {
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, 'business-logic-analysis');
    } catch (error) {
      console.error('Business logic AI analysis failed:', error);
      return [];
    }
  }

  protected async callAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lokaaudit.com',
        'X-Title': 'LokaAudit Smart Contract Analyzer'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert smart contract security auditor with deep knowledge of blockchain vulnerabilities, economic attacks, and secure coding practices. Provide accurate, actionable security analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  protected parseAIResponse(response: string, fileName: string): Finding[] {
    try {
      const parsed = JSON.parse(response);
      
      // Handle both array and object with findings property
      const findings = Array.isArray(parsed) ? parsed : (parsed.findings || []);
      
      return findings.map((finding: any, index: number) => ({
        id: finding.id || `ai-${fileName}-${index}`,
        title: finding.title || 'AI-Detected Issue',
        description: finding.description || 'Issue detected by AI analysis',
        severity: this.validateSeverity(finding.severity),
        confidence: this.validateConfidence(finding.confidence),
        category: finding.category || 'AI Analysis',
        location: {
          file: fileName,
          line: finding.line || 0
        },
        code: finding.code || '',
        recommendation: finding.recommendation || 'Review the identified issue and implement appropriate fixes',
        references: finding.references || [],
        cwe: finding.cwe || '',
        exploitability: this.validateConfidence(finding.exploitability)
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Response:', response);
      return [];
    }
  }

  private shouldAnalyzeFile(fileName: string): boolean {
    const analyzableExtensions = ['.rs', '.move', '.cairo', '.sol'];
    return analyzableExtensions.some(ext => fileName.endsWith(ext));
  }

  private detectLanguage(fileName: string): string {
    if (fileName.endsWith('.rs')) return 'rust';
    if (fileName.endsWith('.move')) return 'move';
    if (fileName.endsWith('.cairo')) return 'cairo';
    if (fileName.endsWith('.sol')) return 'solidity';
    return 'unknown';
  }

  private validateSeverity(severity: string): string {
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    return validSeverities.includes(severity) ? severity : 'medium';
  }

  private validateConfidence(confidence: any): number {
    const conf = typeof confidence === 'number' ? confidence : parseFloat(confidence);
    return isNaN(conf) ? 0.5 : Math.max(0, Math.min(1, conf));
  }
}

// Advanced AI analysis for specific vulnerability patterns
export class AdvancedAIAnalyzer extends AIAnalyzer {
  async analyzeSpecificPatterns(parseData: ParsedData, patterns: string[]): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const pattern of patterns) {
      const patternFindings = await this.analyzePattern(parseData, pattern);
      findings.push(...patternFindings);
    }

    return findings;
  }

  private async analyzePattern(parseData: ParsedData, pattern: string): Promise<Finding[]> {
    const prompt = `Analyze the smart contract code specifically for the following vulnerability pattern: ${pattern}

**Project:** ${parseData.projectId}
**Chain:** ${parseData.language || 'unknown'}

**Code to analyze:**
${this.getRelevantCode(parseData, pattern)}

Focus specifically on detecting instances of the "${pattern}" vulnerability pattern.
Provide detailed analysis with exact line numbers and code snippets.
Return findings as JSON array.`;

    try {
      const response = await this.callAI(prompt);
      return this.parseAIResponse(response, `pattern-${pattern}`);
    } catch (error) {
      console.error(`Pattern analysis failed for ${pattern}:`, error);
      return [];
    }
  }

  protected async callAI(prompt: string): Promise<string> {
    return super.callAI(prompt);
  }

  protected parseAIResponse(response: string, fileName: string): Finding[] {
    return super.parseAIResponse(response, fileName);
  }

  private getRelevantCode(parseData: ParsedData, pattern: string): string {
    // Get relevant code sections based on the pattern
    const relevantFiles = Object.entries(parseData.ast)
      .filter(([fileName, data]) => this.isRelevantForPattern(data.content, pattern))
      .slice(0, 3); // Limit to avoid token limits

    return relevantFiles
      .map(([fileName, data]) => `File: ${fileName}\n${data.content}`)
      .join('\n\n---\n\n');
  }

  private isRelevantForPattern(content: string, pattern: string): boolean {
    const patternKeywords: { [key: string]: string[] } = {
      'reentrancy': ['call', 'transfer', 'send', 'invoke'],
      'overflow': ['+', '-', '*', '/', 'add', 'sub', 'mul'],
      'access-control': ['require', 'assert', 'modifier', 'onlyOwner'],
      'timestamp': ['block.timestamp', 'now', 'block.number'],
      'randomness': ['random', 'hash', 'blockhash', 'difficulty']
    };

    const keywords = patternKeywords[pattern] || [];
    return keywords.some(keyword => content.includes(keyword));
  }
}
