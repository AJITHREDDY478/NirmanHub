import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { downloadImages: false };

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (key === '--input' && value) {
      out.input = value;
      index += 1;
    } else if (key === '--output' && value) {
      out.output = value;
      index += 1;
    } else if (key === '--images-root' && value) {
      out.imagesRoot = value;
      index += 1;
    } else if (key === '--public-prefix' && value) {
      out.publicPrefix = value;
      index += 1;
    } else if (key === '--download-images') {
      out.downloadImages = true;
    }
  }

  return out;
};

const cleanText = (value, fallback = '') => {
  if (value == null) return fallback;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const isGenericBrand = (brand) => {
  const normalized = cleanText(brand, '').toLowerCase();
  if (!normalized) return true;
  return [
    'vishwakraft',
    'vishwa kraft',
    'shopify',
    '3d printed product',
    'printed product',
    'generic'
  ].includes(normalized);
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 64) || 'product';

const parseNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const variantWords = [
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'purple', 'pink', 'brown', 'grey', 'gray',
  'gold', 'silver', 'matte', 'glossy', 'variant', 'color', 'colour', 'multicolor', 'multi-color'
];

const productBaseName = (name) => {
  const original = cleanText(name, '');
  if (!original) return '';

  const pattern = new RegExp(`\\b(${variantWords.join('|')})\\b`, 'gi');
  const cleaned = original
    .replace(/[\[\](){}]/g, ' ')
    .replace(pattern, ' ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length >= 4 ? cleaned : original;
};

const collectImages = (row) => {
  const set = new Set();
  const push = (value) => {
    const normalized = cleanText(value, '');
    if (normalized) set.add(normalized);
  };

  push(row.image_url);

  if (Array.isArray(row.image_urls)) {
    row.image_urls.forEach(push);
  }

  if (Array.isArray(row.item_details_data?.additionalImages)) {
    row.item_details_data.additionalImages.forEach(push);
  }

  return [...set];
};

const fileExtFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname || '').toLowerCase();
    if (ext && ext.length <= 5) return ext;
  } catch {
    return '.jpg';
  }
  return '.jpg';
};

const uniqueBy = (arr) => [...new Set(arr.filter(Boolean))];

const mergeGroup = (rows) => {
  const first = rows[0] || {};
  const details = first.item_details_data || {};
  const mergedDetails = rows.reduce((acc, row) => ({
    ...acc,
    ...(row.item_details_data || {})
  }), {});

  const mergedTags = uniqueBy(rows.flatMap((row) => Array.isArray(row.item_details_data?.tags) ? row.item_details_data.tags : []));
  const mergedVariantOfferUrls = uniqueBy(rows.flatMap((row) => Array.isArray(row.item_details_data?.variantOfferUrls) ? row.item_details_data.variantOfferUrls : []));
  const firstRawJsonLd = rows.map((row) => row.item_details_data?.rawProductJsonLd || null).find(Boolean) || null;
  const mergedImages = uniqueBy(rows.flatMap((row) => collectImages(row)));
  const sourceUrls = uniqueBy(rows.map((row) => cleanText(row.source_url, '')).filter(Boolean));

  const canonicalName = productBaseName(first.name);
  const originalPrice = rows.map((row) => parseNumber(row.original_price, 0)).find((value) => value > 0) ?? 0;
  const discountPrice = rows.map((row) => parseNumber(row.discount_price, 0)).find((value) => value > 0) ?? 0;

  const product = {
    name: canonicalName,
    description: cleanText(first.description, 'Imported product'),
    original_price: originalPrice,
    discount_price: discountPrice,
    stock_quantity: parseInteger(first.stock_quantity, 10),
    printing_time: parseInteger(first.printing_time, 24),
    is_active: first.is_active !== false,
    image_url: mergedImages[0] || null,
    image_urls: mergedImages,
    source_url: sourceUrls[0] || null,
    source_urls: sourceUrls,
    type: 'Item',
    parent_id: first.parent_id || null,
    item_details_data: {
      ...mergedDetails,
      department: cleanText(
        !isGenericBrand(mergedDetails.brand)
          ? mergedDetails.brand
          : (details.department || mergedDetails.productType || '3D Prints'),
        '3D Prints'
      ),
      subcategory: cleanText(mergedDetails.category || details.subcategory, 'Imported'),
      category: cleanText(mergedDetails.category || details.category || mergedDetails.brand || details.department, 'Imported'),
      emoji: cleanText(details.emoji, '📦'),
      specifications: details.specifications || null,
      customizationOptions: details.customizationOptions || null,
      whyChoose: cleanText(details.whyChoose, ''),
      scrapedFrom: cleanText(details.scrapedFrom, ''),
      tags: mergedTags,
      variantOfferUrls: mergedVariantOfferUrls,
      rawProductJsonLd: firstRawJsonLd,
      additionalImages: mergedImages.slice(1)
    },
    _notes: {
      merged_variants_count: rows.length,
      editable: [
        'name',
        'description',
        'original_price',
        'discount_price',
        'stock_quantity',
        'printing_time',
        'image_url',
        'image_urls[]',
        'item_details_data.department',
        'item_details_data.subcategory',
        'item_details_data.category',
        'item_details_data.emoji'
      ],
      required: ['name', 'original_price'],
      optional: ['discount_price', 'description', 'image_url', 'image_urls', 'parent_id']
    }
  };

  return product;
};

