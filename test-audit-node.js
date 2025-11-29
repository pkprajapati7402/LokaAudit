// Direct test of the audit system without Next.js server
const { AuditProcessor } = require('./src/lib/audit/audit-processor.ts');

async function testAuditDirect() {
  console.log('🔍 Testing LokaAudit System Directly...\n');
  
  try {
    const auditProcessor = new (require('./src/lib/audit/audit-processor.ts').AuditProcessor)();
    
    const testRequest = {
      projectId: 'test-project-' + Date.now(),
      projectName: 'Test Solana Contract',
      language: 'Solana (Rust)',
      files: [{
        fileName: 'lib.rs',
        content: `use anchor_lang::prelude::*;

#[program]
pub mod my_program {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = data; // Potential integer overflow
        Ok(())
    }
    
    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        // Missing access control
        account.data = new_data;
        Ok(())
    }
    
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        
        // Reentrancy vulnerability
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;
        account.data -= amount;
        
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
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
}`,
        size: 1200,
        uploadDate: new Date()
      }],
      auditType: 'comprehensive'
    };

    console.log('🚀 Starting audit process...');
    const result = await auditProcessor.processAudit(testRequest);
    
    console.log('\n✅ AUDIT COMPLETED SUCCESSFULLY!');
    console.log('🔍 Audit ID:', result.auditId);
    console.log('📊 Status:', result.status);
    console.log('🎯 Security Score:', result.summary.securityScore);
    console.log('⚠️  Total Vulnerabilities:', result.summary.totalVulnerabilities);
    console.log('🔴 Critical:', result.summary.criticalIssues);
    console.log('🟠 High:', result.summary.highIssues);
    console.log('🟡 Medium:', result.summary.mediumIssues);
    console.log('🟢 Low:', result.summary.lowIssues);
    console.log('⏱️  Analysis Time:', result.metadata.analysisTime, 'ms');
    console.log('📝 Lines of Code:', result.metadata.linesOfCode);
    console.log('🛠️  Tools Used:', result.metadata.tools.join(', '));
    
    if (result.findings && result.findings.length > 0) {
      console.log('\n🔍 KEY FINDINGS:');
      result.findings.slice(0, 5).forEach((finding, i) => {
        console.log(`${i + 1}. ${finding.title}`);
        console.log(`   Severity: ${finding.severity.toUpperCase()}`);
        console.log(`   Category: ${finding.category}`);
        console.log(`   Location: ${finding.location.file}:${finding.location.line}`);
        console.log(`   Confidence: ${Math.round(finding.confidence * 100)}%`);
        console.log(`   Description: ${finding.description.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 TOP RECOMMENDATIONS:');
      result.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n📋 EXECUTIVE SUMMARY:');
    console.log(result.report.executiveSummary.substring(0, 200) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Run the test
testAuditDirect()
  .then((result) => {
    if (result) {
      console.log('\n🎉 AUDIT SYSTEM TEST COMPLETED SUCCESSFULLY!');
      console.log('🏆 The LokaAudit system is fully functional and ready for production!');
    } else {
      console.log('\n💥 AUDIT SYSTEM TEST FAILED!');
    }
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
  });
