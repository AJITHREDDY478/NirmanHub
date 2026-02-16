import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProducts } from '../utils/catalogService';
import ThreeBackground from '../components/ThreeBackground';
import Product3DViewer from '../components/Product3DViewer';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function HomePage({ addToCart, toggleWishlist, wishlistItems, recentlyViewed, addToRecentlyViewed }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [modelIndex, setModelIndex] = useState(0);
  const navigate = useNavigate();
  
  // Handle product view with navigation and tracking
  const handleViewProduct = (productId) => {
    addToRecentlyViewed(productId);
    navigate(`/product/${productId}`);
  };
  
  const categories = [
    { id: 1, name: 'Gifts & Personalized', icon: '🎁', color: 'from-pink-400 to-red-500', textColor: 'text-pink-600', count: 287 },
    { id: 2, name: 'Electronics & Gadgets', icon: '⚡', color: 'from-yellow-400 to-orange-500', textColor: 'text-orange-600', count: 156 },
    { id: 3, name: 'Home & Living', icon: '🏠', color: 'from-green-400 to-emerald-500', textColor: 'text-green-600', count: 312 },
    { id: 4, name: 'Wedding & Events', icon: '💍', color: 'from-purple-400 to-pink-500', textColor: 'text-purple-600', count: 189 },
    { id: 5, name: 'Toys & Kids', icon: '🧸', color: 'from-blue-400 to-cyan-500', textColor: 'text-blue-600', count: 234 },
    { id: 6, name: '3D Printed Toys', icon: '🎮', color: 'from-indigo-400 to-blue-500', textColor: 'text-indigo-600', count: 198 },
    { id: 7, name: '3D Printed Electronics', icon: '🔌', color: 'from-amber-400 to-yellow-500', textColor: 'text-amber-600', count: 142 },
    { id: 8, name: '3D Decor & Art', icon: '🎨', color: 'from-rose-400 to-pink-500', textColor: 'text-rose-600', count: 267 },
    { id: 9, name: 'Miniatures & Models', icon: '🏗️', color: 'from-slate-400 to-gray-500', textColor: 'text-slate-600', count: 156 },
    { id: 10, name: 'Keychains & Accessories', icon: '🔑', color: 'from-teal-400 to-emerald-500', textColor: 'text-teal-600', count: 189 },
    { id: 11, name: 'Figurines & Collectibles', icon: '🗿', color: 'from-orange-400 to-red-500', textColor: 'text-orange-600', count: 234 },
    { id: 12, name: 'Custom Designs', icon: '✨', color: 'from-violet-400 to-purple-500', textColor: 'text-violet-600', count: 512 },
  ];
  
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await getAllProducts();
      setAllProducts(data);
      setFeaturedProducts(data.slice(0, 8));
    };
    fetchProducts();
  }, []);

  const modelSpotlights = [
    { title: 'Architectural Blueprint', category: '🏗️', rating: 4.9, reviews: 1280 },
    { title: 'Modern Building', category: '🏢', rating: 4.8, reviews: 980 },
    { title: 'Residential Villa', category: '🏠', rating: 4.9, reviews: 1420 },
    { title: 'Interior Design Set', category: '🎨', rating: 4.7, reviews: 760 },
    { title: '3D Printer Model', category: '🖨️', rating: 4.8, reviews: 1100 },
    { title: 'Mechanical Parts', category: '⚙️', rating: 4.9, reviews: 930 },
    { title: 'Jewelry Collection', category: '💎', rating: 4.8, reviews: 640 },
    { title: 'Character Models', category: '🎭', rating: 4.7, reviews: 870 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setModelIndex((prev) => (prev + 1) % modelSpotlights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [modelSpotlights.length]);

  const currentModel = modelSpotlights[modelIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Premium 3D Product Showcase */}
      <section className="relative min-h-screen flex items-center overflow-hidden hero-soft-bg">
        <ThreeBackground />
        <div className="absolute inset-0 hero-soft-gradient"></div>
        <div className="hero-grid-overlay"></div>

        <div className="absolute -top-24 -left-10 w-72 h-72 bg-gradient-to-br from-amber-200/60 to-teal-200/40 rounded-full blur-3xl float-slow"></div>
        <div className="absolute bottom-6 right-0 w-80 h-80 bg-gradient-to-br from-emerald-200/50 to-orange-200/40 rounded-full blur-3xl float-medium"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-slate-900 order-2 lg:order-1"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                Experience Products in 3D Before You Buy
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl leading-relaxed"
              >
                Rotate. Customize. Explore. See every detail with immersive 3D previews.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to="/products"
                  className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 touch-manipulation overflow-hidden"
                >
                  <span className="relative z-10">Explore 3D Products</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <Link
                  to="/custom-order"
                  className="px-10 py-5 bg-white/80 backdrop-blur-sm text-slate-800 font-semibold text-lg rounded-full border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300 hover:scale-105 touch-manipulation shadow-lg"
                >
                  Upload Your Design
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-12 flex flex-wrap items-center gap-8"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white"></div>
                    ))}
                  </div>
                  <div className="ml-2 text-sm">
                    <p className="font-semibold text-slate-900">2,500+ users</p>
                    <p className="text-slate-600">joined this month</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-amber-500">
                  <span className="text-2xl">★★★★★</span>
                  <div className="ml-1 text-sm">
                    <p className="font-semibold text-slate-900">4.9/5.0</p>
                    <p className="text-slate-600">from 1,200+ reviews</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: 3D Service Box */}
            <motion.div 
              className="order-1 lg:order-2 relative h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center pr-4 lg:pr-0"
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              style={{ perspective: "1200px" }}
            >
              {/* 3D Box Container with depth */}
              <motion.div
                className="relative w-80 h-96 rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 8px 32px rgba(20, 184, 166, 0.1), inset 0 1px 0 rgba(255,255,255,0.8), 0 20px 60px rgba(0,0,0,0.15)",
                }}
                animate={{
                  y: [0, -12, 0],
                  rotateX: [2, -2, 2],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* 3D Depth Effect - Left Shadow */}
                <div className="absolute -left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/10 to-transparent rounded-full blur-xl"></div>
                {/* 3D Depth Effect - Right Shadow */}
                <div className="absolute -right-8 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/10 to-transparent rounded-full blur-xl"></div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                {/* Content inside box */}
                <div className="h-full flex flex-col justify-center px-8 py-10">
                  {/* Header */}
                  <div className="mb-8">
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2"
                    >
                      Features
                    </motion.p>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
                    >
                      What We Offer
                    </motion.h3>
                  </div>

                  {/* Service Items - Stacked */}
                  <div className="space-y-4 flex-1">
                    {/* Item 1 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        🔍
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">Explore 3D</p>
                        <p className="text-xs text-slate-500 truncate">Browse collection</p>
                      </div>
                    </motion.div>

                    {/* Item 2 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        📤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">Upload Design</p>
                        <p className="text-xs text-slate-500 truncate">Custom orders</p>
                      </div>
                    </motion.div>

                    {/* Item 3 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        🎨
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">Customize</p>
                        <p className="text-xs text-slate-500 truncate">Your product</p>
                      </div>
                    </motion.div>

                    {/* Item 4 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        🛒
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">Buy Online</p>
                        <p className="text-xs text-slate-500 truncate">Easy checkout</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom accent line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="mt-6 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-teal-400 rounded-full opacity-60"
                    style={{ transformOrigin: "left" }}
                  ></motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Horizontal Animated Product Strip */}
      <section className="py-6 bg-white border-y border-slate-200 overflow-hidden">
        <div className="flex gap-8 animate-scroll">
          {categories.concat(categories).map((category, index) => (
            <motion.div
              key={`${category.id}-${index}`}
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex-shrink-0 group cursor-pointer"
            >
              <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 group-hover:border-blue-300 group-hover:shadow-lg transition-all">
                <div className="text-4xl">{category.icon}</div>
                <div>
                  <h4 className="font-semibold text-slate-900">{category.name}</h4>
                  <p className="text-sm text-slate-600">{category.count} products</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories - Modern Redesign */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Shop by Category
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto"
            >
              Explore our premium collection of 3D printed products across diverse categories
            </motion.p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  to={`/department/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group h-full"
                >
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="h-full p-5 sm:p-6 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-slate-200 flex flex-col items-center text-center cursor-pointer"
                  >
                    {/* Icon Container */}
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${category.color} shadow-lg flex items-center justify-center transform transition-all`}
                    >
                      <span className="text-2xl sm:text-4xl filter drop-shadow-lg">{category.icon}</span>
                    </motion.div>

                    {/* Title */}
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                      {category.name}
                    </h3>

                    {/* Product Count */}
                    <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                      {category.count} products
                    </p>

                    {/* Bottom Accent */}
                    <div className="mt-3 sm:mt-4 w-full h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 rounded-full transition-all"></div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12 sm:mt-16"
          >
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-purple-500/50"
            >
              View All Categories
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 sm:py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Featured Models</h2>
            <p className="text-slate-600 text-base sm:text-lg px-4">Handpicked selections from our premium collection</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistItems.includes(product.id)}
                onViewDetails={handleViewProduct}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:scale-110 transition-transform shadow-xl hover:shadow-purple-500/50">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Viewed - Premium Section */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="relative py-20 px-4 overflow-hidden bg-slate-50">
          {/* Premium Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated Gradient Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent animate-gradientShift" />
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-transparent to-purple-500/5 animate-gradientShift animation-delay-2000" />
            
            {/* Soft Floating Particles */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-purple-300/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-300/5 rounded-full blur-3xl animate-float animation-delay-4000" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300/5 rounded-full blur-3xl animate-float animation-delay-2000" />
          </div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto z-10">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Recently Viewed</h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">Products you've checked out</p>
              </motion.div>
            </div>

            {/* Carousel Container */}
            <div className="relative group">
              {/* Left Fade */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-20 pointer-events-none" />
              {/* Right Fade */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-20 pointer-events-none" />

              {/* Scrollable Container */}
              <div 
                className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex gap-6 pb-6">
                  {recentlyViewed.slice(0, 12).map((productId, index) => {
                    const product = allProducts.find(p => p.id === productId);
                    if (!product) return null;
                    
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="flex-shrink-0 w-56 snap-start group/card"
                      >
                        {/* Card Wrapper with Backdrop */}
                        <div className="h-full bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-purple-200/50 hover:scale-105 hover:-translate-y-1">
                          {/* Product Card Content */}
                          <div className="relative h-full">
                            <ProductCard
                              product={product}
                              onAddToCart={addToCart}
                              onToggleWishlist={toggleWishlist}
                              isWishlisted={wishlistItems.includes(product.id)}
                              onViewDetails={handleViewProduct}
                              darkMode={false}
                            />
                          </div>

                          {/* Hover Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 to-transparent opacity-0 group-hover/card:opacity-10 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="text-center mt-8 text-slate-500 text-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>Scroll to explore more</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">Ready to Create Something Unique?</h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 px-4">
            Our custom 3D printing service brings your imagination to life. From concept to creation, we're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/custom-order" className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full font-bold text-lg hover:scale-110 transition-transform shadow-2xl hover:shadow-yellow-500/50 text-slate-900">
              Start Custom Order
            </Link>
            <Link to="/about" className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-full font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/30">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Features Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {/* Premium Quality */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Premium Quality</h3>
              <p className="text-slate-600 text-sm sm:text-base">High-grade materials</p>
            </motion.div>

            {/* Fast Delivery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Fast Delivery</h3>
              <p className="text-slate-600 text-sm sm:text-base">3-5 business days</p>
            </motion.div>

            {/* Secure Payment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Secure Payment</h3>
              <p className="text-slate-600 text-sm sm:text-base">100% protected</p>
            </motion.div>

            {/* 24/7 Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">24/7 Support</h3>
              <p className="text-slate-600 text-sm sm:text-base">Always here to help</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
