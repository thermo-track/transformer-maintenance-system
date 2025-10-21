@echo off
REM Bootstrap First Admin Account
REM This script creates the first admin user using credentials from .env file

echo ========================================
echo   TMS Admin Bootstrap Script
echo ========================================
echo.

REM Load environment variables from .env file
if not exist .env (
    echo Error: .env file not found!
    echo Please create .env file with required credentials.
    pause
    exit /b 1
)

REM Parse .env file and set environment variables
for /f "usebackq tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)

REM Check required environment variables
if "%ADMIN_USERNAME%"=="" (
    echo Error: ADMIN_USERNAME not set in .env
    pause
    exit /b 1
)
if "%ADMIN_EMAIL%"=="" (
    echo Error: ADMIN_EMAIL not set in .env
    pause
    exit /b 1
)
if "%ADMIN_PASSWORD_HASH%"=="" (
    echo Error: ADMIN_PASSWORD_HASH not set in .env
    pause
    exit /b 1
)

REM Database connection details from .env
set DB_HOST=localhost
set DB_PORT=%POSTGRES_PORT%
set DB_NAME=%POSTGRES_DB%
set DB_USER=%DB_USERNAME%
set DB_PASSWORD=%DB_PASSWORD%

echo Database Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.
echo Admin Account:
echo   Username: %ADMIN_USERNAME%
echo   Email: %ADMIN_EMAIL%
echo   Full Name: %ADMIN_FULL_NAME%
echo.

echo Creating admin account...
echo.

REM Set password environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Create SQL with environment variable substitution
(
echo INSERT INTO users (
echo     username, email, password, role, enabled, email_verified,
echo     full_name, employee_id, department,
echo     account_non_expired, account_non_locked, credentials_non_expired, created_at
echo ^) VALUES (
echo     '%ADMIN_USERNAME%', '%ADMIN_EMAIL%', '%ADMIN_PASSWORD_HASH%',
echo     'ROLE_ADMIN', true, true,
echo     '%ADMIN_FULL_NAME%', '%ADMIN_EMPLOYEE_ID%', '%ADMIN_DEPARTMENT%',
echo     true, true, true, CURRENT_TIMESTAMP
echo ^) ON CONFLICT ^(username^) DO NOTHING;
echo.
echo SELECT username, email, role, enabled, email_verified FROM users WHERE role = 'ROLE_ADMIN';
) > bootstrap_admin_temp.sql

REM Execute SQL
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f bootstrap_admin_temp.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Admin account created successfully!
    echo.
    echo Login credentials:
    echo   URL:      http://localhost:5173/login
    echo   Username: %ADMIN_USERNAME%
    echo   Email:    %ADMIN_EMAIL%
    echo   Role:     ROLE_ADMIN
    echo.
    echo NOTE: Use the password you configured for the admin account.
) else (
    echo.
    echo ✗ Failed to create admin account
    echo.
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database '%DB_NAME%' exists
    echo   3. 'users' table exists
    echo   4. psql command is available in PATH
    echo   5. .env file has correct credentials
)

REM Cleanup
del bootstrap_admin_temp.sql
set PGPASSWORD=

echo.
echo ========================================
echo.
pause
