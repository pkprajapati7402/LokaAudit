use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_contract {
    use super::*;

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        // VULNERABILITY: Missing signer check
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        // VULNERABILITY: No overflow protection
        let total_amount = amount * 2 + 1000;
        
        token::transfer(cpi_ctx, total_amount)?;
        
        Ok(())
    }
    
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let account = &mut ctx.accounts.user_account;
        
        // VULNERABILITY: Missing owner check and potential underflow
        account.balance -= amount;
        
        **ctx.accounts.user_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount;
        
        Ok(())
    }
    
    pub fn create_pda_account(ctx: Context<CreatePDA>) -> Result<()> {
        // VULNERABILITY: Weak PDA seed
        let (pda, _bump) = Pubkey::find_program_address(
            &[b"vault"],
            ctx.program_id,
        );
        
        // Use unsafe block (potential vulnerability)
        unsafe {
            let ptr = &ctx.accounts.user_account as *const Account<UserAccount>;
            (*ptr).balance = 1000;
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>, // Missing proper constraints
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub user_account: Account<'info, UserAccount>,
    pub destination: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreatePDA<'info> {
    #[account(
        init,
        seeds = [b"vault", user.key().as_ref()],
        // VULNERABILITY: Missing bump constraint
        payer = user,
        space = 8 + 32 + 8
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub balance: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    #[msg("Invalid owner")]
    InvalidOwner,
}
