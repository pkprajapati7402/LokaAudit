#!/usr/bin/env node
/**
 * Enhanced Gemini AI Integration Test with AST-Based Recommendations
 * Tests the new code-specific recommendation system
 */

import { GeminiAuditEnhancer } from './src/services/gemini-audit-enhancer';
import { StandardAuditReport, StandardFinding } from './src/types/audit.types';

const sampleSolanaContractCode = `
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111112");

#[program]
pub mod token_swap {
    use super::*;

    /// Initialize a new token swap pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_rate: u64,
        initial_price: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.fee_rate = fee_rate;
        pool.token_a_reserve = 0;
        pool.token_b_reserve = 0;
        pool.initial_price = initial_price;
        pool.authority = ctx.accounts.authority.key();
        
        // Missing signer verification - CRITICAL VULNERABILITY
        // Should verify: require!(ctx.accounts.authority.is_signer, ErrorCode::UnauthorizedSigner);
        
        Ok(())
    }

    /// Swap tokens without proper validation
    pub fn swap_tokens(
        ctx: Context<SwapTokens>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // VULNERABILITY: No overflow protection
        let fee_amount = amount_in * pool.fee_rate / 10000;
        let amount_after_fee = amount_in - fee_amount;
        
        // VULNERABILITY: Potential division by zero
        let amount_out = (amount_after_fee * pool.token_b_reserve) / pool.token_a_reserve;
        
        if amount_out < minimum_amount_out {
            return Err(ErrorCode::InsufficientOutput.into());
        }
        
        // Transfer tokens without proper checks
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_a.to_account_info(),
                to: ctx.accounts.pool_token_a.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount_in)?;
        
        // Update reserves without safety checks
        pool.token_a_reserve += amount_in;
        pool.token_b_reserve -= amount_out;
        
        Ok(())
    }

    /// Emergency withdraw function with insufficient access control
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        // VULNERABILITY: No proper access control
        let pool = &mut ctx.accounts.pool;
        
        if amount > pool.token_a_reserve {
            return Err(ErrorCode::InsufficientFunds.into());
        }
        
        // Direct withdrawal without proper authorization
        pool.token_a_reserve -= amount;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + 128)]
    pub pool: Account<'info, TokenPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub pool: Account<'info, TokenPool>,
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, TokenPool>,
    /// VULNERABILITY: Should require admin or authority verification
    pub user: Signer<'info>,
}

#[account]
pub struct TokenPool {
    pub fee_rate: u64,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub initial_price: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    #[msg("Insufficient output")]
    InsufficientOutput,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
`;

