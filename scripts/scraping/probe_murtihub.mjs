import * as cheerio from 'cheerio';

const url = 'https://www.murtihub.com/collections/all';

console.log('Fetching:', url);
const response = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
});

if (!response.ok) {
  console.error('Failed:', response.status);
  process.exit(1);
}

const html = await response.text();
const $ = cheerio.load(html);

console.log('\n=== DETAILED PRODUCT CARD ANALYSIS ===');
const firstCard = $('.product-card').first();
console.log(firstCard.html().substring(0, 1500));

console.log('\n=== LOOKING FOR PRICES AND TEXT ===');
console.log('.product-card__title:', $('.product-card__title').length);
console.log('.product-card__heading:', $('.product-card__heading').length);
console.log('.money:', $('.money').length);
console.log('.product-card .price:', $('.product-card .price').length);
console.log('[data-compare-price]:', $('[data-compare-price]').length);
console.log('[data-regular-price]:', $('[data-regular-price]').length);

// Sample text from first card
console.log('\nFirst card title:', $('.product-card .product-card__title').first().text().trim());
console.log('First card price:', $('.product-card .money').first().text().trim());

// Single product to understand full structure
console.log('\n=== SINGLE PRODUCT PAGE TEST ===');
const productLink = $('.product-card a[href*="/products/"]').first().attr('href');
if (productLink) {
  console.log('Testing product URL:', productLink);
  const prodUrl = new URL(productLink, 'https://www.murtihub.com').toString();
  console.log('Full URL:', prodUrl);
}
