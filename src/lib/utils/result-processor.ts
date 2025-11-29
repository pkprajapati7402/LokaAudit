// Test Result Processing and Analysis
import { 
  TestResult, 
  TestCase, 
  ExecutionResult,
  TestResultStatus,
  ExportData,
  ExportOptions 
} from '../types/test-types';

export class TestResultProcessor {
  private static instance: TestResultProcessor;

  static getInstance(): TestResultProcessor {
    if (!TestResultProcessor.instance) {
      TestResultProcessor.instance = new TestResultProcessor();
    }
    return TestResultProcessor.instance;
  }

  processExecutionResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    sessionId: string
  ): TestResult {
    const status = this.determineTestStatus(executionResult);
    const message = this.generateResultMessage(executionResult, status);

    return {
      sessionId,
      testId: testCase.testId,
      testCaseId: testCase._id || '',
      fileName: testCase.fileName,
      testName: testCase.name,
      status,
      executionTime: executionResult.executionTime,
      message,
      output: executionResult.stdout,
      error: executionResult.stderr || executionResult.error,
      metrics: {
        memoryUsage: executionResult.memoryUsage,
        cpuTime: executionResult.executionTime,
        exitCode: executionResult.exitCode
      },
      timestamp: new Date()
    };
  }

  private determineTestStatus(result: ExecutionResult): TestResultStatus {
    if (result.timedOut) {
      return 'timeout';
    }
    
    if (result.error) {
      return 'error';
    }
    
    if (result.exitCode === 0) {
      // Check for test failures in output
      const hasFailures = this.checkForTestFailures(result.stdout, result.stderr);
      return hasFailures ? 'failed' : 'passed';
    }
    
    return 'failed';
  }

  private checkForTestFailures(stdout: string, stderr: string): boolean {
    const failurePatterns = [
      /FAILED/i,
      /failed:/i,
      /assertion failed/i,
      /panicked/i,
      /error:/i,
      /ERROR/,
      /FAIL/,
      /test result: FAILED/i
    ];

    const output = stdout + stderr;
    return failurePatterns.some(pattern => pattern.test(output));
  }

  private generateResultMessage(result: ExecutionResult, status: TestResultStatus): string {
    switch (status) {
      case 'passed':
        return `Test passed successfully in ${result.executionTime}ms`;
      case 'failed':
        return `Test failed: ${result.stderr || result.error || 'Unknown failure'}`;
      case 'error':
        return `Test error: ${result.error || 'Unknown error'}`;
      case 'timeout':
        return `Test timed out after ${result.executionTime}ms`;
      case 'skipped':
        return 'Test was skipped';
      default:
        return 'Unknown test result';
    }
  }

  calculateSessionSummary(results: TestResult[]): {
    totalTests: number;
    passed: number;
    failed: number;
    errors: number;
    timeouts: number;
    skipped: number;
    totalExecutionTime: number;
    successRate: number;
    averageExecutionTime: number;
    performanceMetrics: {
      fastestTest: { name: string; time: number } | null;
      slowestTest: { name: string; time: number } | null;
      averageMemoryUsage: number;
    };
  } {
    const totalTests = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;
    const timeouts = results.filter(r => r.status === 'timeout').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const averageExecutionTime = totalTests > 0 ? totalExecutionTime / totalTests : 0;

    // Performance metrics
    const validResults = results.filter(r => r.executionTime > 0);
    const fastestTest = validResults.length > 0 
      ? validResults.reduce((min, r) => r.executionTime < min.executionTime ? r : min)
      : null;
    const slowestTest = validResults.length > 0
      ? validResults.reduce((max, r) => r.executionTime > max.executionTime ? r : max)
      : null;
    
    const averageMemoryUsage = results.reduce((sum, r) => 
      sum + (r.metrics?.memoryUsage || 0), 0) / Math.max(totalTests, 1);

    return {
      totalTests,
      passed,
      failed,
      errors,
      timeouts,
      skipped,
      totalExecutionTime,
      successRate,
      averageExecutionTime,
      performanceMetrics: {
        fastestTest: fastestTest ? { name: fastestTest.testName, time: fastestTest.executionTime } : null,
        slowestTest: slowestTest ? { name: slowestTest.testName, time: slowestTest.executionTime } : null,
        averageMemoryUsage
      }
    };
  }

  generateTestReport(results: TestResult[], testCases: TestCase[]): {
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      errors: number;
      timeouts: number;
      skipped: number;
      totalExecutionTime: number;
      successRate: number;
      averageExecutionTime: number;
      performanceMetrics: {
        fastestTest: { name: string; time: number } | null;
        slowestTest: { name: string; time: number } | null;
        averageMemoryUsage: number;
      };
    };
    detailedResults: Array<{
      testCase: TestCase;
      result: TestResult;
      analysis: {
        complexity: 'low' | 'medium' | 'high';
        performance: 'excellent' | 'good' | 'fair' | 'poor';
        reliability: 'stable' | 'unstable' | 'flaky';
      };
    }>;
    recommendations: string[];
  } {
    const summary = this.calculateSessionSummary(results);
    
    const detailedResults = results.map(result => {
      const testCase = testCases.find(tc => tc.testId === result.testId);
      if (!testCase) {
        throw new Error(`Test case not found for result: ${result.testId}`);
      }

      const analysis = this.analyzeTestResult(result, testCase);
      
      return {
        testCase,
        result,
        analysis
      };
    });

    const recommendations = this.generateRecommendations(summary, detailedResults);

    return {
      summary,
      detailedResults,
      recommendations
    };
  }

  private analyzeTestResult(result: TestResult, testCase: TestCase): {
    complexity: 'low' | 'medium' | 'high';
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    reliability: 'stable' | 'unstable' | 'flaky';
  } {
    // Complexity analysis
    const complexity = testCase.metadata?.complexity || 5;
    const complexityLevel = complexity <= 3 ? 'low' : complexity <= 7 ? 'medium' : 'high';

    // Performance analysis
    const executionTime = result.executionTime;
    let performance: 'excellent' | 'good' | 'fair' | 'poor';
    if (executionTime < 100) performance = 'excellent';
    else if (executionTime < 500) performance = 'good';
    else if (executionTime < 2000) performance = 'fair';
    else performance = 'poor';

    // Reliability analysis
    let reliability: 'stable' | 'unstable' | 'flaky';
    if (result.status === 'passed') reliability = 'stable';
    else if (result.status === 'timeout' || result.status === 'error') reliability = 'unstable';
    else reliability = 'flaky';

    return {
      complexity: complexityLevel,
      performance,
      reliability
    };
  }

  private generateRecommendations(
    summary: ReturnType<typeof this.calculateSessionSummary>,
    detailedResults: Array<{ testCase: TestCase; result: TestResult; analysis: any }>
  ): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (summary.successRate < 70) {
      recommendations.push('Low test success rate detected. Review failing tests and fix underlying issues.');
    } else if (summary.successRate < 90) {
      recommendations.push('Some tests are failing. Consider reviewing test logic and implementation.');
    }

    // Performance recommendations
    if (summary.averageExecutionTime > 1000) {
      recommendations.push('Tests are running slowly. Consider optimizing test logic or infrastructure.');
    }

    // Error analysis
    if (summary.errors > 0) {
      recommendations.push(`${summary.errors} test(s) encountered errors. Review test environment and dependencies.`);
    }

    if (summary.timeouts > 0) {
      recommendations.push(`${summary.timeouts} test(s) timed out. Consider increasing timeout or optimizing test performance.`);
    }

    // Test complexity recommendations
    const highComplexityTests = detailedResults.filter(r => r.analysis.complexity === 'high').length;
    if (highComplexityTests > detailedResults.length * 0.3) {
      recommendations.push('Many tests have high complexity. Consider breaking them down into simpler, more focused tests.');
    }

    // Performance recommendations for specific tests
    const poorPerformanceTests = detailedResults.filter(r => r.analysis.performance === 'poor').length;
    if (poorPerformanceTests > 0) {
      recommendations.push(`${poorPerformanceTests} test(s) have poor performance. Review and optimize these tests.`);
    }

    return recommendations;
  }

  analyzeVulnerabilities(results: TestResult[], testCases: TestCase[]): {
    securityIssues: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      testName: string;
      fileName: string;
      description: string;
      recommendation: string;
    }>;
    overallSecurityScore: number;
  } {
    const securityIssues: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      testName: string;
      fileName: string;
      description: string;
      recommendation: string;
    }> = [];

    const securityTestResults = results.filter(r => {
      const testCase = testCases.find(tc => tc.testId === r.testId);
      return testCase?.testType === 'security';
    });

    for (const result of securityTestResults) {
      const testCase = testCases.find(tc => tc.testId === result.testId);
      if (!testCase) continue;

      if (result.status === 'failed') {
        // Security test failure indicates potential vulnerability
        const severity = this.determineSeverity(result, testCase);
        securityIssues.push({
          severity,
          testName: result.testName,
          fileName: result.fileName,
          description: `Security test failed: ${result.message}`,
          recommendation: this.getSecurityRecommendation(severity, testCase)
        });
      }
    }

    // Calculate overall security score
    const totalSecurityTests = securityTestResults.length;
    const passedSecurityTests = securityTestResults.filter(r => r.status === 'passed').length;
    const overallSecurityScore = totalSecurityTests > 0 
      ? Math.round((passedSecurityTests / totalSecurityTests) * 100)
      : 100;

    return {
      securityIssues,
      overallSecurityScore
    };
  }

  private determineSeverity(result: TestResult, testCase: TestCase): 'low' | 'medium' | 'high' | 'critical' {
    // Analyze the test output to determine severity
    const output = (result.output || '') + (result.error || '');
    
    const criticalPatterns = ['overflow', 'underflow', 'reentrancy', 'privilege escalation'];
    const highPatterns = ['access control', 'authentication', 'authorization'];
    const mediumPatterns = ['validation', 'input', 'boundary'];
    
    if (criticalPatterns.some(pattern => output.toLowerCase().includes(pattern))) {
      return 'critical';
    } else if (highPatterns.some(pattern => output.toLowerCase().includes(pattern))) {
      return 'high';
    } else if (mediumPatterns.some(pattern => output.toLowerCase().includes(pattern))) {
      return 'medium';
    }
    
    return 'low';
  }

  private getSecurityRecommendation(severity: string, testCase: TestCase): string {
    const recommendations = {
      critical: 'Immediate action required. This vulnerability could lead to total system compromise.',
      high: 'High priority fix needed. This issue poses significant security risks.',
      medium: 'Should be addressed in the next security update cycle.',
      low: 'Consider addressing during routine maintenance.'
    };
    
    return recommendations[severity as keyof typeof recommendations] || 'Review and assess the security implications.';
  }
}

