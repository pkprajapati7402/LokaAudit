use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};

entrypoint!(process_instruction);

// This contract has intentional vulnerabilities for testing
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let user_account = next_account_info(accounts_iter)?;
    let destination_account = next_account_info(accounts_iter)?;
    
    // Vulnerability 1: Integer overflow potential
    let amount = u64::from_le_bytes([
        instruction_data[0],
        instruction_data[1], 
        instruction_data[2],
        instruction_data[3],
        instruction_data[4],
        instruction_data[5],
        instruction_data[6],
        instruction_data[7],
    ]);
    
    // Vulnerability 2: Missing access control
    let mut balance = **user_account.try_borrow_mut_lamports()?;
    
    // Vulnerability 3: Potential overflow without checks
    balance += amount;
    
    **user_account.try_borrow_mut_lamports()? = balance;
    
    // Vulnerability 4: No validation of destination account
    **destination_account.try_borrow_mut_lamports()? += amount;
    
    msg!("Transfer completed: {} lamports", amount);
    
    Ok(())
}

// Vulnerability 5: Unsafe function without proper validation
pub fn unsafe_withdraw(account: &AccountInfo, amount: u64) -> ProgramResult {
    let mut balance = **account.try_borrow_mut_lamports()?;
    balance -= amount; // Could underflow
    **account.try_borrow_mut_lamports()? = balance;
    Ok(())
}
