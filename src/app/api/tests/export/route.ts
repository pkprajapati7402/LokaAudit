// API Route: Export Test Results
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getTestSession,
  getTestCasesBySession,
  getTestResultsBySession,
  logAuditAction
} from '@/lib/database/models';
import { TestResultProcessor, ReportGenerator } from '@/lib/utils/result-processor';
import { 
  ValidationError,
  ExportData,
  ExportOptions
} from '@/lib/types/test-types';

// Request validation schema
const exportSchema = z.object({
  sessionId: z.string().min(1),
  format: z.enum(['json', 'md', 'pdf']),
  includeSourceCode: z.boolean().optional().default(false),
  includeTestResults: z.boolean().optional().default(true),
  includeMetrics: z.boolean().optional().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = exportSchema.parse(body);
    
    const { sessionId, format, includeSourceCode, includeTestResults, includeMetrics } = validatedData;
    
    console.log(`📥 Exporting ${format} report for session: ${sessionId}`);
    
    // Get session and related data
    const session = await getTestSession(sessionId);
    if (!session) {
      throw new ValidationError('Test session not found', 'sessionId', sessionId);
    }
    
    const [testCases, testResults] = await Promise.all([
      getTestCasesBySession(sessionId),
      getTestResultsBySession(sessionId)
    ]);
    
    if (testResults.length === 0) {
      throw new ValidationError('No test results to export', 'testResults', []);
    }
    
    // Process results and generate summary
    const resultProcessor = TestResultProcessor.getInstance();
    const summary = resultProcessor.calculateSessionSummary(testResults);
    
    // Prepare export data
    const exportData: ExportData = {
      session,
      testCases: includeSourceCode ? testCases : testCases.map(tc => ({ ...tc, code: '[SOURCE_CODE_EXCLUDED]' })),
      results: includeTestResults ? testResults : [],
      summary: {
        projectInfo: {
          name: session.projectName,
          developerId: session.developerId,
          language: testCases[0]?.language || 'unknown',
          filesCount: session.selectedFiles.length
        },
        testSummary: {
          totalTests: summary.totalTests,
          passed: summary.passed,
          failed: summary.failed,
          executionTime: summary.totalExecutionTime
        },
        performanceMetrics: includeMetrics ? {
          averageExecutionTime: summary.averageExecutionTime,
          memoryUsage: summary.performanceMetrics.averageMemoryUsage,
          successRate: summary.successRate
        } : {
          averageExecutionTime: 0,
          memoryUsage: 0,
          successRate: 0
        }
      },
      generatedAt: new Date()
    };
    
    // Generate report based on format
    let content: string | Buffer;
    let contentType: string;
    let filename: string;
    
    switch (format) {
      case 'json':
        content = ReportGenerator.generateJSONReport(exportData);
        contentType = 'application/json';
        filename = `test-report-${sessionId}-${Date.now()}.json`;
        break;
        
      case 'md':
        content = ReportGenerator.generateMarkdownReport(exportData);
        contentType = 'text/markdown';
        filename = `test-report-${sessionId}-${Date.now()}.md`;
        break;
        
      case 'pdf':
        content = ReportGenerator.generatePDFReport(exportData);
        contentType = 'application/pdf';
        filename = `test-report-${sessionId}-${Date.now()}.pdf`;
        break;
        
      default:
        throw new ValidationError('Unsupported export format', 'format', format);
    }
    
    // Log export action
    await logAuditAction(
      sessionId,
      session.developerId,
      'export_downloaded',
      {
        format,
        includeSourceCode,
        includeTestResults,
        includeMetrics,
        dataSize: typeof content === 'string' ? content.length : content.length
      }
    );
    
    console.log(`✅ Generated ${format} export: ${filename}`);
    
    // Return file for download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache');
    
    return new NextResponse(content as string, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 });
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json({
        error: error.message,
        field: error.field,
        value: error.value
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to export test results'
    }, { status: 500 });
  }
}

// GET method to get available export options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    const session = await getTestSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const [testCases, testResults] = await Promise.all([
      getTestCasesBySession(sessionId),
      getTestResultsBySession(sessionId)
    ]);
    
    return NextResponse.json({
      sessionId,
      exportOptions: {
        formats: ['json', 'md', 'pdf'],
        hasTestCases: testCases.length > 0,
        hasResults: testResults.length > 0,
        canIncludeSourceCode: testCases.length > 0,
        estimatedSizes: {
          json: Math.round((JSON.stringify({ testCases, testResults }).length / 1024) * 100) / 100, // KB
          md: Math.round((testResults.length * 0.5) * 100) / 100, // KB estimate
          pdf: Math.round((testResults.length * 2) * 100) / 100  // KB estimate
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to get export options:', error);
    return NextResponse.json({
      error: 'Failed to get export options'
    }, { status: 500 });
  }
}
