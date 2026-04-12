# 🖼️ Lithophane Photo Frame - Product Implementation

## ✨ Key Functionality

### 1. **Customizable Product Flow**
The Lithophane Photo Frame requires customer interaction before purchase:
- Photo Upload
- Size Selection  
- WhatsApp Integration for Sample Preview
- Payment Confirmation

### 2. **Component Architecture**

```
ProductDetailPage
    ├── ProductGallery (shows images)
    ├── ProductInfo (basic details)
    └── LithophaneCustomizer (✨ NEW)
        ├── SizeSelector (5x7" / 6x8")
        ├── PhotoUploadArea
        ├── WhatsAppContactInput
        └── OrderSummary
            └── WhatsApp Submit Button
```

### 3. **Integration Points**

#### In Product Detail Page:
```jsx
import LithophaneCustomizer from '@/components/LithophaneCustomizer';

// Inside your product detail component
{product.category === 'Photo Frames' && product.name.includes('Lithophane') && (
  <LithophaneCustomizer 
    product={product}
    onCustomizationComplete={(customData) => {
      // Add to cart with customization metadata
      cart.addItem(product, { customization: customData });
    }}
  />
)}
```

#### In Shopping Cart:
```jsx
// Show customization badge
{cartItem.customization && (
  <div className="customization-badge">
    📸 Personalized | Size: {cartItem.customization.selectedSize}"
  </div>
)}
```

---

## 📊 Product Categories

The Lithophane product fits in:

| Category | Subcategory | Department | Emoji |
|----------|-------------|-----------|-------|
| Photo Frames | Personalized Photo Frames | Photo Frames | 🖼️ |
| Gifts | Personalized Gifts | Gifts | 🎁 |
| Home Decor | Wall Art | Home | 🏠 |

**Where to Display:**
- Photo Frames Collection
- Personalized Gifts Section
- Valentine's Day Category
- Anniversary Gifts
- Birthday Gifts
- Corporate Gifts

---

## 🎯 Product Tags for Search

```json
[
  "personalized",
  "photo-frame",
  "3d-printed",
  "custom-gift",
  "lithophane",
  "backlit-photo",
  "customizable",
  "anniversary-gift",
  "birthday-gift",
  "valentines-gift",
  "home-decor",
  "wall-art",
  "unique-gift",
  "memory-keeper"
]
```

---

## 💰 Pricing Structure

| Field | Value |
|-------|-------|
| Original Price | ₹599 |
| Discount Price | ₹449 |
| Discount % | 25% off |
| Available Sizes | 5x7", 6x8" (same price) |
| Stock | 100 units |
| Turnaround Time | 3-5 business days |

---

## 🚀 Deployment Steps

### Step 1: Database Import
```bash
# Generate product JSON
node scripts/scraping/scrape_memorable_gifts.mjs

# Import to database
npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json
```

### Step 2: Frontend Integration
```bash
# Component is already at:
# src/components/LithophaneCustomizer.jsx

# Update your product pages to use it
# See LITHOPHANE_SETUP.md for integration code
```

### Step 3: Testing
```
✅ Search for "Lithophane" in product search
✅ Click product to open detail page
✅ See LithophaneCustomizer form
✅ Upload test image
✅ Click WhatsApp button
✅ Verify pre-filled message
```

---

## 📱 WhatsApp Workflow

**Trigger:** User clicks "Proceed to WhatsApp" after selecting size & uploading photo

**Pre-filled Message Template:**
```
Hi! I'm interested in ordering a {SIZE}" Lithophane Photo Frame. 
I've uploaded my photo. Please share the sample preview. 

Product: Lithophane Photo Frame - 3D Personalized Art
Size: {SIZE} inches
Photo Uploaded: Yes
Contact: {WHATSAPP_NUMBER}
```

**Seller Actions (on WhatsApp):**
1. ✅ Acknowledge order receipt
2. 📸 Request photo file if needed
3. 🎨 Create 3D preview design
4. 📤 Send preview image/video on WhatsApp
5. ✅ Get customer approval
6. 💳 Process payment
7. 🖨️ Start 3D printing
8. 📦 Arrange packaging
9. 🚚 Coordinate delivery

---

## 🔐 Data Structure (Cart Item with Customization)

```javascript
{
  // Product fields
  id: "uuid",
  name: "Lithophane Photo Frame - 3D Personalized Art",
  price: 449,
  originalPrice: 599,
  image: "url",
  
  // Customization metadata
  customization: {
    productId: "uuid",
    productName: "Lithophane Photo Frame",
    selectedSize: "5x7",  // or "6x8"
    uploadedImage: "filename.jpg",
    whatsappNumber: "9876543210",
    status: "pending-confirmation",  // pending-confirmation -> confirmed -> processing -> completed
    timestamp: "2026-04-12T10:30:00Z",
    orderNotes: "...",
    whatsappLink: "https://wa.me/917678642888?text=..."
  },
  
  quantity: 1,
  cartItemId: "unique-id"
}
```

---

## 🎨 Customization Status Flow

```
PENDING_CONFIRMATION (User submitted form)
    ↓
AWAITING_SAMPLE_PREVIEW (Seller designing)
    ↓
SAMPLE_SHARED (Seller sent preview)
    ↓
APPROVED (Customer approved)
    ↓
PAYMENT_CONFIRMED (Order paid)
    ↓
PRINTING_IN_PROGRESS (3D printing)
    ↓
READY_TO_SHIP (Quality check passed)
    ↓
DELIVERED (Customer received)
```

---

## 🎁 Related Custom Products Template

Use this template to add similar customizable products:

```mjs
// scripts/scraping/scrape_[vendor].mjs
const scrapedProducts = [
  {
    name: "Product Name",
    description: "Full description...",
    original_price: 999,
    discount_price: 799,
    // ... rest of fields
    item_details_data: {
      category: "Category",
      customization: "Photo/Text/Design Upload Required",
      specifications: {
        requiresCustomization: true,
        customizationFields: ["photo", "size", "text"],
        sampleProcess: "WhatsApp preview"
      }
    }
  }
];
```

---

## ✅ Quality Checklist

Before going live:

- [ ] Product appears in search results
- [ ] Product detail page loads correctly
- [ ] LithophaneCustomizer component displays
- [ ] Photo upload works (test with various file sizes)
- [ ] Size selection toggles properly
- [ ] WhatsApp number validation works
- [ ] WhatsApp link opens correctly with pre-filled message
- [ ] Cart displays customization metadata
- [ ] Checkout shows customization badge
- [ ] Mobile responsive design verified
- [ ] No console errors
- [ ] Images load correctly

---

## 📞 Reference Information

**Seller Details:**
- Name: Memorable Gifts
- WhatsApp: +91-7678642888
- Hours: 10 AM - 6 PM, Monday - Saturday
- Website: https://memorablegifts.in/
- Product: https://memorablegifts.in/product/lithophane-photo-frame/

**Technical Support:**
- Components: `src/components/LithophaneCustomizer.jsx`
- Scraper: `scripts/scraping/scrape_memorable_gifts.mjs`
- Product Data: `scripts/scraping/memorable-gifts-lithophane.json`
- Setup Guide: `LITHOPHANE_SETUP.md`
