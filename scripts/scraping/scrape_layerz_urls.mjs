import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_URLS_FILE = path.join(__dirname, 'layerz-urls.txt');
const DEFAULT_OUTPUT = path.join(__dirname, 'review-layerz-products.json');
const DEFAULT_PRODUCTS_ROOT = path.resolve(__dirname, '..', '..', 'public', 'Products', 'Layerz');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {
    urlsFile: DEFAULT_URLS_FILE,
    output: DEFAULT_OUTPUT,
    productsRoot: DEFAULT_PRODUCTS_ROOT,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--urls-file' && value) {
      out.urlsFile = path.resolve(process.cwd(), value);
      i += 1;
    } else if (key === '--output' && value) {
      out.output = path.resolve(process.cwd(), value);
      i += 1;
    } else if (key === '--products-root' && value) {
      out.productsRoot = path.resolve(process.cwd(), value);
      i += 1;
    } else if (key === '--dry-run') {
      out.dryRun = true;
    }
  }

  return out;
};

const clean = (value, fallback = '') => {
  if (value == null) return fallback;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80) || 'product';

const stripHtml = (html) => {
  if (!html) return '';
  const $ = cheerio.load(html);
  return clean($('body').text());
};

const toHttpsUrl = (url) => {
  const value = clean(url);
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  return value;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const centsToInr = (cents) => {
  const n = toNumber(cents, 0);
  return Math.round((n / 100) * 100) / 100;
};

const extensionFromContentType = (contentType = '') => {
  const type = String(contentType).toLowerCase();
  if (type.includes('image/jpeg')) return '.jpg';
  if (type.includes('image/png')) return '.png';
  if (type.includes('image/webp')) return '.webp';
  if (type.includes('image/gif')) return '.gif';
  if (type.includes('video/mp4')) return '.mp4';
  if (type.includes('video/webm')) return '.webm';
  if (type.includes('video/ogg')) return '.ogv';
  return '';
};

const extensionFromUrl = (url) => {
  try {
    const parsed = new URL(toHttpsUrl(url));
    const ext = path.extname(parsed.pathname || '').toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch {
    return '';
  }
  return '';
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const readUrlList = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  const urls = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const handles = new Set();
  const deduped = [];

  for (const url of urls) {
    let handle = '';
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('products');
      if (idx >= 0 && parts[idx + 1]) {
        handle = parts[idx + 1];
      }
    } catch {
      continue;
    }

    if (!handle || handles.has(handle)) continue;
    handles.add(handle);
    deduped.push({
      handle,
      sourceUrl: `https://www.layerz.club/products/${handle}`,
    });
  }

  return deduped;
};

const fetchJson = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json,text/plain,*/*',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.json();
};

const pickVideoUrl = (media) => {
  if (!media || media.media_type !== 'video') return '';
  const sources = Array.isArray(media.sources) ? media.sources : [];
  const mp4 = sources
    .filter((source) => String(source.format || '').toLowerCase() === 'mp4' && source.url)
    .sort((a, b) => toNumber(b.width, 0) - toNumber(a.width, 0));

  if (mp4.length > 0) return toHttpsUrl(mp4[0].url);

  const withUrl = sources.find((source) => source.url);
  return withUrl ? toHttpsUrl(withUrl.url) : '';
};

const collectMedia = (product) => {
  const imageUrls = [];
  const videoUrls = [];
  const externalVideoUrls = [];

  const media = Array.isArray(product.media) ? product.media : [];

  for (const item of media) {
    if (item.media_type === 'image' && item.src) {
      imageUrls.push(toHttpsUrl(item.src));
    } else if (item.media_type === 'video') {
      const videoUrl = pickVideoUrl(item);
      if (videoUrl) videoUrls.push(videoUrl);
    } else if (item.media_type === 'external_video') {
      const maybeUrl = toHttpsUrl(item.embed_url || item.alt || '');
      if (maybeUrl) externalVideoUrls.push(maybeUrl);
    }
  }

  if (Array.isArray(product.images)) {
    product.images.forEach((url) => imageUrls.push(toHttpsUrl(url)));
  }

  if (product.featured_image) {
    imageUrls.unshift(toHttpsUrl(product.featured_image));
  }

  return {
    imageUrls: unique(imageUrls),
    videoUrls: unique(videoUrls),
    externalVideoUrls: unique(externalVideoUrls),
  };
};

const downloadAsset = async (url, folderAbs, prefix, index) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: '*/*',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const urlExt = extensionFromUrl(url);
  const typeExt = extensionFromContentType(contentType);
  const ext = urlExt || typeExt || (prefix === 'video' ? '.mp4' : '.jpg');
  const filename = `${prefix}-${String(index).padStart(2, '0')}${ext}`;
  const outputPath = path.join(folderAbs, filename);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
  return filename;
};

const extractCustomizationOptions = (product) => {
  const options = Array.isArray(product.options) ? product.options : [];
  const normalized = options
    .map((option) => ({
      name: clean(option.name),
      values: Array.isArray(option.values) ? option.values.map((value) => clean(value)).filter(Boolean) : [],
    }))
    .filter((option) => option.name);

  return normalized.length > 0 ? normalized : null;
};

