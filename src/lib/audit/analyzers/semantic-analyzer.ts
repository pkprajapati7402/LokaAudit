import { ParsedData } from '../parsers/code-parser';
import { Finding } from '../audit-processor';

export class SemanticAnalyzer {
  async analyze(parseData: ParsedData, staticFindings?: Finding[]): Promise<Finding[]> {
    console.log(`Running semantic analysis for project ${parseData.projectId}`);
    
    const findings: Finding[] = [];
    
    // Business logic validation
    const businessLogicFindings = await this.analyzeBusinessLogic(parseData);
    findings.push(...businessLogicFindings);
    
    // Inter-procedural analysis
    const interProceduralFindings = await this.analyzeInterProcedural(parseData);
    findings.push(...interProceduralFindings);
    
    // Data flow analysis
    const dataFlowFindings = await this.analyzeDataFlow(parseData);
    findings.push(...dataFlowFindings);
    
    // Contract interaction analysis
    const interactionFindings = await this.analyzeContractInteractions(parseData);
    findings.push(...interactionFindings);
    
    // Economic logic analysis
    const economicFindings = await this.analyzeEconomicLogic(parseData);
    findings.push(...economicFindings);

    // Use static findings to enhance analysis if provided
    if (staticFindings) {
      const enhancedFindings = await this.enhanceWithStaticFindings(findings, staticFindings);
      findings.push(...enhancedFindings);
    }

    console.log(`Semantic analysis found ${findings.length} issues`);
    return findings;
  }

  private async enhanceWithStaticFindings(semanticFindings: Finding[], staticFindings: Finding[]): Promise<Finding[]> {
    // Enhance semantic analysis with insights from static analysis
    const enhancedFindings: Finding[] = [];

    // Look for patterns where static and semantic findings complement each other
    for (const semanticFinding of semanticFindings) {
      const relatedStaticFindings = staticFindings.filter(sf => 
        sf.location.file === semanticFinding.location.file &&
        Math.abs(sf.location.line - semanticFinding.location.line) <= 5
      );

      if (relatedStaticFindings.length > 0) {
        // Increase confidence if multiple analyzers found similar issues
        semanticFinding.confidence = Math.min(1.0, semanticFinding.confidence + 0.1);
      }
    }

    return enhancedFindings;
  }

  private async analyzeBusinessLogic(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Analyze for business logic flaws
    for (const func of parseData.functions) {
      const analysis = this.analyzeFunction(parseData, func);
      
      // Check for missing validation
      if (analysis.hasStateChanges && !analysis.hasValidation) {
        findings.push({
          id: `business-logic-validation-${func.name}`,
          title: 'Missing Business Logic Validation',
          description: `Function '${func.name}' changes state without proper validation`,
          severity: 'medium',
          confidence: 0.7,
          category: 'Business Logic',
          location: {
            file: func.file,
            line: func.startLine
          },
          code: func.name,
          recommendation: 'Add input validation and business rule checks',
          references: ['https://owasp.org/www-project-smart-contract-top-10/'],
          cwe: 'CWE-20',
          exploitability: 0.6
        });
      }

      // Check for inconsistent state transitions
      if (analysis.hasInconsistentStateTransitions) {
        findings.push({
          id: `inconsistent-state-${func.name}`,
          title: 'Inconsistent State Transitions',
          description: `Function '${func.name}' has potentially inconsistent state transitions`,
          severity: 'high',
          confidence: 0.6,
          category: 'Business Logic',
          location: {
            file: func.file,
            line: func.startLine
          },
          code: func.name,
          recommendation: 'Ensure state transitions are atomic and consistent',
          references: ['https://consensys.github.io/smart-contract-best-practices/'],
          cwe: 'CWE-362',
          exploitability: 0.5
        });
      }
    }

    return findings;
  }

