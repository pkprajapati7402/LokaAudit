/**
 * Gemini AI Integration Test Script
 * 
 * This script demonstrates the enhanced audit report generation with Gemini AI.
 * Run this script to test the integration before using it in production.
 */

import dotenv from 'dotenv';
import { GeminiAuditEnhancer } from './src/services/gemini-audit-enhancer';
import { StandardAuditReport, Finding } from './src/types/audit.types';

// Load environment variables
dotenv.config();

// Sample audit report for testing
const sampleAuditReport: StandardAuditReport = {
  report_metadata: {
    report_id: 'TEST-2024-001',
    platform: 'Solana',
    language: 'Rust',
    auditor: 'LokaAudit Test Engine',
    audit_date: new Date().toISOString(),
    version: '1.0.0',
    target_contract: {
      name: 'Sample Token Contract',
      files: ['token.rs', 'lib.rs']
    }
  },
  summary: {
    total_issues: 3,
    critical: 1,
    high: 1,
    medium: 1,
    low: 0,
    informational: 0,
    security_score: 60,
    overall_risk_level: 'High',
    recommendation: 'Address critical and high severity issues before deployment'
  },
  findings: [
    {
      id: 'TST-001',
      title: 'Missing Signer Verification',
      severity: 'Critical',
      description: 'Function lacks proper signer verification for privileged operations.',
      impact: 'Unauthorized users could execute privileged operations',
      affected_files: ['token.rs'],
      line_numbers: [45],
      recommendation: 'Add require!(ctx.accounts.authority.is_signer, ErrorCode::UnauthorizedSigner);',
      references: ['https://docs.solana.com/developing/programming-model/transactions#signatures'],
      status: 'Unresolved',
      confidence: 0.95,
      cwe: 'CWE-862',
      exploitability: 0.8,
      category: 'access_control',
      code_snippet: 'pub fn transfer_tokens(ctx: Context<Transfer>) -> Result<()> {'
    },
    {
      id: 'TST-002',
      title: 'Integer Overflow Risk',
      severity: 'High',
      description: 'Arithmetic operations performed without overflow protection.',
      impact: 'Could lead to unexpected behavior and financial losses',
      affected_files: ['token.rs'],
      line_numbers: [78],
      recommendation: 'Use checked arithmetic: amount.checked_add(fee)?',
      references: ['https://doc.rust-lang.org/std/primitive.u64.html#method.checked_add'],
      status: 'Unresolved',
      confidence: 0.85,
      cwe: 'CWE-190',
      exploitability: 0.6,
      category: 'arithmetic_safety'
    },
    {
      id: 'TST-003',
      title: 'Insufficient Input Validation',
      severity: 'Medium',
      description: 'User input not properly validated before processing.',
      impact: 'May lead to unexpected program behavior',
      affected_files: ['token.rs'],
      line_numbers: [112],
      recommendation: 'Add input validation checks for all user-provided parameters',
      references: ['https://docs.solana.com/developing/programming-model/accounts'],
      status: 'Unresolved',
      confidence: 0.75,
      exploitability: 0.4,
      category: 'input_validation'
    }
  ],
  recommendations: {
    immediate_actions: ['Fix critical signer verification issue'],
    security_best_practices: ['Implement comprehensive access controls', 'Use safe arithmetic operations'],
    future_improvements: ['Regular security audits', 'Automated testing']
  },
  appendix: {
    tools_used: ['Rust Analyzer', 'Custom Security Scanner'],
    glossary: {
      'Signer': 'An account that has provided a cryptographic signature',
      'PDA': 'Program Derived Address'
    }
  }
};

const sampleSourceCode = `
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[program]
pub mod token_program {
    use super::*;
    
    pub fn transfer_tokens(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        // SECURITY ISSUE: Missing signer verification
        // Should have: require!(ctx.accounts.authority.is_signer, ErrorCode::UnauthorizedSigner);
        
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        
        // SECURITY ISSUE: Integer overflow risk
        let fee = amount * 100; // Should use checked_mul
        let total = amount + fee; // Should use checked_add
        
        token::transfer(transfer_ctx, total)?;
        Ok(())
    }
    
    pub fn initialize_account(ctx: Context<Initialize>, data: String) -> Result<()> {
        // SECURITY ISSUE: No input validation
        // Should validate data length, format, etc.
        ctx.accounts.account.data = data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32)]
    pub account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserAccount {
    pub data: String,
}
`;

