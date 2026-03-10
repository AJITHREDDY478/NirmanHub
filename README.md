# AR Print Lab

AR Print Lab is a React + Vite storefront for 3D-printed and customizable products with Supabase-powered catalog, auth, orders, and admin product management.

## Documentation

- Developer onboarding: `DEVELOPER_ONBOARDING.md`
- Quick start: `QUICKSTART.md`
- Supabase setup: `SUPABASE_SETUP.md`
- Scraping/import details: `scripts/scraping/README.md`

## Highlights

- Product catalog with category/department flows
- Product detail pages with customization handoff to custom-order form
- Custom order submission with file uploads
- Admin product upload/review workflow (including scraped product import)
- Supabase authentication + profile integration
- Mobile-responsive UI, search overlay, cart, wishlist, and WhatsApp chat
- Branded assets (logo + favicon) and imported local product media

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- React Router 6
- Supabase JS
- Framer Motion
- Three.js
- XLSX + Cheerio (data import/scraping tools)

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `.env` (or copy from `.env.example`) and set:

```dotenv
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SCRAPER_USER_ID=your_user_uuid
```

### 3) Run app

```bash
npm run dev
```

The app is configured with `base: /NirmanHub/` in `vite.config.js`.

### 4) Build/preview

```bash
npm run build
npm run preview
```

## Supabase Setup

Run the SQL setup files from project root in your Supabase SQL editor:

- `supabase_profiles_setup.sql`
- `supabase_catalog_setup.sql`
- `supabase_cart_setup.sql`

Useful guide documents:

- `SUPABASE_SETUP.md`
- `SETUP_GUIDE.md`
- `SETUP_CHECKLIST.md`

## NPM Scripts

### App

- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

### Scraping + Catalog Import

- `npm run scrape:products` – scrape products to JSON
- `npm run prepare:products` – merge/prepare review JSON
- `npm run prepare:products:local-images` – also download images to `public/Products/imported`
- `npm run import:products` – import prepared products to Supabase
- `npm run scrape-and-import` – run scrape + import sequence

Detailed usage: `scripts/scraping/README.md`

## Project Structure

```text
.
├─ public/
│  ├─ Products/                 # product media (including imported assets)
│  ├─ data/                     # review/import JSON files
│  ├─ brand/                    # logo assets
│  └─ favicon.svg
├─ scripts/
│  ├─ migrations/               # SQL migration helpers
│  └─ scraping/                 # scrape + prepare + import pipeline
├─ src/
│  ├─ components/               # reusable UI + feature components
│  ├─ contexts/                 # auth context
│  ├─ pages/                    # route-level pages
│  ├─ utils/                    # supabase and service utilities
│  └─ assets/brand/             # bundled logo assets
├─ openscad_models/             # parametric model sources
├─ blender_scripts/             # modeling/render helper scripts
└─ stl_files/                   # generated STL outputs
```

## Core Workflows

### Product browsing

Catalog data is read from Supabase (`catalog_entities`) via `src/utils/catalogService.js`, transformed to UI shape, and rendered in cards/pages.

### Custom orders

Users can move from product detail to custom order with prefilled context. Orders and attachments are saved via Supabase services.

### Product management

Admin-side product upload/review pages support manual and scrape-assisted data population.

## Deployment Notes

- Vite base path is currently `/NirmanHub/`.
- Use base-aware asset handling (already applied for branding and catalog image normalization).
- If images look stale after update, hard-refresh the browser.

## Troubleshooting

- Port already in use: Vite auto-switches (e.g., 3000 → 3001)
- Missing Supabase env vars: check `.env` keys and restart dev server
- Broken product images: verify `image_url` values in catalog and that assets exist under `public/Products/...`
- Auth issues: re-run profile setup SQL and confirm Email provider settings in Supabase

## Contributing

1. Create a feature branch
2. Make focused changes
3. Run lint/build locally
4. Open pull request with testing notes

## License

Private project (AR Print Lab). Add your preferred license if needed.
