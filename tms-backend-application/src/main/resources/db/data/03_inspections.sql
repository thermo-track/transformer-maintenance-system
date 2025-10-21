-- ============================================================
-- Table: inspections
-- Description: Maintenance inspection records
-- ============================================================

-- Insert inspection data with conflict handling (DO NOTHING approach)
INSERT INTO public.inspections 
(inspection_id, branch, cloud_image_name, cloud_image_type, cloud_image_url, cloud_uploaded_at, cloudinary_public_id, environmental_condition, inspection_timestamp, status, transformer_no)
VALUES
('100000001', 'COLOMBO', 'T6_faulty_002.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761047874/inspections/100000001/100000001_sunny_1761047870358.jpg', '2025-10-21 17:27:54.454+05:30', 'inspections/100000001/100000001_sunny_1761047870358', 'sunny', '2025-08-27 19:23:00+05:30', 'COMPLETED', 'TX-001'),

('100000002', 'COLOMBO', 'T6_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048083/inspections/100000002/100000002_sunny_1761048072984.jpg', '2025-10-21 17:31:23.519+05:30', 'inspections/100000002/100000002_sunny_1761048072984', 'sunny', '2025-08-27 19:24:00+05:30', 'IN_PROGRESS', 'TX-001'),

('100000003', 'COLOMBO', 'T6_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048017/inspections/100000003/100000003_sunny_1761048009585.jpg', '2025-10-21 17:30:17.721+05:30', 'inspections/100000003/100000003_sunny_1761048009585', 'sunny', '2025-08-27 19:22:00+05:30', 'SCHEDULED', 'TX-001'),

('100000004', 'KANDY', 'T7_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048450/inspections/100000004/100000004_sunny_1761048447319.jpg', '2025-10-21 17:37:31.241+05:30', 'inspections/100000004/100000004_sunny_1761048447319', 'sunny', '2025-08-27 19:28:00+05:30', 'IN_PROGRESS', 'TX-002'),

('100000005', 'KANDY', 'T7_faulty_003.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048618/inspections/100000005/100000005_sunny_1761048611811.jpg', '2025-10-21 17:40:18.919+05:30', 'inspections/100000005/100000005_sunny_1761048611811', 'sunny', '2025-08-27 19:27:00+05:30', 'IN_PROGRESS', 'TX-002'),

('100000006', 'KANDY', 'T7_faulty_002.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048547/inspections/100000006/100000006_sunny_1761048541684.jpg', '2025-10-21 17:39:07.598+05:30', 'inspections/100000006/100000006_sunny_1761048541684', 'sunny', '2025-08-27 19:19:00+05:30', 'COMPLETED', 'TX-002'),

('100000007', 'GALLE', 'T4_faulty_002.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048748/inspections/100000007/100000007_sunny_1761048744289.png', '2025-10-21 17:42:29.402+05:30', 'inspections/100000007/100000007_sunny_1761048744289', 'sunny', '2025-08-27 19:18:00+05:30', 'COMPLETED', 'TX-003'),

('100000008', 'GALLE', 'T4_faulty_002.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048879/inspections/100000008/100000008_sunny_1761048869502.png', '2025-10-21 17:44:39.435+05:30', 'inspections/100000008/100000008_sunny_1761048869502', 'sunny', '2025-08-27 07:06:00+05:30', 'COMPLETED', 'TX-003'),

('100000009', 'GALLE', 'T5_faulty_001.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048785/inspections/100000009/100000009_sunny_1761048781520.png', '2025-10-21 17:43:05.518+05:30', 'inspections/100000009/100000009_sunny_1761048781520', 'sunny', '2025-08-27 19:17:00+05:30', 'IN_PROGRESS', 'TX-003'),

('100000010', 'JAFFNA', 'T3_faulty_001.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048969/inspections/100000010/100000010_sunny_1761048968360.png', '2025-10-21 17:46:10.033+05:30', 'inspections/100000010/100000010_sunny_1761048968360', 'sunny', '2025-08-27 19:15:00+05:30', 'IN_PROGRESS', 'TX-004'),

('100000011', 'JAFFNA', 'T3_faulty_002.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049016/inspections/100000011/100000011_sunny_1761049013762.png', '2025-10-21 17:46:56.385+05:30', 'inspections/100000011/100000011_sunny_1761049013762', 'sunny', '2025-08-27 19:16:00+05:30', 'COMPLETED', 'TX-004'),

('100000012', 'JAFFNA', 'T3_faulty_003.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049057/inspections/100000012/100000012_sunny_1761049055754.png', '2025-10-21 17:47:37.391+05:30', 'inspections/100000012/100000012_sunny_1761049055754', 'sunny', '2025-08-27 19:14:00+05:30', 'SCHEDULED', 'TX-004'),

('100000013', 'COLOMBO', 'T13_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049297/inspections/100000013/100000013_sunny_1761049295165.jpg', '2025-10-21 17:51:38.188+05:30', 'inspections/100000013/100000013_sunny_1761049295165', 'sunny', '2025-08-04 19:35:00+05:30', 'IN_PROGRESS', 'TX-005'),

('100000014', 'COLOMBO', 'T13_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049340/inspections/100000014/100000014_sunny_1761049337629.jpg', '2025-10-21 17:52:20.87+05:30', 'inspections/100000014/100000014_sunny_1761049337629', 'sunny', '2025-08-06 19:36:00+05:30', 'COMPLETED', 'TX-005'),

('100000015', 'GALLE', 'T13_faulty_001.jpg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049392/inspections/100000015/100000015_cloudy_1761049388949.jpg', '2025-10-21 17:53:13.577+05:30', 'inspections/100000015/100000015_cloudy_1761049388949', 'cloudy', '2025-08-12 05:06:00+05:30', 'COMPLETED', 'TX-005')

ON CONFLICT (inspection_id) DO NOTHING;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_inspections_transformer_no ON public.inspections(transformer_no);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_timestamp ON public.inspections(inspection_timestamp);

-- Ensure the inspection_id_sequence is in sync with the current data to avoid
-- duplicate key errors when the DB already contains inspection rows (eg. persistent volumes).
SELECT setval('inspection_id_sequence', COALESCE((SELECT MAX(inspection_id) FROM inspections), 0), true);

-- Verification query
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT transformer_no) as unique_transformers,
    status,
    COUNT(*) as count_by_status
FROM public.inspections 
GROUP BY status
ORDER BY status;