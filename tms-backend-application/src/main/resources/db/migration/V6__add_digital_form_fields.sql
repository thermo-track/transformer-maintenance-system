-- Add digital form fields to inspections table
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspected_by VARCHAR(255);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS baseline_right VARCHAR(255);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS baseline_left VARCHAR(255);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS baseline_front VARCHAR(255);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS last_month_kva VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS last_month_date VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS last_month_time VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS current_month_kva VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS meter_serial VARCHAR(255);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS meter_ct_ratio VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS meter_make VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS after_thermal_date VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS after_thermal_time VARCHAR(50);

-- Add voltage and current reading columns
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

-- Checklist data stored as JSON
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS digital_form_data TEXT;
