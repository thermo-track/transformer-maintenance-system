-- ============================================================
-- Table: transformers
-- Description: Core transformer equipment records
-- ============================================================

-- Insert transformers data with conflict handling
INSERT INTO public.transformers (id, transformer_no, pole_no, region, type, location_details, created_at, updated_at)
VALUES 
('de72eb41-12c3-43a4-9031-c2911cb986aa', 'TX-001', 'P-1001', 'COLOMBO', 'Distribution', 'Near Main St substation', NOW(), NOW()),
('a2dd837e-2030-4f0b-95fe-4f4b43f31d6e', 'TX-002', 'P-2003', 'KANDY', 'Distribution', 'Opposite Central School', NOW(), NOW()),
('f2eae15d-b0f4-4156-a5e1-2edc0447e0ce', 'TX-003', 'P-3055', 'GALLE', 'Bulk', 'Harbor access road - gate', NOW(), NOW()),
('9ccdd6c3-3381-49ef-9b75-8c0dec91a34a', 'TX-004', 'P-4120', 'JAFFNA', 'Bulk', 'Uptown feeder, junction pole', NOW(), NOW()),
('53136bd7-5775-4abb-a365-1c0de88762dd', 'TX-005', 'P-5890', 'NEGOMBO', 'Distribution', 'Agri market perimeter, pole 7', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_transformers_transformer_no ON public.transformers(transformer_no);
CREATE INDEX IF NOT EXISTS idx_transformers_region ON public.transformers(region);
