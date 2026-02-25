import { useState, useEffect, useRef } from 'react';

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle swipe down to close (mobile)
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd < -80) {
      setIsOpen(false);
    }
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleDirectChat = () => {
    const message = encodeURIComponent(`Hi! I'm interested in your products. Can you help me?`);
    window.open(`https://wa.me/919632038829?text=${message}`, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button - Chat Icon Instead of WhatsApp */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="Open Support Chat"
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Backdrop Overlay - Mobile Only */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden animate-fadeIn"
          onClick={handleBackdropClick}
        />
      )}

      {/* Chat Widget - Responsive Desktop/Mobile */}
      {isOpen && (
        <div
          ref={chatRef}
          className={`
            fixed z-[70] bg-white shadow-2xl overflow-hidden flex flex-col
            
            /* Mobile: Bottom Sheet */
            bottom-0 left-0 right-0 rounded-t-3xl max-h-[80vh] animate-slideUpMobile
            
            /* Desktop: Floating Widget */
            md:bottom-24 md:right-6 md:left-auto md:w-[380px] md:h-[600px] md:max-h-[calc(100vh-120px)] md:rounded-3xl md:animate-slideUpDesktop
          `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
            {/* Drag Handle - Mobile Only */}
            <div className="flex justify-center pt-3 pb-2 bg-gradient-to-r from-green-500 to-green-600 md:hidden">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-4 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">NirmanHub Support</h3>
                  <p className="text-white/90 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    Online now
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors touch-manipulation flex-shrink-0"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 space-y-5">
                {/* Welcome Message */}
                <div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[90%]">
                    <p className="text-slate-800 text-base mb-1.5">👋 Hello!</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Welcome to <span className="font-semibold text-green-600">NirmanHub</span>! How can we help you today?
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Just now</p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 px-1">Quick Actions</p>
                  
                  <button
                    onClick={handleDirectChat}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white rounded-2xl px-5 py-4 text-left transition-all shadow-lg active:shadow-md active:scale-[0.98] touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">💬</div>
                        <div>
                          <p className="font-bold text-base">Start Chat</p>
                          <p className="text-sm text-white/80">Talk to our team instantly</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Popular Topics */}
                <div className="space-y-3 pb-4">
                  <p className="text-sm font-bold text-slate-700 px-1">Popular Topics</p>
                  <div className="flex flex-wrap gap-2.5">
                    <button 
                      onClick={() => {
                        const message = encodeURIComponent("Hi! I'd like to know more about your 3D Printing services.");
                        window.open(`https://wa.me/919632038829?text=${message}`, '_blank');
                        setIsOpen(false);
                      }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 active:border-green-500 active:bg-green-100 text-sm font-medium text-slate-700 hover:text-green-600 rounded-full transition-all touch-manipulation shadow-sm"
                    >
                      🖨️ 3D Printing
                    </button>
                    <button 
                      onClick={() => {
                        const message = encodeURIComponent("Hi! I'm interested in placing a custom order. Can you help me?");
                        window.open(`https://wa.me/919632038829?text=${message}`, '_blank');
                        setIsOpen(false);
                      }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 active:border-green-500 active:bg-green-100 text-sm font-medium text-slate-700 hover:text-green-600 rounded-full transition-all touch-manipulation shadow-sm"
                    >
                      🎨 Custom Orders
                    </button>
                    <button 
                      onClick={() => {
                        const message = encodeURIComponent("Hi! I'd like to track my order. Can you help me with the status?");
                        window.open(`https://wa.me/919632038829?text=${message}`, '_blank');
                        setIsOpen(false);
                      }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 active:border-green-500 active:bg-green-100 text-sm font-medium text-slate-700 hover:text-green-600 rounded-full transition-all touch-manipulation shadow-sm"
                    >
                      📦 Track Order
                    </button>
                    <button 
                      onClick={() => {
                        const message = encodeURIComponent("Hi! I'm interested in bulk orders. Can you share pricing and details?");
                        window.open(`https://wa.me/919632038829?text=${message}`, '_blank');
                        setIsOpen(false);
                      }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 active:border-green-500 active:bg-green-100 text-sm font-medium text-slate-700 hover:text-green-600 rounded-full transition-all touch-manipulation shadow-sm"
                    >
                      🏢 Bulk Orders
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Message Input */}
            <div className="px-4 py-3 bg-white border-t border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDirectChat();
                    }
                  }}
                />
                <button
                  onClick={handleDirectChat}
                  className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-green-500/50 active:scale-95 transition-all flex-shrink-0"
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Powered by WhatsApp
              </p>
            </div>
          </div>
      )}
    </>
  );
}
