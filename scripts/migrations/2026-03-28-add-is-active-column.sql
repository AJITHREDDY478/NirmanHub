-- Add a first-class boolean flag for product active/inactive status.
ALTER TABLE public.catalog_entities
ADD COLUMN IF NOT EXISTS is_active boolean;

-- Backfill from legacy JSON flags when present on product rows.
-- Supported keys: item_details_data.is_active, item_details_data.isActive
UPDATE public.catalog_entities
SET is_active = CASE
  WHEN lower(
    coalesce(
      item_details_data ->> 'is_active',
      item_details_data ->> 'isActive',
      ''
    )
  ) IN ('false', 'f', '0', 'no', 'n', 'off') THEN false
  WHEN lower(
    coalesce(
      item_details_data ->> 'is_active',
      item_details_data ->> 'isActive',
      ''
    )
  ) IN ('true', 't', '1', 'yes', 'y', 'on') THEN true
  ELSE true
END
WHERE type = 'Item'
  AND is_active IS NULL;

-- Enforce predictable behavior for new and existing records.
ALTER TABLE public.catalog_entities
ALTER COLUMN is_active SET DEFAULT true;

UPDATE public.catalog_entities
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE public.catalog_entities
ALTER COLUMN is_active SET NOT NULL;
