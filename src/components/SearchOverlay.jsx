import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';

export default function SearchOverlay({ isOpen, onClose, addToRecentlyViewed }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredProducts = query.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.department.toLowerCase().includes(query.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleProductClick = (productId) => {
    addToRecentlyViewed(productId);
    navigate(`/product/${productId}`);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay active fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm">
      <div className="h-full flex items-start justify-center pt-16 sm:pt-20 md:pt-24 px-4">
        <div className="w-full max-w-2xl animate-scale-in">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl border-0 shadow-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/30"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {query.trim() && (
            <div className="mt-3 sm:mt-4 bg-white rounded-xl sm:rounded-2xl shadow-xl max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-slate-500 text-sm sm:text-base">
                  No products found for "{query}"
                </div>
              ) : (
                filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p.id)}
                    className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3 sm:gap-4 transition-colors animate-fade-in touch-manipulation"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-slate-800 truncate">{p.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{p.department} / {p.subcategory}</p>
                    </div>
                    <span className="font-bold text-sm sm:text-base text-amber-600 flex-shrink-0">₹{p.price.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
