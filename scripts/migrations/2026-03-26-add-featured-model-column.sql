-- Add a first-class boolean flag for "Featured Models" on catalog rows.
ALTER TABLE public.catalog_entities
ADD COLUMN IF NOT EXISTS featured_model boolean;

-- Backfill from legacy JSON flag (item_details_data.featuredModel) when present.
UPDATE public.catalog_entities
SET featured_model = CASE
  WHEN lower(coalesce(item_details_data ->> 'featuredModel', '')) IN ('true', 't', '1', 'yes') THEN true
  ELSE false
END
WHERE featured_model IS NULL;

-- Enforce predictable behavior for new and existing records.
ALTER TABLE public.catalog_entities
ALTER COLUMN featured_model SET DEFAULT false;

UPDATE public.catalog_entities
SET featured_model = false
WHERE featured_model IS NULL;

ALTER TABLE public.catalog_entities
ALTER COLUMN featured_model SET NOT NULL;
