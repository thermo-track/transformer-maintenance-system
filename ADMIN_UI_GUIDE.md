# Admin System - Complete Guide

## Overview

The Transformer Maintenance System implements a secure admin registration and verification process with multiple security layers:

- **Admin Secret Key** - Prevents unauthorized registration attempts
- **Email Verification** - Validates email ownership via OTP
- **Manual Approval** (optional) - Existing admins review and approve requests
- **Auto-Approval** (optional) - For development/testing environments

---

## Quick Start

### Step 1: Create First Admin

Choose one method:

#### Option A: Using pgAdmin or DBeaver (Recommended ⭐)

1. Connect to database `transformerdb1`
2. Open SQL query window and execute:

```sql
INSERT INTO users (
    username, email, password, role, enabled, email_verified,
    full_name, employee_id, department,
    account_non_expired, account_non_locked, credentials_non_expired,
    created_at
) VALUES (
    'admin', 'admin@tms.com',
    '$2a$10$dXJ3SW6G7P9H.M5lMjU3C.h3nDB8mC7dYqCwXz8mP5BjLgQe7zLqO',
    'ROLE_ADMIN', true, true,
    'System Administrator', 'ADMIN001', 'IT Department',
    true, true, true, CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;
```

#### Option B: Using psql Command Line

```bash
cd tms-backend-application
psql -U postgres -d transformerdb1 -f bootstrap_admin.sql
```

#### Option C: Temporary Auto-Approve (Development Only)

```properties
# In application.properties
app.admin.auto-approve=true
```

Then register at `/admin/register`. **Set back to `false` afterwards!**

### Step 2: Login as Admin

1. Navigate to: **http://localhost:5173/login**
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `Admin123`
3. Click **Login**

> ⚠️ **Important:** Use the same login page as regular users - no separate admin login!

### Step 3: Access Admin Features

After login:
- **Admin Approvals:** http://localhost:5173/admin/approvals

---

## Configuration

### Application Properties

Add to `application.properties`:

```properties
# Admin secret key - required for admin registration
app.admin.secret-key=CHANGE_ME_IN_PRODUCTION_12345

# Auto-approve admins after email verification
# false = manual approval required (recommended for production)
# true = auto-approve after verification (for dev/testing)
app.admin.auto-approve=false

# Email configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Environment Variables (Production)

```bash
export ADMIN_SECRET_KEY="your-super-secret-key-here"
export ADMIN_AUTO_APPROVE=false
```

---

## Admin Registration Flow

### Auto-Approval Flow (`app.admin.auto-approve=true`)

```
User submits registration
    ↓
System verifies admin secret key
    ↓
User receives OTP email
    ↓
User verifies email with OTP
    ↓
System AUTOMATICALLY upgrades to ROLE_ADMIN
    ↓
Admin welcome email sent
    ↓
User can login as admin
```

### Manual Approval Flow (`app.admin.auto-approve=false`)

```
User submits registration
    ↓
System verifies admin secret key
    ↓
User receives OTP email
    ↓
User verifies email with OTP
    ↓
User receives "Pending Approval" email
    ↓
Existing admins receive notification
    ↓
Admin approves/rejects request
    ↓
User receives approval/rejection email
    ↓
If approved: User can login as admin
```

---

## API Endpoints

### Register Admin

**POST** `/api/admin/auth/register`

```json
{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "SecureP@ssw0rd",
  "fullName": "John Doe",
  "employeeId": "EMP001",
  "department": "IT Operations",
  "phoneNumber": "+94771234567",
  "adminSecretKey": "CHANGE_ME_IN_PRODUCTION_12345",
  "justification": "I need admin access to manage the system"
}
```

### Verify Email OTP

**POST** `/api/admin/auth/verify-otp`

```json
{
  "email": "admin@example.com",
  "otpCode": "123456"
}
```

### Get Pending Approvals (Admin Only)

**GET** `/api/admin/auth/pending-approvals`

Headers: `Authorization: Basic <base64(username:password)>`

### Approve Admin Request (Admin Only)

**POST** `/api/admin/auth/approve/{approvalId}`

### Reject Admin Request (Admin Only)

**POST** `/api/admin/auth/reject/{approvalId}`

```json
{
  "reason": "Insufficient justification for admin access"
}
```

---

## Frontend Implementation

### New Pages

1. **Admin Registration** (`/admin/register`)
   - Two-column form layout
   - Required fields: username, email, password, full name, employee ID, department
   - Optional: phone number, justification
   - Admin secret key input (masked)
   - Password strength validation

2. **Admin Approvals** (`/admin/approvals`)
   - View pending requests
   - Approve/reject with one click
   - Card-based UI
   - Admin-only access (requires ROLE_ADMIN)

3. **OTP Verification** (`/verify-otp`)
   - Handles both user and admin verification
   - Different success messages for admin vs user


## Database Schema

### `admin_approvals` Table

```sql
CREATE TABLE admin_approvals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    justification VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values:**
- `PENDING` - Waiting for approval
- `APPROVED` - Approved and upgraded to admin
- `REJECTED` - Rejected with reason

---

## Email Notifications

### Email Types

1. **OTP Verification** - 6-digit code for email verification
2. **Admin Request Notification** - Sent to existing admins when new request submitted
3. **Pending Approval** - Sent to candidate after email verification
4. **Admin Welcome** - Sent when approved
5. **Rejection Notice** - Sent when rejected with reason

### Email Service Methods

```java
// In EmailService.java
sendOtpEmail(String toEmail, String otpCode)
sendAdminRequestNotification(String adminEmail, String candidateUsername, ...)
sendPendingApprovalEmail(String toEmail, String username)
sendAdminWelcomeEmail(String toEmail, String username)
sendAdminRejectionEmail(String toEmail, String username, String reason)
```

---

## Security Best Practices

### 1. Change Default Admin Secret Key

```bash
# Generate strong random key
openssl rand -base64 32

# Set as environment variable
export ADMIN_SECRET_KEY="your-generated-key"
```

### 2. Use Manual Approval in Production

Always set `app.admin.auto-approve=false` for:
- Multiple verification levels
- Audit trail of approvals
- Prevention of unauthorized access

### 3. Security Checklist

Before production deployment:

- [ ] Change `app.admin.secret-key` to strong random value
- [ ] Set `app.admin.auto-approve=false`
- [ ] Change default admin password from `Admin123`
- [ ] Use environment variables for secrets
- [ ] Test role-based access control
- [ ] Verify non-admins get 403 on admin endpoints

---

## Quick Reference

| Item | Value |
|------|-------|
| Login URL | http://localhost:5173/login |
| Admin Registration | http://localhost:5173/admin/register |
| Manage Approvals | http://localhost:5173/admin/approvals |
| Default Username | `admin` |
| Default Password | `Admin123` |
| Default Secret Key | `CHANGE_ME_IN_PRODUCTION_12345` |
| Default Role | `ROLE_ADMIN` |

---
