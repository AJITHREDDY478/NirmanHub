import { useState } from 'react';

export default function FloatingCart({ cartItemsCount, onOpenCart }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't show cart button if cart is empty
  if (cartItemsCount === 0) return null;

  return (
    <div className="relative">
      {/* Floating Cart Button */}
      <button
        onClick={onOpenCart}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full flex items-center justify-center shadow-2xl hover:shadow-amber-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="View Cart"
      >
        {/* Shopping Cart Icon */}
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>

        {/* Cart Count Badge */}
        {cartItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[28px] h-[28px] px-1.5 bg-red-500 rounded-full text-white text-sm font-extrabold flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            {cartItemsCount}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-6 left-24 z-50 hidden md:block animate-fadeIn">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <span className="text-sm font-medium">View Cart</span>
            {cartItemsCount > 0 && (
              <span className="ml-2 text-xs text-amber-300">({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'})</span>
            )}
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-slate-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
