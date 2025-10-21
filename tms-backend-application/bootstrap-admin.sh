#!/bin/bash

# Bootstrap Admin User Creation Script
# This script creates the first admin user using credentials from .env file

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found!"
    exit 1
fi

# Check required environment variables
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD_HASH" ]; then
    echo "Error: Required environment variables not set!"
    echo "Please ensure ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD_HASH are set in .env"
    exit 1
fi

# PostgreSQL connection details from .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-transformerdb1}
DB_USER=${DB_USERNAME:-postgres}
DB_PASS=${DB_PASSWORD}

echo "Creating admin user: $ADMIN_USERNAME"

# Execute SQL with environment variable substitution
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
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
    '$ADMIN_USERNAME',
    '$ADMIN_EMAIL',
    '$ADMIN_PASSWORD_HASH',
    'ROLE_ADMIN',
    true,
    true,
    '$ADMIN_FULL_NAME',
    '$ADMIN_EMPLOYEE_ID',
    '$ADMIN_DEPARTMENT',
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
EOF

echo "Admin user creation complete!"
