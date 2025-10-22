-- Migration: Create retraining_history table
-- Version: 1.0
-- Date: 2025-10-22

-- Create retraining_history table to track retraining sessions
CREATE TABLE IF NOT EXISTS retraining_history (
    id BIGSERIAL PRIMARY KEY,
    
    -- Retraining run info
    run_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL,
    -- Values: 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    
    -- Timestamps
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Statistics
    images_count INTEGER DEFAULT 0,
    feedback_samples INTEGER DEFAULT 0,
    replay_samples INTEGER DEFAULT 0,
    actions_included INTEGER DEFAULT 0,
    
    -- User who triggered
    triggered_by VARCHAR(50) NOT NULL,
    
    -- Python service response
    weights_path TEXT,
    metrics JSONB,
    error_message TEXT,
    
    -- Metadata
    hyperparameters JSONB,
    python_response JSONB
);

-- Create indexes
CREATE INDEX idx_retraining_status ON retraining_history(status);
CREATE INDEX idx_retraining_completed ON retraining_history(completed_at);
CREATE INDEX idx_retraining_started ON retraining_history(started_at);

-- Add comments
COMMENT ON TABLE retraining_history IS 'Tracks model retraining sessions and their outcomes';
COMMENT ON COLUMN retraining_history.run_id IS 'Unique identifier for the retraining run';
COMMENT ON COLUMN retraining_history.status IS 'Current status: PENDING, RUNNING, COMPLETED, FAILED';
COMMENT ON COLUMN retraining_history.actions_included IS 'Number of annotation actions included in this retraining';
COMMENT ON COLUMN retraining_history.images_count IS 'Number of images used for fine-tuning';
