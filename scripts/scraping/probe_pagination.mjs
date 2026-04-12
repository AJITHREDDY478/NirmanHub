import * as cheerio from 'cheerio';

const baseUrl = 'https://www.murtihub.com/collections/car-dashboard-idols';

const res = await fetch(`${baseUrl}?page=1`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();
const $ = cheerio.load(html);

console.log('=== PAGINATION CHECK ===');

// Look for pagination links
const paginationLinks = $('a[rel="next"], a[rel="prev"], .pagination a, .nav-pagination a');
console.log('Pagination links found:', paginationLinks.length);
paginationLinks.each((i, el) => {
  if (i < 10) console.log(`  ${i}: href="${$(el).attr('href')}" text="${$(el).text()}"`);
});

// Check for product count indicators
const pageInfo = $('[data-pagination-info], .page-info, [data-product-count]');
console.log('Page info elements:', pageInfo.length);
pageInfo.each((i, el) => {
  if (i < 5) console.log(`  ${i}: ${$(el).text()}`);
});

// Look for next page button
const nextBtn = $('a[rel="next"]');
console.log('\nNext button href:', nextBtn.attr('href'));

// Check query params on current page
const cards = $('.product-card');
console.log(`Products on page 1: ${cards.length}`);

// Try page 2
console.log('\n=== PAGE 2 CHECK ===');
const res2 = await fetch(`${baseUrl}?page=2`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html2 = await res2.text();
const $2 = cheerio.load(html2);
const cards2 = $2('.product-card');
console.log(`Products on page 2: ${cards2.length}`);

if (cards2.length > 0) {
  console.log('First product on page 2:', $2('.product-title').first().text().trim());
}
