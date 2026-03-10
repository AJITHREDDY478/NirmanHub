/**
 * scrape_noveltyboy.mjs
 * Scrapes products from noveltyboy.com using the Shopify JSON API.
 * Outputs a JSON file compatible with import_scraped_products.mjs.
 *
 * Usage:
 *   node scrape_noveltyboy.mjs
 *   node scrape_noveltyboy.mjs --collection religious --output noveltyboy-religious-products.json
 *   node scrape_noveltyboy.mjs --collection all --output noveltyboy-all-products.json --dry-run
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.noveltyboy.com';

// ── CLI args ──────────────────────────────────────────────────────────────────
const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {
    collection: 'religious',
    output: null,
    dryRun: false,
    concurrency: 4,
  };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--collection' && val) { out.collection = val; i += 1; }
    else if (key === '--output' && val) { out.output = val; i += 1; }
    else if (key === '--concurrency' && val) { out.concurrency = Number(val) || 4; i += 1; }
    else if (key === '--dry-run') { out.dryRun = true; }
  }
  return out;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const clean = (value, fallback = '') => {
  if (value == null) return fallback;
  return String(value).replace(/\s+/g, ' ').trim() || fallback;
};

const stripHtml = (html) => {
  if (!html) return '';
  const $ = cheerio.load(html);
  return clean($('body').text());
};

const parsePrice = (value) => {
  if (!value) return 0;
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch with simple retry (up to 3 attempts). */
const fetchWithRetry = async (url, options = {}, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.warn(`  Retry ${attempt}/${attempts - 1} for ${url}: ${err.message}`);
      await sleep(1000 * attempt);
    }
  }
};

// ── Shopify product page detail enrichment ────────────────────────────────────
const enrichProductPage = async (productHandle) => {
  const productUrl = `${BASE_URL}/products/${productHandle}`;
  const jsonUrl = `${BASE_URL}/products/${productHandle}.json`;

  try {
    const res = await fetchWithRetry(jsonUrl);
    const data = await res.json();
    const p = data?.product;
    if (!p) return null;

    // Parse description from body_html
    const description = stripHtml(p.body_html);

    // All full-resolution CDN images
    const images = (p.images || [])
      .map((img) => clean(img.src))
      .filter(Boolean);

    // Variant info
    const primaryVariant = p.variants?.[0] || {};
    const price = parsePrice(primaryVariant.price);
    const compareAtPrice = primaryVariant.compare_at_price
      ? parsePrice(primaryVariant.compare_at_price)
      : null;
    const sku = clean(primaryVariant.sku, null) || null;
    const available = primaryVariant.available !== false;

    return {
      description,
      price,
      compareAtPrice,
      sku,
      available,
      images,
      productUrl,
      productType: clean(p.product_type, null) || null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      vendor: clean(p.vendor, null),
    };
  } catch (err) {
    console.warn(`  Could not enrich ${productHandle}: ${err.message}`);
    return null;
  }
};

// ── Fetch all collection products via Shopify API (with pagination) ───────────
const fetchCollectionProducts = async (collection) => {
  const allProducts = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/collections/${collection}/products.json?limit=250&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);

    const res = await fetchWithRetry(url);
    const data = await res.json();
    const batch = data?.products || [];

    if (batch.length === 0) break;
    allProducts.push(...batch);
    console.log(`  Got ${batch.length} products (total so far: ${allProducts.length})`);

    if (batch.length < 250) break; // last page
    page += 1;
    await sleep(300); // be polite
  }

  return allProducts;
};