const groupSimilarProducts = (rows) => {
  const groups = new Map();

  rows.forEach((row) => {
    const canonical = productBaseName(row.name);
    if (!canonical) return;
    const key = canonical.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  return [...groups.values()].map(mergeGroup);
};

const makePublicImagePath = (publicPrefix, folderName, fileName) => {
  const prefix = `/${String(publicPrefix || '/Products/imported').replace(/^\/+|\/+$/g, '')}`;
  return `${prefix}/${folderName}/${fileName}`;
};

const downloadImagesToLocal = async (products, imagesRootAbs, publicPrefix) => {
  await fs.mkdir(imagesRootAbs, { recursive: true });
  const usedFolderNames = new Map();
  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    const baseSlug = slugify(product.name);
    const seen = (usedFolderNames.get(baseSlug) || 0) + 1;
    usedFolderNames.set(baseSlug, seen);
    const folderName = seen === 1 ? baseSlug : `${baseSlug}-${seen}`;
    const folderAbs = path.join(imagesRootAbs, folderName);
    await fs.mkdir(folderAbs, { recursive: true });

    const localImagePaths = [];

    for (let idx = 0; idx < product.image_urls.length; idx += 1) {
      const remoteUrl = product.image_urls[idx];
      if (!remoteUrl || !/^https?:\/\//i.test(remoteUrl)) {
        localImagePaths.push(remoteUrl);
        continue;
      }

      const ext = fileExtFromUrl(remoteUrl);
      const fileName = `image-${String(idx + 1).padStart(2, '0')}${ext}`;
      const targetAbs = path.join(folderAbs, fileName);

      try {
        const response = await fetch(remoteUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(targetAbs, Buffer.from(arrayBuffer));
        localImagePaths.push(makePublicImagePath(publicPrefix, folderName, fileName));
        successCount += 1;
      } catch {
        localImagePaths.push(remoteUrl);
        failCount += 1;
      }
    }

    product.image_urls = uniqueBy(localImagePaths);
    product.image_url = product.image_urls[0] || null;
    product.item_details_data = {
      ...(product.item_details_data || {}),
      additionalImages: product.image_urls.slice(1)
    };
  }

  return { successCount, failCount };
};

const main = async () => {
  const args = parseArgs();

  const inputPath = args.input
    ? path.resolve(args.input)
    : path.join(__dirname, 'vishwakraft-products.json');

  const outputPath = args.output
    ? path.resolve(args.output)
    : path.join(__dirname, 'review-products.nirmanhub.json');

  const raw = await fs.readFile(inputPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Input file must be a JSON array');
  }

  const cleaned = parsed.filter((item) => cleanText(item?.name, '').length > 0);
  const transformed = groupSimilarProducts(cleaned);

  let downloadResult = null;
  if (args.downloadImages) {
    const imagesRootAbs = args.imagesRoot
      ? path.resolve(args.imagesRoot)
      : path.resolve(process.cwd(), 'public', 'Products', 'imported');
    const publicPrefix = args.publicPrefix || '/Products/imported';
    downloadResult = await downloadImagesToLocal(transformed, imagesRootAbs, publicPrefix);
  }

  await fs.writeFile(outputPath, JSON.stringify(transformed, null, 2), 'utf8');

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Products prepared for review: ${transformed.length}`);
  console.log(`Products merged from source rows: ${cleaned.length} -> ${transformed.length}`);
  if (downloadResult) {
    console.log(`Images downloaded: ${downloadResult.successCount}`);
    console.log(`Images failed (kept remote URL): ${downloadResult.failCount}`);
  }
  console.log('No DB upload was done.');
};

main().catch((error) => {
  console.error('Prepare review file failed:', error.message);
  process.exit(1);
});
