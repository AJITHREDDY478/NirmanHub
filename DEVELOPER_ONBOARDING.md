# Developer Onboarding (5 Minutes)

This guide helps a new developer run AR Print Lab quickly and safely.

## 1) Prerequisites

- Node.js 18+
- npm 9+
- Supabase project access
- Git access to this repository

## 2) Clone and install

```bash
git clone <repo-url>
cd NirmanaHub
npm install
```

## 3) Environment setup

Copy `.env.example` to `.env` and set values:

```dotenv
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SCRAPER_USER_ID=your_user_uuid
```

## 4) Database setup (Supabase)

Run these SQL files in Supabase SQL Editor:

1. `supabase_profiles_setup.sql`
2. `supabase_catalog_setup.sql`
3. `supabase_cart_setup.sql`

Then verify:
- Auth → Email provider enabled
- Required tables created (profiles, catalog, cart/custom-order related)

## 5) Start the app

```bash
npm run dev
```

Open the URL shown in terminal (commonly `http://localhost:3000/NirmanHub/` or next free port).

## 6) Useful commands

```bash
npm run lint
npm run build
npm run preview
```

### Scrape/import workflow (optional)

```bash
npm run scrape:products
npm run prepare:products
npm run import:products
```

For advanced options, see `scripts/scraping/README.md`.

## 7) High-level architecture

- Frontend: React + Vite + Tailwind
- Routing/UI: `src/App.jsx`, `src/pages/*`, `src/components/*`
- Data services: `src/utils/catalogService.js`, `src/utils/customOrderService.js`, `src/utils/supabase.js`
- Product assets: `public/Products/*`
- Branding assets: `src/assets/brand/*` and `public/favicon.svg`

## 8) First-day sanity checks

- Logo appears in navbar/footer
- Product cards show images
- Product details open correctly
- Custom order form submits
- Admin product upload page opens without errors

## 9) Common issues

- **Images not loading**: verify `image_url` values and base path (`/NirmanHub/`) behavior
- **Supabase auth errors**: check URL/keys and profile SQL setup
- **Port already in use**: Vite auto-selects another port
- **Stale UI assets**: hard refresh browser (`Ctrl+F5`)

## 10) Team conventions

- Keep commits focused and descriptive
- Avoid mixing unrelated changes in one PR
- Run lint/build before pushing
- Update docs when behavior/setup changes