  private async analyzeInterProcedural(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Build call graph
    const callGraph = this.buildCallGraph(parseData);
    
    // Analyze call paths
    for (const [caller, callees] of callGraph.entries()) {
      for (const callee of callees) {
        // Check for recursive calls without proper termination
        if (this.hasRecursiveCall(callGraph, caller, callee)) {
          findings.push({
            id: `recursive-call-${caller}-${callee}`,
            title: 'Potential Infinite Recursion',
            description: `Recursive call between '${caller}' and '${callee}' may cause stack overflow`,
            severity: 'medium',
            confidence: 0.5,
            category: 'Control Flow',
            location: {
              file: this.getFunctionFile(parseData, caller),
              line: this.getFunctionLine(parseData, caller)
            },
            code: `${caller} -> ${callee}`,
            recommendation: 'Add proper termination conditions for recursive calls',
            references: ['https://en.wikipedia.org/wiki/Stack_overflow'],
            cwe: 'CWE-674',
            exploitability: 0.3
          });
        }

        // Check for privilege escalation through call chains
        if (this.hasPrivilegeEscalation(parseData, caller, callee)) {
          findings.push({
            id: `privilege-escalation-${caller}-${callee}`,
            title: 'Privilege Escalation Risk',
            description: `Call from '${caller}' to '${callee}' may lead to privilege escalation`,
            severity: 'high',
            confidence: 0.7,
            category: 'Access Control',
            location: {
              file: this.getFunctionFile(parseData, caller),
              line: this.getFunctionLine(parseData, caller)
            },
            code: `${caller} -> ${callee}`,
            recommendation: 'Ensure proper access control throughout call chains',
            references: ['https://owasp.org/www-project-smart-contract-top-10/'],
            cwe: 'CWE-269',
            exploitability: 0.8
          });
        }
      }
    }

    return findings;
  }

  private async analyzeDataFlow(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Analyze data flow for each function
    for (const func of parseData.functions) {
      const dataFlow = this.analyzeDataFlowInFunction(parseData, func);
      
      // Check for uninitialized variables
      for (const variable of dataFlow.uninitializedVariables) {
        findings.push({
          id: `uninitialized-var-${func.name}-${variable.name}`,
          title: 'Uninitialized Variable Usage',
          description: `Variable '${variable.name}' is used before initialization in function '${func.name}'`,
          severity: 'medium',
          confidence: 0.8,
          category: 'Data Flow',
          location: {
            file: func.file,
            line: variable.line
          },
          code: variable.name,
          recommendation: 'Initialize variables before use',
          references: ['https://cwe.mitre.org/data/definitions/457.html'],
          cwe: 'CWE-457',
          exploitability: 0.4
        });
      }

      // Check for dead code
      for (const deadCode of dataFlow.deadCode) {
        findings.push({
          id: `dead-code-${func.name}-${deadCode.line}`,
          title: 'Dead Code Detected',
          description: `Unreachable code detected in function '${func.name}'`,
          severity: 'low',
          confidence: 0.9,
          category: 'Code Quality',
          location: {
            file: func.file,
            line: deadCode.line
          },
          code: deadCode.code,
          recommendation: 'Remove unreachable code',
          references: ['https://cwe.mitre.org/data/definitions/561.html'],
          cwe: 'CWE-561',
          exploitability: 0.0
        });
      }

      // Check for sensitive data exposure
      for (const exposure of dataFlow.sensitiveDataExposures) {
        findings.push({
          id: `data-exposure-${func.name}-${exposure.variable}`,
          title: 'Sensitive Data Exposure',
          description: `Sensitive data '${exposure.variable}' may be exposed in function '${func.name}'`,
          severity: 'high',
          confidence: 0.6,
          category: 'Information Disclosure',
          location: {
            file: func.file,
            line: exposure.line
          },
          code: exposure.variable,
          recommendation: 'Protect sensitive data from unauthorized access',
          references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
          cwe: 'CWE-200',
          exploitability: 0.7
        });
      }
    }

    return findings;
  }

