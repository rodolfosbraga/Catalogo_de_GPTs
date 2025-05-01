-- Add users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest', -- 'guest', 'invited', 'paid'
    hotmart_status TEXT, -- Store relevant Hotmart transaction/subscription status
    invite_code_used TEXT, -- Store the invite code used for signup
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (used_by_user_id) REFERENCES users(id)
);

