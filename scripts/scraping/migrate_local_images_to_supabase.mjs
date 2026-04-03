import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {
    dryRun: false,
    bucket: 'NirmanHub',
    limit: 0
  };

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--dry-run') {
      out.dryRun = true;
    } else if (key === '--bucket' && value) {
      out.bucket = value;
      i += 1;
    } else if (key === '--limit' && value) {
      out.limit = Number.parseInt(value, 10) || 0;
      i += 1;
    }
  }

  return out;
};

const getEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL)');
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  return { supabaseUrl, serviceKey };
};

const isLocalAssetRef = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  return /^\/?NirmanHub\/Products\//i.test(text)
    || /^\/?Products\//i.test(text);
};

const normalizeAssetPath = (value) => {
  const text = String(value || '').trim().replace(/\\/g, '/');
  if (!text) return null;

  let normalized = text;
  normalized = normalized.replace(/^https?:\/\/[^/]+/i, '');
  normalized = normalized.replace(/^\/+/, '/');

  if (/^\/NirmanHub\/Products\//i.test(normalized)) {
    normalized = normalized.replace(/^\/NirmanHub/i, '');
  } else if (/^NirmanHub\/Products\//i.test(normalized)) {
    normalized = `/${normalized.replace(/^NirmanHub/i, '')}`;
  } else if (/^Products\//i.test(normalized)) {
    normalized = `/${normalized}`;
  }

  if (!/^\/Products\//i.test(normalized)) return null;

  return normalized;
};

const toPublicFilePath = (normalizedAssetPath) => {
  const relative = normalizedAssetPath.replace(/^\/+/, '');
  return path.resolve(process.cwd(), 'public', relative);
};

const toStorageObjectPath = (normalizedAssetPath) =>
  normalizedAssetPath.replace(/^\/+/, '');

const mapPathToPublicUrl = (supabase, bucket, normalizedAssetPath) => {
  const objectPath = toStorageObjectPath(normalizedAssetPath);
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || null;
};

const uploadLocalFile = async (supabase, bucket, normalizedAssetPath) => {
  const localPath = toPublicFilePath(normalizedAssetPath);
  const objectPath = toStorageObjectPath(normalizedAssetPath);
  const content = await fs.readFile(localPath);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, content, { upsert: true });

  if (error) throw error;

  return objectPath;
};

const dedupe = (arr) => [...new Set(arr.filter(Boolean))];

const migrateOneRow = async ({ row, supabase, bucket, dryRun }) => {
  const rowImages = [];
  const primary = String(row.image_url || '').trim();
  if (isLocalAssetRef(primary)) {
    rowImages.push({ kind: 'primary', value: primary });
  }

  const additionalImages = Array.isArray(row.item_details_data?.additionalImages)
    ? row.item_details_data.additionalImages
    : [];

  additionalImages.forEach((image) => {
    if (isLocalAssetRef(image)) {
      rowImages.push({ kind: 'additional', value: image });
    }
  });

  if (rowImages.length === 0) {
    return { updated: false, migratedCount: 0, skippedCount: 0 };
  }

  const migratedMap = new Map();
  let migratedCount = 0;
  let skippedCount = 0;

  for (const imageRef of rowImages) {
    const normalizedAssetPath = normalizeAssetPath(imageRef.value);
    if (!normalizedAssetPath) {
      skippedCount += 1;
      continue;
    }

    const localFilePath = toPublicFilePath(normalizedAssetPath);
    try {
      await fs.access(localFilePath);
    } catch {
      skippedCount += 1;
      continue;
    }

    if (!dryRun) {
      await uploadLocalFile(supabase, bucket, normalizedAssetPath);
    }

    const publicUrl = mapPathToPublicUrl(supabase, bucket, normalizedAssetPath);
    if (!publicUrl) {
      skippedCount += 1;
      continue;
    }

    migratedMap.set(imageRef.value, publicUrl);
    migratedCount += 1;
  }

  if (migratedMap.size === 0) {
    return { updated: false, migratedCount, skippedCount };
  }

  const nextPrimary = migratedMap.get(primary) || primary;
  const nextAdditional = dedupe(
    additionalImages.map((image) => migratedMap.get(image) || image)
  );

  if (dryRun) {
    return { updated: true, migratedCount, skippedCount };
  }

  const { error } = await supabase
    .from('catalog_entities')
    .update({
      image_url: nextPrimary,
      item_details_data: {
        ...(row.item_details_data || {}),
        additionalImages: nextAdditional
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', row.id);

  if (error) throw error;

  return { updated: true, migratedCount, skippedCount };
};

const main = async () => {
  const args = parseArgs();
  const { supabaseUrl, serviceKey } = getEnv();
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('catalog_entities')
    .select('id,name,type,image_url,item_details_data')
    .eq('type', 'Item')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const candidateRows = rows.filter((row) => {
    const primary = isLocalAssetRef(row.image_url);
    const additional = Array.isArray(row.item_details_data?.additionalImages)
      && row.item_details_data.additionalImages.some((image) => isLocalAssetRef(image));
    return primary || additional;
  });

  const toProcess = args.limit > 0 ? candidateRows.slice(0, args.limit) : candidateRows;

  let updatedRows = 0;
  let migratedImages = 0;
  let skippedImages = 0;

  for (const row of toProcess) {
    try {
      const result = await migrateOneRow({
        row,
        supabase,
        bucket: args.bucket,
        dryRun: args.dryRun
      });
      if (result.updated) updatedRows += 1;
      migratedImages += result.migratedCount;
      skippedImages += result.skippedCount;
    } catch (rowError) {
      skippedImages += 1;
      console.error(`Row ${row.id} (${row.name}): ${rowError.message}`);
    }
  }

  console.log(`Mode: ${args.dryRun ? 'dry-run' : 'apply'}`);
  console.log(`Bucket: ${args.bucket}`);
  console.log(`Total item rows scanned: ${rows.length}`);
  console.log(`Candidate rows with local images: ${candidateRows.length}`);
  console.log(`Rows processed: ${toProcess.length}`);
  console.log(`Rows updated: ${updatedRows}`);
  console.log(`Image refs migrated: ${migratedImages}`);
  console.log(`Image refs skipped: ${skippedImages}`);
};

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
