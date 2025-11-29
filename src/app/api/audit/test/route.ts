import { NextRequest, NextResponse } from 'next/server';
import { AuditProcessor, AuditRequest } from '@/lib/audit/audit-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test audit request with sample smart contract code
    const testAuditRequest: AuditRequest = {
      projectId: 'test-project-' + Date.now(),
      projectName: 'Test Smart Contract',
      language: 'rust',
      files: [
        {
          fileName: 'lib.rs',
          content: `
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod test_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let account = &mut ctx.accounts.data_account;
        account.data = data; // Potential overflow issue
        Ok(())
    }

    pub fn update(ctx: Context<Update>, new_data: u64) -> Result<()> {
        let account = &mut ctx.accounts.data_account;
        // Missing access control check
        account.data = new_data;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let account = &mut ctx.accounts.data_account;
        
        // Potential reentrancy vulnerability
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;
        account.data -= amount; // State change after external call
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub data_account: Account<'info, DataAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub data_account: Account<'info, DataAccount>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub data_account: Account<'info, DataAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct DataAccount {
    pub data: u64,
}
          `,
          size: 1500,
          uploadDate: new Date()
        }
      ],
      auditType: 'comprehensive'
    };

    console.log('Starting test audit...');
    
    // Initialize audit processor
    const auditProcessor = new AuditProcessor();
    
    // Process the audit
    const auditResult = await auditProcessor.processAudit(testAuditRequest);
    
    console.log('Test audit completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Test audit completed successfully',
      auditId: auditResult.auditId,
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
        title: finding.title,
        severity: finding.severity,
        category: finding.category,
        description: finding.description.substring(0, 200) + '...',
        location: finding.location
      }))
    });

  } catch (error) {
    console.error('Test audit failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Test audit failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Smart Contract Audit Test Endpoint',
    usage: 'Send POST request to run a test audit with sample Rust/Solana smart contract',
    features: [
      'Static Analysis - Pattern matching for vulnerabilities',
      'Semantic Analysis - Business logic validation', 
      'AI Analysis - Advanced vulnerability detection',
      'External Tools - Clippy, Cargo audit integration',
      'Result Aggregation - Comprehensive reporting'
    ],
    testContract: 'Sample Solana/Anchor smart contract with intentional vulnerabilities'
  });
}
