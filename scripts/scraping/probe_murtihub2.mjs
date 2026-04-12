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

// Check for JSON data in scripts
console.log('=== LOOKING FOR DATA IN SCRIPTS ===');
const scripts = $('script[type="application/json"]');
console.log('JSON scripts found:', scripts.length);

// Look for window data
const mainScripts = $('script').slice(0, 5);
let foundData = false;
mainScripts.each((i, el) => {
  const content = $(el).html() || '';
  if (content.includes('window.') || content.includes('product') || content.includes('price')) {
    console.log(`\nScript ${i} (first 300 chars):`);
    console.log(content.substring(0, 300));
    foundData = true;
  }
});

// Look at all text content of first product card
console.log('\n=== FULL FIRST CARD HTML ===');
const firstCard = $('.product-card').first();
console.log(firstCard.html());

// Check for hidden data attributes
console.log('\n=== DATA ATTRIBUTES IN FIRST CARD ===');
firstCard.find('[*]').each((i, el) => {
  const attrs = Object.keys(el.attribs).filter(k => k.startsWith('data-'));
  if (attrs.length > 0 && i < 5) {
    console.log(`Element ${i}:`, attrs, '=', attrs.map(a => el.attribs[a]));
  }
});
