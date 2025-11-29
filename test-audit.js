const testAudit = async () => {
  try {
    console.log('Testing audit system...');
    
    const response = await fetch('http://localhost:3001/api/audit/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    console.log('Audit test result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Audit system is working!');
      console.log(`Security Score: ${result.securityScore}/100`);
      console.log(`Found ${result.findingsCount} issues:`);
      console.log(`- Critical: ${result.issues.critical}`);
      console.log(`- High: ${result.issues.high}`);
      console.log(`- Medium: ${result.issues.medium}`);
      console.log(`- Low: ${result.issues.low}`);
      
      console.log('\nSample findings:');
      result.sampleFindings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.title} (${finding.severity})`);
        console.log(`   ${finding.description}`);
        console.log(`   Location: ${finding.location.file}:${finding.location.line}`);
      });
    } else {
      console.log('❌ Audit test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAudit();
