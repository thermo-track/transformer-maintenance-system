-- Migration: Create annotation_actions table
-- Version: 1.1
-- Date: 2025-10-21

-- Create annotation_actions table for audit trail
CREATE TABLE annotation_actions (
    id BIGSERIAL PRIMARY KEY,
    
    -- What was acted upon
    anomaly_id BIGINT NOT NULL,
    inspection_id BIGINT NOT NULL,
    
    -- Who did it
    user_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL,
    
    -- What action
    action_type VARCHAR(20) NOT NULL,
    -- Values: 'CREATED', 'EDITED', 'DELETED', 'APPROVED', 'REJECTED', 'COMMENTED'
    
    -- Before/After state (for EDITED actions)
    previous_bbox JSONB,
    new_bbox JSONB,
    previous_classification JSONB,
    new_classification JSONB,
    
    -- Optional comment
    comment TEXT,
    
    -- Metadata
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_metadata JSONB,
    
    -- Foreign keys
    CONSTRAINT fk_annotation_actions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_annotation_actions_anomaly FOREIGN KEY (anomaly_id) REFERENCES inspection_anomalies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_annotation_actions_anomaly ON annotation_actions(anomaly_id);
CREATE INDEX idx_annotation_actions_user ON annotation_actions(user_id);
CREATE INDEX idx_annotation_actions_inspection ON annotation_actions(inspection_id);
CREATE INDEX idx_annotation_actions_timestamp ON annotation_actions(action_timestamp);
CREATE INDEX idx_annotation_actions_type ON annotation_actions(action_type);

-- Add comments for documentation
COMMENT ON TABLE annotation_actions IS 'Audit trail of all user interactions with anomaly annotations';
COMMENT ON COLUMN annotation_actions.action_type IS 'Type of action: CREATED, EDITED, DELETED, APPROVED, REJECTED, COMMENTED';
COMMENT ON COLUMN annotation_actions.previous_bbox IS 'Bounding box before edit: {x, y, width, height}';
COMMENT ON COLUMN annotation_actions.new_bbox IS 'Bounding box after edit: {x, y, width, height}';
COMMENT ON COLUMN annotation_actions.previous_classification IS 'Classification before edit: {fault_type, confidence, class_id}';
COMMENT ON COLUMN annotation_actions.new_classification IS 'Classification after edit: {fault_type, confidence, class_id}';
COMMENT ON COLUMN annotation_actions.client_metadata IS 'Client information: {ip_address, user_agent, etc.}';
