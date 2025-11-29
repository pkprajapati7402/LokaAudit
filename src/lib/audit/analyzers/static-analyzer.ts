import { ParsedData } from '../parsers/code-parser';
import { Finding } from '../audit-processor';

export class StaticAnalyzer {
  private vulnerabilityRules: VulnerabilityRule[] = [];

  constructor() {
    this.initializeRules();
  }

  async analyze(parseData: ParsedData): Promise<Finding[]> {
    console.log(`Running static analysis for project ${parseData.projectId}`);
    
    const findings: Finding[] = [];
    
    // Run all vulnerability rules
    for (const rule of this.vulnerabilityRules) {
      try {
        const ruleFindings = await rule.check(parseData);
        findings.push(...ruleFindings);
      } catch (error) {
        console.warn(`Rule ${rule.name} failed:`, error);
      }
    }

    // Sort by severity
    findings.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));

    console.log(`Static analysis found ${findings.length} potential issues`);
    return findings;
  }

  private initializeRules() {
    this.vulnerabilityRules = [
      new IntegerOverflowRule(),
      new AccessControlRule(),
      new ReentrancyRule(),
      new UncheckedReturnValueRule(),
      new UnauthorizedStateChangeRule(),
      new ResourceLeakRule(),
      new TypeConfusionRule(),
      new BufferOverflowRule(),
      new DivisionByZeroRule(),
      new UnvalidatedInputRule(),
      new PrivilegeEscalationRule(),
      new TimeManipulationRule(),
      new FrontRunningRule(),
      new DoSRule()
    ];
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}

interface VulnerabilityRule {
  name: string;
  check(parseData: ParsedData): Promise<Finding[]>;
}

