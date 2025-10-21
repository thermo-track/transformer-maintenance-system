-- Bootstrap First Admin Account
-- Run this SQL script in your PostgreSQL database to create the first admin user
-- 
-- IMPORTANT: This script contains hardcoded credentials for initial setup only.
-- The actual credentials are stored in .env file as environment variables:
-- - ADMIN_USERNAME
-- - ADMIN_EMAIL  
-- - ADMIN_PASSWORD_HASH
-- - ADMIN_FULL_NAME
-- - ADMIN_EMPLOYEE_ID
-- - ADMIN_DEPARTMENT
--
-- To generate a new password hash:
-- Use BCryptPasswordEncoder with 12 rounds or run: 
-- java -cp target/classes com.powergrid.maintenance.tms_backend_application.PasswordHashGenerator

-- Step 1: Insert admin user directly with ROLE_ADMIN
-- NOTE: Replace these values with your environment variables when running manually
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
    '${ADMIN_USERNAME}',              -- From .env: ADMIN_USERNAME
    '${ADMIN_EMAIL}',                 -- From .env: ADMIN_EMAIL
    '${ADMIN_PASSWORD_HASH}',         -- From .env: ADMIN_PASSWORD_HASH (BCrypt with 12 rounds)
    'ROLE_ADMIN',
    true,
    true,
    '${ADMIN_FULL_NAME}',            -- From .env: ADMIN_FULL_NAME
    '${ADMIN_EMPLOYEE_ID}',          -- From .env: ADMIN_EMPLOYEE_ID
    '${ADMIN_DEPARTMENT}',           -- From .env: ADMIN_DEPARTMENT
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