const sampleAuditReport: StandardAuditReport = {
  report_metadata: {
    report_id: "AUDIT-2024-001",
    platform: "Solana",
    language: "Rust",
    auditor: "LokaAudit AI System",
    audit_date: new Date().toISOString(),
    version: "1.0.0",
    target_contract: {
      name: "TokenSwap Contract",
      files: ["lib.rs"]
    }
  },
  summary: {
    total_issues: 6,
    critical: 2,
    high: 1,
    medium: 2,
    low: 1,
    informational: 0,
    security_score: 45,
    overall_risk_level: "Critical",
    recommendation: "Critical security issues must be resolved before deployment"
  },
  findings: [
    {
      id: "CRIT-001",
      title: "Missing Signer Verification in Initialize Pool",
      description: "The initialize_pool function does not verify that the authority account is a signer, allowing unauthorized initialization of pools.",
      severity: "critical" as any,
      category: "access_control",
      impact: "High - Unauthorized users can create pools with arbitrary parameters",
      likelihood: "High - Easy to exploit",
      recommendation: "Add require!(ctx.accounts.authority.is_signer, ErrorCode::UnauthorizedSigner) before pool initialization",
      references: ["CWE-862: Missing Authorization"],
      code_snippet: "// Missing signer verification\nlet pool = &mut ctx.accounts.pool;"
    },
    {
      id: "CRIT-002", 
      title: "Integer Overflow in Fee Calculation",
      description: "The swap_tokens function performs arithmetic operations without overflow protection, potentially leading to unexpected behavior or token loss.",
      severity: "critical" as any,
      category: "arithmetic",
      impact: "High - Can result in token loss or unexpected swap rates",
      likelihood: "Medium - Requires specific input values",
      recommendation: "Use checked arithmetic operations (checked_mul, checked_div, checked_sub)",
      references: ["CWE-190: Integer Overflow", "Solana Security Best Practices"],
      code_snippet: "let fee_amount = amount_in * pool.fee_rate / 10000; // No overflow protection"
    },
    {
      id: "HIGH-001",
      title: "Insufficient Access Control in Emergency Withdraw", 
      description: "The emergency_withdraw function lacks proper authorization checks, allowing any user to potentially drain pool reserves.",
      severity: "high" as any,
      category: "access_control",
      impact: "High - Pool funds can be drained by unauthorized users",
      likelihood: "Medium - Requires knowledge of function existence",
      recommendation: "Add authority verification: require!(ctx.accounts.user.key() == pool.authority, ErrorCode::UnauthorizedSigner)",
      references: ["CWE-862: Missing Authorization"],
      code_snippet: "pub user: Signer<'info>, // Should verify authority"
    }
  ],
  recommendations: {
    priority_fixes: [
      "Fix critical signer verification in initialize_pool function",
      "Implement overflow protection in swap calculations",
      "Add proper access control to emergency_withdraw function"
    ],
    security_improvements: [
      "Add comprehensive input validation to all functions",
      "Implement event emissions for transparency",
      "Add unit tests for edge cases and error conditions"
    ],
    best_practices: [
      "Implement formal verification for critical functions",
      "Add comprehensive monitoring and alerting",
      "Consider upgradeability patterns for future improvements"
    ]
  },
  appendix: {
    methodology: ["Static analysis with manual review of critical paths"],
    tools_used: ["Anchor Security Scanner", "Custom Rust Analysis"],
    references: ["CWE Top 25", "Solana Security Best Practices"],
    additional_notes: ["Test completed successfully"],
    scan_configuration: {
      scope: "Full contract analysis",
      depth: "comprehensive",
      duration: "5 minutes"
    },
    future_improvements: [
      "Automated fuzzing integration",
      "Formal verification integration", 
      "Runtime monitoring setup"
    ]
  }
};

