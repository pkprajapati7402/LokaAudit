import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const exportSchema = z.object({
  reportData: z.any(), // The audit results data
  format: z.enum(['json', 'pdf', 'html', 'csv', 'markdown']),
  options: z.object({
    includeFindings: z.boolean().optional().default(true),
    includeRecommendations: z.boolean().optional().default(true),
    includeExecutiveSummary: z.boolean().optional().default(true),
    includeTechnicalDetails: z.boolean().optional().default(true),
    includeSourceCode: z.boolean().optional().default(false)
  }).optional().default({})
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = exportSchema.parse(body);
    
    const { reportData, format, options } = validatedData;
    
    console.log(`📥 Exporting ${format.toUpperCase()} audit report`);
    
    if (!reportData) {
      return NextResponse.json(
        { error: 'No audit report data provided' },
        { status: 400 }
      );
    }

    // Generate report based on format
    let content: string | Buffer;
    let contentType: string;
    let filename: string;
    
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
    const reportId = reportData.report_metadata?.report_id || 'audit';
    
    switch (format) {
      case 'json':
        content = generateJSONReport(reportData, options);
        contentType = 'application/json';
        filename = `lokaaudit-${reportId}-${timestamp}.json`;
        break;
        
      case 'pdf':
        content = await generatePDFReport(reportData, options);
        contentType = 'application/pdf';
        filename = `lokaaudit-${reportId}-${timestamp}.pdf`;
        break;
        
      case 'html':
        content = generateHTMLReport(reportData, options);
        contentType = 'text/html';
        filename = `lokaaudit-${reportId}-${timestamp}.html`;
        break;
        
      case 'csv':
        content = generateCSVReport(reportData, options);
        contentType = 'text/csv';
        filename = `lokaaudit-findings-${reportId}-${timestamp}.csv`;
        break;
        
      case 'markdown':
        content = generateMarkdownReport(reportData, options);
        contentType = 'text/markdown';
        filename = `lokaaudit-${reportId}-${timestamp}.md`;
        break;
        
      default:
        throw new Error('Unsupported export format');
    }
    
    console.log(`✅ Generated ${format.toUpperCase()} export: ${filename}`);
    
    // Return file for download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache');
    headers.set('X-Filename', filename);
    
    return new NextResponse(content, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('❌ Audit export failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate JSON report
function generateJSONReport(reportData: any, options: any): string {
  const exportData = {
    export_metadata: {
      format: 'json',
      exported_at: new Date().toISOString(),
      exported_by: 'LokaAudit v2.0',
      options
    },
    audit_report: reportData
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Generate PDF report using jsPDF
async function generatePDFReport(reportData: any, options: any): Promise<Buffer> {
  try {
    // We'll generate an HTML version and convert to PDF
    // For production, use Puppeteer, but for now use a comprehensive text-based approach
    const htmlContent = generateHTMLReport(reportData, options);
    
    // Use jsPDF for basic PDF generation
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm'
    });
    
    // Add title
    doc.setFontSize(20);
    doc.text('LokaAudit Security Analysis Report', 20, 20);
    
    doc.setFontSize(12);
    let y = 35;
    
    // Report metadata
    doc.setFontSize(14);
    doc.text('Report Overview', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    const metadata = [
      `Report ID: ${reportData.report_metadata?.report_id || 'N/A'}`,
      `Platform: ${reportData.report_metadata?.platform || 'Unknown'}`,
      `Language: ${reportData.report_metadata?.language || 'Unknown'}`,
      `Generated: ${new Date(reportData.report_metadata?.audit_date || Date.now()).toLocaleString()}`,
      `Security Score: ${reportData.summary?.security_score || 0}/100`,
      `Total Issues: ${reportData.summary?.total_issues || 0}`,
      `Risk Level: ${reportData.summary?.overall_risk_level || 'Low'}`
    ];
    
    metadata.forEach(line => {
      if (y > 280) { // Check if we need a new page
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    });
    
    y += 10;
    
    // Summary by severity
    doc.setFontSize(14);
    doc.text('Issue Summary by Severity', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    const summaryLines = [
      `Critical: ${reportData.summary?.critical || 0}`,
      `High: ${reportData.summary?.high || 0}`,
      `Medium: ${reportData.summary?.medium || 0}`,
      `Low: ${reportData.summary?.low || 0}`,
      `Informational: ${reportData.summary?.informational || 0}`
    ];
    
    summaryLines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    });
    
    // Findings section
    if (options.includeFindings && reportData.findings?.length > 0) {
      y += 15;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`Security Findings (${reportData.findings.length})`, 20, y);
      y += 10;
      
      reportData.findings.slice(0, 20).forEach((finding: any, index: number) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${finding.title || 'Security Finding'}`, 20, y);
        y += 8;
        
        doc.setFontSize(9);
        const findingDetails = [
          `Severity: ${(finding.severity || 'Unknown').toUpperCase()}`,
          `Category: ${finding.category || 'General'}`,
          finding.affected_files?.[0] ? `File: ${finding.affected_files[0]}` : null,
          finding.line_numbers?.[0] ? `Line: ${finding.line_numbers[0]}` : null
        ].filter(Boolean);
        
        findingDetails.forEach(detail => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(detail!, 25, y);
          y += 5;
        });
        
        // Description
        if (finding.description) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(finding.description, 160);
          lines.slice(0, 3).forEach((line: string) => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, 25, y);
            y += 5;
          });
        }
        
        y += 5;
      });
    }
    
    // Recommendations section
    if (options.includeRecommendations && reportData.recommendations) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Recommendations', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      
      // Immediate actions
      if (reportData.recommendations.immediate_actions?.length > 0) {
        doc.text('Immediate Actions:', 20, y);
        y += 7;
        
        reportData.recommendations.immediate_actions.slice(0, 10).forEach((action: string, index: number) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`${index + 1}. ${action}`, 160);
          lines.slice(0, 2).forEach((line: string) => {
            doc.text(line, 25, y);
            y += 5;
          });
        });
        y += 5;
      }
      
      // High priority fixes
      if (reportData.recommendations.high_priority_fixes?.length > 0) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        
        doc.text('High Priority Fixes:', 20, y);
        y += 7;
        
        reportData.recommendations.high_priority_fixes.slice(0, 10).forEach((fix: string, index: number) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`${index + 1}. ${fix}`, 160);
          lines.slice(0, 2).forEach((line: string) => {
            doc.text(line, 25, y);
            y += 5;
          });
        });
      }
    }
    
    // Footer on each page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated by LokaAudit v2.0 - Page ${i} of ${pageCount}`, 20, 290);
      doc.text(`${new Date().toLocaleString()}`, 150, 290);
    }
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Fallback to text-based PDF if jsPDF fails
    const pdfContent = `
PDF EXPORT - LOKAAUDIT SECURITY ANALYSIS REPORT
=============================================

REPORT METADATA
---------------
Report ID: ${reportData.report_metadata?.report_id || 'N/A'}
Platform: ${reportData.report_metadata?.platform || 'N/A'}
Language: ${reportData.report_metadata?.language || 'N/A'}
Generated: ${reportData.report_metadata?.audit_date || new Date().toISOString()}
Auditor: ${reportData.report_metadata?.auditor || 'LokaAudit v2.0'}

EXECUTIVE SUMMARY
----------------
Security Score: ${reportData.summary?.security_score || 0}/100
Overall Risk: ${reportData.summary?.overall_risk_level || 'Unknown'}
Total Issues: ${reportData.summary?.total_issues || 0}
- Critical: ${reportData.summary?.critical || 0}
- High: ${reportData.summary?.high || 0}
- Medium: ${reportData.summary?.medium || 0}
- Low: ${reportData.summary?.low || 0}
- Informational: ${reportData.summary?.informational || 0}

${reportData.summary?.recommendation ? `
OVERALL RECOMMENDATION
---------------------
${reportData.summary.recommendation}
` : ''}

${reportData.summary?.executive_summary?.risk_assessment ? `
RISK ASSESSMENT
--------------
Business Impact: ${reportData.summary.executive_summary.risk_assessment.business_impact}
Deployment Status: ${reportData.summary.executive_summary.risk_assessment.deployment_readiness}
` : ''}

${options.includeFindings && reportData.findings?.length > 0 ? `
DETAILED FINDINGS
----------------
${reportData.findings.map((finding: any, index: number) => `
${index + 1}. ${finding.title || 'Finding'}
   Severity: ${finding.severity || 'Unknown'}
   Category: ${finding.category || 'General'}
   ${finding.affected_files ? `File: ${finding.affected_files[0]}` : ''}
   ${finding.line_numbers ? `Line: ${finding.line_numbers[0]}` : ''}
   
   Description: ${finding.description || 'No description available'}
   
   ${finding.recommendation ? `Recommendation: ${finding.recommendation}` : ''}
   
   ${finding.references?.length > 0 ? `References: ${finding.references.join(', ')}` : ''}
`).join('\n')}
` : ''}

${options.includeRecommendations && reportData.recommendations ? `
RECOMMENDATIONS
--------------
${Object.entries(reportData.recommendations).map(([category, recs]: [string, any]) => `
${category.toUpperCase().replace(/_/g, ' ')}:
${Array.isArray(recs) ? recs.map((rec: string, idx: number) => `  ${idx + 1}. ${rec}`).join('\n') : ''}
`).join('\n')}
` : ''}

---
Report generated by LokaAudit - Multi-Chain Security Analysis Platform
Generated at: ${new Date().toISOString()}
`;
    
    return Buffer.from(pdfContent, 'utf8');
  }
}

// Generate HTML report
function generateHTMLReport(reportData: any, options: any): string {
  const severityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#2563eb';
      default: return '#6b7280';
    }
  };

  const riskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LokaAudit Security Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; font-size: 1.1em; margin-top: 10px; }
        .metadata { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .metadata-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .metadata-label { font-weight: 600; color: #495057; }
        .metadata-value { color: #6c757d; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .summary-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .risk-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
        .section { background: white; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; border-radius: 8px 8px 0 0; }
        .section-header h2 { margin: 0; color: #495057; }
        .section-content { padding: 20px; }
        .finding { background: #f8f9fa; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
        .finding-header { padding: 15px 20px; background: white; border-bottom: 1px solid #e9ecef; }
        .finding-title { margin: 0; font-size: 1.1em; color: #495057; }
        .finding-meta { display: flex; gap: 15px; margin-top: 8px; font-size: 0.9em; }
        .finding-content { padding: 20px; }
        .finding-description { margin-bottom: 15px; color: #6c757d; }
        .finding-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px; }
        .detail-item { background: white; padding: 10px; border-radius: 5px; }
        .detail-label { font-size: 0.8em; color: #6c757d; text-transform: uppercase; }
        .detail-value { font-weight: 500; margin-top: 2px; }
        .recommendation { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin-top: 15px; border-radius: 0 5px 5px 0; }
        .recommendation-title { font-weight: bold; color: #0c5460; margin-bottom: 5px; }
        .tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .tag { background: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; }
        .recommendations-list { list-style: none; padding: 0; }
        .recommendations-list li { background: #f8f9fa; margin-bottom: 10px; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ LokaAudit Security Analysis Report</h1>
        <div class="subtitle">Comprehensive Multi-Chain Smart Contract Security Assessment</div>
    </div>

    <div class="metadata">
        <div class="metadata-grid">
            <div class="metadata-item">
                <span class="metadata-label">Report ID:</span>
                <span class="metadata-value">${reportData.report_metadata?.report_id || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Platform:</span>
                <span class="metadata-value">${reportData.report_metadata?.platform || 'Unknown'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Language:</span>
                <span class="metadata-value">${reportData.report_metadata?.language || 'Unknown'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Generated:</span>
                <span class="metadata-value">${new Date(reportData.report_metadata?.audit_date || Date.now()).toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Auditor:</span>
                <span class="metadata-value">${reportData.report_metadata?.auditor || 'LokaAudit v2.0'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Files Analyzed:</span>
                <span class="metadata-value">${reportData.report_metadata?.target_contract?.files?.length || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Security Score</h3>
            <div class="summary-value" style="color: ${reportData.summary?.security_score >= 80 ? '#16a34a' : reportData.summary?.security_score >= 60 ? '#d97706' : '#dc2626'}">${reportData.summary?.security_score || 0}/100</div>
        </div>
        <div class="summary-card">
            <h3>Total Issues</h3>
            <div class="summary-value" style="color: #2563eb">${reportData.summary?.total_issues || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Critical Issues</h3>
            <div class="summary-value" style="color: #dc2626">${reportData.summary?.critical || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Risk Level</h3>
            <div class="risk-badge" style="background-color: ${riskColor(reportData.summary?.overall_risk_level)}">${reportData.summary?.overall_risk_level || 'Low'}</div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>High Severity</h3>
            <div class="summary-value" style="color: #ea580c">${reportData.summary?.high || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Medium Severity</h3>
            <div class="summary-value" style="color: #d97706">${reportData.summary?.medium || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Low Severity</h3>
            <div class="summary-value" style="color: #2563eb">${reportData.summary?.low || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Informational</h3>
            <div class="summary-value" style="color: #6b7280">${reportData.summary?.informational || 0}</div>
        </div>
    </div>

    ${reportData.summary?.executive_summary ? `
    <div class="section">
        <div class="section-header">
            <h2>📋 Executive Summary</h2>
        </div>
        <div class="section-content">
            ${reportData.summary.executive_summary.risk_assessment ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>🎯 Risk Assessment</h3>
                <p><strong>Business Impact:</strong> ${reportData.summary.executive_summary.risk_assessment.business_impact || 'Not assessed'}</p>
                <p><strong>Deployment Readiness:</strong> ${reportData.summary.executive_summary.risk_assessment.deployment_readiness || 'Not assessed'}</p>
            </div>
            ` : ''}
            
            ${reportData.summary.executive_summary.immediate_actions?.length > 0 ? `
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #dc2626;">🚨 Immediate Actions Required</h3>
                <ul>
                    ${reportData.summary.executive_summary.immediate_actions.map((action: string) => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${options.includeFindings && reportData.findings?.length > 0 ? `
    <div class="section">
        <div class="section-header">
            <h2>🔍 Security Findings (${reportData.findings.length})</h2>
        </div>
        <div class="section-content">
            ${reportData.findings.map((finding: any, index: number) => `
            <div class="finding">
                <div class="finding-header">
                    <h3 class="finding-title">${finding.title || 'Security Finding'}</h3>
                    <div class="finding-meta">
                        <span class="risk-badge" style="background-color: ${severityColor(finding.severity)}">${(finding.severity || 'Unknown').toUpperCase()}</span>
                        ${finding.category ? `<span class="tag">${finding.category}</span>` : ''}
                        ${finding.confidence ? `<span class="tag">Confidence: ${Math.round(finding.confidence * 100)}%</span>` : ''}
                        ${finding.id ? `<span class="tag">ID: ${finding.id}</span>` : ''}
                    </div>
                </div>
                <div class="finding-content">
                    <div class="finding-description">
                        ${finding.description || 'No description available'}
                    </div>
                    
                    <div class="finding-details">
                        ${finding.affected_files ? `
                        <div class="detail-item">
                            <div class="detail-label">Affected File</div>
                            <div class="detail-value">📁 ${finding.affected_files[0]}</div>
                        </div>
                        ` : ''}
                        
                        ${finding.line_numbers ? `
                        <div class="detail-item">
                            <div class="detail-label">Line Number</div>
                            <div class="detail-value">${finding.line_numbers[0]}</div>
                        </div>
                        ` : ''}
                        
                        ${finding.impact ? `
                        <div class="detail-item">
                            <div class="detail-label">Impact</div>
                            <div class="detail-value">${finding.impact}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${finding.code_snippet ? `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; overflow-x: auto;">
                        <div class="detail-label">Code Snippet</div>
                        <pre style="margin: 5px 0 0 0; white-space: pre-wrap;"><code>${finding.code_snippet}</code></pre>
                    </div>
                    ` : ''}
                    
                    ${finding.recommendation ? `
                    <div class="recommendation">
                        <div class="recommendation-title">💡 Recommended Fix</div>
                        <div>${finding.recommendation}</div>
                    </div>
                    ` : ''}
                    
                    ${finding.references?.length > 0 || finding.cwe ? `
                    <div class="tags">
                        ${finding.cwe ? `<span class="tag">CWE-${finding.cwe}</span>` : ''}
                        ${finding.references?.length > 0 ? `<span class="tag">${finding.references.length} Reference${finding.references.length > 1 ? 's' : ''}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${options.includeRecommendations && reportData.recommendations ? `
    <div class="section">
        <div class="section-header">
            <h2>💡 Prioritized Recommendations</h2>
        </div>
        <div class="section-content">
            ${reportData.recommendations.immediate_actions?.length > 0 ? `
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <h3 style="color: #dc2626;">🚨 Immediate Actions</h3>
                <ul class="recommendations-list">
                    ${reportData.recommendations.immediate_actions.map((action: string) => `<li style="border-left-color: #dc2626;">${action}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${reportData.recommendations.high_priority_fixes?.length > 0 ? `
            <div style="background: #fef5e7; border-left: 4px solid #ea580c; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <h3 style="color: #ea580c;">⚡ High Priority Fixes</h3>
                <ul class="recommendations-list">
                    ${reportData.recommendations.high_priority_fixes.map((fix: string) => `<li style="border-left-color: #ea580c;">${fix}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${reportData.recommendations.security_best_practices?.length > 0 ? `
            <div style="background: #f0f9f0; border-left: 4px solid #16a34a; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #16a34a;">✅ Security Best Practices</h3>
                <ul class="recommendations-list">
                    ${reportData.recommendations.security_best_practices.slice(0, 10).map((practice: string) => `<li style="border-left-color: #16a34a;">${practice}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div>Report generated by <strong>LokaAudit v2.0</strong> - Multi-Chain Security Analysis Platform</div>
        <div>Generated on ${new Date().toLocaleString()}</div>
    </div>
</body>
</html>
  `.trim();
}

// Generate CSV report for findings
function generateCSVReport(reportData: any, options: any): string {
  const findings = reportData.findings || [];
  
  const headers = [
    'ID',
    'Title',
    'Severity',
    'Category',
    'Confidence',
    'File',
    'Line',
    'Description',
    'Impact',
    'Recommendation',
    'CWE',
    'References'
  ];
  
  const csvRows = [headers.join(',')];
  
  findings.forEach((finding: any) => {
    const row = [
      `"${finding.id || ''}"`,
      `"${(finding.title || '').replace(/"/g, '""')}"`,
      `"${finding.severity || ''}"`,
      `"${finding.category || ''}"`,
      `"${finding.confidence ? Math.round(finding.confidence * 100) + '%' : ''}"`,
      `"${finding.affected_files?.[0] || finding.file || ''}"`,
      `"${finding.line_numbers?.[0] || finding.line || ''}"`,
      `"${(finding.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(finding.impact || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(finding.recommendation || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${finding.cwe ? 'CWE-' + finding.cwe : ''}"`,
      `"${finding.references?.join('; ') || ''}"`
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

// Generate Markdown report
function generateMarkdownReport(reportData: any, options: any): string {
  let markdown = `# 🛡️ LokaAudit Security Analysis Report\n\n`;
  
  // Metadata
  markdown += `## 📊 Report Metadata\n\n`;
  markdown += `| Field | Value |\n`;
  markdown += `|-------|-------|\n`;
  markdown += `| Report ID | \`${reportData.report_metadata?.report_id || 'N/A'}\` |\n`;
  markdown += `| Platform | **${reportData.report_metadata?.platform || 'Unknown'}** |\n`;
  markdown += `| Language | **${reportData.report_metadata?.language || 'Unknown'}** |\n`;
  markdown += `| Generated | ${new Date(reportData.report_metadata?.audit_date || Date.now()).toLocaleString()} |\n`;
  markdown += `| Auditor | ${reportData.report_metadata?.auditor || 'LokaAudit v2.0'} |\n`;
  markdown += `| Files Analyzed | ${reportData.report_metadata?.target_contract?.files?.length || 'N/A'} |\n\n`;
  
  // Executive Summary
  markdown += `## 🎯 Executive Summary\n\n`;
  markdown += `### Security Overview\n\n`;
  markdown += `| Metric | Value | Status |\n`;
  markdown += `|--------|-------|--------|\n`;
  markdown += `| 🛡️ Security Score | **${reportData.summary?.security_score || 0}/100** | ${reportData.summary?.security_score >= 80 ? '🟢 Good' : reportData.summary?.security_score >= 60 ? '🟡 Fair' : '🔴 Poor'} |\n`;
  markdown += `| ⚠️ Total Issues | **${reportData.summary?.total_issues || 0}** | ${reportData.summary?.total_issues === 0 ? '🟢 Clean' : reportData.summary?.total_issues <= 5 ? '🟡 Moderate' : '🔴 High'} |\n`;
  markdown += `| 🚨 Critical Issues | **${reportData.summary?.critical || 0}** | ${reportData.summary?.critical === 0 ? '🟢 None' : '🔴 Action Required'} |\n`;
  markdown += `| 📈 Risk Level | **${reportData.summary?.overall_risk_level || 'Low'}** | ${reportData.summary?.overall_risk_level === 'Low' ? '🟢' : reportData.summary?.overall_risk_level === 'Medium' ? '🟡' : '🔴'} |\n\n`;
  
  // Severity Breakdown
  markdown += `### 📊 Issue Breakdown by Severity\n\n`;
  markdown += `| Severity | Count | Description |\n`;
  markdown += `|----------|-------|-------------|\n`;
  markdown += `| 🔴 Critical | **${reportData.summary?.critical || 0}** | Immediate action required - potential for severe impact |\n`;
  markdown += `| 🟠 High | **${reportData.summary?.high || 0}** | Should be fixed soon - significant security risk |\n`;
  markdown += `| 🟡 Medium | **${reportData.summary?.medium || 0}** | Should be addressed - moderate security concern |\n`;
  markdown += `| 🔵 Low | **${reportData.summary?.low || 0}** | Consider fixing - minor security issue |\n`;
  markdown += `| ℹ️ Informational | **${reportData.summary?.informational || 0}** | For awareness - code quality or best practice |\n\n`;
  
  // Risk Assessment
  if (reportData.summary?.executive_summary?.risk_assessment) {
    markdown += `### 🎯 Risk Assessment\n\n`;
    markdown += `**Business Impact:** ${reportData.summary.executive_summary.risk_assessment.business_impact || 'Not assessed'}\n\n`;
    markdown += `**Deployment Status:** ${reportData.summary.executive_summary.risk_assessment.deployment_readiness || 'Not assessed'}\n\n`;
  }
  
  // Immediate Actions
  if (reportData.summary?.executive_summary?.immediate_actions?.length > 0) {
    markdown += `### 🚨 Immediate Actions Required\n\n`;
    reportData.summary.executive_summary.immediate_actions.forEach((action: string, index: number) => {
      markdown += `${index + 1}. ${action}\n`;
    });
    markdown += `\n`;
  }
  
  // Detailed Findings
  if (options.includeFindings && reportData.findings?.length > 0) {
    markdown += `## 🔍 Detailed Security Findings\n\n`;
    markdown += `Found **${reportData.findings.length}** security issue${reportData.findings.length > 1 ? 's' : ''} during analysis:\n\n`;
    
    reportData.findings.forEach((finding: any, index: number) => {
      const severityIcons: { [key: string]: string } = {
        'critical': '🔴',
        'high': '🟠', 
        'medium': '🟡',
        'low': '🔵',
        'informational': 'ℹ️'
      };
      const severityIcon = severityIcons[finding.severity?.toLowerCase() || ''] || '⚪';
      
      markdown += `### ${index + 1}. ${severityIcon} ${finding.title || 'Security Finding'}\n\n`;
      markdown += `| Property | Value |\n`;
      markdown += `|----------|-------|\n`;
      markdown += `| **Severity** | \`${(finding.severity || 'Unknown').toUpperCase()}\` |\n`;
      markdown += `| **Category** | ${finding.category || 'General'} |\n`;
      markdown += `| **Confidence** | ${finding.confidence ? Math.round(finding.confidence * 100) + '%' : 'N/A'} |\n`;
      if (finding.affected_files?.[0] || finding.file) {
        markdown += `| **File** | \`${finding.affected_files?.[0] || finding.file}\` |\n`;
      }
      if (finding.line_numbers?.[0] || finding.line) {
        markdown += `| **Line** | \`${finding.line_numbers?.[0] || finding.line}\` |\n`;
      }
      if (finding.id) {
        markdown += `| **ID** | \`${finding.id}\` |\n`;
      }
      markdown += `\n`;
      
      markdown += `**Description:**\n${finding.description || 'No description available'}\n\n`;
      
      if (finding.impact) {
        markdown += `**Impact:**\n${finding.impact}\n\n`;
      }
      
      if (finding.code_snippet) {
        markdown += `**Code Snippet:**\n\`\`\`\n${finding.code_snippet}\n\`\`\`\n\n`;
      }
      
      if (finding.recommendation) {
        markdown += `**💡 Recommended Fix:**\n${finding.recommendation}\n\n`;
      }
      
      if (finding.references?.length > 0) {
        markdown += `**References:**\n`;
        finding.references.forEach((ref: string) => {
          markdown += `- ${ref}\n`;
        });
        markdown += `\n`;
      }
      
      if (finding.cwe) {
        markdown += `**CWE:** [CWE-${finding.cwe}](https://cwe.mitre.org/data/definitions/${finding.cwe}.html)\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  }
  
  // Recommendations
  if (options.includeRecommendations && reportData.recommendations) {
    markdown += `## 💡 Prioritized Recommendations\n\n`;
    
    if (reportData.recommendations.immediate_actions?.length > 0) {
      markdown += `### 🚨 Immediate Actions\n\n`;
      reportData.recommendations.immediate_actions.forEach((action: string, index: number) => {
        markdown += `${index + 1}. ${action}\n`;
      });
      markdown += `\n`;
    }
    
    if (reportData.recommendations.high_priority_fixes?.length > 0) {
      markdown += `### ⚡ High Priority Fixes\n\n`;
      reportData.recommendations.high_priority_fixes.forEach((fix: string, index: number) => {
        markdown += `${index + 1}. ${fix}\n`;
      });
      markdown += `\n`;
    }
    
    if (reportData.recommendations.security_best_practices?.length > 0) {
      markdown += `### ✅ Security Best Practices\n\n`;
      reportData.recommendations.security_best_practices.slice(0, 10).forEach((practice: string, index: number) => {
        markdown += `${index + 1}. ${practice}\n`;
      });
      markdown += `\n`;
    }
  }
  
  markdown += `---\n\n`;
  markdown += `**Report generated by LokaAudit v2.0** - Multi-Chain Security Analysis Platform\n\n`;
  markdown += `Generated on: ${new Date().toLocaleString()}\n`;
  
  return markdown;
}