export class ReportGenerator {
  static generateJSONReport(exportData: ExportData): string {
    return JSON.stringify(exportData, null, 2);
  }

  static generateMarkdownReport(exportData: ExportData): string {
    const { session, summary } = exportData;
    
    let markdown = `# Test Report\n\n`;
    markdown += `**Project:** ${summary.projectInfo.name}\n`;
    markdown += `**Developer:** ${summary.projectInfo.developerId}\n`;
    markdown += `**Language:** ${summary.projectInfo.language}\n`;
    markdown += `**Generated:** ${exportData.generatedAt.toISOString()}\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${summary.testSummary.totalTests} |\n`;
    markdown += `| Passed | ${summary.testSummary.passed} |\n`;
    markdown += `| Failed | ${summary.testSummary.totalTests - summary.testSummary.passed} |\n`;
    markdown += `| Success Rate | ${((summary.testSummary.passed / summary.testSummary.totalTests) * 100).toFixed(1)}% |\n`;
    markdown += `| Execution Time | ${summary.testSummary.executionTime}ms |\n\n`;
    
    markdown += `## Performance Metrics\n\n`;
    markdown += `- **Average Execution Time:** ${summary.performanceMetrics.averageExecutionTime.toFixed(2)}ms\n`;
    markdown += `- **Memory Usage:** ${summary.performanceMetrics.memoryUsage.toFixed(2)}MB\n`;
    markdown += `- **Success Rate:** ${summary.performanceMetrics.successRate.toFixed(1)}%\n\n`;
    
    markdown += `## Test Results\n\n`;
    exportData.results.forEach((result) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌';
      markdown += `${statusIcon} **${result.testName}** (${result.executionTime}ms)\n`;
      markdown += `   - File: ${result.fileName}\n`;
      markdown += `   - Status: ${result.status}\n`;
      if (result.message) {
        markdown += `   - Message: ${result.message}\n`;
      }
      markdown += `\n`;
    });
    
    return markdown;
  }

  static generatePDFReport(exportData: ExportData): Buffer {
    // This would typically use a PDF generation library like jsPDF or Puppeteer
    // For now, return a placeholder
    const content = this.generateMarkdownReport(exportData);
    return Buffer.from(content, 'utf8');
  }
}

export default TestResultProcessor;
