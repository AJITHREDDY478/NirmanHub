import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { dryRun: false };

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--input' && value) {
      out.input = value;
      i += 1;
    } else if (key === '--output-dir' && value) {
      out.outputDir = value;
      i += 1;
    } else if (key === '--dry-run') {
      out.dryRun = true;
    }
  }

  return out;
};

const slugify = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50) || 'product';

const downloadImage = async (url, filePath) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ✗ Failed to download ${url} (${response.status})`);
      return false;
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`  ✗ Error downloading ${url}:`, error.message);
    return false;
  }
};

const getImageExtension = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname || '';
    const ext = path.extname(pathname).toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch {
    // ignore
  }
  return '.jpg';
};

const main = async () => {
  const options = parseArgs();

  if (!options.input) {
    console.error('Error: --input is required');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), options.input);
  const outputDir = path.resolve(process.cwd(), options.outputDir || './public/Products/Devotional');

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Dry-run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log('');

  // Read input JSON
  const rawData = await fs.readFile(inputPath, 'utf8');
  const products = JSON.parse(rawData);

  if (!Array.isArray(products)) {
    console.error('Error: Input must be an array of products');
    process.exit(1);
  }

  console.log(`Found ${products.length} products\n`);

  let totalImages = 0;
  let successfulImages = 0;

  for (const [index, product] of products.entries()) {
    const productName = product.name || `product-${index}`;
    const productDir = slugify(productName);
    const fullProductDir = path.join(outputDir, productDir);

    const allImages = [
      ...(product.image_url ? [product.image_url] : []),
      ...(Array.isArray(product.image_urls) ? product.image_urls : []),
      ...(Array.isArray(product.item_details_data?.additionalImages) || false
        ? product.item_details_data.additionalImages
        : [])
    ].filter((url) => url && String(url).trim());

    const uniqueImages = [...new Set(allImages)];

    console.log(`[${index + 1}/${products.length}] ${productName}`);
    console.log(`  Images: ${uniqueImages.length}`);

    if (uniqueImages.length === 0) {
      console.log('  → No images found\n');
      continue;
    }

    if (!options.dryRun) {
      try {
        await fs.mkdir(fullProductDir, { recursive: true });
        console.log(`  → Created folder: ${productDir}`);
      } catch (error) {
        console.error(`  ✗ Failed to create folder: ${error.message}`);
        continue;
      }
    }

    for (const [imgIndex, imageUrl] of uniqueImages.entries()) {
      totalImages += 1;
      const ext = getImageExtension(imageUrl);
      const filename = `${String(imgIndex + 1).padStart(2, '0')}${ext}`;
      const filePath = path.join(fullProductDir, filename);

      if (options.dryRun) {
        console.log(`  → Would download: ${filename}`);
      } else {
        const success = await downloadImage(imageUrl, filePath);
        if (success) {
          successfulImages += 1;
          console.log(`  ✓ Downloaded: ${filename}`);
        }
      }
    }

    console.log('');
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total images to download: ${totalImages}`);
  if (!options.dryRun) {
    console.log(`Successfully downloaded: ${successfulImages}`);
    console.log(`Failed: ${totalImages - successfulImages}`);
    console.log(`Output directory: ${outputDir}`);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
