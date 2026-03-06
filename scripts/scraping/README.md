# Product Scraping + Import Pipeline

This folder contains a 2-step pipeline to scrape product listings from a website and upload them to NirmanaHub (`catalog_entities` in Supabase).

## Important

- Only scrape websites you are authorized to use.
- Respect website Terms of Service and robots rules.
- Keep `SUPABASE_SERVICE_ROLE_KEY` private.

## 1) Install dependencies

From project root:

```bash
npm install
```

## 2) Configure environment

Add values in your `.env` file:

```dotenv
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SCRAPER_USER_ID=...
```

`SCRAPER_USER_ID` should be the owner user ID for the products you are importing.

## 3) Configure selectors

Copy and edit config:

```bash
copy scripts\scraping\site-config.example.json scripts\scraping\site-config.json
```

Then update selectors in `site-config.json` to match your source website HTML.

## 4) Scrape products to JSON

```bash
npm run scrape:products -- --config ./scripts/scraping/site-config.json --output ./scripts/scraping/scraped-products.json
```

By default this now enriches each product by opening the product page and collecting additional details such as:
- full description
- complete image list
- SKU, brand, category
- availability and currency
- variant offer URLs
- raw Product JSON-LD (for advanced mapping)

## 5) Prepare review JSON (merge similar products + multi-image)

This merges similar product names (e.g. color variants) into one product and combines all images into `image_urls`.

```bash
npm run prepare:products -- --input ./scripts/scraping/scraped-products.json --output ./scripts/scraping/review-products.nirmanhub.json
```

### Optional: download images into app folders

This stores product images under `public/Products/imported/<product-folder>/` and rewrites JSON image paths to local app URLs.

```bash
npm run prepare:products:local-images -- --input ./scripts/scraping/scraped-products.json --output ./scripts/scraping/review-products.nirmanhub.json
```

## 6) Preview import (no DB write)

```bash
npm run import:products -- --input ./scripts/scraping/scraped-products.json --dry-run
```

## 7) Import into Supabase

```bash
npm run import:products -- --input ./scripts/scraping/review-products.nirmanhub.json
```

## Optional one-command run

```bash
npm run scrape-and-import
```

(Uses default config/output paths.)
