import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (key === '--input' && value) {
      out.input = value;
      index += 1;
    } else if (key === '--dry-run') {
      out.dryRun = true;
    }
  }

  return out;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 24);

const buildLookupCode = (name, index) => {
  const base = slugify(name) || 'item';
  return `SCRAPE-${base}-${Date.now()}-${index + 1}`;
};

const assertEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.SCRAPER_USER_ID;

  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL)');
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  if (!userId) throw new Error('Missing SCRAPER_USER_ID');

  return { supabaseUrl, serviceKey, userId };
};

const tryReadEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.SCRAPER_USER_ID;
  return {
    supabaseUrl: supabaseUrl || null,
    serviceKey: serviceKey || null,
    userId: userId || null
  };
};

const normalizeProduct = (row, userId, index) => {
  const rowDetails = row.item_details_data || {};
  const imageUrls = Array.isArray(row.image_urls)
    ? row.image_urls.map((url) => String(url || '').trim()).filter(Boolean)
    : [];
  const primaryImage = String(row.image_url || '').trim() || imageUrls[0] || null;
  const additionalImages = [
    ...new Set(
      [
        ...imageUrls,
        ...(Array.isArray(rowDetails.additionalImages) ? rowDetails.additionalImages : [])
      ]
        .map((url) => String(url || '').trim())
        .filter((url) => url && url !== primaryImage)
    )
  ];

  return {
    user_id: userId,
    name: String(row.name || '').trim(),
    lookup_code: row.lookup_code || buildLookupCode(row.name || 'item', index),
    description: row.description || '',
    type: 'Item',
    parent_id: row.parent_id || null,
    item_details_data: {
      ...rowDetails,
      additionalImages
    },
    printing_time: Number.parseInt(row.printing_time, 10) || 24,
    original_price: Number.parseFloat(row.original_price) || 0,
    discount_price: row.discount_price != null ? Number.parseFloat(row.discount_price) : 0,
    stock_quantity: Number.parseInt(row.stock_quantity, 10) || 0,
    reserved_quantity: 0,
    is_active: row.is_active !== false,
    image_url: primaryImage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

const main = async () => {
  const args = parseArgs();
  const inputPath = args.input
    ? path.resolve(args.input)
    : path.join(__dirname, 'scraped-products.json');

  const raw = await fs.readFile(inputPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Input JSON must be an array of products');
  }

  const env = tryReadEnv();

  if (args.dryRun && (!env.supabaseUrl || !env.serviceKey || !env.userId)) {
    const localCandidates = parsed.filter((row) => String(row.name || '').trim());
    console.log(`Input products: ${parsed.length}`);
    console.log(`Products locally valid for insert: ${localCandidates.length}`);
    console.log('Dry run complete (local mode).');
    console.log('DB dedupe was skipped because SUPABASE_SERVICE_ROLE_KEY / SCRAPER_USER_ID is not set.');
    return;
  }

  const { supabaseUrl, serviceKey, userId } = assertEnv();
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const names = parsed
    .map((row) => String(row.name || '').trim())
    .filter(Boolean);

  const { data: existingRows, error: existingError } = await supabase
    .from('catalog_entities')
    .select('name')
    .eq('user_id', userId)
    .eq('type', 'Item')
    .in('name', names);

  if (existingError) throw existingError;

  const existingSet = new Set((existingRows || []).map((row) => row.name.trim().toLowerCase()));

  const candidates = parsed
    .filter((row) => String(row.name || '').trim())
    .map((row, index) => normalizeProduct(row, userId, index));

  const finalRows = candidates.filter((row) => !existingSet.has(row.name.toLowerCase()));

  console.log(`Input products: ${parsed.length}`);
  console.log(`Existing products skipped: ${candidates.length - finalRows.length}`);
  console.log(`Products ready to insert: ${finalRows.length}`);

  if (args.dryRun) {
    console.log('Dry run complete. No DB rows inserted.');
    return;
  }

  if (finalRows.length === 0) {
    console.log('No new products to insert.');
    return;
  }

  const { error: insertError } = await supabase
    .from('catalog_entities')
    .insert(finalRows);

  if (insertError) throw insertError;

  console.log(`Inserted ${finalRows.length} products successfully.`);
};

main().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
