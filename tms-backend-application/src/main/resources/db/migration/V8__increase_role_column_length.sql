-- Increase the length of the role column to support longer role names like ROLE_MAINTENANCE_ENGINEER
ALTER TABLE users 
ALTER COLUMN role TYPE VARCHAR(50);
