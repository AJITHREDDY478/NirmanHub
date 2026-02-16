import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { products } from '../data/products';
import { renderStars, formatPrice } from '../utils/helpers';

export default function ProductPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');

  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id);
    }
    // Scroll to top when product changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product, productId]);

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

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
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
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl md:rounded-3xl flex items-center justify-center text-6xl sm:text-7xl md:text-9xl shadow-2xl md:sticky md:top-24">
              {product.emoji}
            </div>
            {product.isNew && (
              <span className="absolute top-6 left-6 px-4 py-2 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-bold rounded-full animate-badge-pulse">NEW</span>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {renderStars(product.rating)}
              </div>
              <span className="text-slate-600">{product.rating}</span>
              <span className="text-slate-400">({product.reviews} reviews)</span>
            </div>

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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button onClick={() => addToCart(product.id, product, quantity)} className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 touch-manipulation">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                Add to Cart
              </button>
              <button onClick={() => toggleWishlist(product.id)} className={`sm:px-6 py-3 sm:py-4 border-2 rounded-xl transition-all transform hover:scale-105 touch-manipulation ${wishlistItems.includes(product.id) ? 'bg-red-50 border-red-500 text-red-500' : 'border-slate-300 text-slate-600 hover:border-amber-500 hover:text-amber-600'}`}>
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
          <div className="flex gap-4 sm:gap-6 md:gap-8 border-b border-slate-200 mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
            <button onClick={() => setSelectedTab('description')} className={`pb-3 sm:pb-4 font-semibold text-sm sm:text-base whitespace-nowrap transition-colors relative touch-manipulation ${selectedTab === 'description' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Description
              {selectedTab === 'description' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('specs')} className={`pb-4 font-semibold transition-colors relative ${selectedTab === 'specs' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Specifications
              {selectedTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('reviews')} className={`pb-4 font-semibold transition-colors relative ${selectedTab === 'reviews' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}>
              Reviews
              {selectedTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-teal-500 tab-underline"></div>}
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
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="text-sm text-slate-500">Product ID</span>
                  <p className="font-semibold text-slate-800">#{product.id}</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="text-sm text-slate-500">Department</span>
                  <p className="font-semibold text-slate-800">{product.department}</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <span className="text-sm text-slate-500">Rating</span>
                  <p className="font-semibold text-slate-800">{product.rating} / 5.0</p>
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div>
                <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-slate-800">{product.rating}</div>
                    <div className="flex items-center justify-center mt-2">{renderStars(product.rating)}</div>
                    <div className="text-sm text-slate-600 mt-1">{product.reviews} reviews</div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-slate-600 w-12">{star} star</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${star === 5 ? 70 : star === 4 ? 20 : 10}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600">Customer reviews help us improve our products and service. Share your experience!</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-800 mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {relatedProducts.map(relProduct => (
                <div key={relProduct.id} onClick={() => navigate(`/product/${relProduct.id}`)} className="product-card bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-lg cursor-pointer touch-manipulation">
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl product-image">
                      {relProduct.emoji}
                    </div>
                    {relProduct.isNew && (
                      <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-xs font-bold rounded-full">NEW</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-medium text-sm sm:text-base text-slate-800 truncate">{relProduct.name}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <div className="flex items-center scale-75 sm:scale-100 origin-left">{renderStars(relProduct.rating)}</div>
                      <span className="text-xs text-slate-500">({relProduct.reviews})</span>
                    </div>
                    <p className="text-amber-600 font-bold text-base sm:text-lg mt-1">{formatPrice(relProduct.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
