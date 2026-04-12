import * as cheerio from 'cheerio';

const url = process.argv[2] || 'https://www.murtihub.com/products/baal-durga-maa-with-lion-car-dashboard-idol';

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
const html = await res.text();
const $ = cheerio.load(html);

$('script[type="application/ld+json"]').each((_, el) => {
  const text = $(el).html();
  if (!text) return;
  try {
    const d = JSON.parse(text);
    if (d['@type'] === 'Product' || d.offers) {
      console.log('=== JSON-LD Product ===');
      console.log('name:', d.name);
      console.log('offers:', JSON.stringify(d.offers, null, 2));
    }
  } catch {}
});

// Also check meta tags for pricing
console.log('\n=== Meta price tags ===');
$('meta[property="product:price:amount"]').each((_, el) => console.log('og:price:amount:', $(el).attr('content')));
$('meta[name="twitter:data1"]').each((_, el) => console.log('twitter:data1:', $(el).attr('content')));

// Check for any price-looking text
console.log('\n=== Looking for INR prices in page ===');
const matches = html.match(/[\u20B9₹]\s*\d+/g) || html.match(/"price"\s*:\s*"?\d+/g) || [];
console.log([...new Set(matches)].slice(0, 10));
