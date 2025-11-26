-- Add Work Data Sheet fields to inspections table (not digital_forms)

-- Time & Supervision Section
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS start_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS completion_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS supervised_by VARCHAR(100);

-- Gang Composition Section
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS tech_i VARCHAR(100),
ADD COLUMN IF NOT EXISTS tech_ii VARCHAR(100),
ADD COLUMN IF NOT EXISTS tech_iii VARCHAR(100),
ADD COLUMN IF NOT EXISTS helpers VARCHAR(100);

-- Inspection & Rectification Log Section
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS inspected_by_wds VARCHAR(100),
ADD COLUMN IF NOT EXISTS inspected_date VARCHAR(20),
ADD COLUMN IF NOT EXISTS rectified_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS rectified_date VARCHAR(20),
ADD COLUMN IF NOT EXISTS re_inspected_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS re_inspected_date VARCHAR(20),
ADD COLUMN IF NOT EXISTS css_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS css_date VARCHAR(20);

-- Final Verification Section
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS final_css_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS final_css_date VARCHAR(20);
