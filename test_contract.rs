use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    system_program,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    
    // Potential vulnerability: No owner check
    msg!("Processing instruction for account: {}", account.key);
    
    // Potential vulnerability: Unchecked arithmetic
    let amount = u64::from_le_bytes(instruction_data[0..8].try_into().unwrap());
    let new_balance = account.lamports() + amount;
    
    msg!("New balance: {}", new_balance);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_process_instruction() {
        // Basic test
        assert_eq!(1, 1);
    }
}
