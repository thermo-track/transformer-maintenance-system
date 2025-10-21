-- Migration: Add annotation feedback columns to inspection_anomalies
-- Version: 1.0
-- Date: 2025-10-21

-- Add new columns to inspection_anomalies table
ALTER TABLE inspection_anomalies 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'AI_GENERATED',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS superseded_by BIGINT,
ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);

-- Mark all existing records as AI_GENERATED and active
UPDATE inspection_anomalies 
SET source = 'AI_GENERATED', is_active = true 
WHERE source IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_anomalies_source ON inspection_anomalies(source);
CREATE INDEX IF NOT EXISTS idx_anomalies_active ON inspection_anomalies(is_active);
CREATE INDEX IF NOT EXISTS idx_anomalies_inspection_active ON inspection_anomalies(inspection_id, is_active);
CREATE INDEX IF NOT EXISTS idx_anomalies_superseded ON inspection_anomalies(superseded_by);

-- Add comments for documentation
COMMENT ON COLUMN inspection_anomalies.source IS 'Source of anomaly detection: AI_GENERATED or USER_ADDED';
COMMENT ON COLUMN inspection_anomalies.is_active IS 'Whether this anomaly is currently active (false = soft deleted)';
COMMENT ON COLUMN inspection_anomalies.superseded_by IS 'ID of the anomaly that replaced this one (for edited annotations)';
COMMENT ON COLUMN inspection_anomalies.superseded_at IS 'Timestamp when this anomaly was superseded';
COMMENT ON COLUMN inspection_anomalies.created_by IS 'Username who created this anomaly (for USER_ADDED)';
