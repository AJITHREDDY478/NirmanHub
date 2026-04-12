# ⚡ LITHOPHANE - QUICK REFERENCE CARD

## 🚀 3-STEP SETUP

```bash
# 1️⃣ Generate product data
node scripts/scraping/scrape_memorable_gifts.mjs

# 2️⃣ Import to database
npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json

# 3️⃣ Add component to product page
# See LITHOPHANE_INTEGRATION_EXAMPLE.jsx
```

---

## 📂 KEY FILES

| File | Purpose |
|------|---------|
| `src/components/LithophaneCustomizer.jsx` | Photo upload component |
| `scripts/scraping/memorable-gifts-lithophane.json` | Product data |
| `scripts/scraping/scrape_memorable_gifts.mjs` | Scraper script |
| `LITHOPHANE_README.md` | Main documentation |
| `LITHOPHANE_INTEGRATION_EXAMPLE.jsx` | Code examples |

---

## 💻 CODE SNIPPET

```jsx
import LithophaneCustomizer from '@/components/LithophaneCustomizer';

// In your product detail page:
<LithophaneCustomizer 
  product={product}
  onCustomizationComplete={(customData) => {
    addToCart(product, { customization: customData });
  }}
/>
```

---

## 📊 PRODUCT INFO

| Field | Value |
|-------|-------|
| **Name** | Lithophane Photo Frame - 3D Personalized Art |
| **Price** | ₹449 (₹599 original) |
| **Sizes** | 5x7", 6x8" |
| **WhatsApp** | +91-7678642888 |
| **Time** | 3-5 business days |

---

## ✅ TESTING CHECKLIST

- [ ] Scraper runs successfully
- [ ] JSON file created
- [ ] Product imported to database
- [ ] Search finds "Lithophane"
- [ ] Component displays on product page
- [ ] Photo upload works
- [ ] Size selection works
- [ ] WhatsApp link opens correctly
- [ ] Mobile responsive
- [ ] No console errors

---

## 🎯 INTEGRATION CHECKLIST

- [ ] Import product
- [ ] Add LithophaneCustomizer to product page
- [ ] Handle customization in addToCart
- [ ] Update cart display
- [ ] Update checkout process
- [ ] Test full workflow
- [ ] Go live

---

## 🔧 TROUBLESHOOTING

**Product not found?**
```bash
npm run import:products --input ./scripts/scraping/memorable-gifts-lithophane.json --dry-run
```

**Component not showing?**
```jsx
console.log('Is customizable?', product.name.includes('Lithophane'));
```

**WhatsApp link not working?**
- Check phone: +917678642888
- Ensure WhatsApp installed
- Test: https://wa.me/917678642888?text=test

---

## 📚 DOCUMENTATION

| Doc | Find |
|-----|------|
| Overview | LITHOPHANE_README.md |
| Tech Details | LITHOPHANE_PRODUCT_GUIDE.md |
| Full Setup | LITHOPHANE_SETUP.md |
| Code Examples | LITHOPHANE_INTEGRATION_EXAMPLE.jsx |
| Quick Index | LITHOPHANE_INTEGRATION_INDEX.md |

---

## 🎨 CUSTOMIZE

### Change Color:
```jsx
// In LithophaneCustomizer.jsx
bg-blue-600 → bg-purple-600
```

### Change Max File Size:
```jsx
// In LithophaneCustomizer.jsx (line ~80)
300 * 1024 * 1024  // Change 300 to your size
```

### Change WhatsApp Number:
```jsx
// In LithophaneCustomizer.jsx
https://wa.me/917678642888
```

---

## 💾 DATA STRUCTURE

**Customization Object:**
```json
{
  "productId": "uuid",
  "selectedSize": "5x7",
  "uploadedImage": "photo.jpg",
  "whatsappNumber": "9876543210",
  "status": "pending-confirmation",
  "timestamp": "2026-04-12T10:30:00Z"
}
```

---

## 🌐 URLS

| Link | Purpose |
|------|---------|
| `+91-7678642888` | WhatsApp contact |
| `https://memorablegifts.in/` | Seller website |
| `https://wa.me/917678642888` | Direct WhatsApp |

---

## 📞 SUPPORT

**Seller:** +91-7678642888 (10 AM - 6 PM, Mon-Sat)

**Docs:** Check files above first

---

## ⚡ ONE-LINER COMMANDS

```bash
# Generate + Import in one line
node scripts/scraping/scrape_memorable_gifts.mjs && npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json

# Dry run to check
npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json --dry-run
```

---

## 🎯 QUICK TIPS

✅ Product sizes: 5x7" and 6x8" (same price)
✅ Max upload: 300 MB
✅ Processing: 3-5 days
✅ Fully responsive component
✅ WhatsApp-based ordering
✅ Sample preview workflow
✅ Can customize colors/sizes in component

---

## 🚀 GO LIVE CHECKLIST

1. ✅ Import product
2. ✅ Add component
3. ✅ Test on desktop
4. ✅ Test on mobile
5. ✅ Test WhatsApp
6. ✅ Ready for launch!

---

**Need more details? See LITHOPHANE_README.md**
