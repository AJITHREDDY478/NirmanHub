import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (key === '--config' && value) {
      out.config = value;
      index += 1;
    } else if (key === '--output' && value) {
      out.output = value;
      index += 1;
    } else if (key === '--dry-run') {
      out.dryRun = true;
    }
  }

  return out;
};

const textOrNull = (node, selector) => {
  if (!selector) return null;
  const value = node.find(selector).first().text().trim();
  return value || null;
};

const attrOrNull = (node, selector, attr) => {
  if (!selector || !attr) return null;
  const value = node.find(selector).first().attr(attr);
  return value ? value.trim() : null;
};

const normalizeUrl = (href, pageUrl) => {
  if (!href) return null;
  try {
    return new URL(href, pageUrl).toString();
  } catch {
    return href;
  }
};

const parsePrice = (value) => {
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ' ');
  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return 0;
  const numeric = Number.parseFloat(matches[0]);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseConfig = async (configPathArg) => {
  const defaultPath = path.join(__dirname, 'site-config.example.json');
  const configPath = configPathArg ? path.resolve(configPathArg) : defaultPath;
  const raw = await fs.readFile(configPath, 'utf8');
  return { configPath, config: JSON.parse(raw) };
};

const cleanText = (value, fallback = '') => {
  if (value == null) return fallback;
  const cleaned = String(value).replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
};

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return String(value);
  }
};

const uniqueBy = (arr, keyGetter) => {
  const seen = new Set();
  const out = [];
  arr.forEach((item) => {
    const key = keyGetter(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
};

const imageDedupeKey = (url) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('width');
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

const extractJsonLdBlocks = ($) => {
  const blocks = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).html();
    if (!raw) return;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // ignore invalid block
    }
  });
  return blocks;
};

const findProductJsonLd = (blocks) => {
  for (const block of blocks) {
    if (block && block['@type'] === 'Product') return block;
    if (Array.isArray(block)) {
      const found = block.find((entry) => entry && entry['@type'] === 'Product');
      if (found) return found;
    }
  }
  return null;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

const parseAvailabilityValue = (value) => {
  const normalized = cleanText(value, '').toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('instock')) return 'In stock';
  if (normalized.includes('outofstock')) return 'Out of stock';
  return null;
};

