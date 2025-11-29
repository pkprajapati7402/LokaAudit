import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get('auditId');
  const format = searchParams.get('format') || 'json';

  if (!auditId) {
    return NextResponse.json(
      { success: false, error: 'auditId is required' },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const auditResult = await db.collection('audit_results').findOne({ auditId });
    
    if (!auditResult) {
      return NextResponse.json(
        { success: false, error: 'Audit result not found' },
        { status: 404 }
      );
    }

    // Get the detailed report
    const detailedReport = auditResult.result?.detailedReport;
    
    if (!detailedReport) {
      return NextResponse.json(
        { success: false, error: 'Detailed report not available' },
        { status: 404 }
      );
    }

    switch (format.toLowerCase()) {
      case 'json':
        return NextResponse.json({
          success: true,
          report: detailedReport
        });

      case 'pdf':
        return generatePDFReport(detailedReport, auditId);

      case 'html':
        return generateHTMLReport(detailedReport, auditId);

      case 'markdown':
      case 'md':
        return generateMarkdownReport(detailedReport, auditId);

      case 'csv':
        return generateCSVReport(detailedReport, auditId);

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported format. Use: json, pdf, html, markdown, csv' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Generate PDF report
function generatePDFReport(report: any, auditId: string): NextResponse {
  // For now, return a placeholder - would integrate with a PDF library like puppeteer
  const pdfContent = generateReportContent(report, 'pdf');
  
  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="audit-report-${auditId}.pdf"`,
    },
  });
}

// Generate HTML report
function generateHTMLReport(report: any, auditId: string): NextResponse {
  const htmlContent = generateHTMLContent(report);
  
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="audit-report-${auditId}.html"`,
    },
  });
}

// Generate Markdown report
function generateMarkdownReport(report: any, auditId: string): NextResponse {
  const markdownContent = generateMarkdownContent(report);
  
  return new NextResponse(markdownContent, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="audit-report-${auditId}.md"`,
    },
  });
}

// Generate CSV report
function generateCSVReport(report: any, auditId: string): NextResponse {
  const csvContent = generateCSVContent(report);
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-findings-${auditId}.csv"`,
    },
  });
}

// Helper functions for different formats
function generateReportContent(report: any, format: string): string {
  // Placeholder for PDF generation - would use a library like puppeteer
  return `PDF report generation not implemented yet. Use HTML format instead.`;
}

