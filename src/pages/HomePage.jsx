import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProducts, getAllDepartments } from '../utils/catalogService';
import { getDepartmentIcon } from '../utils/departmentIcons';
import { departments as seedDepartments } from '../data/products';
import ThreeBackground from '../components/ThreeBackground';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import BrandLoader from '../components/BrandLoader';

export default function HomePage({ addToCart, toggleWishlist, wishlistItems, recentlyViewed, addToRecentlyViewed }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [modelIndex, setModelIndex] = useState(0);
  const navigate = useNavigate();
  
  // Helper to check if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  
  // Handle product view with navigation and tracking
  const handleViewProduct = (productId) => {
    addToRecentlyViewed(productId);
    navigate(`/product/${productId}`);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      let productList = [];
      try {
        setIsProductsLoading(true);

        // Fetch products
        const { data } = await getAllProducts();
        productList = Array.isArray(data) ? data : [];
        setAllProducts(productList);
        const flaggedFeaturedProducts = productList.filter((product) => product.featuredModel);
        setFeaturedProducts(flaggedFeaturedProducts.slice(0, 8));
      } finally {
        setIsProductsLoading(false);
      }

      // Fetch departments for categories
      const { data: depts } = await getAllDepartments();
      const fallbackDepartments = Array.from(
        new Map(
          productList
            .map((product) => String(product.department || '').trim())
            .filter(Boolean)
            .map((name) => [
              name.toLowerCase(),
              {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                item_details_data: {},
                image_url: ''
              }
            ])
        ).values()
      );

      const sourceDepartments =
        Array.isArray(depts) && depts.length > 0
          ? depts
          : (fallbackDepartments.length > 0 ? fallbackDepartments : seedDepartments);

      const formattedCategories = sourceDepartments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        icon: getDepartmentIcon(dept.name, dept.item_details_data?.icon),
        image:
          dept.image_url ||
          productList.find((product) => product.department?.toLowerCase() === dept.name?.toLowerCase())?.image ||
          '',
        color: dept.item_details_data?.color || 'from-blue-400 to-cyan-500',
        textColor: 'text-slate-600',
        tagline:
          dept.item_details_data?.tagline ||
          seedDepartments.find((seedDepartment) => seedDepartment.name?.toLowerCase() === dept.name?.toLowerCase())?.description ||
          'Crafted collection'
      }));
      setCategories(formattedCategories);
    };
    fetchData();
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
  const processImage = `${import.meta.env.BASE_URL || '/'}Products/Meesho/how_its_made.webp`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Premium 3D Product Showcase */}
      <section className="relative min-h-screen flex items-center overflow-hidden hero-soft-bg">
        <ThreeBackground />
        <div className="absolute inset-0 hero-soft-gradient"></div>
        <div className="hero-grid-overlay"></div>

        <div className="absolute -top-24 -left-10 w-72 h-72 bg-gradient-to-br from-cyan-200/50 to-blue-200/40 rounded-full blur-3xl float-slow"></div>
        <div className="absolute bottom-6 right-0 w-80 h-80 bg-gradient-to-br from-blue-200/40 to-cyan-100/30 rounded-full blur-3xl float-medium"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-4xl">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-slate-900"
            >
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur"
              >
                Custom 3D Printed Products
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                3D printed gifts and custom models, made with care by one creator.
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl leading-relaxed"
              >
                I create physical 3D printed products from photos, ideas, and ready designs. Browse the collection, order a custom piece, and get something made just for you.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-4 max-w-xl text-sm sm:text-base font-medium text-slate-500"
              >
                Personalized figurines, devotional models, gifts, event pieces, and made-to-order prints.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to="/products"
                  className="group relative px-10 py-5 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold text-lg rounded-full shadow-2xl hover:shadow-cyan-400/40 transition-all duration-300 hover:scale-105 touch-manipulation overflow-hidden"
                >
                  <span className="relative z-10">Shop 3D Products</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A78D1] to-[#29C4FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <Link
                  to="/custom-order"
                  className="px-10 py-5 bg-white/80 backdrop-blur-sm text-slate-800 font-semibold text-lg rounded-full border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300 hover:scale-105 touch-manipulation shadow-lg"
                >
                  Start Custom Order
                </Link>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 sm:py-16 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Featured Models</h2>
            <p className="text-slate-600 text-base sm:text-lg px-4">Handpicked selections from our premium collection</p>
          </div>

          {isProductsLoading ? (
            <BrandLoader message="Loading featured models..." compact />
          ) : (
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
          )}

          <div className="text-center mt-12">
            <Link to="/products" className="inline-block px-8 py-4 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white rounded-full font-bold text-lg hover:scale-110 transition-transform shadow-xl hover:shadow-cyan-400/50">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,39,64,0.08)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">How It’s Made</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">From your photo to a finished 3D keepsake</h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Upload a clear reference photo, we sculpt the model digitally, prepare it for printing, and finish it into a polished custom piece.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative mt-6"
              >
                <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle,_rgba(41,196,255,0.16),_transparent_70%)] blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
                  <img
                    src={processImage}
                    alt="Custom 3D model creation process from photo to completed figure"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  'Upload photo',
                  'We sculpt it',
                  'Print and finish',
                  'Packed and delivered'
                ].map((step) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white text-sm font-bold">✓</span>
                    <span className="text-sm sm:text-base font-medium text-slate-800">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/custom-order"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold hover:scale-[1.02] transition-transform shadow-lg"
                >
                  Start Your Custom Order
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Browse Ready Models
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Animated Product Strip */}
      {categories.length > 0 && (
        <section className="py-6 bg-white border-y border-slate-200 overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {categories.concat(categories).map((category, index) => (
              <motion.div
                key={`${category.id}-${index}`}
                whileHover={{ scale: 1.05, y: -4 }}
                className="flex-shrink-0 group cursor-pointer"
              >
                <Link to={`/department/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-100/60 transition-all">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} p-0.5`}>
                      <div className="w-full h-full rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        {category.image ? (
                          isVideoUrl(category.image) ? (
                            <video src={category.image} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          )
                        ) : (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{category.name}</h4>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Categories - Studio Originals Style */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-20 px-4 bg-[radial-gradient(circle_at_top,_rgba(255,244,220,0.95),_rgba(255,251,244,0.98)_38%,_#ffffff_100%)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#4d3d1f]"
              >
                Shop by Category
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[#8a7b66] text-base sm:text-lg max-w-2xl mx-auto"
              >
                Discover our curated department collections through bold visual previews
              </motion.p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                >
                  <Link
                    to={`/department/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group block h-full"
                  >
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.25 }}
                      className="relative h-full rounded-[1.75rem] bg-[#fbf5ec]/95 p-3 sm:p-4 shadow-[0_14px_34px_rgba(122,96,49,0.11)] ring-1 ring-[#efe0c8] overflow-hidden"
                    >
                      <div className="absolute inset-x-6 top-0 h-20 rounded-full bg-[radial-gradient(circle,_rgba(226,197,145,0.22),_transparent_70%)] blur-2xl opacity-80" />

                      <div className="relative">
                        <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#b99369] via-[#d4a077] to-[#f0dfc7] aspect-[4/3]">
                          {category.image ? (
                            isVideoUrl(category.image) ? (
                              <video
                                src={category.image}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl bg-[linear-gradient(180deg,_rgba(134,144,89,0.92),_rgba(238,221,193,0.85))]">
                              {category.icon}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,39,18,0.05),transparent_45%,rgba(52,39,18,0.14))]" />
                        </div>

                        <div className="px-2 pt-4 pb-2 text-center">
                          <h3 className="text-lg sm:text-xl md:text-2xl leading-tight font-bold text-[#4d3d1f]">
                            {category.name}
                          </h3>
                          <p className="mt-2 text-sm sm:text-base text-[#8f7d67] line-clamp-2">
                            {category.tagline}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12 sm:mt-16"
            >
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4d3d1f] to-[#7a6336] text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-amber-200/70"
              >
                View All Categories
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

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
                        className="flex-shrink-0 w-52 snap-start group/card"
                      >
                        {/* Card Wrapper with Backdrop */}
                        <div className="h-full bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-cyan-200/60 hover:scale-105 hover:-translate-y-1">
                          {/* Product Card Content */}
                          <div className="relative h-full">
                            <ProductCard
                              product={product}
                              onAddToCart={addToCart}
                              onToggleWishlist={toggleWishlist}
                              isWishlisted={wishlistItems.includes(product.id)}
                              onViewDetails={handleViewProduct}
                              darkMode={false}
                              compact={true}
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
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-[#0B1F35] to-[#0F2740] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">Ready to Create Something Unique?</h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 px-4">
            Our custom 3D printing service brings your imagination to life. From concept to creation, we're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/custom-order" className="px-8 py-4 bg-gradient-to-r from-[#29C4FF] to-[#67E1FF] rounded-full font-bold text-lg hover:scale-110 transition-transform shadow-2xl hover:shadow-cyan-400/50 text-[#0B1F35]">
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-[#0A78D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
