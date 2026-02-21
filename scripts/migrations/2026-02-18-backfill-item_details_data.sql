-- Backfill migration: populate item_details_data for existing catalog items
-- This script conditionally reads legacy flat columns (if present) and merges
-- their values into the jsonb `item_details_data` column under
-- `specifications`, `customizationOptions`, and `whyChoose` keys.

BEGIN;

DO $$
BEGIN
  -- Backfill structured specifications from legacy spec_* columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_entities' AND column_name = 'spec_material'
  ) THEN
    UPDATE catalog_entities
    SET item_details_data = COALESCE(item_details_data, '{}'::jsonb) || jsonb_build_object(
      'specifications', jsonb_build_object(
        'material', COALESCE(spec_material::text, ''),
        'printingTechnology', COALESCE(spec_printingTechnology::text, ''),
        'finish', COALESCE(spec_finish::text, ''),
        'base', COALESCE(spec_base::text, ''),
        'textEngraving', COALESCE(spec_textEngraving::text, ''),
        'size', COALESCE(spec_size::text, ''),
        'weight', COALESCE(spec_weight::text, '')
      )
    )
    WHERE type = 'Item'
      AND (item_details_data IS NULL OR NOT (item_details_data ? 'specifications'))
      AND (
        spec_material IS NOT NULL OR spec_printingTechnology IS NOT NULL OR spec_finish IS NOT NULL
        OR spec_base IS NOT NULL OR spec_textEngraving IS NOT NULL OR spec_size IS NOT NULL OR spec_weight IS NOT NULL
      );
  END IF;

  -- Backfill customization options from legacy boolean flags if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_entities' AND column_name = 'custom_names'
  ) THEN
    UPDATE catalog_entities
    SET item_details_data = COALESCE(item_details_data, '{}'::jsonb) || jsonb_build_object(
      'customizationOptions', jsonb_build_object(
        'customNames', COALESCE(custom_names, false),
        'changeOutfits', COALESCE(change_outfits, false),
        'modifyHairstyles', COALESCE(modify_hairstyles, false),
        'extraMembers', COALESCE(extra_members, false),
        'personalMessage', COALESCE(personal_message, false)
      )
    )
    WHERE type = 'Item'
      AND (item_details_data IS NULL OR NOT (item_details_data ? 'customizationOptions'))
      AND (
        custom_names IS NOT NULL OR change_outfits IS NOT NULL OR modify_hairstyles IS NOT NULL
        OR extra_members IS NOT NULL OR personal_message IS NOT NULL
      );
  END IF;

  -- Backfill marketing / why-choose short text if a legacy column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_entities' AND column_name = 'why_choose'
  ) THEN
    UPDATE catalog_entities
    SET item_details_data = COALESCE(item_details_data, '{}'::jsonb) || jsonb_build_object(
      'whyChoose', COALESCE(why_choose::text, '')
    )
    WHERE type = 'Item'
      AND (item_details_data IS NULL OR NOT (item_details_data ? 'whyChoose'))
      AND why_choose IS NOT NULL;
  END IF;
END
$$;

COMMIT;

-- Notes:
-- - This migration is intentionally defensive: it only touches columns if they exist
--   in the current database schema to avoid errors on deployments where legacy
--   columns were never present.
-- - The script merges into existing `item_details_data` rather than replacing it.
-- - Review the rows updated after running and remove or adjust keys as needed.
