/**
 * Generates a self-contained HTML with base64-embedded assets,
 * then uses headless Edge/Chrome to screenshot at 1080×1080.
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
    console.warn(`⚠ Missing: ${abs}`);
    return '';
  }
  const data = readFileSync(abs).toString('base64');
  return `data:${mimeType};base64,${data}`;
}

// Generate QR code locally as base64 PNG data URI
const qrDataURI = await QRCode.toDataURL('https://arprintlab.netlify.app/', {
  width: 210,
  margin: 2,
  color: { dark: '#042032', light: '#ffffff' },
  errorCorrectionLevel: 'M',
});

const logoAR   = toDataURI('public/brand/ar-print-lab-logo-tech.svg', 'image/svg+xml');
const logoNH   = toDataURI('public/brand/nirmanhub-logo-light.svg', 'image/svg+xml');
const imgSculpt= toDataURI('public/Products/custom girl sculpt.jpg', 'image/jpeg');
const imgKey   = toDataURI('public/Products/Home-Key Chain.webp', 'image/webp');
const imgPlant = toDataURI('public/Products/Hanging Planters1.png', 'image/png');
const imgOm    = toDataURI('public/Products/om.jpg', 'image/jpeg');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07111f"/>
      <stop offset="45%" stop-color="#0f2740"/>
      <stop offset="100%" stop-color="#0a6f86"/>
    </linearGradient>
    <linearGradient id="cardGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7ef3ff"/>
      <stop offset="100%" stop-color="#7dff9f"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#04111c" flood-opacity="0.45"/>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <clipPath id="qrClip">
      <rect x="0" y="0" width="210" height="210" rx="22" ry="22"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="165" cy="170" r="150" fill="#44d6ff" fill-opacity="0.16" filter="url(#softGlow)"/>
  <circle cx="965" cy="180" r="170" fill="#8dffb1" fill-opacity="0.14" filter="url(#softGlow)"/>
  <circle cx="860" cy="910" r="220" fill="#ffffff" fill-opacity="0.08" filter="url(#softGlow)"/>

  <g opacity="0.12">
    <path d="M0 835 C120 780 220 760 360 790 S640 900 1080 790" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M0 875 C200 840 310 820 480 850 S830 925 1080 860" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M0 915 C160 885 300 865 480 900 S850 980 1080 915" fill="none" stroke="#ffffff" stroke-width="2"/>
  </g>

  <g transform="translate(58 44)">
    <rect x="0" y="0" width="964" height="992" rx="44" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.12"/>

    <g transform="translate(54 42)">
      <image href="${logoAR}" x="0" y="0" width="240" height="72" preserveAspectRatio="xMinYMid meet"/>
      <image href="${logoNH}" x="718" y="4" width="150" height="60" preserveAspectRatio="xMaxYMid meet"/>

      <text x="0" y="126" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700">Bring Your Ideas To Life</text>
      <text x="0" y="174" fill="#cbf9ff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500">
        <tspan x="0" dy="0">Custom 3D prints, personalised gifts, decor pieces</tspan>
        <tspan x="0" dy="28">and standout prototypes for every story.</tspan>
      </text>

      <rect x="0" y="214" width="444" height="46" rx="23" fill="url(#accent)"/>
      <text x="24" y="245" fill="#042032" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700">CUSTOM ORDERS OPEN NOW</text>

      <text x="0" y="304" fill="#dffaff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">Featured Products</text>
    </g>

    <g filter="url(#shadow)">
      <g transform="translate(84 334) rotate(-2 136 152)">
        <rect x="0" y="0" width="272" height="304" rx="24" fill="#102338"/>
        <rect x="10" y="10" width="252" height="284" rx="18" fill="#0d1723" stroke="url(#cardGlow)"/>
        <image href="${imgSculpt}" x="20" y="20" width="232" height="174" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="232" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">Custom 3D Sculpture</text>
        <text x="28" y="258" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">Personalised prints for gifts</text>
        <text x="28" y="278" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">and memories</text>
      </g>

      <g transform="translate(364 334) rotate(1 136 152)">
        <rect x="0" y="0" width="272" height="304" rx="24" fill="#102338"/>
        <rect x="10" y="10" width="252" height="284" rx="18" fill="#0d1723" stroke="url(#cardGlow)"/>
        <image href="${imgKey}" x="20" y="20" width="232" height="174" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="232" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">Custom Keychains</text>
        <text x="28" y="258" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">Branding, gifting and event</text>
        <text x="28" y="278" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">keepsakes</text>
      </g>

      <g transform="translate(644 334) rotate(2 136 152)">
        <rect x="0" y="0" width="272" height="304" rx="24" fill="#102338"/>
        <rect x="10" y="10" width="252" height="284" rx="18" fill="#0d1723" stroke="url(#cardGlow)"/>
        <image href="${imgPlant}" x="20" y="20" width="232" height="174" preserveAspectRatio="xMidYMid slice"/>
        <text x="28" y="232" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">Modern Planters</text>
        <text x="28" y="258" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">Home decor with printable</text>
        <text x="28" y="278" fill="#b6ebf6" font-family="Arial, Helvetica, sans-serif" font-size="15">design freedom</text>
      </g>

    </g>

    <g transform="translate(54 686)">
      <rect x="0" y="0" width="428" height="226" rx="30" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.12"/>
      <text x="34" y="46" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Why brands &amp; creators choose us</text>
      <g fill="#d9fbff" font-family="Arial, Helvetica, sans-serif" font-size="21">
        <circle cx="40" cy="85" r="6" fill="#7ef3ff"/>
        <text x="58" y="92">Fast customisation for one-off and bulk orders</text>
        <circle cx="40" cy="123" r="6" fill="#7ef3ff"/>
        <text x="58" y="130">From concept visualisation to final print</text>
        <circle cx="40" cy="161" r="6" fill="#7ef3ff"/>
        <text x="58" y="168">Worldwide delivery. Locally made.</text>
      </g>
    </g>

    <g transform="translate(654 686)">
      <rect x="-18" y="-18" width="296" height="296" rx="32" fill="#ffffff" fill-opacity="0.12"/>
      <rect x="0" y="0" width="260" height="260" rx="22" fill="#ffffff" clip-path="url(#qrClip)"/>
      <image href="${qrDataURI}" x="25" y="25" width="210" height="210" preserveAspectRatio="xMidYMid meet"/>
      <text x="130" y="282" text-anchor="middle" fill="#7ef3ff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">Scan to explore</text>
      <text x="130" y="302" text-anchor="middle" fill="#a0e9f5" font-family="Arial, Helvetica, sans-serif" font-size="14">arprintlab.netlify.app</text>
    </g>

    <g transform="translate(54 930)">
      <text x="0" y="0" fill="#8cc6d4" font-family="Arial, Helvetica, sans-serif" font-size="17">AR PrintLab &amp; Nirmana Hub — Custom 3D Printing Studio</text>
      <text x="868" y="0" text-anchor="end" fill="#8cc6d4" font-family="Arial, Helvetica, sans-serif" font-size="17">@arprintlab</text>
    </g>
  </g>
</svg>`;

// Write standalone SVG with embedded data
const svgPath = path.join(root, 'public/samples/ar-printlab-brand-poster-standalone.svg');
writeFileSync(svgPath, svgContent, 'utf8');
console.log(`✓ Standalone SVG written: ${svgPath}`);

// Create HTML wrapper referencing the inline SVG
const htmlPath = path.join(root, 'public/samples/ar-printlab-poster-render.html');
const htmlContent = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; }
    html, body { width:1080px; height:1080px; overflow:hidden; background:#07111f; }
    img { width:1080px; height:1080px; display:block; }
  </style>
</head>
<body>
  <img src="data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}" />
</body>
</html>`;

writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`✓ Render HTML written: ${htmlPath}`);

// Find Edge or Chrome
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const browser = edgePaths.find(p => existsSync(p));
if (!browser) {
  console.error('✗ Could not find Edge or Chrome. Please screenshot manually:', htmlPath);
  process.exit(0);
}

const outPng = path.join(root, 'public/samples/ar-printlab-brand-poster.png');
const cmd = `"${browser}" --headless=new --disable-gpu --no-sandbox --window-size=1080,1080 --screenshot="${outPng}" "${htmlPath}"`;
console.log(`Running: ${cmd}`);
try {
  execSync(cmd, { timeout: 30000 });
  const stat = readFileSync(outPng);
  console.log(`✓ PNG saved: ${outPng} (${stat.length} bytes)`);
} catch (e) {
  console.error('✗ Screenshot failed:', e.message);
}
