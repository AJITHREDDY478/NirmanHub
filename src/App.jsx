import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import Cart from './components/Cart';
import SearchOverlay from './components/SearchOverlay';
import Toast from './components/Toast';
import WhatsAppChat from './components/WhatsAppChat';
import FloatingCart from './components/FloatingCart';
import AuthModal from './components/AuthModal';
import CheckoutModals from './components/CheckoutModals';
import { getUserCart, addToUserCart, updateCartItemQuantity, removeFromUserCart, clearUserCart } from './utils/userService';

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
import ProductUploadPage from './pages/ProductUploadPage';

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
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
  const [cartLoading, setCartLoading] = useState(false);

  // Load cart from database when user logs in
  useEffect(() => {
    if (user?.id) {
      loadUserCart();
      localStorage.removeItem('cartItems'); // Clear localStorage after loading from DB
    } else {
      // When user logs out, switch back to localStorage
      const saved = localStorage.getItem('cartItems');
      setCartItems(saved ? JSON.parse(saved) : []);
    }
  }, [user?.id]);

  // Global scroll position save/restore
  const scrollPositionsRef = useRef({});
  const currentPathRef = useRef(location.pathname);
  const redirectHandledRef = useRef(false);

  // Save scroll position continuously on scroll events (not on navigation)
  const isNavigatingRef = useRef(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Don't save during navigation (prevents ProductPage scrollTo(0) from overwriting)
      if (isNavigatingRef.current) return;
      scrollPositionsRef.current[currentPathRef.current] = window.scrollY;
    };

    // Save immediately when clicking (before navigation happens)
    const handleClick = (e) => {
      // Check if click is on a link or inside a link
      const link = e.target.closest('a, [role="link"], .cursor-pointer');
      if (link) {
        // Mark navigation starting - block scroll saves for 500ms
        scrollPositionsRef.current[currentPathRef.current] = window.scrollY;
        isNavigatingRef.current = true;
        setTimeout(() => { isNavigatingRef.current = false; }, 500);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  // Handle route changes - restore scroll on POP, scroll to top on PUSH
  useEffect(() => {
    const savedY = scrollPositionsRef.current[location.pathname];
    
    // Update current path reference AFTER we read the saved position
    currentPathRef.current = location.pathname;

    // On browser back/forward (POP), restore scroll after content renders
    if (navigationType === 'POP') {
      if (savedY !== undefined && savedY > 0) {
        // Temporarily disable smooth scroll for instant jump
        document.documentElement.style.scrollBehavior = 'auto';

        const tryRestore = (attempts = 0) => {
          // Wait until page is tall enough to scroll to saved position, or give up after 2s
          if (document.documentElement.scrollHeight >= savedY + window.innerHeight || attempts > 20) {
            window.scrollTo(0, savedY);
            // Re-enable smooth scroll after a tick
            requestAnimationFrame(() => {
              document.documentElement.style.scrollBehavior = '';
            });
          } else {
            setTimeout(() => tryRestore(attempts + 1), 100);
          }
        };
        tryRestore();
      }
    } else if (navigationType === 'PUSH') {
      // For new navigations (not product page which handles its own), scroll to top
      if (!location.pathname.startsWith('/product/')) {
        window.scrollTo(0, 0);
      }
    }
  }, [location.pathname, navigationType]);

  useEffect(() => {
    // Only handle redirect once per session to avoid history issues
    if (redirectHandledRef.current) return;
    
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      redirectHandledRef.current = true;
      const normalized = redirect.replace(/^\/+/, '');
      navigate(`/${normalized}`, { replace: true });
    }
  }, [location.search, navigate]);

  const loadUserCart = async () => {
    setCartLoading(true);
    const { data, error } = await getUserCart(user.id);
    if (!error && data) {
      const formattedCart = data.map(item => ({
        id: item.id,
        productId: item.product_id,
        product: item.product_data,
        quantity: item.quantity,
        dbId: item.id // Store database ID
      }));
      setCartItems(formattedCart);
    }
    setCartLoading(false);
  };

  // Save to localStorage when offline, or to database when logged in
  useEffect(() => {
    if (user?.id) {
      // Don't auto-save to localStorage when logged in
      return;
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems, user?.id]);

  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Add to cart
  const addToCart = async (productId, product) => {
    try {
      if (user?.id) {
        // Save to database for authenticated users
        const { error } = await addToUserCart(user.id, productId, product, 1);
        if (error) {
          console.error('Failed to add to cart:', error);
          showToast('Failed to add to cart. Please try again.');
          return;
        }
        await loadUserCart();
        showToast('Added to cart!');
      } else {
        // Use localStorage for non-authenticated users
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
      }
      setIsCartOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Error adding to cart. Please try again.');
    }
  };

  // Update cart quantity
  const updateCartQuantity = async (itemId, delta) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (user?.id && item.dbId) {
      // Update in database
      await updateCartItemQuantity(user.id, item.dbId, newQty);
      await loadUserCart();
    } else {
      // Update in localStorage
      setCartItems(cartItems.map(i =>
        i.id === itemId ? { ...i, quantity: newQty } : i
      ));
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    if (user?.id && item.dbId) {
      // Remove from database
      await removeFromUserCart(user.id, item.dbId);
      await loadUserCart();
    } else {
      // Remove from localStorage
      setCartItems(cartItems.filter(item => item.id !== itemId));
    }
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
    <div className="min-h-screen w-full relative bg-slate-50 overflow-x-hidden">
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
        addToRecentlyViewed={addToRecentlyViewed}
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
      <Route path="/products/upload" element={<ProductUploadPage showToast={showToast} />} />
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
      onComplete={async () => {
        setCheckoutStep(null);
        if (user?.id) {
          await clearUserCart(user.id);
        }
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
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
