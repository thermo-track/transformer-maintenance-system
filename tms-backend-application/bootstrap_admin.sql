-- Bootstrap First Admin Account
-- Run this SQL script in your PostgreSQL database to create the first admin user

-- Step 1: Insert admin user directly with ROLE_ADMIN
-- Password: 098765 (BCrypt encrypted with 12 rounds)
INSERT INTO users (
    username, 
    email, 
    password, 
    role, 
    enabled, 
    email_verified,
    full_name,
    employee_id,
    department,
    account_non_expired,
    account_non_locked,
    credentials_non_expired,
    created_at
) VALUES (
    'admin',
    'admin@tms.com',
    '$2a$12$ywMjnnKx9sCDGJNCcMHaJO7EMG1V7I1sInOtvG689Dl52qR2v5u7O', -- Password: 098765
    'ROLE_ADMIN',
    true,
    true,
    'System Administrator',
    'ADMIN001',
    'IT Department',
    true,
    true,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Verify the admin was created
SELECT username, email, role, enabled, email_verified 
FROM users 
WHERE role = 'ROLE_ADMIN';
