// Quick test script to verify backend audit functionality
const testBackendAudit = async () => {
  try {
    console.log('🧪 Testing Backend Audit API...\n');
    
    // Sample Solana contract code for testing
    const sampleCode = `
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod simple_contract {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let account = &mut ctx.accounts.account;
        account.data = 0;
        Ok(())
    }
    
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let account = &mut ctx.accounts.account;
        account.data += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub account: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
}
    `;
    
    // Test data - matching backend expected format
    const testData = {
      projectName: 'Test Contract Analysis',
      network: 'solana', // Backend expects lowercase network names
      files: [{
        fileName: 'simple_contract.rs', // Backend expects 'fileName' not 'name'
        content: sampleCode,
        type: 'code'
      }]
    };
    
    console.log('📡 Sending request to http://localhost:4000/api/v1/audit/start');
    console.log('📦 Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:4000/api/v1/audit/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ SUCCESS! Backend audit started:');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      
      // Test job status if audit was started successfully
      if (result.jobId) {
        console.log(`\n� Testing job status for job ID: ${result.jobId}`);
        
        const statusResponse = await fetch(`http://localhost:4000/api/v1/audit/status/${result.jobId}`);
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log('✅ Status check successful!');
          console.log('📋 Status:', JSON.stringify(statusResult, null, 2));
        } else {
          console.log('⚠️  Status check failed:', statusResponse.status);
        }
      }
      
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.log('\n❌ FAILED! Backend audit failed:');
      console.log('🔴 Error:', errorData);
    }
    
  } catch (error) {
    console.error('\n💥 Test script error:', error.message);
    console.error('🔍 Make sure your backend is running on http://localhost:4000');
  }
};

// Run the test
testBackendAudit();
