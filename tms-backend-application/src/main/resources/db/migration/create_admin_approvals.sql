-- Create admin_approvals table
CREATE TABLE IF NOT EXISTS admin_approvals (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_approval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_approvals_status ON admin_approvals(status);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_email ON admin_approvals(email);

-- Add comments for documentation
COMMENT ON TABLE admin_approvals IS 'Tracks admin access approval requests';
COMMENT ON COLUMN admin_approvals.status IS 'Approval status: PENDING, APPROVED, or REJECTED';
COMMENT ON COLUMN admin_approvals.approved_by IS 'Username of super admin who approved/rejected the request';
