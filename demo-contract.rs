// Sample Vulnerable Solana Smart Contract for Demo
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_defi {
    use super::*;

    #[state]
    pub struct Pool {
        pub total_supply: u64,
        pub interest_rate: u64,
        pub admin: Pubkey,
        pub emergency_withdraw_enabled: bool,
    }

    // VULNERABILITY: No access control on admin function
    pub fn set_interest_rate(ctx: Context<SetInterestRate>, new_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // VULNERABILITY: Missing admin check
        pool.interest_rate = new_rate;
        
        Ok(())
    }

    // VULNERABILITY: Integer overflow potential
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_token = &ctx.accounts.user_token_account;
        
        // VULNERABILITY: No overflow protection
        pool.total_supply = pool.total_supply + amount;
        
        // VULNERABILITY: External call before state update
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: user_token.to_account_info(),
                    to: ctx.accounts.pool_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;
        
        Ok(())
    }

    // VULNERABILITY: Reentrancy attack vector
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // VULNERABILITY: External call before state update
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // State update after external call - VULNERABLE
        pool.total_supply = pool.total_supply - amount;
        
        Ok(())
    }

    // VULNERABILITY: No input validation
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        
        // VULNERABILITY: Anyone can trigger emergency withdraw
        if pool.emergency_withdraw_enabled {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_account.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                ),
                ctx.accounts.pool_token_account.amount,
            )?;
        }
        
        Ok(())
    }

    // VULNERABILITY: Unchecked arithmetic
    pub fn calculate_rewards(ctx: Context<CalculateRewards>, principal: u64, time: u64) -> Result<()> {
        let pool = &ctx.accounts.pool;
        
        // VULNERABILITY: Potential overflow
        let rewards = principal * pool.interest_rate * time / 100;
        
        msg!("Calculated rewards: {}", rewards);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetInterestRate<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we're only using it as authority
    pub pool_authority: UncheckedAccount<'info>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we're only using it as authority
    pub pool_authority: UncheckedAccount<'info>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CalculateRewards<'info> {
    pub pool: Account<'info, Pool>,
}