async function testGeminiIntegration() {
  console.log('🚀 Starting Gemini AI Integration Test');
  console.log('=====================================');

  // Check if Gemini API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable not set');
    console.error('   Please add your Gemini API key to the .env file');
    console.error('   Get your API key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }

  try {
    // Initialize the Gemini enhancer
    console.log('🤖 Initializing Gemini AI Enhancer...');
    const enhancer = new GeminiAuditEnhancer();
    
    console.log('📊 Original Report Summary:');
    console.log(`   - Total Issues: ${sampleAuditReport.summary.total_issues}`);
    console.log(`   - Critical: ${sampleAuditReport.summary.critical}`);
    console.log(`   - High: ${sampleAuditReport.summary.high}`);
    console.log(`   - Security Score: ${sampleAuditReport.summary.security_score}/100`);
    console.log(`   - Risk Level: ${sampleAuditReport.summary.overall_risk_level}`);
    console.log('');

    // Enhance the audit report
    console.log('✨ Enhancing audit report with Gemini AI...');
    console.log('   This may take 30-60 seconds depending on API response times...');
    
    const startTime = Date.now();
    const enhancedReport = await enhancer.enhanceAuditReport(
      sampleAuditReport,
      sampleSourceCode,
      'Solana'
    );
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Enhancement completed in ${processingTime.toFixed(2)} seconds`);
    console.log('');

    // Display enhanced results
    console.log('🎯 Enhanced Report Highlights:');
    console.log('===============================');
    
    if (enhancedReport.summary.executive_summary) {
      console.log('📋 Executive Summary:');
      console.log(`   Risk Level: ${enhancedReport.summary.executive_summary.risk_assessment.overall_risk_level}`);
      console.log(`   Deployment Status: ${enhancedReport.summary.executive_summary.risk_assessment.deployment_readiness}`);
      console.log(`   Security Score: ${enhancedReport.summary.executive_summary.key_findings.security_score}/100`);
      if (enhancedReport.summary.executive_summary.key_findings.confidence_level) {
        console.log(`   AI Confidence: ${(enhancedReport.summary.executive_summary.key_findings.confidence_level * 100).toFixed(0)}%`);
      }
      console.log('');
    }

    console.log('🔍 Enhanced Findings Analysis:');
    enhancedReport.findings.forEach((finding: any, index: number) => {
      console.log(`   ${index + 1}. ${finding.title} (${finding.severity})`);
      if (finding.business_context) {
        console.log(`      Business Context: ${finding.business_context.substring(0, 100)}...`);
      }
      if (finding.mitigation_priority) {
        console.log(`      Priority: ${finding.mitigation_priority}`);
      }
      if (finding.estimated_effort) {
        console.log(`      Estimated Effort: ${finding.estimated_effort}`);
      }
      if (finding.attack_scenarios && finding.attack_scenarios.length > 0) {
        console.log(`      Attack Scenarios: ${finding.attack_scenarios.length} identified`);
      }
      console.log('');
    });

    if (enhancedReport.recommendations.immediate_actions && enhancedReport.recommendations.immediate_actions.length > 0) {
      console.log('⚡ Immediate Actions Required:');
      enhancedReport.recommendations.immediate_actions.forEach((action: string, index: number) => {
        console.log(`   ${index + 1}. ${action}`);
      });
      console.log('');
    }

    if (enhancedReport.appendix?.ai_enhancement_details) {
      console.log('🤖 AI Enhancement Details:');
      console.log(`   Model: ${enhancedReport.appendix.ai_enhancement_details.gemini_model_used}`);
      console.log(`   Findings Enhanced: ${enhancedReport.appendix.ai_enhancement_details.findings_enhanced}`);
      console.log(`   Confidence Score: ${(enhancedReport.appendix.ai_enhancement_details.confidence_score * 100).toFixed(0)}%`);
      console.log(`   Analysis Capabilities: ${enhancedReport.appendix.ai_enhancement_details.analysis_capabilities.length}`);
    }

    console.log('');
    console.log('✅ Gemini AI Integration Test Completed Successfully!');
    console.log('');
    console.log('🎉 Your audit reports will now include:');
    console.log('   ✅ Business context for each vulnerability');
    console.log('   ✅ Detailed attack scenario analysis');
    console.log('   ✅ Implementation complexity assessment');
    console.log('   ✅ Prioritized remediation guidance');
    console.log('   ✅ Executive-level risk summaries');
    console.log('   ✅ Advanced security scoring');
    console.log('');
    console.log('🚀 Ready for production-grade audit reporting!');

  } catch (error) {
    console.error('❌ Gemini AI Enhancement Test Failed:');
    console.error(`   Error: ${(error as Error).message}`);
    
    if ((error as Error).message.includes('API key')) {
      console.error('');
      console.error('🔑 API Key Issues:');
      console.error('   1. Verify your GEMINI_API_KEY in .env file');
      console.error('   2. Check that the API key is valid and has proper permissions');
      console.error('   3. Ensure you have sufficient API quota');
    } else if ((error as Error).message.includes('rate limit')) {
      console.error('');
      console.error('⏰ Rate Limit Issues:');
      console.error('   1. Wait a few minutes before retrying');
      console.error('   2. Consider upgrading your Gemini API plan');
      console.error('   3. The system will use standard reports when rate limited');
    } else {
      console.error('');
      console.error('🔧 General Troubleshooting:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify Gemini API service status');
      console.error('   3. Review the error details above');
    }
    
    console.error('');
    console.error('📝 Note: Even if AI enhancement fails, LokaAudit will still generate');
    console.error('   standard audit reports with comprehensive vulnerability detection.');
  }
}

// Run the test
testGeminiIntegration().catch(console.error);
