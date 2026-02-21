import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, getAllProducts } from '../utils/catalogService';
import { renderStars, formatPrice } from '../utils/helpers';
import ProductCard from '../components/ProductCard';

export default function ProductPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Touch/swipe handling refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Get all images for product
  const productImages = useMemo(() => {
    if (!product) return [];
    const images = [];
    if (product.image) images.push(product.image);
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
      images.push(...product.additionalImages);
    }
    return images;
  }, [product]);

  // Swipe handlers for image navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold && productImages.length > 1) {
      if (diff > 0) {
        // Swipe left - next image
        setSelectedImageIndex(prev => 
          prev < productImages.length - 1 ? prev + 1 : 0
        );
      } else {
        // Swipe right - previous image
        setSelectedImageIndex(prev => 
          prev > 0 ? prev - 1 : productImages.length - 1
        );
      }
    }
  };

  useEffect(() => {
    setSelectedImageIndex(0); // Reset image selection when product changes
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await getProductById(productId);
      setProduct(data);
      
      if (data) {
        addToRecentlyViewed(data.id);
        // Fetch related products
        const { data: allProducts } = await getAllProducts();
        const related = allProducts.filter(p => 
          p.category === data.category && p.id !== data.id
        ).slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    };
    
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h2>
          <Link to="/" className="text-amber-600 hover:text-amber-700">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-6 sm:mb-8 text-xs sm:text-sm text-slate-600">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-amber-600">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Product Image */}
          <div className="relative group">
            <div 
              className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {productImages.length > 0 ? (
                <img 
                  src={productImages[selectedImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-contain select-none pointer-events-none" 
                  draggable="false"
                />
              ) : product.emoji ? (
                <span className="text-6xl sm:text-7xl md:text-9xl">{product.emoji}</span>
              ) : (
                <span className="text-6xl">📦</span>
              )}
              
              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : productImages.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => prev < productImages.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Image Thumbnails - Only show if more than 1 image */}
            {productImages.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-amber-500 ring-2 ring-amber-200' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {product.isNew && (
              <span className="absolute top-6 left-6 px-4 py-2 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold rounded-full animate-badge-pulse">NEW</span>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">{product.name}</h1>
            
            {/* Reviews removed per product owner request. */}

            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-600">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg sm:text-xl text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-600 text-white text-sm font-bold rounded-full shadow-md">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-slate-600 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed">
              {product.description || `Experience the best in ${product.category} with this premium ${product.name}. Crafted with quality materials and designed for excellence.`}
            </p>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-slate-300 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                    </svg>
                  </button>
                  <input type="text" value={quantity} readOnly className="w-16 text-center font-bold text-slate-800 bg-white" />
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-slate-500">In Stock</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button onClick={() => addToCart(product.id, product, quantity)} className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 touch-manipulation">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                Add to Cart
              </button>
              <button onClick={() => toggleWishlist(product.id)} className={`px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl transition-all transform hover:scale-105 touch-manipulation flex items-center justify-center ${wishlistItems.includes(product.id) ? 'bg-red-50 border-red-500 text-red-500' : 'border-slate-300 text-slate-600 hover:border-amber-500 hover:text-amber-600'}`}>
                <svg className={`w-6 h-6 ${wishlistItems.includes(product.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>

            {/* Product Info */}
            <div className="space-y-3 sm:space-y-4 border-t border-slate-200 pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-slate-700">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Free shipping on orders over ₹999</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>30-day easy returns</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span>1 year warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-12 md:mb-16">
          <div className="flex border-b border-slate-200 mb-6 sm:mb-8">
            <button onClick={() => setSelectedTab('description')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'description' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Description
              {selectedTab === 'description' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('specs')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'specs' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Specification
              {selectedTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('customization')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'customization' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Customization
              {selectedTab === 'customization' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
            </button>
          </div>

          <div className="prose max-w-none">
            {selectedTab === 'description' && (
              <div className="text-slate-600 leading-relaxed">
                <p className="mb-4">
                  Discover the perfect blend of style and functionality with our {product.name}. This premium product from our {product.category} collection is designed to exceed your expectations.
                </p>
                <p className="mb-4">
                  Crafted with attention to detail and quality materials, this item represents the pinnacle of modern design and engineering. Whether you're looking to upgrade your collection or find the perfect gift, this product delivers exceptional value.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">Key Features:</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>Premium quality construction</li>
                  <li>Modern and elegant design</li>
                  <li>Durable and long-lasting</li>
                  <li>Easy to use and maintain</li>
                  <li>Backed by our quality guarantee</li>
                </ul>
              </div>
            )}

            {selectedTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4">
                  <span className="text-sm text-slate-500">Category</span>
                  <p className="font-semibold text-slate-800">{product.category}</p>
                </div>

                {/* Dynamically render specifications object keys */}
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="border border-slate-200 rounded-lg p-4">
                      <span className="text-sm text-slate-500">{key}</span>
                      <p className="font-semibold text-slate-800">{value || '—'}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-1 sm:col-span-2 text-slate-500">No specifications provided.</div>
                )}
              </div>
            )}

            {selectedTab === 'customization' && (
              <div className="space-y-4 text-slate-600">
                <p className="mb-2">Choose from the available customization options for this product. These options are set by the seller during upload.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.customizationOptions && Object.keys(product.customizationOptions).length > 0 ? (
                    Object.entries(product.customizationOptions).map(([k, v]) => (
                      <div key={k} className="border border-slate-200 rounded-lg p-4">
                        <span className="text-sm text-slate-500">{k}</span>
                        <p className="font-semibold text-slate-800">{typeof v === 'boolean' ? (v ? 'Available' : 'Not available') : v}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-1 sm:col-span-2 text-slate-500">No customization options provided.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map(relProduct => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={addToCart}
                  onToggleWishlist={toggleWishlist}
                  isWishlisted={wishlistItems.includes(relProduct.id)}
                  onViewDetails={(id) => navigate(`/product/${id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
