-- Create role_change_requests table
CREATE TABLE IF NOT EXISTS role_change_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    requested_role VARCHAR(50) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER,
    review_comment VARCHAR(500),
    CONSTRAINT fk_role_change_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_change_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_change_requests_requested_at ON role_change_requests(requested_at DESC);

-- Add comment
COMMENT ON TABLE role_change_requests IS 'Stores user requests for role changes (e.g., to MAINTENANCE_ENGINEER)';