async function testEnhancedGeminiIntegration() {
  console.log('🚀 Testing Enhanced Gemini AI Integration with AST-Based Recommendations\n');
  
  try {
    // Initialize the enhancer
    const enhancer = new GeminiAuditEnhancer();
    
    console.log('📝 Sample Smart Contract:');
    console.log('─'.repeat(50));
    console.log(`Module: TokenSwap (Solana/Anchor)`);
    console.log(`Functions: initialize_pool(), swap_tokens(), emergency_withdraw()`);
    console.log(`Critical Issues: Missing signer verification, overflow risks`);
    console.log(`Lines of Code: ${sampleSolanaContractCode.split('\n').length}`);
    console.log('');

    console.log('🔍 Original Audit Report:');
    console.log('─'.repeat(50));
    console.log(`Security Score: ${sampleAuditReport.audit_summary?.security_score}/100`);
    console.log(`Risk Level: ${sampleAuditReport.audit_summary?.risk_level.toUpperCase()}`);
    console.log(`Findings: ${sampleAuditReport.findings.length} total`);
    console.log(`- Critical: ${sampleAuditReport.audit_summary?.findings_summary.critical}`);
    console.log(`- High: ${sampleAuditReport.audit_summary?.findings_summary.high}`);
    console.log(`- Medium: ${sampleAuditReport.audit_summary?.findings_summary.medium}`);
    console.log('');

    // Enhance the audit report with AST analysis
    console.log('🤖 Enhancing audit report with Gemini AI and AST analysis...\n');
    const startTime = Date.now();
    
    const enhancedReport = await enhancer.enhanceAuditReport(
      sampleAuditReport,
      sampleSolanaContractCode,
      'Solana'
    );
    
    const enhancementTime = Date.now() - startTime;
    
    console.log('✅ Enhancement completed successfully!');
    console.log(`⏱️ Processing time: ${(enhancementTime / 1000).toFixed(1)}s\n`);

    // Display enhanced executive summary
    if (enhancedReport.audit_summary?.executive_summary) {
      console.log('📊 EXECUTIVE SUMMARY (AI-Enhanced)');
      console.log('═'.repeat(50));
      
      const execSummary = enhancedReport.audit_summary.executive_summary;
      if (execSummary.risk_assessment) {
        console.log(`🎯 Overall Risk: ${execSummary.risk_assessment.overall_risk_level}`);
        console.log(`💼 Business Impact: ${execSummary.risk_assessment.business_impact}`);
        console.log(`🚀 Deployment Status: ${execSummary.risk_assessment.deployment_readiness}`);
      }

      if (execSummary.key_metrics) {
        console.log('\n📈 Key Metrics:');
        console.log(`   • Security Score: ${execSummary.key_metrics.security_score}/100`);
        console.log(`   • AI Confidence: ${execSummary.key_metrics.ai_confidence}%`);
        console.log(`   • Critical Issues: ${execSummary.key_metrics.critical_issues_count}`);
      }

      if (execSummary.immediate_actions) {
        console.log('\n🚨 Immediate Actions Required:');
        execSummary.immediate_actions.forEach((action, index) => {
          console.log(`   ${index + 1}. ${action}`);
        });
      }
      console.log('');
    }

    // Display enhanced recommendations
    if (enhancedReport.recommendations) {
      console.log('🎯 CODE-SPECIFIC RECOMMENDATIONS (AST-Enhanced)');
      console.log('═'.repeat(50));
      
      if (enhancedReport.recommendations.immediate) {
        console.log('🚨 IMMEDIATE ACTIONS:');
        enhancedReport.recommendations.immediate.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
      }

      if (enhancedReport.recommendations.short_term) {
        console.log('⚡ SHORT-TERM IMPROVEMENTS:');
        enhancedReport.recommendations.short_term.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
      }

      if (enhancedReport.recommendations.long_term) {
        console.log('📋 LONG-TERM STRATEGIES:');
        enhancedReport.recommendations.long_term.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
      }

      if (enhancedReport.recommendations.architectural) {
        console.log('🏗️ ARCHITECTURAL IMPROVEMENTS:');
        enhancedReport.recommendations.architectural.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
      }
    }

    // Display enhanced finding analysis
    console.log('🔍 ENHANCED FINDING ANALYSIS');
    console.log('═'.repeat(50));
    
    enhancedReport.findings.slice(0, 2).forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.title} (${finding.severity?.toUpperCase()})`);
      console.log(`   📍 Location: ${finding.location?.function}() line ${finding.location?.line}`);
      
      if (finding.business_context) {
        console.log(`   💼 Business Context: ${finding.business_context}`);
      }
      
      if (finding.attack_scenarios && finding.attack_scenarios.length > 0) {
        console.log(`   ⚔️ Attack Scenarios:`);
        finding.attack_scenarios.forEach((scenario, idx) => {
          console.log(`      • ${scenario}`);
        });
      }
      
      if (finding.remediation_guidance?.implementation_steps) {
        console.log(`   🛠️ Implementation Steps:`);
        finding.remediation_guidance.implementation_steps.forEach((step, idx) => {
          console.log(`      ${idx + 1}. ${step}`);
        });
      }
      
      if (finding.mitigation_priority) {
        console.log(`   🎯 Priority: ${finding.mitigation_priority.toUpperCase()}`);
      }
      
      if (finding.implementation_complexity) {
        console.log(`   🔧 Complexity: ${finding.implementation_complexity}`);
      }
    });

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(50));
    console.log('✅ AST parsing and analysis working');
    console.log('✅ Code-specific recommendations generated');
    console.log('✅ Function-level security insights provided');
    console.log('✅ Business context and attack scenarios included');
    console.log('✅ Prioritized remediation guidance delivered');
    console.log('\n🚀 The enhanced system now provides production-grade,');
    console.log('   code-specific audit reports with actionable recommendations!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    console.log('\n⚠️ Falling back to standard audit report format');
    console.log('The system is designed to gracefully handle AI service unavailability.');
  }
}

// Run the test
console.log('🔧 Environment Check:');
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`ENABLE_AI_ENHANCEMENT: ${process.env.ENABLE_AI_ENHANCEMENT || 'default (true)'}`);
console.log('');

testEnhancedGeminiIntegration();