class IntegerOverflowRule implements VulnerabilityRule {
  name = 'Integer Overflow Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check each file content directly
    for (const [fileName, astData] of Object.entries(parseData.ast)) {
      if (!astData.content) continue;
      
      const fileContent = astData.content;
      const lines = fileContent.split('\n');

      // Look for arithmetic operations without overflow checks
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Check for basic arithmetic without checked operations
        const arithmeticMatches = line.match(/(\w+)\s*[+\-*\/]\s*(\w+)/g);
        if (arithmeticMatches) {
          for (const match of arithmeticMatches) {
            // Skip if it's already using checked operations
            if (line.includes('checked_') || line.includes('saturating_') || line.includes('wrapping_')) {
              continue;
            }

            // Skip if it's a simple assignment or comparison
            if (line.includes('==') || line.includes('!=') || line.includes('<=') || line.includes('>=')) {
              continue;
            }

            findings.push({
              id: `overflow-${fileName}-${lineNumber}`,
              title: 'Potential Integer Overflow',
              description: `Arithmetic operation may cause integer overflow. Consider using checked arithmetic operations like checked_add(), checked_mul(), etc.`,
              severity: 'high',
              confidence: 0.7,
              category: 'Arithmetic Safety',
              location: {
                file: fileName,
                line: lineNumber
              },
              code: line.trim(),
              recommendation: 'Use checked arithmetic: checked_add(), checked_mul(), checked_sub(), or handle overflow explicitly',
              references: [
                'https://doc.rust-lang.org/std/primitive.u64.html#method.checked_add',
                'https://docs.solana.com/developing/programming-model/overview'
              ],
              cwe: 'CWE-190',
              exploitability: 0.8
            });
          }
        }

        // Check for division operations that might divide by zero
        if (line.includes('/') && !line.includes('//')) {
          const divisionMatch = line.match(/(\w+)\s*\/\s*(\w+)/);
          if (divisionMatch && !line.includes('checked_div') && !line.includes('assert') && !line.includes('require')) {
            findings.push({
              id: `division-${fileName}-${lineNumber}`,
              title: 'Potential Division by Zero',
              description: 'Division operation without zero-check may cause panic',
              severity: 'medium',
              confidence: 0.6,
              category: 'Arithmetic Safety',
              location: {
                file: fileName,
                line: lineNumber
              },
              code: line.trim(),
              recommendation: 'Add zero-check before division or use checked_div()',
              references: ['https://doc.rust-lang.org/std/primitive.u64.html#method.checked_div'],
              cwe: 'CWE-369',
              exploitability: 0.5
            });
          }
        }
      }
    }

    return findings;
  }

  private getFileContent(parseData: ParsedData, fileName: string): string {
    return parseData.ast[fileName]?.content || '';
  }

  private extractFunctionContent(fileContent: string, func: any): string {
    const lines = fileContent.split('\n');
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private hasOverflowCheck(content: string, position: number): boolean {
    // Look for overflow protection patterns
    const protectionPatterns = [
      /checked_add|checked_sub|checked_mul|checked_div/,
      /SafeMath/,
      /overflow_check/,
      /assert|require.*overflow/
    ];

    return protectionPatterns.some(pattern => pattern.test(content));
  }

  private getRelativeLine(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}

class AccessControlRule implements VulnerabilityRule {
  name = 'Access Control Validation';

  async check(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check each file for access control issues
    for (const [fileName, astData] of Object.entries(parseData.ast)) {
      if (!astData.content) continue;
      
      const fileContent = astData.content;
      const lines = fileContent.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Check for public functions without proper access control
        if (line.includes('pub fn') || line.includes('pub(crate) fn')) {
          const functionMatch = line.match(/pub(?:\([^)]*\))?\s+fn\s+(\w+)/);
          if (functionMatch) {
            const functionName = functionMatch[1];
            
            // Look for state-changing operations in the next 20 lines
            let hasStateChange = false;
            let hasAccessControl = false;
            
            for (let lookAhead = lineIndex; lookAhead < Math.min(lines.length, lineIndex + 20); lookAhead++) {
              const lookAheadLine = lines[lookAhead];
              
              // Check for state changes
              if (this.isStateChanging(lookAheadLine)) {
                hasStateChange = true;
              }
              
              // Check for access control
              if (this.hasAccessControl(lookAheadLine)) {
                hasAccessControl = true;
              }
              
              // Break if we hit another function
              if (lookAhead > lineIndex && (lookAheadLine.includes('fn ') || lookAheadLine.includes('pub fn'))) {
                break;
              }
            }

            if (hasStateChange && !hasAccessControl) {
              findings.push({
                id: `access-control-${fileName}-${lineNumber}`,
                title: 'Missing Access Control',
                description: `Public function '${functionName}' appears to modify state without proper access control checks`,
                severity: 'high',
                confidence: 0.8,
                category: 'Access Control',
                location: {
                  file: fileName,
                  line: lineNumber
                },
                code: line.trim(),
                recommendation: 'Add access control checks: require!(), assert!(), or check signer/authority',
                references: [
                  'https://docs.solana.com/developing/programming-model/transactions#signatures',
                  'https://book.anchor-lang.com/anchor_references/account_constraints.html#signer'
                ],
                cwe: 'CWE-284',
                exploitability: 0.9
              });
            }
          }
        }

        // Check for missing signer verification in Solana context
        if (line.includes('Context<') && !line.includes('//')) {
          let hasSignerCheck = false;
          
          // Look for signer checks in the next 15 lines
          for (let lookAhead = lineIndex; lookAhead < Math.min(lines.length, lineIndex + 15); lookAhead++) {
            const lookAheadLine = lines[lookAhead];
            if (lookAheadLine.includes('is_signer') || lookAheadLine.includes('signed')) {
              hasSignerCheck = true;
              break;
            }
          }

          if (!hasSignerCheck) {
            findings.push({
              id: `signer-check-${fileName}-${lineNumber}`,
              title: 'Missing Signer Verification',
              description: 'Function uses Context but may lack proper signer verification',
              severity: 'medium',
              confidence: 0.6,
              category: 'Access Control',
              location: {
                file: fileName,
                line: lineNumber
              },
              code: line.trim(),
              recommendation: 'Verify that ctx.accounts.authority.is_signer is checked',
              references: ['https://book.anchor-lang.com/anchor_references/account_constraints.html#signer'],
              cwe: 'CWE-862',
              exploitability: 0.7
            });
          }
        }
      }
    }

    return findings;
  }

  private getFileContent(parseData: ParsedData, fileName: string): string {
    return parseData.ast[fileName]?.content || '';
  }

  private extractFunctionContent(fileContent: string, func: any): string {
    const lines = fileContent.split('\n');
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private hasAccessControl(content: string): boolean {
    const accessPatterns = [
      /require!\s*\(/,
      /assert!\s*\(/,
      /only_owner|onlyOwner/,
      /is_signer|signed/,
      /access_control|AccessControl/,
      /authority|owner/,
      /admin/
    ];

    return accessPatterns.some(pattern => pattern.test(content));
  }

  private isStateChanging(content: string): boolean {
    const stateChangingPatterns = [
      /\w+\s*=(?!=)/,  // Assignment (not comparison)
      /\.push\s*\(/,
      /\.pop\s*\(/,
      /\.insert\s*\(/,
      /\.remove\s*\(/,
      /transfer|send|call/,
      /mint|burn|destroy/,
      /move_to|move_from/,
      /\*\w+\s*=/  // Dereferencing assignment
    ];

    return stateChangingPatterns.some(pattern => pattern.test(content));
  }
}

class ReentrancyRule implements VulnerabilityRule {
  name = 'Reentrancy Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const func of parseData.functions) {
      const fileContent = this.getFileContent(parseData, func.file);
      const functionContent = this.extractFunctionContent(fileContent, func);

      // Check for external calls followed by state changes
      if (this.hasExternalCall(functionContent) && this.hasStateChangeAfterCall(functionContent)) {
        findings.push({
          id: `reentrancy-${func.name}`,
          title: 'Potential Reentrancy Vulnerability',
          description: `Function '${func.name}' makes external calls before completing state changes`,
          severity: 'critical',
          confidence: 0.6,
          category: 'Reentrancy',
          location: {
            file: func.file,
            line: func.startLine
          },
          code: func.name,
          recommendation: 'Use checks-effects-interactions pattern or reentrancy guards',
          references: ['https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/'],
          cwe: 'CWE-367',
          exploitability: 0.8
        });
      }
    }

    return findings;
  }

  private getFileContent(parseData: ParsedData, fileName: string): string {
    return parseData.ast[fileName]?.content || '';
  }

  private extractFunctionContent(fileContent: string, func: any): string {
    const lines = fileContent.split('\n');
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private hasExternalCall(content: string): boolean {
    const externalCallPatterns = [
      /\.call\s*\(/,
      /\.transfer\s*\(/,
      /\.send\s*\(/,
      /invoke\s*\(/,
      /external_call/
    ];

    return externalCallPatterns.some(pattern => pattern.test(content));
  }

  private hasStateChangeAfterCall(content: string): boolean {
    // This would need more sophisticated analysis of the order of operations
    return /=\s*[^=]/.test(content);
  }
}

class UncheckedReturnValueRule implements VulnerabilityRule {
  name = 'Unchecked Return Values';

  async check(parseData: ParsedData): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check each file for unchecked return values
    for (const [fileName, astData] of Object.entries(parseData.ast)) {
      if (!astData.content) continue;
      
      const fileContent = astData.content;
      const lines = fileContent.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Look for function calls that return Result<> and might be unchecked
        const resultCalls = [
          /(\w+)\s*\([^)]*\)\s*\?/g,  // Functions called with ? operator (good)
          /(\w+)\s*\([^)]*\)\s*;/g    // Functions called without checking (potential issue)
        ];

        // Check for calls that end with semicolon (might be unchecked)
        const uncheckedCalls = line.match(/(\w+)\s*\([^)]*\)\s*;/g);
        if (uncheckedCalls) {
          for (const call of uncheckedCalls) {
            const functionName = call.match(/(\w+)\s*\(/)?.[1];
            
            if (functionName && this.returnsResult(functionName, line)) {
              // Skip if it's a clear non-result function or already handled
              if (this.isCheckedElsewhere(lines, lineIndex, functionName)) {
                continue;
              }

              findings.push({
                id: `unchecked-return-${fileName}-${lineNumber}`,
                title: 'Potentially Unchecked Return Value',
                description: `Function call '${functionName}' may return a Result that should be handled`,
                severity: 'medium',
                confidence: 0.5,
                category: 'Error Handling',
                location: {
                  file: fileName,
                  line: lineNumber
                },
                code: line.trim(),
                recommendation: 'Check return values with ? operator, match statement, or explicit error handling',
                references: [
                  'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
                  'https://docs.solana.com/developing/programming-model/overview'
                ],
                cwe: 'CWE-252',
                exploitability: 0.4
              });
            }
          }
        }

        // Check for missing unwrap checks (dangerous)
        if (line.includes('.unwrap()')) {
          findings.push({
            id: `unsafe-unwrap-${fileName}-${lineNumber}`,
            title: 'Unsafe unwrap() Usage',
            description: 'unwrap() can cause panic if the value is None or Err. Consider using safer alternatives.',
            severity: 'medium',
            confidence: 0.8,
            category: 'Error Handling',
            location: {
              file: fileName,
              line: lineNumber
            },
            code: line.trim(),
            recommendation: 'Use expect(), match, if let, or ? operator instead of unwrap()',
            references: ['https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html'],
            cwe: 'CWE-754',
            exploitability: 0.6
          });
        }
      }
    }

    return findings;
  }

  private getFileContent(parseData: ParsedData, fileName: string): string {
    return parseData.ast[fileName]?.content || '';
  }

  private extractFunctionContent(fileContent: string, func: any): string {
    const lines = fileContent.split('\n');
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private returnsResult(functionName: string, line: string): boolean {
    // Common functions that return Result<> in Rust/Solana
    const resultFunctions = [
      'try_from', 'try_into', 'parse', 'decode', 'deserialize',
      'invoke', 'invoke_signed', 'transfer', 'send',
      'create_account', 'allocate', 'assign',
      'borsh_deserialize', 'try_deserialize'
    ];

    return resultFunctions.some(fn => 
      functionName.includes(fn) || 
      line.includes(`${fn}(`) ||
      line.includes('?') // Already has ? operator
    );
  }

  private isCheckedElsewhere(lines: string[], currentIndex: number, functionName: string): boolean {
    // Check if the return value is assigned to a variable or used in a match
    const currentLine = lines[currentIndex];
    
    // Check if it's part of an assignment
    if (currentLine.includes('let ') || currentLine.includes('= ')) {
      return true;
    }
    
    // Check if it's in a match statement
    if (currentIndex > 0 && lines[currentIndex - 1].includes('match ')) {
      return true;
    }
    
    // Check next line for match or if let
    if (currentIndex + 1 < lines.length) {
      const nextLine = lines[currentIndex + 1];
      if (nextLine.includes('match ') || nextLine.includes('if let ')) {
        return true;
      }
    }
    
    return false;
  }

  private isReturnValueChecked(content: string, position: number): boolean {
    // Look for patterns that indicate the return value is being used
    const checkPatterns = [
      /let\s+\w+\s*=/,
      /if\s*\(/,
      /assert\s*\(/,
      /require\s*\(/,
      /match\s+/
    ];

    const contextBefore = content.substring(Math.max(0, position - 50), position);
    const contextAfter = content.substring(position, position + 100);
    
    return checkPatterns.some(pattern => 
      pattern.test(contextBefore) || pattern.test(contextAfter)
    );
  }

  private getRelativeLine(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}

// Add more rules...
class UnauthorizedStateChangeRule implements VulnerabilityRule {
  name = 'Unauthorized State Changes';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class ResourceLeakRule implements VulnerabilityRule {
  name = 'Resource Leak Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class TypeConfusionRule implements VulnerabilityRule {
  name = 'Type Confusion Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class BufferOverflowRule implements VulnerabilityRule {
  name = 'Buffer Overflow Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class DivisionByZeroRule implements VulnerabilityRule {
  name = 'Division by Zero Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class UnvalidatedInputRule implements VulnerabilityRule {
  name = 'Unvalidated Input Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class PrivilegeEscalationRule implements VulnerabilityRule {
  name = 'Privilege Escalation Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class TimeManipulationRule implements VulnerabilityRule {
  name = 'Time Manipulation Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class FrontRunningRule implements VulnerabilityRule {
  name = 'Front-running Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}

class DoSRule implements VulnerabilityRule {
  name = 'Denial of Service Detection';

  async check(parseData: ParsedData): Promise<Finding[]> {
    return []; // Implementation would go here
  }
}
