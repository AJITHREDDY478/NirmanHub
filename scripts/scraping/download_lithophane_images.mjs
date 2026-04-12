import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.resolve(__dirname, '../../public/Products/Lithophane');
const JSON_PATH = path.resolve(__dirname, 'memorable-gifts-lithophane.json');

const PRODUCT_URL = 'https://memorablegifts.in/product/lithophane-photo-frame/';

const fetchHtml = (url) =>
  new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

const downloadFile = (url, destPath) =>
  new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', async () => {
        await fs.writeFile(destPath, Buffer.concat(chunks));
        resolve();
      });
    }).on('error', reject);
  });

const extractImages = (html) => {
  const images = new Set();

  // Match WooCommerce product gallery images (wp-content/uploads)
  const patterns = [
    /https:\/\/memorablegifts\.in\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
    /"href":"(https:\/\/memorablegifts\.in\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
    /data-large_image="(https:\/\/memorablegifts\.in\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
    /data-src="(https:\/\/memorablegifts\.in\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1] || match[0];
      // Skip thumbnail sizes like -150x150, -300x300, -100x100
      if (!/-\d+x\d+\./.test(url)) {
        images.add(url.trim());
      }
    }
  }

  return [...images];
};

const main = async () => {
  console.log('📥 Fetching product page HTML...');
  const html = await fetchHtml(PRODUCT_URL);
  console.log(`✓ Got HTML (${Math.round(html.length / 1024)}KB)`);

  const images = extractImages(html);
  console.log(`✓ Found ${images.length} product image(s):`);
  images.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));

  if (images.length === 0) {
    // Fallback to known image URL from scraping
    images.push(
      'https://memorablegifts.in/wp-content/uploads/2021/06/Copy-of-Copy-of-Copy-of-product-creatives-insta-3-3.jpg'
    );
    console.log('  Using fallback image URL');
  }

  // Create output folder
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`\n📁 Saving to: ${OUTPUT_DIR}\n`);

  const localPaths = [];
  const publicPaths = [];

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const ext = path.extname(url.split('?')[0]) || '.jpg';
    const filename = `lithophane-${String(i + 1).padStart(2, '0')}${ext}`;
    const destPath = path.join(OUTPUT_DIR, filename);
    const publicPath = `/Products/Lithophane/${filename}`;

    process.stdout.write(`  Downloading [${i + 1}/${images.length}] ${filename}... `);
    try {
      await downloadFile(url, destPath);
      const stat = await fs.stat(destPath);
      console.log(`✓ (${Math.round(stat.size / 1024)}KB)`);
      localPaths.push(destPath);
      publicPaths.push(publicPath);
    } catch (err) {
      console.log(`✗ Failed: ${err.message}`);
    }
  }

  // Update the memorable-gifts-lithophane.json with local paths
  const jsonRaw = await fs.readFile(JSON_PATH, 'utf8');
  const products = JSON.parse(jsonRaw);

  if (products[0]) {
    products[0].image_url = publicPaths[0] || products[0].image_url;
    products[0].image_urls = publicPaths.length > 0 ? publicPaths : products[0].image_urls;
    products[0].item_details_data = {
      ...products[0].item_details_data,
      additionalImages: publicPaths.slice(1),
      localImages: publicPaths,
      originalImageUrls: images,
    };
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(products, null, 4), 'utf8');
  console.log(`\n✅ Updated ${JSON_PATH} with local image paths`);
  console.log(`\n📋 Summary:`);
  console.log(`   Images downloaded : ${localPaths.length}`);
  console.log(`   Saved to          : public/Products/Lithophane/`);
  console.log(`   JSON updated      : scripts/scraping/memorable-gifts-lithophane.json`);
  console.log(`\n🚀 Ready to import! Run:`);
  console.log(`   npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json`);
};

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
