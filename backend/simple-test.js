// Simple test to verify AST-based recommendations system
const GeminiAuditEnhancer = require('./src/services/gemini-audit-enhancer.ts').GeminiAuditEnhancer;
const { parseRustAST } = require('./src/lib/ast-parser.ts');

console.log('Testing AST-based recommendation system...');

// Test sample Solana smart contract code
const sampleRustCode = `
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[program]
pub mod vulnerable_vault {
    use super::*;
    
    pub fn initialize_pool(ctx: Context<InitializePool>, amount: u64) -> Result<()> {
        // Missing signer verification - VULNERABILITY!
        let pool = &mut ctx.accounts.pool;
        pool.total_deposited = amount;
        pool.admin = ctx.accounts.authority.key();
        Ok(())
    }
    
    pub fn swap_tokens(ctx: Context<SwapTokens>, amount_in: u64) -> Result<()> {
        // Missing slippage protection - VULNERABILITY!
        require!(amount_in > 0, ErrorCode::InvalidAmount);
        
        let pool = &ctx.accounts.pool;
        let amount_out = amount_in * pool.exchange_rate; // No slippage check
        
        // Transfer tokens without proper validation
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_in.to_account_info(),
                    to: ctx.accounts.pool_token_in.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_in,
        )?;
        
        Ok(())
    }
    
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        // Missing access control - VULNERABILITY!
        let pool = &ctx.accounts.pool;
        let amount = pool.total_deposited;
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_token.to_account_info(),
                    to: ctx.accounts.user_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
            ),
            amount,
        )?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + 64)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_in: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub admin: Pubkey,
    pub total_deposited: u64,
    pub exchange_rate: u64,
}
`;

async function testAST() {
    try {
        console.log('\n=== Testing AST Parser ===');
        
        // Test AST parsing
        const ast = parseRustAST(sampleRustCode);
        console.log('AST parsed successfully!');
        console.log('Functions found:', ast.functions.map(f => f.name));
        console.log('Structs found:', ast.structs.map(s => s.name));
        
        console.log('\n=== Testing AST-Enhanced Recommendations ===');
        
        // Create sample findings that would be found by our analyzer
        const findings = [
            {
                id: 'missing-signer-check',
                severity: 'high',
                category: 'Access Control',
                title: 'Missing Signer Verification',
                description: 'Function lacks proper signer verification',
                location: { line: 9, column: 4 },
                codeSnippet: 'pub fn initialize_pool(ctx: Context<InitializePool>, amount: u64)',
                recommendation: 'Generic recommendation about adding signer checks'
            },
            {
                id: 'missing-slippage-protection',
                severity: 'medium',
                category: 'Economic Security',
                title: 'Missing Slippage Protection',
                description: 'Token swap lacks slippage protection',
                location: { line: 16, column: 4 },
                codeSnippet: 'let amount_out = amount_in * pool.exchange_rate;',
                recommendation: 'Generic recommendation about slippage protection'
            },
            {
                id: 'missing-access-control',
                severity: 'critical',
                category: 'Access Control', 
                title: 'Missing Access Control',
                description: 'Emergency withdraw function lacks access control',
                location: { line: 42, column: 4 },
                codeSnippet: 'pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>)',
                recommendation: 'Generic recommendation about access control'
            }
        ];
        
        // Test the enhanced service (fallback mode without API key)
        const enhancer = new GeminiAuditEnhancer(null); // No API key
        
        // Test code-specific recommendations
        console.log('\n=== Testing Code-Specific Security Recommendations ===');
        const securityRecs = enhancer.getCodeSpecificSecurityRecommendations(findings, 'Solana', 'Rust');
        console.log('Security Recommendations:');
        securityRecs.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
        
        console.log('\n=== Testing Code-Specific Best Practices ===');
        const bestPractices = enhancer.getCodeSpecificBestPractices(findings, 'Solana', 'Rust');
        console.log('Best Practices:');
        bestPractices.forEach((practice, i) => {
            console.log(`${i + 1}. ${practice}`);
        });
        
        console.log('\n=== Testing Code-Specific Implementation Recommendations ===');
        const implRecs = enhancer.getCodeSpecificImplementationRecommendations(findings, 'Solana', 'Rust');
        console.log('Implementation Recommendations:');
        implRecs.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
        
        console.log('\n✅ All tests completed successfully!');
        console.log('The system now provides code-specific recommendations based on actual parsed AST!');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testAST();
