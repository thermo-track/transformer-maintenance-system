-- Generate UUIDs (text) for the varchar id
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert transformers data with conflict handling
INSERT INTO public.transformers (id, transformer_no, pole_no, region, type, location_details, created_at, updated_at)
VALUES 
('de72eb41-12c3-43a4-9031-c2911cb986aa', 'TX-001', 'P-1001', 'COLOMBO', 'Distribution', 'Near Main St substation', NOW(), NOW()),
('a2dd837e-2030-4f0b-95fe-4f4b43f31d6e', 'TX-002', 'P-2003', 'KANDY', 'Distribution', 'Opposite Central School', NOW(), NOW()),
('f2eae15d-b0f4-4156-a5e1-2edc0447e0ce', 'TX-003', 'P-3055', 'GALLE', 'Bulk', 'Harbor access road - gate', NOW(), NOW()),
('9ccdd6c3-3381-49ef-9b75-8c0dec91a34a', 'TX-004', 'P-4120', 'JAFFNA', 'Bulk', 'Uptown feeder, junction pole', NOW(), NOW()),
('53136bd7-5775-4abb-a365-1c0de88762dd', 'TX-005', 'P-5890', 'NEGOMBO', 'Distribution', 'Agri market perimeter, pole 7', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert transformer_images data with conflict handling
-- Note: The transformer_id column still exists in the database and maps to the transformer.id relationship
INSERT INTO public.transformer_images 
(id, base_cloudinary_public_id, base_image_name, base_image_type, base_image_uploaded_at, base_image_url, created_at, transformer_id, uploaded_by, weather_condition)
VALUES
('06499027-ac1f-4879-9f86-6177ab477d01', 'transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_sunny_1756300807230', 'Sunny 01 (3).jpeg', 'image/jpeg', '2025-08-27 18:50:08.558733+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300807/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_sunny_1756300807230.jpg', '2025-08-27 18:50:08.559735+05:30', 'de72eb41-12c3-43a4-9031-c2911cb986aa', 'SYSTEM', 'SUNNY'),

('08da5b71-f99f-46e5-af07-422f3ff33201', 'transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_rainy_1756300851600', 'Rainy 04.jpeg', 'image/jpeg', '2025-08-27 18:50:52.388088+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300851/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_rainy_1756300851600.jpg', '2025-08-27 18:50:52.388088+05:30', 'a2dd837e-2030-4f0b-95fe-4f4b43f31d6e', 'SYSTEM', 'RAINY'),

('1a3e41c4-b346-4ee2-a737-4dd652f0070a', 'transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_rainy_1756300874308', 'Rainy 05.png', 'image/png', '2025-08-27 18:51:16.10303+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300875/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_rainy_1756300874308.png', '2025-08-27 18:51:16.104034+05:30', 'f2eae15d-b0f4-4156-a5e1-2edc0447e0ce', 'SYSTEM', 'RAINY'),

('1e5df2da-eb1e-4acf-8278-1bc97fbc2040', 'transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_cloudy_1756300619921', 'cloudy 01.jpeg', 'image/jpeg', '2025-08-27 18:47:01.501274+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300620/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_cloudy_1756300619921.jpg', '2025-08-27 18:47:01.501897+05:30', '9ccdd6c3-3381-49ef-9b75-8c0dec91a34a', 'SYSTEM', 'CLOUDY'),

('24a9ac01-da92-4d9d-bea0-fbe6b95ebbd1', 'transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_rainy_1756300766689', 'Rainy 02.jpeg', 'image/jpeg', '2025-08-27 18:49:27.694165+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300766/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_rainy_1756300766689.jpg', '2025-08-27 18:49:27.695169+05:30', '53136bd7-5775-4abb-a365-1c0de88762dd', 'SYSTEM', 'RAINY'),

('26dd58cf-e211-4cab-92b6-12d7ed3147a2', 'transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_cloudy_1756300812350', 'Cloudy 03.jpeg', 'image/jpeg', '2025-08-27 18:50:13.191036+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300812/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_cloudy_1756300812350.jpg', '2025-08-27 18:50:13.191036+05:30', 'de72eb41-12c3-43a4-9031-c2911cb986aa', 'SYSTEM', 'CLOUDY'),

('3b7ea44d-1197-4e6b-b177-371ff9b9a3f8', 'transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_sunny_1756300867667', 'Sunny 01 (5).jpeg', 'image/jpeg', '2025-08-27 18:51:08.725697+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300867/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_sunny_1756300867667.jpg', '2025-08-27 18:51:08.726697+05:30', 'f2eae15d-b0f4-4156-a5e1-2edc0447e0ce', 'SYSTEM', 'SUNNY'),

('4dbfbdac-c317-4411-a80f-c9e2b9fe835f', 'transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_rainy_1756300816335', 'Rainy 03.jpeg', 'image/jpeg', '2025-08-27 18:50:17.014882+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300816/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_rainy_1756300816335.jpg', '2025-08-27 18:50:17.014882+05:30', 'de72eb41-12c3-43a4-9031-c2911cb986aa', 'SYSTEM', 'RAINY'),

('5c4fb223-8e46-43b7-9723-dc0b8c02697c', 'transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_cloudy_1756300742818', 'Cloudy 02.jpeg', 'image/jpeg', '2025-08-27 18:49:03.718678+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300743/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_cloudy_1756300742818.jpg', '2025-08-27 18:49:03.718678+05:30', '53136bd7-5775-4abb-a365-1c0de88762dd', 'SYSTEM', 'CLOUDY'),

('7799d277-5019-4188-bb39-a47fccd4937f', 'transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_rainy_1756300627846', 'Rainy 01.png', 'image/png', '2025-08-27 18:47:08.635827+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300628/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_rainy_1756300627846.jpg', '2025-08-27 18:47:08.635827+05:30', '9ccdd6c3-3381-49ef-9b75-8c0dec91a34a', 'SYSTEM', 'RAINY'),

('9690fc22-b321-464e-bac8-ab2a958b5165', 'transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_sunny_1756300733656', 'Sunny 01 (2).jpeg', 'image/jpeg', '2025-08-27 18:48:55.323393+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300734/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_sunny_1756300733656.jpg', '2025-08-27 18:48:55.324386+05:30', '53136bd7-5775-4abb-a365-1c0de88762dd', 'SYSTEM', 'SUNNY'),

('d3540c92-5fac-4d1d-9143-7db715ad904f', 'transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_cloudy_1756300871311', 'Cloudy 05.jpeg', 'image/jpeg', '2025-08-27 18:51:12.161337+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300871/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_cloudy_1756300871311.jpg', '2025-08-27 18:51:12.161337+05:30', 'f2eae15d-b0f4-4156-a5e1-2edc0447e0ce', 'SYSTEM', 'CLOUDY'),

('e117e4cf-faac-4f27-877f-9870ffd18fd1', 'transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_cloudy_1756300847098', 'Cloudy 04.jpeg', 'image/jpeg', '2025-08-27 18:50:47.899529+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300847/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_cloudy_1756300847098.jpg', '2025-08-27 18:50:47.901532+05:30', 'a2dd837e-2030-4f0b-95fe-4f4b43f31d6e', 'SYSTEM', 'CLOUDY'),

('f05d5020-185b-4822-8a0e-8fe4e690af78', 'transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_sunny_1756300613197', 'Sunny 01 (1).jpeg', 'image/jpeg', '2025-08-27 18:46:54.970701+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300614/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_sunny_1756300613197.jpg', '2025-08-27 18:46:54.980702+05:30', '9ccdd6c3-3381-49ef-9b75-8c0dec91a34a', 'SYSTEM', 'SUNNY'),

('f7099b2e-643c-4d04-b1b0-f579ecda1049', 'transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_sunny_1756300842803', 'Sunny 01 (4).jpeg', 'image/jpeg', '2025-08-27 18:50:43.756547+05:30', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756300843/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_sunny_1756300842803.jpg', '2025-08-27 18:50:43.757546+05:30', 'a2dd837e-2030-4f0b-95fe-4f4b43f31d6e', 'SYSTEM', 'SUNNY')

ON CONFLICT (id) DO NOTHING;

-- Verify the transformer_images insert
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT transformer_id) as unique_transformers,
    weather_condition,
    COUNT(*) as count_by_weather
FROM public.transformer_images 
GROUP BY weather_condition
ORDER BY weather_condition;

-- Insert inspection data with conflict handling (DO NOTHING approach)
INSERT INTO public.inspections 
(inspection_id, branch, cloud_image_name, cloud_image_type, cloud_image_url, cloud_uploaded_at, cloudinary_public_id, environmental_condition, inspection_timestamp, status, transformer_no)
VALUES
('100000001', 'COLOMBO', 'Sunny 01 (1).jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756302900/inspections/000000001/000000001_sunny_1756302898776.jpg', '2025-08-27 19:25:00.55+05:30', 'inspections/000000001/000000001_sunny_1756302898776', 'sunny', '2025-08-27 19:23:00+05:30', 'COMPLETED', 'TX-001'),

('100000002', 'COLOMBO', 'cloudy 01.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756302958/inspections/000000002/000000002_cloudy_1756302957509.jpg', '2025-08-27 19:25:58.898+05:30', 'inspections/000000002/000000002_cloudy_1756302957509', 'cloudy', '2025-08-27 19:24:00+05:30', 'IN_PROGRESS', 'TX-001'),

('100000003', 'COLOMBO', 'Rainy 01.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303020/inspections/000000003/000000003_rainy_1756303018426.jpg', '2025-08-27 19:27:00.225+05:30', 'inspections/000000003/000000003_rainy_1756303018426', 'rainy', '2025-08-27 19:22:00+05:30', 'SCHEDULED', 'TX-001'),

('100000004', 'KANDY', 'Sunny 01 (2).jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303167/inspections/000000004/000000004_sunny_1756303166292.jpg', '2025-08-27 19:29:27.942+05:30', 'inspections/000000004/000000004_sunny_1756303166292', 'sunny', '2025-08-27 19:28:00+05:30', 'IN_PROGRESS', 'TX-002'),

('100000005', 'KANDY', 'Rainy 02.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303207/inspections/000000005/000000005_rainy_1756303206748.jpg', '2025-08-27 19:30:08.032+05:30', 'inspections/000000005/000000005_rainy_1756303206748', 'rainy', '2025-08-27 19:27:00+05:30', 'IN_PROGRESS', 'TX-002'),

('100000006', 'KANDY', 'Cloudy 02.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303184/inspections/000000006/000000006_cloudy_1756303183922.jpg', '2025-08-27 19:29:44.806+05:30', 'inspections/000000006/000000006_cloudy_1756303183922', 'cloudy', '2025-08-27 19:19:00+05:30', 'COMPLETED', 'TX-002'),

('100000007', 'GALLE', 'Cloudy 03.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303343/inspections/000000007/000000007_cloudy_1756303342213.jpg', '2025-08-27 19:32:24.05+05:30', 'inspections/000000007/000000007_cloudy_1756303342213', 'cloudy', '2025-08-27 19:18:00+05:30', 'COMPLETED', 'TX-003'),

('100000008', 'GALLE', 'Rainy 03.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303380/inspections/000000008/000000008_rainy_1756303379812.jpg', '2025-08-27 19:33:00.803+05:30', 'inspections/000000008/000000008_rainy_1756303379812', 'rainy', '2025-08-27 07:06:00+05:30', 'COMPLETED', 'TX-003'),

('100000009', 'GALLE', 'Sunny 01 (3).jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303362/inspections/000000009/000000009_sunny_1756303362124.jpg', '2025-08-27 19:32:42.93+05:30', 'inspections/000000009/000000009_sunny_1756303362124', 'sunny', '2025-08-27 19:17:00+05:30', 'IN_PROGRESS', 'TX-003'),

('100000010', 'JAFFNA', 'Sunny 01 (4).jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303462/inspections/000000010/000000010_sunny_1756303460777.jpg', '2025-08-27 19:34:22.414+05:30', 'inspections/000000010/000000010_sunny_1756303460777', 'sunny', '2025-08-27 19:15:00+05:30', 'IN_PROGRESS', 'TX-004'),

('100000011', 'JAFFNA', 'Cloudy 04.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303492/inspections/000000011/000000011_cloudy_1756303490979.jpg', '2025-08-27 19:34:52.296+05:30', 'inspections/000000011/000000011_cloudy_1756303490979', 'cloudy', '2025-08-27 19:16:00+05:30', 'COMPLETED', 'TX-004'),

('100000012', 'JAFFNA', 'Rainy 04.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303476/inspections/000000012/000000012_rainy_1756303475975.jpg', '2025-08-27 19:34:36.667+05:30', 'inspections/000000012/000000012_rainy_1756303475975', 'rainy', '2025-08-27 19:14:00+05:30', 'SCHEDULED', 'TX-004'),

('100000013', 'COLOMBO', 'Cloudy 05.jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303614/inspections/000000013/000000013_cloudy_1756303612801.jpg', '2025-08-27 19:36:54.561+05:30', 'inspections/000000013/000000013_cloudy_1756303612801', 'cloudy', '2025-08-04 19:35:00+05:30', 'IN_PROGRESS', 'TX-005'),

('100000014', 'COLOMBO', 'Sunny 01 (5).jpeg', 'image/jpeg', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303626/inspections/000000014/000000014_sunny_1756303625436.jpg', '2025-08-27 19:37:06.747+05:30', 'inspections/000000014/000000014_sunny_1756303625436', 'sunny', '2025-08-06 19:36:00+05:30', 'COMPLETED', 'TX-005'),

('100000015', 'GALLE', 'Rainy 05.png', 'image/png', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1756303644/inspections/000000015/000000015_rainy_1756303641818.png', '2025-08-27 19:37:24.548+05:30', 'inspections/000000015/000000015_rainy_1756303641818', 'rainy', '2025-08-12 05:06:00+05:30', 'COMPLETED', 'TX-005')

ON CONFLICT (inspection_id) DO NOTHING;

-- Verify inspection data
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT transformer_no) as unique_transformers,
    status,
    COUNT(*) as count_by_status
FROM public.inspections 
GROUP BY status
ORDER BY status;

-- Performance indexes - Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transformer_images_transformer_id ON public.transformer_images(transformer_id);
CREATE INDEX IF NOT EXISTS idx_transformer_images_weather ON public.transformer_images(weather_condition);
CREATE INDEX IF NOT EXISTS idx_inspections_transformer_no ON public.inspections(transformer_no);

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

ALTER SEQUENCE inspection_id_sequence RESTART WITH 100000016;