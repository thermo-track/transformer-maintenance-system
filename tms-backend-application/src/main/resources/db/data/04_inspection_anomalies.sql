-- Insert inspection anomalies data
-- ON CONFLICT DO NOTHING makes this idempotent (safe to run multiple times)
INSERT INTO inspection_anomalies (
    id,
    area_px,
    bbox_height,
    bbox_width,
    bbox_x,
    bbox_y,
    centroid_x,
    centroid_y,
    class_id,
    created_at,
    detected_at,
    fault_confidence,
    fault_type,
    inspection_id,
    source,
    is_active,
    created_by
) VALUES
(12, 651160, 584, 1115, 552, 778, 1109.5, 1070, 0, '2025-01-01 00:58:42.6', '2025-01-01 00:58:42.6', 0.580114, 'Full wire overload', 100000001, 'AI_GENERATED', true, 'system'),
(13, 148050, 315, 470, 668, 245, 903, 402.5, 3, '2025-01-01 00:00:37.3', '2025-01-01 00:00:37.3', 0.838216, 'Point Overload - Faulty', 100000003, 'AI_GENERATED', true, 'system'),
(14, 148050, 315, 470, 668, 245, 903, 402.5, 3, '2025-01-01 00:02:19.0', '2025-01-01 00:02:19.0', 0.838216, 'Point Overload - Faulty', 100000002, 'AI_GENERATED', true, 'system'),
(15, 46652, 218, 214, 950, 299, 1057, 408, 1, '2025-01-01 00:08:09.4', '2025-01-01 00:08:09.4', 0.61924, 'Loose Joint -Faulty', 100000004, 'AI_GENERATED', true, 'system'),
(16, 125280, 290, 432, 732, 1143, 948, 1288, 4, '2025-01-01 00:10:39.9', '2025-01-01 00:10:39.9', 0.812935, 'normal', 100000005, 'AI_GENERATED', true, 'system'),
(17, 103230, 310, 333, 432, 735, 598.5, 890, 4, '2025-01-01 00:10:40.0', '2025-01-01 00:10:40.0', 0.763932, 'normal', 100000005, 'AI_GENERATED', true, 'system'),
(18, 75429, 261, 289, 1857, 776, 2001.5, 906.5, 4, '2025-01-01 00:10:40.1', '2025-01-01 00:10:40.1', 0.610598, 'normal', 100000005, 'AI_GENERATED', true, 'system'),
(19, 54488, 278, 196, 1263, 765, 1361, 904, 4, '2025-01-01 00:10:40.1', '2025-01-01 00:10:40.1', 0.544236, 'normal', 100000005, 'AI_GENERATED', true, 'system'),
(20, 103161, 251, 411, 107, 88, 312.5, 213.5, 1, '2025-01-01 00:12:43.2', '2025-01-01 00:12:43.2', 0.84828, 'Loose Joint -Faulty', 100000007, 'AI_GENERATED', true, 'system'),
(21, 102090, 249, 410, 106, 90, 311, 214.5, 1, '2025-01-01 00:13:18.3', '2025-01-01 00:13:18.3', 0.782227, 'Loose Joint -Faulty', 100000009, 'AI_GENERATED', true, 'system'),
(22, 103161, 251, 411, 107, 88, 312.5, 213.5, 1, '2025-01-01 00:14:50.0', '2025-01-01 00:14:50.0', 0.84828, 'Loose Joint -Faulty', 100000008, 'AI_GENERATED', true, 'system'),
(23, 4368, 91, 48, 140, 75, 164, 120.5, 4, '2025-01-01 00:16:22.6', '2025-01-01 00:16:22.6',  0.889113, 'normal', 100000010, 'AI_GENERATED', true, 'system'),
(24, 4324, 92, 47, 89, 76, 112.5, 122, 4, '2025-01-01 00:16:22.6', '2025-01-01 00:16:22.6',  0.888318, 'normal', 100000010, 'AI_GENERATED', true, 'system'),
(25, 4508, 92, 49, 36, 77, 60.5, 123, 1, '2025-01-01 00:16:22.6', '2025-01-01 00:16:22.6',  0.779223, 'Loose Joint -Faulty', 100000010, 'AI_GENERATED', true, 'system'),
(26, 17100, 180, 95, 272, 149, 319.5, 239, 4, '2025-01-01 00:17:09.5', '2025-01-01 00:17:09.5',  0.878304, 'normal', 100000011, 'AI_GENERATED', true, 'system'),
(27, 19897, 197, 101, 65, 139, 115.5, 237.5, 1, '2025-01-01 00:17:09.6', '2025-01-01 00:17:09.6', 0.662108, 'Loose Joint -Faulty', 100000011, 'AI_GENERATED', true, 'system'),
(28, 4700, 94, 50, 140, 77, 165, 124, 4, '2025-01-01 00:17:50.5', '2025-01-01 00:17:50.5', 0.888976, 'normal', 100000012, 'AI_GENERATED', true, 'system'),
(29, 5880, 120, 49, 88, 51, 112.5, 111, 1, '2025-01-01 00:17:50.5', '2025-01-01 00:17:50.5',  0.645268, 'Loose Joint -Faulty', 100000012, 'AI_GENERATED', true, 'system'),
(30, 6188, 119, 52, 33, 54, 59, 113.5, 1, '2025-01-01 00:17:50.5', '2025-01-01 00:17:50.5',  0.626095, 'Loose Joint -Faulty', 100000012, 'AI_GENERATED', true, 'system'),
(31, 13515, 159, 85, 1166, 639, 1208.5, 718.5, 1, '2025-01-01 00:21:51.6', '2025-01-01 00:21:51.6',  0.568875, 'Loose Joint -Faulty', 100000013, 'AI_GENERATED', true, 'system'),
(32, 13515, 159, 85, 1166, 639, 1208.5, 718.5, 1, '2025-01-01 00:22:42.9', '2025-01-01 00:22:42.9', 0.568875, 'Loose Joint -Faulty', 100000014, 'AI_GENERATED', true, 'system'),
(33, 13515, 159, 85, 1166, 639, 1208.5, 718.5, 1, '2025-01-01 00:23:29.0', '2025-01-01 00:23:29.0', 0.568875, 'Loose Joint -Faulty', 100000015, 'AI_GENERATED', true, 'system')
ON CONFLICT (id) DO UPDATE SET
    source = EXCLUDED.source,
    is_active = EXCLUDED.is_active,
    created_by = EXCLUDED.created_by;

-- Ensure the inspection_anomalies sequence is in sync with the current data to avoid
-- duplicate key errors when the DB already contains anomaly rows (eg. persistent volumes).
SELECT setval('inspection_anomalies_id_seq', COALESCE((SELECT MAX(id) FROM inspection_anomalies), 0), true);

-- Verification query
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT inspection_id) as unique_inspections,
    fault_type,
    COUNT(*) as count_by_fault_type,
    ROUND(AVG(fault_confidence)::numeric, 3) as avg_confidence
FROM inspection_anomalies 
GROUP BY fault_type
ORDER BY count_by_fault_type DESC;