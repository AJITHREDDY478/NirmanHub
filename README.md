# NirmanaHub - 3D Model Marketplace

A modern, full-featured e-commerce React application built with Vite and Tailwind CSS.

## Features

- 🛍️ Complete e-commerce functionality
- 🛒 Shopping cart with quantity management
- ❤️ Wishlist functionality
- 🔍 Product search
- 📦 Product categories and departments
- 💳 Checkout flow (Address & Payment)
- 📱 Fully responsive design
- 🎨 Beautiful animations and transitions
- 💬 WhatsApp chat integration
- 🎯 Product filtering and sorting

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── Navbar.jsx
│   ├── Cart.jsx
│   ├── ProductCard.jsx
│   ├── SearchOverlay.jsx
│   ├── AuthModal.jsx
│   ├── WhatsAppChat.jsx
│   └── ...
├── pages/             # Page components
│   ├── HomePage.jsx
│   ├── ProductPage.jsx
│   ├── CategoriesPage.jsx
│   └── ...
├── data/              # Static data
│   └── products.js
├── utils/             # Utility functions
│   └── helpers.jsx
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics (for hero background)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Implemented

### Shopping Experience
- Browse products by category
- View product details
- Add items to cart
- Manage cart quantities
- Wishlist functionality
- Recently viewed products

### User Interface
- Responsive navbar with search
- Cart sidebar
- Product cards with hover effects
- Smooth animations
- Glass morphism effects
- 3D background effects

### Pages
- Home page with hero section
- Categories listing
- Department pages
- Product detail pages
- About page
- Contact page
- Wishlist page
- Orders page (placeholder)

## Customization

### Colors
The site uses a gradient color scheme from amber to teal. You can customize these in your Tailwind config or component files.

### Products
Edit `src/data/products.js` to add or modify products, categories, and departments.

### Styling
All styles use Tailwind CSS utility classes. Custom animations are defined in `src/index.css`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Author

NirmanaHub Team