const extractProductPageDetails = async (productUrl) => {
  const response = await fetch(productUrl);
  if (!response.ok) {
    throw new Error(`Failed product page ${productUrl} (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = cleanText($('h1').first().text(), null);
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || productUrl;
  const pageDescription = cleanText($('.product__description').first().text(), '')
    || cleanText($('.rte').first().text(), '')
    || cleanText($('meta[name="description"]').attr('content'), '');

  const jsonLdBlocks = extractJsonLdBlocks($);
  const productLd = findProductJsonLd(jsonLdBlocks);
  const offers = asArray(productLd?.offers);
  const primaryOffer = offers[0] || null;

  const ldImages = uniqueBy(
    asArray(productLd?.image)
      .map((src) => toAbsoluteUrl(src, productUrl))
      .filter(Boolean),
    imageDedupeKey
  );

  const galleryImages = uniqueBy(
    $('img')
      .map((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-original-src');
        return toAbsoluteUrl(src, productUrl);
      })
      .get()
      .filter(Boolean)
      .filter((src) => /\/cdn\/shop\/files\//i.test(src)),
    imageDedupeKey
  );

  const images = uniqueBy([...ldImages, ...galleryImages], imageDedupeKey);

  const inferredAvailability = parseAvailabilityValue(primaryOffer?.availability)
    || (/in stock/i.test(html) ? 'In stock' : null)
    || (/out of stock/i.test(html) ? 'Out of stock' : null);

  const tags = cleanText($('meta[property="product:tag"]').attr('content'), '')
    ? $('meta[property="product:tag"]').map((_, el) => cleanText($(el).attr('content'), '')).get().filter(Boolean)
    : [];

  return {
    title,
    canonicalUrl,
    description: pageDescription,
    price: primaryOffer?.price ? parsePrice(primaryOffer.price) : null,
    currency: cleanText(primaryOffer?.priceCurrency, null),
    availability: inferredAvailability,
    sku: cleanText(productLd?.sku, null),
    brand: cleanText(productLd?.brand?.name || productLd?.brand, null),
    category: cleanText(productLd?.category, null),
    productType: cleanText($('meta[property="product:type"]').attr('content'), null),
    tags,
    images,
    variantOfferUrls: uniqueBy(
      offers.map((offer) => toAbsoluteUrl(offer?.url, productUrl)).filter(Boolean),
      (value) => value
    ),
    rawProductJsonLd: productLd || null
  };
};

const scrapeOnePage = async (url, selectors, defaults) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const products = [];

  $(selectors.productCard).each((_, element) => {
    const node = $(element);

    const name = textOrNull(node, selectors.name);
    if (!name) return;

    const priceText = textOrNull(node, selectors.price);
    const description = textOrNull(node, selectors.description) ?? defaults.description ?? '';
    const imageUrl = normalizeUrl(attrOrNull(node, selectors.image, selectors.imageAttr || 'src'), url);
    const productUrl = normalizeUrl(attrOrNull(node, selectors.link, selectors.linkAttr || 'href'), url);

    products.push({
      name,
      original_price: parsePrice(priceText),
      discount_price: null,
      description,
      image_url: imageUrl,
      source_url: productUrl || url,
      item_details_data: {
        department: defaults.department || 'General',
        subcategory: defaults.subcategory || 'Other',
        category: defaults.category || defaults.department || 'General',
        emoji: defaults.emoji || '📦',
        scrapedFrom: url
      },
      stock_quantity: defaults.stock_quantity ?? 10,
      printing_time: defaults.printing_time ?? 24,
      is_active: true
    });
  });

  return products;
};

const enrichProductsWithDetails = async (products, options) => {
  const concurrency = Number.parseInt(options?.concurrency, 10) || 6;
  const total = products.length;
  let processed = 0;

  const queue = [...products];
  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (queue.length > 0) {
      const product = queue.shift();
      if (!product) continue;

      try {
        if (product.source_url) {
          const details = await extractProductPageDetails(product.source_url);
          const imageUrls = details.images || [];
          const primaryImage = imageUrls[0] || product.image_url || null;

          product.name = details.title || product.name;
          product.description = details.description || product.description;
          product.original_price = details.price != null && details.price > 0 ? details.price : product.original_price;
          product.image_url = primaryImage;
          product.image_urls = imageUrls;
          product.item_details_data = {
            ...(product.item_details_data || {}),
            additionalImages: imageUrls.slice(1),
            currency: details.currency,
            availability: details.availability,
            sku: details.sku,
            brand: details.brand,
            category: details.category || product.item_details_data?.category,
            productType: details.productType,
            tags: details.tags,
            sourceCanonicalUrl: details.canonicalUrl,
            variantOfferUrls: details.variantOfferUrls,
            rawProductJsonLd: details.rawProductJsonLd
          };
        }
      } catch (error) {
        product.item_details_data = {
          ...(product.item_details_data || {}),
          scrapeError: error.message
        };
      } finally {
        processed += 1;
        if (processed % 20 === 0 || processed === total) {
          console.log(`Product detail enrichment: ${processed}/${total}`);
        }
      }
    }
  });

  await Promise.all(workers);
  return products;
};

const dedupeByName = (products) => {
  const seen = new Set();
  return products.filter((product) => {
    const key = product.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const main = async () => {
  const args = parseArgs();
  const { configPath, config } = await parseConfig(args.config);

  const selectors = config.selectors || {};
  if (!selectors.productCard || !selectors.name) {
    throw new Error('Config must include selectors.productCard and selectors.name');
  }

  const urls = config.listPageUrls || (config.sourceUrl ? [config.sourceUrl] : []);
  if (urls.length === 0) {
    throw new Error('Config must include sourceUrl or listPageUrls');
  }

  const defaults = config.defaults || {};
  const enrichConfig = config.enrich || {};
  const enableEnrichment = enrichConfig.enabled !== false;
  const scrapedProducts = [];

  for (const url of urls) {
    const products = await scrapeOnePage(url, selectors, defaults);
    scrapedProducts.push(...products);
  }

  const dedupedProducts = dedupeByName(scrapedProducts);
  const finalProducts = enableEnrichment
    ? await enrichProductsWithDetails(dedupedProducts, { concurrency: enrichConfig.concurrency || 6 })
    : dedupedProducts;
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.join(__dirname, 'scraped-products.json');

  await fs.writeFile(outputPath, JSON.stringify(finalProducts, null, 2), 'utf8');

  console.log(`Config used: ${configPath}`);
  console.log(`Pages scanned: ${urls.length}`);
  console.log(`Products scraped: ${scrapedProducts.length}`);
  console.log(`Products after dedupe: ${finalProducts.length}`);
  console.log(`Product detail enrichment: ${enableEnrichment ? 'enabled' : 'disabled'}`);
  console.log(`Output: ${outputPath}`);

  if (args.dryRun) {
    console.log('Dry run complete. No DB upload performed by this script.');
  }
};

main().catch((error) => {
  console.error('Scrape failed:', error.message);
  process.exit(1);
});
