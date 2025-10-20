@echo off
REM Bootstrap First Admin Account
REM Simple batch script to create first admin user

echo ========================================
echo   TMS Admin Bootstrap Script
echo ========================================
echo.

REM Database connection details
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=transformerdb1
set DB_USER=postgres

echo Database Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

REM Prompt for password
set /p DB_PASSWORD="Enter PostgreSQL password for user '%DB_USER%': "

echo.
echo Creating admin account...
echo.

REM Set password environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Execute SQL
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f bootstrap_admin.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Admin account created successfully!
    echo.
    echo Login credentials:
    echo   URL:      http://localhost:5173/login
    echo   Username: admin
    echo   Password: Admin123
    echo   Role:     ROLE_ADMIN
    echo.
    echo You can now login as admin!
) else (
    echo.
    echo ✗ Failed to create admin account
    echo.
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database 'transformerdb1' exists
    echo   3. 'users' table exists
    echo   4. psql command is available in PATH
)

REM Clear password
set PGPASSWORD=

echo.
echo ========================================
echo.
pause