const buildReviewProduct = ({
  product,
  sourceUrl,
  remoteImages,
  remoteVideos,
  localImages,
  localVideos,
  externalVideoUrls,
}) => {
  const currentPrice = centsToInr(product.price);
  const compareAt = centsToInr(product.compare_at_price);
  const hasDiscount = compareAt > currentPrice;

  const sku = clean(product.variants?.[0]?.sku, null) || null;
  const customizationOptions = extractCustomizationOptions(product);

  return {
    name: clean(product.title, product.handle),
    description: clean(stripHtml(product.description), `Imported from ${sourceUrl}`),
    original_price: hasDiscount ? compareAt : currentPrice,
    discount_price: hasDiscount ? currentPrice : 0,
    stock_quantity: 10,
    printing_time: 24,
    is_active: product.available !== false,
    image_url: localImages[0] || null,
    image_urls: localImages,
    source_url: sourceUrl,
    source_urls: [sourceUrl],
    type: 'Item',
    parent_id: null,
    item_details_data: {
      department: 'Layerz Imports',
      subcategory: 'Custom Products',
      category: 'Layerz',
      emoji: '🧩',
      scrapedFrom: 'https://www.layerz.club/',
      additionalImages: localImages.slice(1),
      videoUrls: localVideos,
      externalVideoUrls,
      currency: 'INR',
      availability: product.available ? 'In stock' : 'Out of stock',
      sku,
      brand: clean(product.vendor, 'Layerz'),
      productType: clean(product.type, null) || null,
      tags: Array.isArray(product.tags) ? product.tags : [],
      sourceCanonicalUrl: sourceUrl,
      shopifyProductId: product.id,
      customizationOptions,
      specifications: null,
      whyChoose: '',
      variantOfferUrls: Array.isArray(product.variants)
        ? product.variants
          .map((variant) => {
            if (!variant?.id) return '';
            return `${sourceUrl}?variant=${variant.id}`;
          })
          .filter(Boolean)
        : [],
      sourceMedia: {
        images: remoteImages,
        videos: remoteVideos,
      },
      rawProductJsonLd: null,
    },
    _notes: {
      media_downloaded: {
        images: localImages.length,
        videos: localVideos.length,
        externalVideos: externalVideoUrls.length,
      },
    },
  };
};

const main = async () => {
  const args = parseArgs();

  console.log('\nLayerz URL Scraper');
  console.log(`URLs file   : ${args.urlsFile}`);
  console.log(`Products dir: ${args.productsRoot}`);
  console.log(`Output JSON : ${args.output}`);
  console.log(`Dry run     : ${args.dryRun}\n`);

  const targets = await readUrlList(args.urlsFile);
  console.log(`Loaded ${targets.length} unique product URLs.`);

  if (targets.length === 0) {
    console.log('No valid product URLs found.');
    return;
  }

  await fs.mkdir(args.productsRoot, { recursive: true });

  const output = [];

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    const productJsonUrl = `https://www.layerz.club/products/${target.handle}.js`;

    console.log(`\n[${i + 1}/${targets.length}] ${target.handle}`);

    const product = await fetchJson(productJsonUrl);
    const { imageUrls, videoUrls, externalVideoUrls } = collectMedia(product);

    const folderName = slugify(target.handle);
    const productFolderAbs = path.join(args.productsRoot, folderName);
    await fs.mkdir(productFolderAbs, { recursive: true });

    const localImages = [];
    const localVideos = [];

    if (!args.dryRun) {
      for (let idx = 0; idx < imageUrls.length; idx += 1) {
        const remote = imageUrls[idx];
        try {
          const fileName = await downloadAsset(remote, productFolderAbs, 'image', idx + 1);
          localImages.push(`/Products/Layerz/${folderName}/${fileName}`);
        } catch (error) {
          console.warn(`  image download failed: ${remote} (${error.message})`);
        }
      }

      for (let idx = 0; idx < videoUrls.length; idx += 1) {
        const remote = videoUrls[idx];
        try {
          const fileName = await downloadAsset(remote, productFolderAbs, 'video', idx + 1);
          localVideos.push(`/Products/Layerz/${folderName}/${fileName}`);
        } catch (error) {
          console.warn(`  video download failed: ${remote} (${error.message})`);
        }
      }
    }

    const reviewProduct = buildReviewProduct({
      product,
      sourceUrl: target.sourceUrl,
      remoteImages: imageUrls,
      remoteVideos: videoUrls,
      localImages,
      localVideos,
      externalVideoUrls,
    });

    output.push(reviewProduct);

    console.log(`  images: ${localImages.length} | videos: ${localVideos.length} | external videos: ${externalVideoUrls.length}`);
  }

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\nSaved ${output.length} products to ${args.output}`);
};

main().catch((error) => {
  console.error(`\nScraper failed: ${error.message}`);
  process.exit(1);
});
