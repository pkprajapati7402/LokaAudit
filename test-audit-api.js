const fs = require('fs');
const path = require('path');

// Test the audit API with real code
async function testAuditAPI() {
    console.log('Testing Audit API with real analysis...');
    
    // Read the test contract
    const contractPath = path.join(__dirname, 'test-contract.rs');
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    
    const testData = {
        projectName: "Test Vulnerable Contract",
        language: "Solana (Rust)",
        code: contractCode,
        auditType: "comprehensive"
    };
    
    try {
        console.log('Sending audit request...');
        const response = await fetch('http://localhost:3001/api/audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('\n=== AUDIT RESULTS ===');
        console.log('Success:', result.success);
        console.log('Project:', result.projectName);
        console.log('Language:', result.language);
        console.log('Status:', result.status);
        console.log('\n=== SECURITY SUMMARY ===');
        console.log('Security Score:', result.securityScore);
        console.log('Total Issues:', result.findingsCount);
        console.log('Critical Issues:', result.issues?.critical || 0);
        console.log('High Issues:', result.issues?.high || 0);
        console.log('Medium Issues:', result.issues?.medium || 0);
        console.log('Low Issues:', result.issues?.low || 0);
        
        console.log('\n=== SAMPLE FINDINGS ===');
        if (result.sampleFindings && result.sampleFindings.length > 0) {
            result.sampleFindings.forEach((finding, index) => {
                console.log(`${index + 1}. ${finding.title} [${finding.severity.toUpperCase()}]`);
                console.log(`   Location: ${finding.location.file}:${finding.location.line}`);
                console.log(`   Category: ${finding.category}`);
                console.log(`   Description: ${finding.description}`);
                console.log(`   Recommendation: ${finding.recommendation}`);
                console.log('');
            });
        } else {
            console.log('No findings returned in sample');
        }
        
        console.log('\n=== RECOMMENDATIONS ===');
        if (result.recommendations && result.recommendations.length > 0) {
            result.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        } else {
            console.log('No recommendations provided');
        }
        
        // Test export functionality
        if (result.success && result.result?.auditId) {
            console.log('\n=== TESTING EXPORT ===');
            console.log('Testing JSON export...');
            
            const exportResponse = await fetch(`http://localhost:3001/api/audit/report?auditId=${result.result.auditId}&format=json`);
            if (exportResponse.ok) {
                const exportResult = await exportResponse.json();
                console.log('Export Success:', exportResult.success);
                if (exportResult.report) {
                    console.log('Report ID:', exportResult.report.reportId);
                    console.log('Findings Count:', exportResult.report.findings?.length || 0);
                }
            } else {
                console.log('Export failed:', exportResponse.status);
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

// Wait for server to be ready, then run test
setTimeout(testAuditAPI, 5000);
