import { useNavigate } from 'react-router-dom';

export default function Cart({ isOpen, onClose, cartItems, updateQuantity, removeItem, onCheckout }) {
  const navigate = useNavigate();
  const total = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm ${isOpen ? '' : 'hidden'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside className={`cart-sidebar fixed right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-sm sm:max-w-md bg-white z-[95] shadow-2xl flex flex-col rounded-t-2xl ${isOpen ? 'active' : ''}`}>
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-800">Your Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500">
              {/* Animated Cart Icon with Bounce */}
              <div className="relative mb-6 h-20 flex items-center justify-center">
                {/* Soft Shadow Orb */}
                <div className="absolute w-20 h-20 bg-blue-300/10 rounded-full blur-xl animate-cartGlow" />
                
                {/* Bouncing Cart Icon */}
                <svg className="w-20 h-20 text-blue-500 relative z-10 animate-cartBounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              {/* Content */}
              <p className="text-xl font-bold text-slate-800 mb-2">Your Cart is Empty</p>
              <p className="text-slate-600 text-base mb-8">Start adding products to see them here</p>
              
              {/* CTA Button */}
              <button
                onClick={() => {
                  onClose();
                  navigate('/categories');
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Shop Products
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="cart-item-enter bg-slate-50 rounded-xl p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl flex-shrink-0">
                  {item.product?.emoji || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 truncate">{item.product?.name || 'Unknown'}</h4>
                  <p className="text-amber-600 font-bold">₹{(item.product?.price || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                      </svg>
                    </button>
                    <span className="font-medium text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-bold text-xl text-slate-800">₹{total.toLocaleString()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Checkout
            </button>
            <div className="text-center mt-4 text-xs text-slate-500 italic">
              CRAFTED WITH CARE BY NirmanaHub
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
