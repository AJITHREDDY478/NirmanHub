import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ cartItemsCount, onOpenCart, onOpenSearch, onShowAuth }) {
  const { user, profile, signOut } = useAuth();
  const [isShrunk, setIsShrunk] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGiftsMenu, setShowGiftsMenu] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setShowAccountMenu(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.pageYOffset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.account-menu-container')) {
        setShowAccountMenu(false);
      }
      if (!e.target.closest('.mobile-menu-container') && !e.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 px-4 md:px-6 ${isShrunk ? 'py-2 md:py-3' : 'py-3 md:py-4'} bg-white/70 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_10px_30px_rgba(15,23,42,0.08)]`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400/40 via-teal-400/40 to-amber-400/40"></div>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-teal-500 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-white/80 transform group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="logo-text font-display font-bold text-lg md:text-xl bg-gradient-to-r from-amber-600 via-orange-500 to-teal-600 bg-clip-text text-transparent transition-all duration-300">
              NirmanHub
            </span>
            <span className="hidden md:inline text-[11px] text-slate-500/80 tracking-[0.12em] uppercase">
              Creating Memories, Layer by Layer.
            </span>
          </div>
        </Link>

        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/" className="px-4 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-amber-100/60 transition-all font-semibold">
            Home
          </Link>
          <Link to="/categories" className="px-4 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-amber-100/60 transition-all font-semibold">
            Categories
          </Link>
          <div 
            className="relative"
            onMouseEnter={() => setShowGiftsMenu(true)}
            onMouseLeave={() => setShowGiftsMenu(false)}
          >
            <button className="px-4 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-amber-100/60 transition-all font-semibold flex items-center gap-1">
              Gifts
              <svg className={`w-4 h-4 transition-transform ${showGiftsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Gifts Mega Menu */}
            <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[640px] bg-white rounded-3xl shadow-[0_30px_60px_rgba(15,23,42,0.18)] border border-slate-200 transition-all duration-300 ${showGiftsMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="p-6 grid grid-cols-2 gap-8">
                {/* Shop By Occasion */}
                <div>
                  <h3 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    Shop By Occasion
                  </h3>
                  <div className="space-y-2">
                    <a href="#festive" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Festive</a>
                    <a href="#housewarming" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Housewarming</a>
                    <a href="#birthday" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Birthday</a>
                    <a href="#corporate" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Corporate Gifts</a>
                    <a href="#wedding" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Wedding</a>
                    <a href="#bridesmaid" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">For Bridesmaid</a>
                    <a href="#return-gifts" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Return Gifts</a>
                    <a href="#newly-weds" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">For Newly Weds</a>
                  </div>
                </div>
                
                {/* Gift Shop */}
                <div>
                  <h3 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">🎀</span>
                    Gift Shop
                  </h3>
                  <div className="space-y-2">
                    <a href="#hostess" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Hostess</a>
                    <a href="#fashion-girl" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Fashion Girl</a>
                    <a href="#decor" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Decor Enthusiast</a>
                    <a href="#souvenir" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Souvenir Lover</a>
                    <a href="#travel" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Travel Bug</a>
                    <a href="#accessories" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">Gift Accessories</a>
                    <a href="#egift" className="block px-3 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm">E-Gift Cards</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative group">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-full bg-white/80 border border-slate-200/70 hover:bg-amber-50 transition-all duration-300 ripple-effect touch-manipulation shadow-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-amber-600 transform group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Account */}
          <div className="relative account-menu-container">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="p-2 rounded-full bg-white/80 border border-slate-200/70 hover:bg-amber-50 transition-all duration-300 ripple-effect touch-manipulation group shadow-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-amber-600 transform group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            <div className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_25px_50px_rgba(15,23,42,0.18)] border border-slate-200 transition-all duration-300 ${
              showAccountMenu ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
            }`}>
              <div className="p-4 border-b border-slate-200">
                {user ? (
                  <>
                    <p className="text-sm text-slate-600 mb-1">Welcome back!</p>
                    <p className="font-semibold text-slate-800 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate mb-3">{user.email}</p>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-3">Welcome back!</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onShowAuth('login');
                          setShowAccountMenu(false);
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          onShowAuth('signup');
                          setShowAccountMenu(false);
                        }}
                        className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:border-amber-500 transition-all"
                      >
                        Sign Up
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="p-2">
                <Link
                  to="/orders"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-slate-700 group-hover:text-amber-600 font-medium">My Orders</span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-slate-700 group-hover:text-amber-600 font-medium">Wishlist</span>
                </Link>
                <Link
                  to="/address"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-700 group-hover:text-amber-600 font-medium">Address Book</span>
                </Link>
                {user && user.email === 'ajithreddy478@gmail.com' && (
                  <Link
                    to="/products/upload"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-slate-700 group-hover:text-amber-600 font-medium">Upload Products</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-white/80 border border-slate-200/70 hover:bg-amber-50 transition-all touch-manipulation mobile-menu-button shadow-sm"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute left-0 right-0 top-full transition-all duration-300 mobile-menu-container ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="mx-4 my-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_25px_50px_rgba(15,23,42,0.18)] border border-slate-200/60 px-4 py-4 space-y-1 text-center">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-slate-700 hover:bg-amber-50 rounded-xl transition-colors font-semibold"
          >
            Home
          </Link>
          <Link
            to="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-slate-700 hover:bg-amber-50 rounded-xl transition-colors font-semibold"
          >
            Categories
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-slate-700 hover:bg-amber-50 rounded-xl transition-colors font-semibold"
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-slate-700 hover:bg-amber-50 rounded-xl transition-colors font-semibold"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
