# ✅ Setup Checklist - NirmanaHub

Follow these steps in order to get your project running:

---

## Step 1: Verify Node.js Installation

Open Command Prompt (Win + R, type `cmd`, press Enter) and run:

```bash
node --version
npm --version
```

### ✅ Expected Output:
```
v20.x.x (or v16+)
10.x.x (or 8+)
```

### ❌ If you see "not recognized":
1. Download Node.js from: https://nodejs.org/
2. Install the LTS version (Long Term Support)
3. Restart your computer
4. Try again

---

## Step 2: Navigate to Project Directory

In Command Prompt:

```bash
cd c:\Users\Admin\Desktop\NirmanaHub
```

### ✅ Expected: 
You're now in the project folder

---

## Step 3: Install Dependencies

Run:

```bash
npm install
```

### ✅ Expected:
- You'll see downloading progress
- Takes 2-5 minutes
- Creates `node_modules` folder
- Creates `package-lock.json` file

### ⏰ Wait Time:
This step takes a few minutes. Be patient!

---

## Step 4: Start Development Server

Run:

```bash
npm run dev
```

### ✅ Expected Output:
```
VITE v5.1.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 🎯 Server is Running!
The terminal will stay open - this is normal!

---

## Step 5: Open in Browser

Open your web browser and go to:

```
http://localhost:5173
```

### ✅ You Should See:
- NirmanaHub homepage
- Hero section with animated background
- Product grid
- Navigation bar
- All features working

---

## 🎉 Success Indicators

Check these to confirm everything is working:

- [ ] Home page loads
- [ ] Products are visible
- [ ] Can click on products
- [ ] Can add items to cart
- [ ] Cart icon shows count
- [ ] Search works
- [ ] Navigation links work
- [ ] Pages load smoothly
- [ ] No errors in browser console (F12)

---

## 🛑 Common Issues

### Issue 1: "npm is not recognized"
**Solution:** Install Node.js first (Step 1)

### Issue 2: "Cannot find module..."
**Solution:** Run `npm install` again

### Issue 3: Port already in use
**Solution:** Vite will use next available port (5174, 5175, etc.)

### Issue 4: Blank page
**Solution:** 
- Check browser console (F12) for errors
- Make sure all files are present
- Try refreshing the page

### Issue 5: Slow installation
**Solution:** 
- Check internet connection
- Wait patiently (can take 5+ min on slow connections)

---

## 📁 Files You Should Have

### Root Directory (11 files):
- [ ] package.json
- [ ] vite.config.js
- [ ] tailwind.config.js
- [ ] postcss.config.js
- [ ] .gitignore
- [ ] index.html
- [ ] README.md
- [ ] SETUP_GUIDE.md
- [ ] QUICKSTART.md
- [ ] PROJECT_SUMMARY.md
- [ ] SETUP_CHECKLIST.md (this file)

### src/ Directory:
- [ ] main.jsx
- [ ] App.jsx
- [ ] index.css

### src/components/ (8 files):
- [ ] Navbar.jsx
- [ ] Cart.jsx
- [ ] SearchOverlay.jsx
- [ ] Toast.jsx
- [ ] AuthModal.jsx
- [ ] CheckoutModals.jsx
- [ ] WhatsAppChat.jsx
- [ ] PromoBanner.jsx

### src/pages/ (9 files):
- [ ] HomePage.jsx
- [ ] ProductPage.jsx
- [ ] CategoriesPage.jsx
- [ ] DepartmentPage.jsx
- [ ] WishlistPage.jsx
- [ ] OrdersPage.jsx
- [ ] AddressPage.jsx
- [ ] AboutPage.jsx
- [ ] ContactPage.jsx

### src/data/:
- [ ] products.js

### src/utils/:
- [ ] helpers.jsx

---

## 🎯 Quick Commands Reference

| Command | What It Does |
|---------|-------------|
| `node --version` | Check Node.js version |
| `npm --version` | Check npm version |
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| Ctrl + C | Stop dev server |

---

## 📖 Need More Help?

1. **Quick Start:** Read `QUICKSTART.md`
2. **Detailed Setup:** Read `SETUP_GUIDE.md`
3. **Project Info:** Read `PROJECT_SUMMARY.md`
4. **General Info:** Read `README.md`

---

## 🚀 You're All Set!

Once the dev server is running and you can see the site in your browser:

**✅ YOUR PROJECT IS WORKING!**

Now you can:
- Browse products
- Add items to cart
- Test all features
- Start customizing
- Build your own features

---

## 💡 Pro Tips

1. **Keep terminal open** while developing - that's your dev server
2. **Changes auto-refresh** - just save files and browser updates
3. **Check console** (F12) if something doesn't work
4. **Use Ctrl + C** in terminal to stop the server
5. **Run `npm run dev`** again to restart

---

## 🎊 Final Checklist

Before you start developing:

- [ ] Node.js installed
- [ ] Project dependencies installed (`node_modules` exists)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser shows the website
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Can add items to cart
- [ ] All features work

**If all boxes are checked, you're ready to code!** 🎉

---

*Happy Coding! 💻*
*Questions? Check SETUP_GUIDE.md for detailed troubleshooting*