  private async analyzeContractInteractions(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Analyze external contract calls
    const externalCalls = this.findExternalCalls(parseData);
    
    for (const call of externalCalls) {
      // Check for unchecked external calls
      if (!call.hasErrorHandling) {
        findings.push({
          id: `unchecked-external-call-${call.function}-${call.line}`,
          title: 'Unchecked External Call',
          description: `External call in function '${call.function}' lacks proper error handling`,
          severity: 'medium',
          confidence: 0.7,
          category: 'External Calls',
          location: {
            file: call.file,
            line: call.line
          },
          code: call.code,
          recommendation: 'Add proper error handling for external calls',
          references: ['https://consensys.github.io/smart-contract-best-practices/'],
          cwe: 'CWE-252',
          exploitability: 0.5
        });
      }

      // Check for reentrancy in cross-contract calls
      if (call.hasStateChangeAfter) {
        findings.push({
          id: `cross-contract-reentrancy-${call.function}-${call.line}`,
          title: 'Cross-Contract Reentrancy Risk',
          description: `External call followed by state change in function '${call.function}'`,
          severity: 'high',
          confidence: 0.6,
          category: 'Reentrancy',
          location: {
            file: call.file,
            line: call.line
          },
          code: call.code,
          recommendation: 'Use checks-effects-interactions pattern',
          references: ['https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/'],
          cwe: 'CWE-367',
          exploitability: 0.8
        });
      }
    }

    return findings;
  }

  private async analyzeEconomicLogic(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Analyze token transfer logic
    const tokenTransfers = this.findTokenTransfers(parseData);
    
    for (const transfer of tokenTransfers) {
      // Check for missing balance checks
      if (!transfer.hasBalanceCheck) {
        findings.push({
          id: `missing-balance-check-${transfer.function}-${transfer.line}`,
          title: 'Missing Balance Check',
          description: `Token transfer in function '${transfer.function}' lacks balance validation`,
          severity: 'high',
          confidence: 0.8,
          category: 'Economic Logic',
          location: {
            file: transfer.file,
            line: transfer.line
          },
          code: transfer.code,
          recommendation: 'Check sender balance before transfer',
          references: ['https://consensys.github.io/smart-contract-best-practices/'],
          cwe: 'CWE-682',
          exploitability: 0.7
        });
      }

      // Check for overflow in economic calculations
      if (transfer.hasArithmetic && !transfer.hasOverflowCheck) {
        findings.push({
          id: `economic-overflow-${transfer.function}-${transfer.line}`,
          title: 'Economic Logic Overflow Risk',
          description: `Arithmetic in token logic may overflow in function '${transfer.function}'`,
          severity: 'critical',
          confidence: 0.7,
          category: 'Economic Logic',
          location: {
            file: transfer.file,
            line: transfer.line
          },
          code: transfer.code,
          recommendation: 'Use safe arithmetic for economic calculations',
          references: ['https://consensys.github.io/smart-contract-best-practices/'],
          cwe: 'CWE-190',
          exploitability: 0.9
        });
      }
    }

    return findings;
  }

  // Helper methods
  private analyzeFunction(parseData: ParsedData, func: any) {
    const fileContent = this.getFileContent(parseData, func.file);
    const functionContent = this.extractFunctionContent(fileContent, func);

    return {
      hasStateChanges: /=\s*[^=]/.test(functionContent),
      hasValidation: /(require|assert|if.*return|match)/i.test(functionContent),
      hasInconsistentStateTransitions: this.detectInconsistentTransitions(functionContent)
    };
  }

  private buildCallGraph(parseData: ParsedData): Map<string, string[]> {
    const callGraph = new Map<string, string[]>();
    
    for (const func of parseData.functions) {
      const callees = this.findFunctionCalls(parseData, func);
      callGraph.set(func.name, callees);
    }

    return callGraph;
  }

  private findFunctionCalls(parseData: ParsedData, func: any): string[] {
    const fileContent = this.getFileContent(parseData, func.file);
    const functionContent = this.extractFunctionContent(fileContent, func);
    
    const calls: string[] = [];
    const callMatches = functionContent.matchAll(/(\w+)\s*\(/g);
    
    for (const match of callMatches) {
      const functionName = match[1];
      if (this.isDefinedFunction(parseData, functionName)) {
        calls.push(functionName);
      }
    }

    return calls;
  }

  private hasRecursiveCall(callGraph: Map<string, string[]>, start: string, target: string): boolean {
    const visited = new Set<string>();
    const stack = [target];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === start) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      const callees = callGraph.get(current) || [];
      stack.push(...callees);
    }

