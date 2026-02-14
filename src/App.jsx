import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import Cart from './components/Cart';
import SearchOverlay from './components/SearchOverlay';
import Toast from './components/Toast';
import WhatsAppChat from './components/WhatsAppChat';
import FloatingCart from './components/FloatingCart';
import AuthModal from './components/AuthModal';
import CheckoutModals from './components/CheckoutModals';

import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import DepartmentPage from './pages/DepartmentPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CustomOrderPage from './pages/CustomOrderPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import AddressPage from './pages/AddressPage';

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('wishlistItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('recentlyViewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [authModal, setAuthModal] = useState({ show: false, type: 'login' });
  const [checkoutStep, setCheckoutStep] = useState(null); // 'address' or 'payment'

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Add to cart
  const addToCart = (productId, product) => {
    const existingItem = cartItems.find(item => item.productId === productId);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { productId, product, quantity: 1, id: Date.now() }]);
    }
    
    showToast('Added to cart!');
    setIsCartOpen(true);
  };

  // Update cart quantity
  const updateCartQuantity = (itemId, delta) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(cartItems.map(i =>
      i.id === itemId ? { ...i, quantity: newQty } : i
    ));
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    showToast('Removed from cart');
  };

  // Toggle wishlist
  const toggleWishlist = (productId) => {
    if (wishlistItems.includes(productId)) {
      const newWishlist = wishlistItems.filter(id => id !== productId);
      setWishlistItems(newWishlist);
      showToast('Removed from wishlist');
    } else {
      const newWishlist = [...wishlistItems, productId];
      setWishlistItems(newWishlist);
      showToast('Added to wishlist!');
    }
  };

  // Remove multiple items from wishlist
  const removeFromWishlist = (productIds) => {
    const newWishlist = wishlistItems.filter(id => !productIds.includes(id));
    setWishlistItems(newWishlist);
    const count = productIds.length;
    showToast(`Removed ${count} ${count === 1 ? 'item' : 'items'} from wishlist`);
  };

  // Add to recently viewed
  const addToRecentlyViewed = (productId) => {
    if (!recentlyViewed.includes(productId)) {
      const newViewed = [productId, ...recentlyViewed.slice(0, 5)];
      setRecentlyViewed(newViewed);
    }
  };

  // Show toast
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Start checkout
  const startCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    setIsCartOpen(false);
    setCheckoutStep('address');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="h-full w-full relative bg-slate-50 overflow-x-hidden">
          <PromoBanner />
          <Navbar
            cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onShowAuth={(type) => setAuthModal({ show: true, type })}
          />
        
        <Routes>
          <Route path="/" element={<HomePage 
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlistItems={wishlistItems}
            recentlyViewed={recentlyViewed}
            addToRecentlyViewed={addToRecentlyViewed}
          />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<CategoriesPage />} />
          <Route path="/department/:departmentId" element={<DepartmentPage
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlistItems={wishlistItems}
          />} />
          <Route path="/product/:productId" element={<ProductPage
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlistItems={wishlistItems}
            addToRecentlyViewed={addToRecentlyViewed}
          />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/custom-order" element={<CustomOrderPage showToast={showToast} />} />
          <Route path="/contact" element={<ContactPage showToast={showToast} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/wishlist" element={<WishlistPage
            wishlistItems={wishlistItems}
            toggleWishlist={toggleWishlist}
            removeFromWishlist={removeFromWishlist}
            addToCart={addToCart}
            addToRecentlyViewed={addToRecentlyViewed}
          />} />
          <Route path="/address" element={<AddressPage showToast={showToast} />} />
        </Routes>

        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          updateQuantity={updateCartQuantity}
          removeItem={removeFromCart}
          onCheckout={startCheckout}
        />

        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          addToRecentlyViewed={addToRecentlyViewed}
        />

        <AuthModal
          isOpen={authModal.show}
          type={authModal.type}
          onClose={() => setAuthModal({ show: false, type: 'login' })}
          onSwitchType={(type) => setAuthModal({ show: true, type })}
          showToast={showToast}
        />

        <CheckoutModals
          step={checkoutStep}
          onClose={() => setCheckoutStep(null)}
          cartItems={cartItems}
          onComplete={() => {
            setCheckoutStep(null);
            setCartItems([]);
            showToast('Order placed successfully!');
          }}
          showToast={showToast}
        />

        <Toast show={toast.show} message={toast.message} />
        <FloatingCart 
          cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
        />
        <WhatsAppChat />
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
