# 🖼️ Lithophane Photo Frame - Setup & Integration Guide

## Product Overview

**Lithophane Photo Frame** - A 3D printed personalized photo art piece that glows beautifully when backlit.

### Key Features:
- ✨ 3D printed with backlight effect
- 📸 Fully customizable via photo upload
- 🎁 Perfect for all occasions (Anniversary, Birthday, Valentine's, etc.)
- 📏 Available in 2 sizes: 5x7" and 6x8"
- 💬 WhatsApp-based ordering & preview process
- 🚚 Pan India delivery

### Pricing:
- **Original Price:** ₹599
- **Discount Price:** ₹449
- **Turnaround Time:** 3-5 business days
- **Contact:** +91-7678642888 (10 AM - 6 PM, Mon-Sat)

---

## 🚀 Quick Start - Import Product

### Step 1: Run the Scraper
```bash
node ./scripts/scraping/scrape_memorable_gifts.mjs
```

This will create a JSON file at: `scripts/scraping/memorable-gifts-lithophane.json`

### Step 2: Set Environment Variables
Make sure these are in your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SCRAPER_USER_ID=your_user_id
```

### Step 3: Import Products to Database
```bash
npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json
```

Or for dry-run (no DB changes):
```bash
node ./scripts/scraping/import_scraped_products.mjs \
  --input ./scripts/scraping/memorable-gifts-lithophane.json \
  --dry-run
```

---

## 🛠️ Integration in Product Pages

### Step 1: Update Product View Component
In your product detail page, import and use the customizer:

```jsx
import LithophaneCustomizer from '@/components/LithophaneCustomizer';

export default function ProductDetailPage() {
  const product = useProduct(); // Your product fetching logic

  // Check if this is a Lithophane product
  const isLithophane = product.name?.includes('Lithophane');

  const handleCustomizationComplete = (customizationData) => {
    console.log('Customization complete:', customizationData);
    // Store in cart with customization metadata
    addToCart({
      ...product,
      customization: customizationData
    });
  };

  return (
    <div>
      {/* Product Images & Basic Info */}
      <ProductGallery product={product} />
      <ProductInfo product={product} />

      {/* Show customizer for Lithophane products */}
      {isLithophane ? (
        <LithophaneCustomizer 
          product={product}
          onCustomizationComplete={handleCustomizationComplete}
        />
      ) : (
        <AddToCartButton product={product} />
      )}
    </div>
  );
}
```

### Step 2: Update CartItem Component
Handle customization metadata in cart display:

```jsx
export function CartItem({ item, onRemove, onQuantityChange }) {
  return (
    <div className="cart-item">
      <div>
        <h3>{item.name}</h3>
        <p>₹{item.discount_price}</p>
        
        {/* Show customization details if present */}
        {item.customization && (
          <div className="customization-details">
            <p>📸 Photo: {item.customization.uploadedImage}</p>
            <p>📏 Size: {item.customization.selectedSize} inches</p>
            <p>Status: {item.customization.status}</p>
          </div>
        )}
      </div>
      {/* Rest of cart item UI */}
    </div>
  );
}
```

### Step 3: Update Checkout Process
Modify checkout to handle WhatsApp orders:

```jsx
export function CheckoutForm({ cartItems, onSubmit }) {
  const lithophaneItems = cartItems.filter(item => item.customization);
  
  if (lithophaneItems.length > 0) {
    return (
      <div>
        <p>
          ℹ️ Personalized items (Lithophane Frames) will be confirmed 
          via WhatsApp for sample approval before processing payment.
        </p>
        <a 
          href={`https://wa.me/917678642888?text=I want to confirm my Lithophane Frame order`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp"
        >
          📞 Confirm Order on WhatsApp
        </a>
      </div>
    );
  }
  
  // Regular checkout for non-customized items
  return <RegularCheckout cartItems={cartItems} onSubmit={onSubmit} />;
}
```

---

## 📋 Database Schema

The product is stored in `catalog_entities` table with this structure:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Lithophane Photo Frame - 3D Personalized Art",
  "lookup_code": "SCRAPE-lithophane-photo-frame-1234567890-1",
  "description": "...",
  "type": "Item",
  "original_price": 599,
  "discount_price": 449,
  "stock_quantity": 100,
  "printing_time": 72,
  "image_url": "https://...",
  "is_active": true,
  "item_details_data": {
    "category": "Photo Frames",
    "department": "Photo Frames",
    "emoji": "🖼️",
    "specifications": {
      "sizes": ["5x7 inches", "6x8 inches"],
      "material": "3D Printed Resin/Acrylic",
      "lighting": "Backlit LED compatible",
      "customization": "Photo Upload Required"
    },
    "orderingProcess": {
      "contactMethod": "WhatsApp: +91-7678642888",
      "workingHours": "10 AM - 6 PM, Monday to Saturday"
    }
  }
}
```

---

## 🎨 UI Components Used

### LithophaneCustomizer.jsx
- File upload with preview
- Size selection (5x7" / 6x8")
- WhatsApp number input
- Order summary
- Direct WhatsApp integration

### Features:
✅ Photo upload validation (max 300 MB)
✅ Image preview before submission
✅ WhatsApp pre-filled message
✅ Real-time form validation
✅ Mobile responsive design
✅ Framer Motion animations

---

## 📱 WhatsApp Integration

The product uses WhatsApp Web API for:
1. **Photo Upload Confirmation** - Customer shares photo via WhatsApp
2. **Sample Preview** - Team sends 3D preview before final printing
3. **Order Confirmation** - Payment processing confirmation
4. **Delivery Updates** - Tracking and delivery notifications

### WhatsApp Business Number:
```
+91-7678642888
Working Hours: 10 AM - 6 PM, Mon-Sat
```

---

## 🔄 Order Flow Diagram

```
┌─────────────────────────────────────────┐
│  Customer visits product page            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  LithophaneCustomizer Component:         │
│  - Select Size (5x7" / 6x8")           │
│  - Upload Photo (max 300 MB)           │
│  - Enter WhatsApp Number               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Proceed to WhatsApp (pre-filled msg)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Seller receives order on WhatsApp      │
│  - Gets product details                │
│  - Gets photo upload link               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Seller previews design & sends sample  │
│  on WhatsApp                             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Customer approves sample               │
│  Proceeds with payment                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3D Printing & Framing                  │
│  (3-5 business days)                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Delivery to Customer Doorstep          │
│  Pan India Shipping                      │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist for Full Integration

- [ ] Run scraper: `node ./scripts/scraping/scrape_memorable_gifts.mjs`
- [ ] Set environment variables in `.env`
- [ ] Import product to database: `npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json`
- [ ] Add `LithophaneCustomizer.jsx` component to your project
- [ ] Update product detail page to show customizer for Lithophane products
- [ ] Update cart display to show customization metadata
- [ ] Update checkout process for WhatsApp confirmation
- [ ] Test photo upload & WhatsApp integration
- [ ] Add product to your storefront filters/categories
- [ ] Update product listing page to show customization badge

---

## 🐛 Troubleshooting

### Product not appearing in database
```bash
# Check with dry-run first
npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json --dry-run

# Verify environment variables
echo $VITE_SUPABASE_URL
echo $SCRAPER_USER_ID
```

### WhatsApp link not working
- Verify phone number format: +91XXXXXXXXXX
- Check if customer has WhatsApp installed
- Test link: `https://wa.me/917678642888?text=test`

### Photo upload issues
- Check file size limit (max 300 MB)
- Verify MIME type is image/*
- Check browser file API support

---

## 📚 Related Files

- **Scraper:** `scripts/scraping/scrape_memorable_gifts.mjs`
- **Data:** `scripts/scraping/memorable-gifts-lithophane.json`
- **Component:** `src/components/LithophaneCustomizer.jsx`
- **Import Script:** `scripts/scraping/import_scraped_products.mjs`

---

## 🎯 Next Steps

1. **Customize Component**: Modify `LithophaneCustomizer.jsx` to match your brand colors/styling
2. **Add More Products**: Follow the same pattern to add more customizable products
3. **Analytics**: Track customization completions and conversion rates
4. **Notifications**: Set up email/SMS notifications when orders are confirmed on WhatsApp
5. **Inventory Sync**: Periodically verify stock quantity with Memorable Gifts

---

## 📞 Support

For product-specific questions, contact:
- **Memorable Gifts Seller:** +91-7678642888
- **Working Hours:** 10 AM - 6 PM, Monday to Saturday

For technical integration issues, refer to the main project documentation.
