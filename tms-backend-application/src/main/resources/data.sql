-- ============================================================-- ============================================================

-- Master Data SQL - REFERENCE ONLY-- Master Data SQL - Imports all table data files in order

-- ============================================================-- ============================================================

-- This file is NOT executed by Spring Boot.-- This file orchestrates the loading of all seed data in the correct order

-- -- respecting foreign key dependencies.

-- Spring Boot loads seed data from the following files in order:--

--   1. db/data/01_transformers.sql-- Execution order:

--   2. db/data/02_transformer_images.sql-- 1. Transformers (parent table) -> db/data/01_transformers.sql

--   3. db/data/03_inspections.sql-- 2. Transformer Images (depends on Transformers) -> db/data/02_transformer_images.sql

--   4. db/data/99_verification.sql-- 3. Inspections (depends on Transformers) -> db/data/03_inspections.sql

---- 4. Verification queries -> db/data/99_verification.sql

-- Configuration: See application.properties--

--   spring.sql.init.data-locations=classpath:db/data/01_transformers.sql,...-- Note: Spring Boot does not support \i (psql meta-commands) in SQL init scripts.

---- Therefore, all SQL is included directly below instead of using file imports.

-- To modify seed data, edit the individual files in db/data/-- For manual psql execution, see db/data/README.md

-- See db/data/README.md for complete documentation-- ============================================================

-- ============================================================
