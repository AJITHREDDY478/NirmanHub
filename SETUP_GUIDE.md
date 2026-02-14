# 🚀 NirmanaHub - Complete Setup Guide

## Prerequisites Installation

### Step 1: Install Node.js

Node.js is required to run this React + Vite project. Follow these steps:

1. **Download Node.js:**
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS version** (Long Term Support) - recommended for most users
   - Current LTS version: 20.x or higher

2. **Install Node.js:**
   - Run the downloaded installer
   - Accept the license agreement
   - Keep default installation settings (include npm package manager)
   - Click "Install" and wait for completion
   - Restart your computer after installation

3. **Verify Installation:**
   Open Command Prompt or PowerShell and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers like:
   ```
   v20.x.x
   10.x.x
   ```

## Project Setup

### Step 2: Navigate to Project Directory

Open Command Prompt or PowerShell and navigate to the project:
```bash
cd c:\Users\Admin\Desktop\NirmanaHub
```

### Step 3: Install Dependencies

Install all required packages (React, Vite, Tailwind CSS, etc.):
```bash
npm install
```

This will install:
- React 18.2.0 (UI library)
- Vite 5.1.0 (Build tool)
- Tailwind CSS 3.4.1 (Styling)
- React Router DOM 6.22.0 (Routing)
- Three.js 0.160.0 (3D graphics)
- ESLint (Code quality)
- PostCSS & Autoprefixer (CSS processing)

**Installation may take 2-5 minutes depending on your internet speed.**

### Step 4: Start Development Server

Once installation is complete, start the development server:
```bash
npm run dev
```

You should see output like:
```
  VITE v5.1.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 5: Open in Browser

Open your web browser and visit:
```
http://localhost:5173
```

**The application should now be running!** 🎉

## Project Overview

### What You Get

✅ **Full E-Commerce Platform** with:
- 24 products across 4 departments
- Shopping cart with quantity management
- Wishlist functionality
- Product search and filtering
- Checkout flow (address + payment)
- Order tracking
- Address management
- WhatsApp chat widget
- Responsive design for all devices

### Available Pages

1. **Home** (`/`) - Landing page with featured products
2. **Categories** (`/categories`) - Browse all departments
3. **Department** (`/department/:id`) - View department products
4. **Product Details** (`/product/:id`) - Individual product page
5. **Wishlist** (`/wishlist`) - Saved favorite items
6. **Orders** (`/orders`) - Order history
7. **Addresses** (`/addresses`) - Manage delivery addresses
8. **About** (`/about`) - About the company
9. **Contact** (`/contact`) - Contact form

## Available Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:5173)
```

### Production Build
```bash
npm run build        # Create optimized production build
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run lint         # Check code for errors and style issues
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "npm is not recognized"
**Problem:** Node.js/npm not installed or not in PATH
**Solution:**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/command prompt
- If still not working, restart your computer

#### 2. Port Already in Use
**Problem:** Port 5173 is already being used
**Solution:**
- Vite will automatically use the next available port (5174, 5175, etc.)
- Or specify a custom port:
  ```bash
  npm run dev -- --port 3000
  ```

#### 3. Module Not Found Errors
**Problem:** Dependencies not installed properly
**Solution:**
1. Delete `node_modules` folder
2. Delete `package-lock.json` file
3. Run `npm install` again

#### 4. ESM Import Errors
**Problem:** Import/export syntax errors
**Solution:**
- Make sure you're using Node.js v16 or higher
- Check that `"type": "module"` is in package.json (already configured)

#### 5. Slow Installation
**Problem:** npm install taking too long
**Solution:**
- Check your internet connection
- Try using a different npm registry:
  ```bash
  npm config set registry https://registry.npmjs.org/
  ```

#### 6. Permission Errors (Windows)
**Problem:** Access denied errors
**Solution:**
- Run Command Prompt as Administrator
- Or check folder permissions

## File Structure

```
NirmanaHub/
├── node_modules/           # Dependencies (created after npm install)
├── public/                 # Static assets
├── src/
│   ├── components/         # 8 Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Cart.jsx
│   │   ├── SearchOverlay.jsx
│   │   ├── Toast.jsx
│   │   ├── AuthModal.jsx
│   │   ├── CheckoutModals.jsx
│   │   ├── WhatsAppChat.jsx
│   │   └── PromoBanner.jsx
│   ├── pages/             # 9 Page components
│   │   ├── HomePage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── CategoriesPage.jsx
│   │   ├── DepartmentPage.jsx
│   │   ├── WishlistPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── AddressPage.jsx
│   │   ├── AboutPage.jsx
│   │   └── ContactPage.jsx
│   ├── data/
│   │   └── products.js    # 24 products, 4 departments
│   ├── utils/
│   │   └── helpers.jsx    # Utility functions
│   ├── App.jsx            # Main app with routing & state
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles & animations
├── index.html             # HTML template
├── package.json           # Dependencies & scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
└── SETUP_GUIDE.md         # This file
```

## Next Steps

### Development
1. ✅ All files are created and ready
2. ✅ Install Node.js if not already installed
3. ✅ Run `npm install` to install dependencies
4. ✅ Run `npm run dev` to start development server
5. 🎨 Start customizing the app to your needs!

### Customization Ideas
- Add more products in `src/data/products.js`
- Customize colors in `tailwind.config.js`
- Add new pages in `src/pages/`
- Modify styles in `src/index.css`
- Add backend API integration
- Implement real payment gateway
- Add user authentication

### Production Deployment
When ready to deploy:
1. Run `npm run build` - creates optimized build in `dist/` folder
2. Upload `dist/` folder to your hosting service
3. Popular options:
   - **Vercel** (recommended for React apps)
   - **Netlify**
   - **GitHub Pages**
   - **AWS S3 + CloudFront**

## Features Showcase

### 🎨 Design Features
- Glassmorphism effects
- Smooth animations (fade, slide, float, pulse)
- Gradient backgrounds
- Custom scrollbars
- Hover effects on cards
- Tab transitions
- Badge animations
- Responsive grid layouts

### 🛍️ E-Commerce Features
- Product catalog with 24 items
- 4 departments: Electronics, Fashion, Home, Accessories
- Add to cart functionality
- Quantity management
- Wishlist (save favorites)
- Recently viewed products
- Product search with real-time filtering
- Department and subcategory filtering
- Product ratings and reviews
- Order summary and checkout
- Multiple delivery addresses
- Payment method selection (COD implemented)
- Order history tracking
- WhatsApp customer support integration

### 📱 User Experience
- Fully responsive design
- Mobile-friendly navigation
- Toast notifications
- Loading states
- Empty states (empty cart, no orders, etc.)
- Modal dialogs
- Smooth page transitions
- Scroll animations (reveal on scroll)
- Sticky navbar with shrink effect
- Cart sidebar with animations

## Support

If you encounter any issues:

1. **Check this guide** for troubleshooting steps
2. **Verify Node.js installation:** `node --version`
3. **Check npm:** `npm --version`
4. **Delete and reinstall:** Remove `node_modules` and run `npm install` again
5. **Check console errors:** Open browser DevTools (F12) and check Console tab

## Success Checklist

- [ ] Node.js installed (v16+)
- [ ] npm available in terminal
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] Dev server starts without errors
- [ ] Browser opens to http://localhost:5173
- [ ] Home page loads with products
- [ ] Navigation works
- [ ] Can add items to cart
- [ ] All pages accessible

**If all items are checked, you're ready to go!** 🚀

---

**Happy Coding!** 💻✨

*Built with React 18 + Vite 5 + Tailwind CSS 3*