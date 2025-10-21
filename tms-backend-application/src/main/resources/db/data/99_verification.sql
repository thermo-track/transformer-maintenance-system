-- ============================================================
-- Verification and Documentation Queries
-- Description: Foreign key checks and table documentation
-- ============================================================

-- Verify foreign key relationships work properly
-- This query should return all transformer images with their transformer details
SELECT 
    t.transformer_no,
    t.region,
    ti.weather_condition,
    ti.base_image_name,
    ti.created_at
FROM public.transformers t
JOIN public.transformer_images ti ON t.id = ti.transformer_id
ORDER BY t.transformer_no, ti.weather_condition;

-- Add comments for documentation
COMMENT ON TABLE public.inference_metadata IS 'Stores metadata about inference pipeline runs for each inspection';
COMMENT ON TABLE public.inspection_anomalies IS 'Stores detected anomalies and faults from thermal image analysis';
