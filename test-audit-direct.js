const http = require('http');

// Test the audit system directly
const testAudit = async () => {
  console.log('🔍 Testing LokaAudit System...\n');
  
  const testData = JSON.stringify({
    projectId: 'test-project-' + Date.now(),
    projectName: 'Test Solana Contract',
    language: 'rust',
    files: [{
      fileName: 'lib.rs',
      content: `use anchor_lang::prelude::*;

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = data;
        Ok(())
    }
    
    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = new_data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
}`,
      size: 1024,
      uploadDate: new Date()
    }],
    auditType: 'comprehensive'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/audit/test',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n✅ Audit Result:');
          console.log('🔍 Audit ID:', result.auditId);
          console.log('📈 Security Score:', result.summary?.securityScore || 'N/A');
          console.log('🚨 Total Vulnerabilities:', result.summary?.totalVulnerabilities || 0);
          console.log('⚠️  Critical Issues:', result.summary?.criticalIssues || 0);
          console.log('🔴 High Issues:', result.summary?.highIssues || 0);
          console.log('🟡 Medium Issues:', result.summary?.mediumIssues || 0);
          console.log('🟢 Low Issues:', result.summary?.lowIssues || 0);
          console.log('⏱️  Analysis Time:', result.metadata?.analysisTime || 'N/A', 'ms');
          console.log('📝 Lines of Code:', result.metadata?.linesOfCode || 'N/A');
          
          if (result.findings && result.findings.length > 0) {
            console.log('\n🔍 Key Findings:');
            result.findings.slice(0, 3).forEach((finding, i) => {
              console.log(`${i + 1}. ${finding.title} (${finding.severity})`);
              console.log(`   📍 ${finding.location?.file}:${finding.location?.line}`);
            });
          }
          
          if (result.recommendations && result.recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            result.recommendations.slice(0, 2).forEach((rec, i) => {
              console.log(`${i + 1}. ${rec}`);
            });
          }
          
          resolve(result);
        } catch (e) {
          console.log('\n📄 Raw Response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request Error:', e.message);
      reject(e);
    });

    req.write(testData);
    req.end();
  });
};

// Run the test
testAudit()
  .then(() => {
    console.log('\n🎉 Audit test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Audit test failed:', error.message);
    process.exit(1);
  });