    return false;
  }

  private analyzeDataFlowInFunction(parseData: ParsedData, func: any) {
    return {
      uninitializedVariables: this.findUninitializedVariables(parseData, func),
      deadCode: this.findDeadCode(parseData, func),
      sensitiveDataExposures: this.findSensitiveDataExposures(parseData, func)
    };
  }

  private findExternalCalls(parseData: ParsedData) {
    const calls: any[] = [];
    
    for (const func of parseData.functions) {
      const fileContent = this.getFileContent(parseData, func.file);
      const functionContent = this.extractFunctionContent(fileContent, func);
      
      const externalCallMatches = functionContent.matchAll(/(\w+)\.(\w+)\s*\(/g);
      
      for (const match of externalCallMatches) {
        calls.push({
          function: func.name,
          file: func.file,
          line: func.startLine + this.getRelativeLine(functionContent, match.index || 0),
          code: match[0],
          hasErrorHandling: this.hasErrorHandling(functionContent, match.index || 0),
          hasStateChangeAfter: this.hasStateChangeAfter(functionContent, match.index || 0)
        });
      }
    }

    return calls;
  }

  private findTokenTransfers(parseData: ParsedData) {
    const transfers: any[] = [];
    
    for (const func of parseData.functions) {
      const fileContent = this.getFileContent(parseData, func.file);
      const functionContent = this.extractFunctionContent(fileContent, func);
      
      const transferMatches = functionContent.matchAll(/(transfer|send|mint|burn)\s*\(/gi);
      
      for (const match of transferMatches) {
        transfers.push({
          function: func.name,
          file: func.file,
          line: func.startLine + this.getRelativeLine(functionContent, match.index || 0),
          code: match[0],
          hasBalanceCheck: this.hasBalanceCheck(functionContent, match.index || 0),
          hasArithmetic: /[+\-*/]/.test(functionContent),
          hasOverflowCheck: this.hasOverflowCheck(functionContent, match.index || 0)
        });
      }
    }

    return transfers;
  }

  // Utility methods
  private getFileContent(parseData: ParsedData, fileName: string): string {
    return parseData.ast[fileName]?.content || '';
  }

  private extractFunctionContent(fileContent: string, func: any): string {
    const lines = fileContent.split('\n');
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private getRelativeLine(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private detectInconsistentTransitions(content: string): boolean {
    // Simplified check for inconsistent state transitions
    return false; // Would need more sophisticated analysis
  }

  private isDefinedFunction(parseData: ParsedData, functionName: string): boolean {
    return parseData.functions.some(func => func.name === functionName);
  }

  private getFunctionFile(parseData: ParsedData, functionName: string): string {
    const func = parseData.functions.find(f => f.name === functionName);
    return func?.file || '';
  }

  private getFunctionLine(parseData: ParsedData, functionName: string): number {
    const func = parseData.functions.find(f => f.name === functionName);
    return func?.startLine || 0;
  }

  private hasPrivilegeEscalation(parseData: ParsedData, caller: string, callee: string): boolean {
    // Check if calling from less privileged to more privileged function
    const callerFunc = parseData.functions.find(f => f.name === caller);
    const calleeFunc = parseData.functions.find(f => f.name === callee);
    
    return callerFunc?.visibility === 'public' && calleeFunc?.visibility === 'private';
  }

  private findUninitializedVariables(parseData: ParsedData, func: any): any[] {
    // Simplified implementation
    return [];
  }

  private findDeadCode(parseData: ParsedData, func: any): any[] {
    // Simplified implementation
    return [];
  }

  private findSensitiveDataExposures(parseData: ParsedData, func: any): any[] {
    // Simplified implementation
    return [];
  }

  private hasErrorHandling(content: string, position: number): boolean {
    const context = content.substring(position, position + 200);
    return /(try|catch|match|Result|Option|unwrap_or|expect)/i.test(context);
  }

  private hasStateChangeAfter(content: string, position: number): boolean {
    const afterContext = content.substring(position + 50);
    return /=\s*[^=]/.test(afterContext);
  }

  private hasBalanceCheck(content: string, position: number): boolean {
    const beforeContext = content.substring(Math.max(0, position - 200), position);
    return /(balance|amount|sufficient|check)/i.test(beforeContext);
  }

  private hasOverflowCheck(content: string, position: number): boolean {
    return /(checked_|safe_|overflow)/i.test(content);
  }
}
