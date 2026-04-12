/**
 * Generates a 1080x1920 reel poster PNG using headless Edge/Chrome.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function toDataURI(filePath, mimeType) {
  const abs = path.join(root, filePath);
  if (!existsSync(abs)) {
    console.warn(`Missing asset: ${abs}`);
    return '';
  }
  const data = readFileSync(abs).toString('base64');
  return `data:${mimeType};base64,${data}`;
}

const qrDataURI = await QRCode.toDataURL('https://arprintlab.netlify.app/', {
  width: 260,
  margin: 2,
  color: { dark: '#07263a', light: '#ffffff' },
  errorCorrectionLevel: 'M',
});

const logoAR = toDataURI('public/brand/ar-print-lab-logo-tech.svg', 'image/svg+xml');
const logoNH = toDataURI('public/brand/nirmanhub-logo-light.svg', 'image/svg+xml');
const imgSculpt = toDataURI('public/Products/custom girl sculpt.jpg', 'image/jpeg');
const imgKey = toDataURI('public/Products/Home-Key Chain.webp', 'image/webp');
const imgPlant = toDataURI('public/Products/Hanging Planters1.png', 'image/png');
const imgOm = toDataURI('public/Products/om.jpg', 'image/jpeg');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#041222"/>
      <stop offset="55%" stop-color="#103151"/>
      <stop offset="100%" stop-color="#0a7a8f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7ef3ff"/>
      <stop offset="100%" stop-color="#7dff9f"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.07"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#051423" flood-opacity="0.45"/>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg)"/>
  <circle cx="130" cy="210" r="190" fill="#5fd8ff" fill-opacity="0.18" filter="url(#softGlow)"/>
  <circle cx="980" cy="260" r="220" fill="#9cffbc" fill-opacity="0.12" filter="url(#softGlow)"/>
  <circle cx="920" cy="1680" r="260" fill="#ffffff" fill-opacity="0.08" filter="url(#softGlow)"/>

  <g opacity="0.12">
    <path d="M0 1500 C180 1430 320 1420 520 1460 S820 1550 1080 1480" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M0 1580 C150 1540 340 1520 560 1560 S860 1640 1080 1590" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M0 1660 C180 1620 360 1600 620 1640 S900 1710 1080 1660" fill="none" stroke="#ffffff" stroke-width="2"/>
  </g>

  <g transform="translate(52 56)">
    <rect x="0" y="0" width="976" height="1808" rx="44" fill="url(#glass)" stroke="#ffffff" stroke-opacity="0.12"/>

    <g transform="translate(54 44)">
      <image href="${logoAR}" x="0" y="0" width="240" height="72" preserveAspectRatio="xMinYMid meet"/>
      <image href="${logoNH}" x="728" y="4" width="140" height="56" preserveAspectRatio="xMaxYMid meet"/>

      <text x="0" y="132" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700">Bring Your Ideas</text>
      <text x="0" y="214" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700">To Life</text>

      <text x="0" y="270" fill="#c9f9ff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="500">Custom 3D prints, personalised gifts, decor pieces</text>
      <text x="0" y="312" fill="#c9f9ff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="500">and standout prototypes for every story.</text>

      <rect x="0" y="340" width="520" height="64" rx="32" fill="url(#accent)"/>
      <text x="30" y="382" fill="#052338" font-family="Arial, Helvetica, sans-serif" font-size="39" font-weight="700">CUSTOM ORDERS OPEN NOW</text>
    </g>

    <text x="54" y="486" fill="#dffaff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">Featured Products</text>

    <g filter="url(#shadow)">
      <g transform="translate(72 520)">
        <rect x="0" y="0" width="400" height="396" rx="28" fill="#0d243b"/>
        <rect x="12" y="12" width="376" height="372" rx="22" fill="#0b1828" stroke="#86eaff" stroke-opacity="0.22"/>
        <image href="${imgSculpt}" x="22" y="22" width="356" height="248" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="45" font-weight="700">3D Sculpture</text>
        <text x="28" y="350" fill="#bfefff" font-family="Arial, Helvetica, sans-serif" font-size="31">Personalised prints</text>
      </g>

      <g transform="translate(504 520)">
        <rect x="0" y="0" width="400" height="396" rx="28" fill="#0d243b"/>
        <rect x="12" y="12" width="376" height="372" rx="22" fill="#0b1828" stroke="#86eaff" stroke-opacity="0.22"/>
        <image href="${imgPlant}" x="22" y="22" width="356" height="248" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="45" font-weight="700">Planters</text>
        <text x="28" y="350" fill="#bfefff" font-family="Arial, Helvetica, sans-serif" font-size="31">Home decor designs</text>
      </g>

      <g transform="translate(72 944)">
        <rect x="0" y="0" width="400" height="396" rx="28" fill="#0d243b"/>
        <rect x="12" y="12" width="376" height="372" rx="22" fill="#0b1828" stroke="#86eaff" stroke-opacity="0.22"/>
        <image href="${imgKey}" x="22" y="22" width="356" height="248" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="45" font-weight="700">Keychains</text>
        <text x="28" y="350" fill="#bfefff" font-family="Arial, Helvetica, sans-serif" font-size="31">Branding and gifting</text>
      </g>

      <g transform="translate(504 944)">
        <rect x="0" y="0" width="400" height="396" rx="28" fill="#0d243b"/>
        <rect x="12" y="12" width="376" height="372" rx="22" fill="#0b1828" stroke="#86eaff" stroke-opacity="0.22"/>
        <image href="${imgOm}" x="22" y="22" width="356" height="248" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="45" font-weight="700">Religious Decor</text>
        <text x="28" y="350" fill="#bfefff" font-family="Arial, Helvetica, sans-serif" font-size="31">Meaningful pieces</text>
      </g>
    </g>

    <g transform="translate(72 1368)">
      <rect x="0" y="0" width="524" height="376" rx="30" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.14"/>
      <text x="34" y="62" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">Why choose us</text>
      <g fill="#d9fbff" font-family="Arial, Helvetica, sans-serif" font-size="34">
        <circle cx="40" cy="124" r="8" fill="#7ef3ff"/>
        <text x="62" y="134">Fast customisation</text>
        <circle cx="40" cy="192" r="8" fill="#7ef3ff"/>
        <text x="62" y="202">From concept to final print</text>
        <circle cx="40" cy="260" r="8" fill="#7ef3ff"/>
        <text x="62" y="270">Worldwide delivery</text>
        <circle cx="40" cy="328" r="8" fill="#7ef3ff"/>
        <text x="62" y="338">Locally made quality</text>
      </g>
    </g>

    <g transform="translate(636 1368)">
      <rect x="-16" y="-16" width="302" height="428" rx="34" fill="#ffffff" fill-opacity="0.12"/>
      <rect x="0" y="0" width="270" height="270" rx="26" fill="#ffffff"/>
      <image href="${qrDataURI}" x="10" y="10" width="250" height="250" preserveAspectRatio="xMidYMid meet"/>
      <text x="135" y="316" text-anchor="middle" fill="#89f4ff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">Scan To Explore</text>
      <text x="135" y="356" text-anchor="middle" fill="#b0ebf6" font-family="Arial, Helvetica, sans-serif" font-size="24">arprintlab.netlify.app</text>
    </g>

    <g transform="translate(54 1780)">
      <text x="0" y="0" fill="#8cc6d4" font-family="Arial, Helvetica, sans-serif" font-size="31">AR PrintLab &amp; NirmanHub</text>
      <text x="868" y="0" text-anchor="end" fill="#8cc6d4" font-family="Arial, Helvetica, sans-serif" font-size="31">@arprintlab</text>
    </g>
  </g>
</svg>`;

const svgPath = path.join(root, 'public/samples/ar-printlab-brand-poster-reel.svg');
writeFileSync(svgPath, svgContent, 'utf8');

const htmlPath = path.join(root, 'public/samples/ar-printlab-poster-reel-render.html');
const htmlContent = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; }
    html, body { width:1080px; height:1920px; overflow:hidden; background:#041222; }
    img { width:1080px; height:1920px; display:block; }
  </style>
</head>
<body>
  <img src="data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}" />
</body>
</html>`;

writeFileSync(htmlPath, htmlContent, 'utf8');

const browserPaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const browser = browserPaths.find(p => existsSync(p));

if (!browser) {
  console.error(`Browser not found. Open this file manually: ${htmlPath}`);
  process.exit(1);
}

const outPng = path.join(root, 'public/samples/ar-printlab-brand-poster-reel.png');
const cmd = `"${browser}" --headless=new --disable-gpu --no-sandbox --window-size=1080,1920 --screenshot="${outPng}" "${htmlPath}"`;

try {
  execSync(cmd, { timeout: 30000 });
  const bytes = readFileSync(outPng).length;
  console.log(`${bytes} bytes written to file`);
  console.log(outPng);
} catch (error) {
  console.error('Screenshot failed:', error.message);
  process.exit(1);
}
