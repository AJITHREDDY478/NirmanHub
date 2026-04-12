import * as cheerio from 'cheerio';

const url = 'https://www.murtihub.com/products/baal-durga-maa-with-lion-car-dashboard-idol';
const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();
const $ = cheerio.load(html);

$('script[type="application/ld+json"]').each((_, el) => {
  const text = $(el).html();
  if (!text) return;
  try {
    const d = JSON.parse(text);
    if (d['@type'] === 'Product') {
      const offers = Array.isArray(d.offers) ? d.offers : [d.offers];
      console.log('=== Product JSON-LD ===');
      console.log('offers[0].price:', offers[0]?.price);
      console.log('offers[0].priceCurrency:', offers[0]?.priceCurrency);
      console.log('offers count:', offers.length);
    }
  } catch (e) {
    console.log('parse error:', e.message);
  }
});

console.log('\n=== OG meta price ===');
const ogPrice = $('meta[property="og:price:amount"]').attr('content') 
  || $('meta[property="product:price:amount"]').attr('content');
console.log('og price:', ogPrice);