// ── Map a Shopify product + enriched detail to our product format ──────────────
const mapProduct = (shopifyProduct, detail, collection) => {
  const title = clean(shopifyProduct.title);
  const handle = shopifyProduct.handle;
  const primaryVariant = shopifyProduct.variants?.[0] || {};

  const price = detail?.price ?? parsePrice(primaryVariant.price);
  const compareAtPrice = detail?.compareAtPrice ?? null;
  const sku = detail?.sku ?? clean(primaryVariant.sku, null) ?? null;
  const available = detail?.available ?? (primaryVariant.available !== false);
  const tags = detail?.tags ?? [];
  const productType = detail?.productType ?? null;
  const vendor = detail?.vendor ?? 'Novelty Boy';
  const productUrl = detail?.productUrl ?? `${BASE_URL}/products/${handle}`;

  // Images — use detail's full-resolution images if available, else fallback to list API
  const detailImages = detail?.images ?? [];
  const listImages = (shopifyProduct.images || []).map((img) => clean(img.src)).filter(Boolean);
  const allImages = detailImages.length > 0 ? detailImages : listImages;

  const primaryImage = allImages[0] || null;
  const additionalImages = allImages.slice(1);

  // Description — use enriched, else strip from list API body (if any)
  const description = clean(
    detail?.description || stripHtml(shopifyProduct.body_html),
    `${title} – imported from Novelty Boy collection.`
  );

  return {
    name: title,
    original_price: price,
    discount_price: compareAtPrice,
    description,
    image_url: primaryImage,
    source_url: productUrl,
    item_details_data: {
      department: 'Name Boards',
      subcategory: 'Novelty Boy Imported',
      category: 'Religious',
      emoji: '🙏',
      scrapedFrom: `${BASE_URL}/collections/${collection}`,
      additionalImages,
      currency: 'INR',
      availability: available ? 'In stock' : 'Out of stock',
      sku,
      brand: vendor,
      productType,
      tags,
      sourceCanonicalUrl: productUrl,
      shopifyProductId: shopifyProduct.id,
    },
    stock_quantity: 10,
    printing_time: 24,
    is_active: true,
    image_urls: allImages,
  };
};

// ── Main ──────────────────────────────────────────────────────────────────────
const main = async () => {
  const args = parseArgs();
  const outputFile = args.output
    ?? path.join(__dirname, `noveltyboy-${args.collection}-products.json`);

  console.log(`\n🛒  Novelty Boy Scraper`);
  console.log(`Collection : ${args.collection}`);
  console.log(`Output     : ${outputFile}`);
  console.log(`Dry run    : ${args.dryRun}`);
  console.log(`Concurrency: ${args.concurrency}\n`);

  // 1. Fetch all products from the collection
  const shopifyProducts = await fetchCollectionProducts(args.collection);
  console.log(`\nTotal products fetched: ${shopifyProducts.length}`);

  if (shopifyProducts.length === 0) {
    console.warn('No products found. Exiting.');
    process.exit(0);
  }

  // 2. Enrich each product via the per-product JSON API
  console.log('\nEnriching products (fetching per-product details)...');
  const enriched = [];
  const concurrency = args.concurrency;

  for (let i = 0; i < shopifyProducts.length; i += concurrency) {
    const chunk = shopifyProducts.slice(i, i + concurrency);
    const details = await Promise.all(
      chunk.map((p) => enrichProductPage(p.handle))
    );
    chunk.forEach((p, idx) => {
      const detail = details[idx];
      const mapped = mapProduct(p, detail, args.collection);
      enriched.push(mapped);
      const status = detail ? '✓' : '⚠ (fallback)';
      console.log(`  [${i + idx + 1}/${shopifyProducts.length}] ${status} ${mapped.name} — Rs.${mapped.original_price}`);
    });
    if (i + concurrency < shopifyProducts.length) await sleep(400);
  }

  console.log(`\nMapped ${enriched.length} products.`);

  if (args.dryRun) {
    console.log('\n--dry-run: skipping file write. First product preview:');
    console.log(JSON.stringify(enriched[0], null, 2));
    return;
  }

  // 3. Write output JSON
  await fs.writeFile(outputFile, JSON.stringify(enriched, null, 2), 'utf8');
  console.log(`\n✅  Saved to: ${outputFile}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review: node prepare_review_file.mjs --input ${path.basename(outputFile)}`);
  console.log(`  2. Import: node import_scraped_products.mjs --input ${path.basename(outputFile)}`);
};

main().catch((err) => {
  console.error('\n❌ Scraper failed:', err.message);
  process.exit(1);
});
