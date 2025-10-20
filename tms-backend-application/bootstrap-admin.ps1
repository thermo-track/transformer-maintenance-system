# Bootstrap First Admin Account
# This script creates the first admin user in your database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TMS Admin Bootstrap Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "transformerdb1"
$DB_USER = "postgres"

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host ""

# Prompt for database password
$DB_PASSWORD = Read-Host "Enter PostgreSQL password for user '$DB_USER'" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

Write-Host ""
Write-Host "Creating admin account..." -ForegroundColor Yellow

# SQL to create admin
$SQL = @"
-- Create first admin user
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
    created_at
) VALUES (
    'admin',
    'admin@tms.com',
    '$2a$10$dXJ3SW6G7P9H.M5lMjU3C.h3nDB8mC7dYqCwXz8mP5BjLgQe7zLqO',
    'ROLE_ADMIN',
    true,
    true,
    'System Administrator',
    'ADMIN001',
    'IT Department',
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Verify
SELECT username, email, role, enabled, email_verified 
FROM users 
WHERE username = 'admin';
"@

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD_PLAIN

# Execute SQL using psql
try {
    $result = $SQL | & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Admin account created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Login credentials:" -ForegroundColor Cyan
        Write-Host "  URL:      http://localhost:5173/login" -ForegroundColor White
        Write-Host "  Username: admin" -ForegroundColor White
        Write-Host "  Password: Admin123" -ForegroundColor White
        Write-Host "  Role:     ROLE_ADMIN" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now login as admin!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Failed to create admin account" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please ensure:" -ForegroundColor Yellow
        Write-Host "  1. PostgreSQL is running"
        Write-Host "  2. Database 'transformerdb1' exists"
        Write-Host "  3. 'users' table exists"
        Write-Host "  4. psql command is available in PATH"
    }
} catch {
    Write-Host ""
    Write-Host "✗ Error executing SQL" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Run the SQL manually" -ForegroundColor Yellow
    Write-Host "  1. Open pgAdmin or DBeaver"
    Write-Host "  2. Connect to database 'transformerdb1'"
    Write-Host "  3. Run the SQL from 'bootstrap_admin.sql'"
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
