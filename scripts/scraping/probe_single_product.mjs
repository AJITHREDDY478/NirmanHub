import * as cheerio from 'cheerio';

const url = process.argv[2] || 'https://www.vishwakraft.store/products/wire-mesh-style-pen-holder';

const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const absoluteUrl = (value) => {
  const src = String(value || '').trim();
  if (!src) return null;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `https://www.vishwakraft.store${src}`;
  return src;
};

const parsePrice = (text) => {
  const match = clean(text).match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Failed to fetch ${url} (${response.status})`);
}

const html = await response.text();
const $ = cheerio.load(html);

const title = clean($('h1').first().text()) || clean($('meta[property="og:title"]').attr('content'));
const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;
const description = clean($('.product__description').first().text()) || clean($('.rte').first().text()) || clean($('meta[name="description"]').attr('content'));
const priceText = clean($('.price-item--regular').first().text()) || clean($('.price').first().text());
const regularPrice = parsePrice(priceText);
const currency = 'INR';
const availability = /in stock/i.test(html) ? 'In stock' : null;

const imageCandidates = $('img')
  .map((_, element) => absoluteUrl($(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-original-src')))
  .get()
  .filter(Boolean)
  .filter((src) => !/logo|payment|icon|avatar|flag/i.test(src));

const images = [...new Set(imageCandidates)];

const jsonLdBlocks = [];
$('script[type="application/ld+json"]').each((_, element) => {
  const raw = $(element).html();
  if (!raw) return;
  try {
    jsonLdBlocks.push(JSON.parse(raw));
  } catch {
    // ignore invalid JSON-LD blocks
  }
});

let productJsonLd = null;
for (const block of jsonLdBlocks) {
  if (block && block['@type'] === 'Product') {
    productJsonLd = block;
    break;
  }
  if (Array.isArray(block)) {
    const found = block.find((entry) => entry && entry['@type'] === 'Product');
    if (found) {
      productJsonLd = found;
      break;
    }
  }
}

const output = {
  url,
  title,
  canonicalUrl,
  description,
  pricing: {
    regularPrice,
    priceText,
    currency
  },
  availability,
  imagesCount: images.length,
  images,
  productJsonLd
};

console.log(JSON.stringify(output, null, 2));
