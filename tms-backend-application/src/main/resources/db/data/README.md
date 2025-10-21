# Database Seed Data Files

This directory contains seed data for the Transformer Maintenance System database, organized by table for better maintainability.

## File Structure

```
db/data/
├── 01_transformers.sql         # Core transformer equipment records
├── 02_transformer_images.sql   # Baseline thermal images for transformers
├── 03_inspections.sql          # Maintenance inspection records
└── 99_verification.sql         # Verification queries and documentation
```

## Execution Order

The files are numbered to indicate the correct execution order, respecting foreign key dependencies:

1. **01_transformers.sql** - Must be loaded first as it's the parent table
2. **02_transformer_images.sql** - Depends on transformers (foreign key: transformer_id)
3. **03_inspections.sql** - Depends on transformers (foreign key: transformer_no)
4. **99_verification.sql** - Verification queries and table documentation

## Usage

### Via Spring Boot (Automatic)

The main `data.sql` file in the `src/main/resources` directory contains all the SQL from these files merged together. Spring Boot will automatically execute it on startup when configured with:

```properties
spring.sql.init.mode=always
```

### Via psql (Manual)

To execute the files manually using psql:

```bash
# Execute all files in order
psql -U username -d database_name -f 01_transformers.sql
psql -U username -d database_name -f 02_transformer_images.sql
psql -U username -d database_name -f 03_inspections.sql
psql -U username -d database_name -f 99_verification.sql
```

Or execute them all at once using a master script:

```bash
for file in *.sql; do
    psql -U username -d database_name -f "$file"
done
```

## File Details

### 01_transformers.sql
- Inserts 5 transformer records (TX-001 through TX-005)
- Creates performance indexes on `transformer_no` and `region`
- Uses `ON CONFLICT DO NOTHING` to prevent duplicate key errors

### 02_transformer_images.sql
- Inserts 15 baseline thermal images (3 per transformer: sunny, cloudy, rainy)
- Creates indexes on `transformer_id` and `weather_condition`
- Uses unique constraint `ux_transformer_weather` to prevent duplicate weather conditions per transformer

### 03_inspections.sql
- Inserts 15 inspection records across all transformers
- Creates indexes on `transformer_no`, `status`, and `inspection_timestamp`
- Synchronizes the `inspection_id_sequence` with existing data
- Uses `ON CONFLICT DO NOTHING` on `inspection_id` to prevent duplicates

### 99_verification.sql
- Contains queries to verify foreign key relationships
- Adds table documentation comments for:
  - `inference_metadata` table
  - `inspection_anomalies` table

## Adding New Data

To add new seed data:

1. Identify which table the data belongs to
2. Edit the appropriate `0X_tablename.sql` file
3. Add your INSERT statements using the same conflict handling pattern:
   ```sql
   INSERT INTO table_name (columns...) 
   VALUES (values...)
   ON CONFLICT (...) DO NOTHING;
   ```
4. Update the main `data.sql` file if needed (it contains a merged copy)

## Conflict Handling

All INSERT statements use conflict handling to make them idempotent:

- **Transformers**: `ON CONFLICT (id) DO NOTHING`
- **Transformer Images**: `ON CONFLICT ON CONSTRAINT ux_transformer_weather DO NOTHING`
- **Inspections**: `ON CONFLICT (inspection_id) DO NOTHING`

This ensures the scripts can be run multiple times without errors, which is useful for:
- Development database resets
- Testing environments
- CI/CD pipelines
- Kubernetes persistent volumes (data survives pod restarts)

## Performance Indexes

Each file creates its own performance indexes to optimize common queries:

- Transformers: `transformer_no`, `region`
- Transformer Images: `transformer_id`, `weather_condition`
- Inspections: `transformer_no`, `status`, `inspection_timestamp`

All index creation uses `IF NOT EXISTS` to prevent errors on re-execution.

## Notes

- All timestamps use `NOW()` function to get current time on insertion
- UUIDs are pre-generated as strings (VARCHAR) in the transformer IDs
- The `inspection_id_sequence` is automatically synchronized after inserting inspections
- Verification queries can be run separately to check data integrity
