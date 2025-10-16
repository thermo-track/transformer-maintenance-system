-- Add new profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- Update existing users to have created_at as current timestamp if null
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