function generateHTMLContent(report: any): string {
  const findings = report.findings || [];
  const summary = report.executiveSummary || {};
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Contract Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin: 30px 0; }
        .finding { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #ccc; }
        .critical { border-left-color: #dc3545; }
        .high { border-left-color: #fd7e14; }
        .medium { border-left-color: #ffc107; }
        .low { border-left-color: #28a745; }
        .severity { font-weight: bold; text-transform: uppercase; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Smart Contract Security Audit Report</h1>
        <p><strong>Report ID:</strong> ${report.reportId}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
        <p><strong>Project:</strong> ${report.projectInfo?.projectName}</p>
        <p><strong>Blockchain:</strong> ${report.projectInfo?.blockchain}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p><strong>Security Score:</strong> ${summary.securityScore}/100</p>
        <p><strong>Overall Risk:</strong> ${summary.riskLevel?.toUpperCase()}</p>
        <p><strong>Deployment Recommendation:</strong> ${summary.deploymentRecommendation?.replace('-', ' ').toUpperCase()}</p>
        <p>${summary.overview}</p>
    </div>

    <div class="section">
        <h2>Findings Summary</h2>
        <table>
            <tr>
                <th>Severity</th>
                <th>Count</th>
                <th>Status</th>
            </tr>
            ${summary.keyFindings?.map((kf: any) => `
                <tr>
                    <td class="severity ${kf.severity}">${kf.severity}</td>
                    <td>${kf.count}</td>
                    <td>Open</td>
                </tr>
            `).join('') || ''}
        </table>
    </div>

    <div class="section">
        <h2>Detailed Findings</h2>
        ${findings.map((finding: any, index: number) => `
            <div class="finding ${finding.severity}">
                <h3>${index + 1}. ${finding.title}</h3>
                <p><strong>Severity:</strong> <span class="severity ${finding.severity}">${finding.severity}</span></p>
                <p><strong>Category:</strong> ${finding.category}</p>
                <p><strong>Location:</strong> ${finding.location?.file}:${finding.location?.startLine}</p>
                <p><strong>Description:</strong> ${finding.description}</p>
                <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
                <p><strong>Confidence:</strong> ${Math.round(finding.confidence * 100)}%</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ol>
            ${report.recommendations?.map((rec: any) => `
                <li>
                    <strong>[${rec.priority?.toUpperCase()}] ${rec.title}</strong><br>
                    ${rec.description}<br>
                    <em>Implementation:</em> ${rec.implementation}<br>
                    <em>Effort:</em> ${rec.effort} | <em>Timeline:</em> ${rec.timeline}
                </li>
            `).join('') || ''}
        </ol>
    </div>

    ${report.gasOptimization ? `
    <div class="section">
        <h2>Gas Optimization</h2>
        <p><strong>Optimization Score:</strong> ${report.gasOptimization.summary?.optimizationScore}/100</p>
        <p><strong>Total Savings Potential:</strong> ${report.gasOptimization.summary?.totalSavingsPotential} gas units</p>
        
        <h3>Optimization Opportunities</h3>
        ${report.gasOptimization.opportunities?.map((opp: any, index: number) => `
            <div class="finding">
                <h4>${index + 1}. ${opp.title}</h4>
                <p><strong>Location:</strong> ${opp.location?.file}:${opp.location?.startLine}</p>
                <p><strong>Current Cost:</strong> ${opp.currentCost} gas</p>
                <p><strong>Optimized Cost:</strong> ${opp.optimizedCost} gas</p>
                <p><strong>Savings:</strong> ${opp.savings} gas (${Math.round((opp.savings / opp.currentCost) * 100)}%)</p>
                <p><strong>Implementation:</strong> ${opp.implementation}</p>
            </div>
        `).join('') || ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>Disclaimer</h2>
        <p style="font-size: 0.9em; color: #666;">
            ${report.disclaimer}
        </p>
    </div>
</body>
</html>
  `.trim();
}

function generateMarkdownContent(report: any): string {
  const findings = report.findings || [];
  const summary = report.executiveSummary || {};
  
  return `
# Smart Contract Security Audit Report

**Report ID:** ${report.reportId}  
**Generated:** ${new Date(report.generatedAt).toLocaleDateString()}  
**Project:** ${report.projectInfo?.projectName}  
**Blockchain:** ${report.projectInfo?.blockchain}  
**Language:** ${report.projectInfo?.language}

## Executive Summary

- **Security Score:** ${summary.securityScore}/100
- **Overall Risk:** ${summary.riskLevel?.toUpperCase()}
- **Deployment Recommendation:** ${summary.deploymentRecommendation?.replace('-', ' ').toUpperCase()}

${summary.overview}

## Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
${summary.keyFindings?.map((kf: any) => `| ${kf.severity} | ${kf.count} | Open |`).join('\n') || ''}

## Detailed Findings

${findings.map((finding: any, index: number) => `
### ${index + 1}. ${finding.title}

- **Severity:** ${finding.severity.toUpperCase()}
- **Category:** ${finding.category}
- **Location:** ${finding.location?.file}:${finding.location?.startLine}
- **Confidence:** ${Math.round(finding.confidence * 100)}%

**Description:** ${finding.description}

**Recommendation:** ${finding.recommendation}

${finding.references?.length > 0 ? `**References:**\n${finding.references.map((ref: any) => `- [${ref.title}](${ref.url})`).join('\n')}` : ''}

---
`).join('')}

## Recommendations

${report.recommendations?.map((rec: any, index: number) => `
${index + 1}. **[${rec.priority?.toUpperCase()}] ${rec.title}**
   - ${rec.description}
   - **Implementation:** ${rec.implementation}
   - **Effort:** ${rec.effort} | **Timeline:** ${rec.timeline}
`).join('') || ''}

${report.gasOptimization ? `
## Gas Optimization

- **Optimization Score:** ${report.gasOptimization.summary?.optimizationScore}/100
- **Total Savings Potential:** ${report.gasOptimization.summary?.totalSavingsPotential} gas units

### Optimization Opportunities

${report.gasOptimization.opportunities?.map((opp: any, index: number) => `
#### ${index + 1}. ${opp.title}

- **Location:** ${opp.location?.file}:${opp.location?.startLine}
- **Current Cost:** ${opp.currentCost} gas
- **Optimized Cost:** ${opp.optimizedCost} gas  
- **Savings:** ${opp.savings} gas (${Math.round((opp.savings / opp.currentCost) * 100)}%)
- **Implementation:** ${opp.implementation}
`).join('') || ''}
` : ''}

## Disclaimer

${report.disclaimer}

---
*Generated by LokaAudit AI Security Engine*
  `.trim();
}

function generateCSVContent(report: any): string {
  const findings = report.findings || [];
  
  const headers = [
    'Finding ID',
    'Title', 
    'Severity',
    'Category',
    'File',
    'Line',
    'Description',
    'Recommendation',
    'Confidence',
    'CWE ID'
  ];

  const rows = findings.map((finding: any) => [
    finding.id || '',
    `"${finding.title || ''}"`,
    finding.severity || '',
    finding.category || '',
    finding.location?.file || '',
    finding.location?.startLine || '',
    `"${finding.description?.replace(/"/g, '""') || ''}"`,
    `"${finding.recommendation?.replace(/"/g, '""') || ''}"`,
    Math.round((finding.confidence || 0) * 100) + '%',
    finding.cweId || ''
  ]);

  return [
    headers.join(','),
    ...rows.map((row: any[]) => row.join(','))
  ].join('\n');
}
