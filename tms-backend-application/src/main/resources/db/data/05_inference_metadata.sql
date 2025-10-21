-- Insert inference metadata data
-- ON CONFLICT DO NOTHING makes this idempotent (safe to run multiple times)
INSERT INTO inference_metadata (
    id,
    baseline_image_url,
    conf_thresh,
    created_at,
    inference_run_at,
    inspection_id,
    iou_thresh,
    maintenance_image_url,
    registration_inliers,
    registration_method,
    registration_ok,
    threshold_pct
) VALUES
('1093bd90-0266-4fb2-89de-4864f5ec804a', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761047774/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_sunny_1761047771040.jpg', 0.5, '2025-01-01 00:00:37.3', '2025-01-01 00:00:37.3', 100000003, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048017/inspections/100000003/100000003_sunny_1761048009585.jpg', 87, 'ORB_RANSAC', TRUE, 5),
('2757ab2d-b148-495e-955c-d8ce9e29bcae', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049272/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_cloudy_1761049268844.jpg', 0.5, '2025-01-01 00:23:29.0', '2025-01-01 00:23:29.0', 100000015, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049392/inspections/100000015/100000015_cloudy_1761049388949.jpg', 156, 'ORB_RANSAC', TRUE, 5),
('302966fe-6cca-4f9f-ae35-3cce8930b7ef', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048710/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_sunny_1761048708686.png', 0.5, '2025-01-01 00:12:43.2',  '2025-01-01 00:12:43.2', 100000007, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048748/inspections/100000007/100000007_sunny_1761048744289.png', 20, 'ORB_RANSAC', TRUE, 5),
('3c39a9e5-f997-4584-90c7-b0c29730368d', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048425/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_sunny_1761048415008.jpg', 0.5, '2025-01-01 00:08:09.4',  '2025-01-01 00:08:09.4', 100000004, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048450/inspections/100000004/100000004_sunny_1761048447319.jpg', 163, 'ORB_RANSAC', TRUE, 5),
('436ba638-e746-4f9c-9ce2-df3dcaa1ba15', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048425/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_sunny_1761048415008.jpg', 0.5, '2025-01-01 00:10:39.9', '2025-01-01 00:10:39.9', 100000005, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048618/inspections/100000005/100000005_sunny_1761048611811.jpg', 172, 'ORB_RANSAC', TRUE, 5),
('4b3b7f32-fcf9-46e1-b515-0721e41b2524', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049267/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_sunny_1761049263950.jpg', 0.5, '2025-01-01 00:21:51.6', '2025-01-01 00:21:51.6', 100000013, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049297/inspections/100000013/100000013_sunny_1761049295165.jpg', 127, 'ORB_RANSAC', TRUE, 5),
('530751d5-1f2c-4e94-981c-e48db74f8fa1', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049267/transformers/baseline/53136bd7-5775-4abb-a365-1c0de88762dd/baseline_53136bd7-5775-4abb-a365-1c0de88762dd_sunny_1761049263950.jpg', 0.5, '2025-01-01 00:22:42.9', '2025-01-01 00:22:42.9', 100000014, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049340/inspections/100000014/100000014_sunny_1761049337629.jpg', 127, 'ORB_RANSAC', TRUE, 5),
('5643e19c-2e69-4dbd-94bf-2efb3c107b65', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048710/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_sunny_1761048708686.png', 0.5, '2025-01-01 00:13:18.2', '2025-01-01 00:13:18.2', 100000009, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048785/inspections/100000009/100000009_sunny_1761048781520.png', 39, 'ORB_RANSAC', TRUE, 5),
('58403b44-0d62-42e0-9408-ba13245e87bd', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761047774/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_sunny_1761047771040.jpg', 0.5, '2025-01-01 00:02:19.0', '2025-01-01 00:02:19.0', 100000002, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048083/inspections/100000002/100000002_sunny_1761048072984.jpg', 87, 'ORB_RANSAC', TRUE, 5),
('7ad3da68-92e2-43f4-9599-781f47586d43', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048710/transformers/baseline/f2eae15d-b0f4-4156-a5e1-2edc0447e0ce/baseline_f2eae15d-b0f4-4156-a5e1-2edc0447e0ce_sunny_1761048708686.png', 0.5, '2025-01-01 00:14:50.0', '2025-01-01 00:14:50.0', 100000008, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048879/inspections/100000008/100000008_sunny_1761048869502.png', 20, 'ORB_RANSAC', TRUE, 5),
('7eb4c871-1f12-4ec3-b9b8-d7b23b97eb38', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048425/transformers/baseline/a2dd837e-2030-4f0b-95fe-4f4b43f31d6e/baseline_a2dd837e-2030-4f0b-95fe-4f4b43f31d6e_sunny_1761048415008.jpg', 0.5, '2025-01-01 00:09:22.6', '2025-01-01 00:09:38.7', 100000006, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048547/inspections/100000006/100000006_sunny_1761048541684.jpg', 109, 'ORB_RANSAC', TRUE, 5),
('96fbc04c-add9-47de-90c8-937b89e0e9e0', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048934/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_sunny_1761048933037.png', 0.5, '2025-01-01 00:16:22.6', '2025-01-01 00:16:22.6', 100000010, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048969/inspections/100000010/100000010_sunny_1761048968360.png', 42, 'ORB_RANSAC', TRUE, 5),
('d433cc3b-d91d-4f55-b26c-82da674197cc', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048934/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_sunny_1761048933037.png', 0.5, '2025-01-01 00:17:50.5', '2025-01-01 00:17:50.5', 100000012, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049057/inspections/100000012/100000012_sunny_1761049055754.png', 18, 'ORB_RANSAC', TRUE, 5),
('e420895b-6633-4f7d-8e91-2c6b3d5762d0', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761048934/transformers/baseline/9ccdd6c3-3381-49ef-9b75-8c0dec91a34a/baseline_9ccdd6c3-3381-49ef-9b75-8c0dec91a34a_sunny_1761048933037.png', 0.5, '2025-01-01 00:17:09.5', '2025-01-01 00:17:09.5', 100000011, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761049016/inspections/100000011/100000011_sunny_1761049013762.png', 35, 'ORB_RANSAC', TRUE, 5),
('f788d4eb-5ffb-4c33-833c-f6d4e0bf84d8', 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761047774/transformers/baseline/de72eb41-12c3-43a4-9031-c2911cb986aa/baseline_de72eb41-12c3-43a4-9031-c2911cb986aa_sunny_1761047771040.jpg', 0.5, '2025-01-01 00:58:42.6', '2025-01-01 00:58:42.6', 100000001, 1, 'https://res.cloudinary.com/dxqmzslkb/image/upload/v1761047874/inspections/100000001/100000001_sunny_1761047870358.jpg', 70, 'ORB_RANSAC', TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- Note: PostgreSQL UUID generation doesn't require sequence management
-- UUIDs are handled by GenerationType.UUID in the entity

-- Verification query
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT inspection_id) as unique_inspections,
    registration_method,
    COUNT(*) as count_by_method,
    ROUND(AVG(registration_inliers)::numeric, 2) as avg_inliers,
    ROUND(AVG(conf_thresh)::numeric, 2) as avg_conf_thresh
FROM inference_metadata 
GROUP BY registration_method
ORDER BY count_by_method DESC;