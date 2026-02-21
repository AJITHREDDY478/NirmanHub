Backfill migration: populate `item_details_data`
===============================================

This folder contains a defensive SQL migration to populate the `item_details_data`
jsonb column for existing rows in the `catalog_entities` table using legacy
flat columns (if present) such as `spec_material`, `custom_names`, `why_choose`, etc.

How to run
----------

1) Run via psql (direct connection)

   Replace the connection URL with your database credentials.

```bash
psql "postgresql://<DB_USER>:<DB_PASS>@<DB_HOST>:<DB_PORT>/<DB_NAME>" \
  -f "scripts/migrations/2026-02-18-backfill-item_details_data.sql"
```

2) Run via Supabase SQL editor

   - Open your project in the Supabase dashboard.
   - Go to "SQL Editor" → "New query".
   - Paste the contents of `2026-02-18-backfill-item_details_data.sql` and run.

3) Run via supabase CLI (if available)

   The CLI can execute SQL against your project if configured. Example:

```bash
supabase db query --file scripts/migrations/2026-02-18-backfill-item_details_data.sql
```

Verification
------------

After running, verify a few rows were updated:

```sql
SELECT id, item_details_data
FROM catalog_entities
WHERE type = 'Item' AND (item_details_data ? 'specifications' OR item_details_data ? 'customizationOptions' OR item_details_data ? 'whyChoose')
LIMIT 20;
```

Notes / Safety
--------------
- The migration only updates rows if the legacy columns exist in the schema,
  so it's safe to apply across environments with different schemas.
- The script merges into existing `item_details_data` using the `||` operator.
- Make a DB backup or run in a transaction on a staging DB before production.

If you want, I can also add a small Node script that runs this file using the
`pg` client and your DATABASE_URL (only if you provide credentials or run it
locally). For safety I did not execute the migration from this environment.
