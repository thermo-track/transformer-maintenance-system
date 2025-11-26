-- Verify if columns exist and add them if missing
-- Run this in your PostgreSQL database

-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'inspections' 
  AND column_name IN (
    'first_voltage_r', 'first_voltage_y', 'first_voltage_b',
    'first_current_r', 'first_current_y', 'first_current_b',
    'second_voltage_r', 'second_voltage_y', 'second_voltage_b',
    'second_current_r', 'second_current_y', 'second_current_b'
  )
ORDER BY column_name;

-- Add missing columns (IF NOT EXISTS will prevent errors if columns already exist)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_voltage_r VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_voltage_y VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_voltage_b VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_current_r VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_current_y VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_current_b VARCHAR(50);

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_voltage_r VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_voltage_y VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_voltage_b VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_current_r VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_current_y VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS second_current_b VARCHAR(50);

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'inspections' 
  AND column_name IN (
    'first_voltage_r', 'first_voltage_y', 'first_voltage_b',
    'first_current_r', 'first_current_y', 'first_current_b',
    'second_voltage_r', 'second_voltage_y', 'second_voltage_b',
    'second_current_r', 'second_current_y', 'second_current_b'
  )
ORDER BY column_name;
