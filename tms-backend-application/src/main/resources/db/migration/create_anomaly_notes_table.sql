-- Create anomaly_notes table to support multiple notes per anomaly
CREATE TABLE IF NOT EXISTS anomaly_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_id VARCHAR(255) NOT NULL,
    anomaly_id VARCHAR(36) NOT NULL,  -- UUID stored as string
    note TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index for efficient queries
    INDEX idx_inspection_anomaly (inspection_id, anomaly_id),
    INDEX idx_created_at (created_at)
);