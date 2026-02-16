import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllProducts } from '../utils/catalogService';
import ProductCard from '../components/ProductCard';

export default function WishlistPage({ wishlistItems, toggleWishlist, removeFromWishlist, addToCart, addToRecentlyViewed }) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await getAllProducts();
      setAllProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);
  
  const wishlistProducts = allProducts.filter(p => wishlistItems.includes(p.id));

  const handleSelectAll = () => {
    if (selectedItems.length === wishlistProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlistProducts.map(p => p.id));
    }
  };

  const handleSelectItem = (productId) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const handleClearSelected = () => {
    if (selectedItems.length === 0) return;
    
    // Remove all selected items from wishlist using the bulk removal function
    removeFromWishlist(selectedItems);
    
    // Clear selection
    setSelectedItems([]);
  };

  const allSelected = wishlistProducts.length > 0 && selectedItems.length === wishlistProducts.length;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">My Wishlist</h1>
          <p className="text-slate-600">{wishlistProducts.length} items saved</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading wishlist...</p>
          </div>
        ) : wishlistProducts.length > 0 ? (
          <>
            {/* Selection Controls */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-red-500 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Select All ({wishlistProducts.length} items)
                </label>
              </div>

              <button
                onClick={handleClearSelected}
                disabled={selectedItems.length === 0}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  selectedItems.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 active:scale-100'
                }`}
              >
                {selectedItems.length > 0 ? `Remove Selected (${selectedItems.length})` : 'Remove Selected'}
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="relative">
                  {/* Checkbox Overlay */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(product.id)}
                      onChange={() => handleSelectItem(product.id)}
                      className="w-5 h-5 text-red-500 border-slate-300 rounded focus:ring-red-500 cursor-pointer bg-white shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <ProductCard
                    product={product}
                    onAddToCart={addToCart}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={true}
                    onViewDetails={() => {
                      addToRecentlyViewed(product.id);
                      navigate(`/product/${product.id}`);
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4">
            {/* Animated Heart with Glow */}
            <div className="relative mb-8">
              {/* Soft Glow Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-red-300/20 rounded-full blur-2xl animate-heartGlow" />
              </div>
              
              {/* Heartbeat Icon */}
              <div className="relative z-10 animate-heartbeat select-none">
                <div className="text-9xl">❤️</div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center max-w-md">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Your Wishlist is Empty</h2>
              <p className="text-slate-600 text-lg mb-10">Start adding items you love to your wishlist!</p>
              
              {/* CTA Button */}
              <button 
                onClick={() => navigate('/')} 
                className="px-8 py-4 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white font-semibold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Browse Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
