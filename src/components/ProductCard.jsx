import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onViewDetails,
  darkMode = false
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(product.id);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product.id, product);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
      onClick={handleCardClick}
      className={`group relative flex flex-col h-full cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
        darkMode
          ? 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/30'
          : 'bg-white border border-slate-100 shadow-md hover:shadow-xl hover:border-slate-200'
      }`}
    >
      {/* Image Container */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
        <motion.div
          className="aspect-[4/3] flex items-center justify-center text-4xl sm:text-5xl"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {product.emoji}
        </motion.div>

        {/* Badges Container */}
        <div className="absolute top-3 left-0 right-0 px-3 flex items-start justify-between pointer-events-none">
          {/* Left Badges */}
          <div className="flex flex-col gap-2">
            {product.isNew && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg"
              >
                NEW
              </motion.span>
            )}
            {discount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg"
              >
                -{discount}%
              </motion.span>
            )}
          </div>

          {/* Wishlist Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistClick}
            className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : darkMode
                ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Content Container */}
      <div className={`flex flex-col flex-grow p-3 sm:p-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {/* Category */}
        {product.subcategory && (
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
            darkMode ? 'text-white/60' : 'text-slate-500'
          }`}>
            {product.subcategory}
          </p>
        )}

        {/* Title */}
        <h3 className={`font-bold text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>
            {'★'.repeat(Math.floor(product.rating))}
            {'☆'.repeat(5 - Math.floor(product.rating))}
          </div>
          <span className={`text-xs ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            ({product.reviews})
          </span>
        </div>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className={`text-xs sm:text-sm line-through ${darkMode ? 'text-white/50' : 'text-slate-400'}`}>
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          className={`w-full mt-auto py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            darkMode
              ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Add to Cart
        </motion.button>

        {/* Click to View Hint */}
        <p className={`text-center text-xs mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
          darkMode ? 'text-white/40' : 'text-slate-400'
        }`}>
          Click to view details
        </p>
      </div>
    </motion.div>
  );
}
