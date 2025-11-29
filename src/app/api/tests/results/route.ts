// API Route: Get Test Results
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getTestSession,
  getTestCasesBySession,
  getTestResultsBySession
} from '@/lib/database/models';
import { TestResultProcessor } from '@/lib/utils/result-processor';
import { ValidationError } from '@/lib/types/test-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true';
    const includeVulnerabilities = searchParams.get('includeVulnerabilities') === 'true';
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    console.log(`📊 Fetching results for session: ${sessionId}`);
    
    // Get test session
    const session = await getTestSession(sessionId);
    if (!session) {
      throw new ValidationError('Test session not found', 'sessionId', sessionId);
    }
    
    // Get test cases and results
    const [testCases, testResults] = await Promise.all([
      getTestCasesBySession(sessionId),
      getTestResultsBySession(sessionId)
    ]);
    
    console.log(`📝 Found ${testCases.length} test cases and ${testResults.length} results`);
    
    const resultProcessor = TestResultProcessor.getInstance();
    
    // Calculate basic summary
    const summary = resultProcessor.calculateSessionSummary(testResults);
    
    let response: any = {
      sessionId,
      session: {
        projectName: session.projectName,
        developerId: session.developerId,
        testType: session.testType,
        status: session.status,
        selectedFiles: session.selectedFiles,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        completedAt: session.completedAt
      },
      testCases,
      results: testResults,
      summary
    };
    
    // Include detailed analysis if requested
    if (includeAnalysis && testResults.length > 0) {
      console.log('🔍 Generating detailed analysis');
      const analysisReport = resultProcessor.generateTestReport(testResults, testCases);
      response.analysis = analysisReport;
    }
    
    // Include vulnerability analysis if requested
    if (includeVulnerabilities && testResults.length > 0) {
      console.log('🛡️ Analyzing security vulnerabilities');
      const vulnerabilityAnalysis = resultProcessor.analyzeVulnerabilities(testResults, testCases);
      response.vulnerabilityAnalysis = vulnerabilityAnalysis;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Failed to fetch test results:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json({
        error: error.message,
        field: error.field,
        value: error.value
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch test results'
    }, { status: 500 });
  }
}
