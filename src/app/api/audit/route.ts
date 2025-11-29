import { NextRequest, NextResponse } from 'next/server';
import { AuditProcessor, AuditRequest } from '../../../lib/audit/audit-processor';
import { saveAuditResult, getProjectById } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let body: any = {};

    // Handle both FormData and JSON requests
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body.projectId = formData.get('projectId') as string;
      body.auditType = formData.get('auditType') as string || 'comprehensive';
    } else {
      body = await request.json();
    }

    const {
      projectId,
      projectName,
      language,
      files,
      code,
      auditType = 'comprehensive'
    } = body;

    let auditRequest: AuditRequest;

    // Scenario 1: Audit existing project from database
    if (projectId && !projectName && !files && !code) {
      console.log(`Auditing existing project: ${projectId}`);
      
      // Get project data from database
      const project = await getProjectById(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      auditRequest = {
        projectId,
        projectName: project.projectName,
        language: project.language,
        files: project.files.map((file: any) => ({
          fileName: file.fileName,
          content: file.content,
          size: file.size,
          uploadDate: file.uploadDate || new Date()
        })),
        auditType,
        priority: 1,
        configuration: {
          enabledAnalyzers: ['static', 'semantic', 'ai', 'external'],
          aiAnalysisEnabled: true,
          externalToolsEnabled: true,
          confidenceThreshold: 0.6,
          severityThreshold: 'low'
        }
      };
    } 
    // Scenario 2: Audit direct code/files upload
    else {
      console.log(`Auditing direct upload for project: ${projectName}`);
      
      if (!projectName || !language) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Missing required fields',
            details: 'projectName and language are required for direct uploads'
          },
          { status: 400 }
        );
      }

      // Handle code input (pasted code)
      let auditFiles = files || [];
      if (code && code.trim()) {
        // Determine file extension based on language
        const getFileExtension = (lang: string) => {
          if (lang.includes('Rust')) return '.rs';
          if (lang.includes('Move')) return '.move';
          if (lang.includes('Cairo')) return '.cairo';
          return '.rs'; // default
        };

        const fileName = `main${getFileExtension(language)}`;
        auditFiles = [{
          fileName,
          content: code,
          size: code.length,
          uploadDate: new Date()
        }];
      }

      if (!auditFiles || auditFiles.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No files provided',
            details: 'Please provide files or code to audit'
          },
          { status: 400 }
        );
      }

      auditRequest = {
        projectId: projectId || `audit-${Date.now()}`,
        projectName,
        language,
        files: auditFiles,
        auditType,
        priority: 1,
        configuration: {
          enabledAnalyzers: ['static', 'semantic', 'ai', 'external'],
          aiAnalysisEnabled: true,
          externalToolsEnabled: true,
          confidenceThreshold: 0.6,
          severityThreshold: 'low'
        }
      };
    }

    console.log(`Starting audit for project: ${auditRequest.projectName}, language: ${auditRequest.language}`);
    
    // Initialize audit processor
    const auditProcessor = new AuditProcessor();
    
    // Start audit process
    const auditResult = await auditProcessor.processAudit(auditRequest);

    console.log(`Audit completed for project: ${auditRequest.projectName}`);

    // Save audit result to database
    try {
      await saveAuditResult({
        projectId: auditRequest.projectId,
        auditId: auditResult.auditId,
        result: auditResult,
        status: 'completed',
        completedAt: new Date()
      });
    } catch (dbError) {
      console.warn('Failed to save audit result to database:', dbError);
      // Continue without failing the entire audit
    }

    return NextResponse.json({
      success: true,
      message: 'Audit completed successfully',
      auditId: auditResult.auditId,
      projectName: auditRequest.projectName,
      language: auditRequest.language,
      status: auditResult.status || 'completed',
      summary: auditResult.summary,
      findingsCount: auditResult.findings.length,
      recommendations: auditResult.recommendations,
      securityScore: auditResult.summary.securityScore,
      issues: {
        critical: auditResult.summary.criticalIssues,
        high: auditResult.summary.highIssues,
        medium: auditResult.summary.mediumIssues,
        low: auditResult.summary.lowIssues
      },
      // Include first few findings for preview
      sampleFindings: auditResult.findings.slice(0, 5).map(finding => ({
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        category: finding.category,
        description: finding.description.substring(0, 200) + (finding.description.length > 200 ? '...' : ''),
        location: finding.location,
        recommendation: finding.recommendation
      })),
      result: auditResult
    });

  } catch (error) {
    console.error('Audit process error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Audit processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get('auditId');
  const projectId = searchParams.get('projectId');

  if (!auditId && !projectId) {
    return NextResponse.json(
      { error: 'auditId or projectId is required' },
      { status: 400 }
    );
  }

  try {
    // TODO: Implementation to get audit results from database
    // This would fetch from your database based on auditId or projectId
    return NextResponse.json({
      success: true,
      message: 'Audit results endpoint - implementation pending',
      auditId,
      projectId
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit results' },
      { status: 500 }
    );
  }
}
