-- Generate UUIDs (text) for the varchar id
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.transformers
(id, transformer_no, pole_no, region, type, location_details, created_at, updated_at)
VALUES
(gen_random_uuid()::text, 'TX-001', 'P-1001', 'COLOMBO',   'Distribution', 'Near Main St substation',      NOW(), NOW()),
(gen_random_uuid()::text, 'TX-002', 'P-2003', 'KANDY',     'Distribution', 'Opposite Central School',      NOW(), NOW()),
(gen_random_uuid()::text, 'TX-003', 'P-3055', 'GALLE',     'Bulk',         'Harbor access road - gate',    NOW(), NOW()),
(gen_random_uuid()::text, 'TX-004', 'P-4120', 'JAFFNA',    'Bulk',         'Uptown feeder, junction pole', NOW(), NOW()),
(gen_random_uuid()::text, 'TX-005', 'P-5890', 'NEGOMBO',   'Distribution', 'Agri market perimeter, pole 7',NOW(), NOW())
ON CONFLICT DO NOTHING;


INSERT INTO public.transformer_images
  (id, base_cloudinary_public_id, base_image_name, base_image_type,
   base_image_uploaded_at, base_image_url, created_at,
   transformer_id, uploaded_by, weather_condition)
SELECT
  gen_random_uuid()::text,
  'cld_tx001_base',
  'tx-001-baseline.jpg',
  'image/jpeg',
  NOW(),
  'https://example.com/uploads/tx-001-baseline.jpg',
  NOW(),
  t.id,
  'seed',
  'SUNNY'
FROM public.transformers t
WHERE t.transformer_no = 'TX-001'
ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING;

INSERT INTO public.transformer_images
  (id, base_cloudinary_public_id, base_image_name, base_image_type,
   base_image_uploaded_at, base_image_url, created_at,
   transformer_id, uploaded_by, weather_condition)
SELECT
  gen_random_uuid()::text,
  'cld_tx002_base',
  'tx-002-baseline.jpg',
  'image/jpeg',
  NOW(),
  'https://example.com/uploads/tx-002-baseline.jpg',
  NOW(),
  t.id,
  'seed',
  'SUNNY'
FROM public.transformers t
WHERE t.transformer_no = 'TX-002'
ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING;

INSERT INTO public.transformer_images
  (id, base_cloudinary_public_id, base_image_name, base_image_type,
   base_image_uploaded_at, base_image_url, created_at,
   transformer_id, uploaded_by, weather_condition)
SELECT
  gen_random_uuid()::text,
  'cld_tx003_base',
  'tx-003-baseline.jpg',
  'image/jpeg',
  NOW(),
  'https://example.com/uploads/tx-003-baseline.jpg',
  NOW(),
  t.id,
  'seed',
  'SUNNY'
FROM public.transformers t
WHERE t.transformer_no = 'TX-003'
ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING;

INSERT INTO public.transformer_images
  (id, base_cloudinary_public_id, base_image_name, base_image_type,
   base_image_uploaded_at, base_image_url, created_at,
   transformer_id, uploaded_by, weather_condition)
SELECT
  gen_random_uuid()::text,
  'cld_tx004_base',
  'tx-004-baseline.jpg',
  'image/jpeg',
  NOW(),
  'https://example.com/uploads/tx-004-baseline.jpg',
  NOW(),
  t.id,
  'seed',
  'SUNNY'
FROM public.transformers t
WHERE t.transformer_no = 'TX-004'
ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING;

INSERT INTO public.transformer_images
  (id, base_cloudinary_public_id, base_image_name, base_image_type,
   base_image_uploaded_at, base_image_url, created_at,
   transformer_id, uploaded_by, weather_condition)
SELECT
  gen_random_uuid()::text,
  'cld_tx005_base',
  'tx-005-baseline.jpg',
  'image/jpeg',
  NOW(),
  'https://example.com/uploads/tx-005-baseline.jpg',
  NOW(),
  t.id,
  'seed',
  'SUNNY'
FROM public.transformers t
WHERE t.transformer_no = 'TX-005'
ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING;
