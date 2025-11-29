/// A simple user management contract
/// This module handles user registration and authentication
use std::collections::HashMap;

/// User struct to represent a registered user
pub struct User {
    pub username: String,
    pub email: String,
    age: u32,
}

/// A constant for maximum username length
pub const MAX_USERNAME_LENGTH: usize = 50;

/// Error type for user operations
#[derive(Debug)]
pub enum UserError {
    InvalidUsername,
    UserAlreadyExists,
}

/// Register a new user with the given username and email
/// Returns the user ID if successful
pub fn register_user(username: String, email: String, age: u32) -> Result<u64, UserError> {
    if username.is_empty() || username.len() > MAX_USERNAME_LENGTH {
        return Err(UserError::InvalidUsername);
    }
    
    // Create new user
    let user = User {
        username,
        email,
        age,
    };
    
    // Return mock user ID
    Ok(12345)
}

/// Get user information by username
/// Returns the user if found
pub fn get_user(username: &str) -> Option<User> {
    if username == "test_user" {
        Some(User {
            username: "test_user".to_string(),
            email: "test@example.com".to_string(),
            age: 25,
        })
    } else {
        None
    }
}

/// Private helper function to validate email
fn validate_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}
