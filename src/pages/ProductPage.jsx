import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, getAllProducts } from '../utils/catalogService';
import { renderStars, formatPrice } from '../utils/helpers';
import { CONFIG, getWhatsAppUrl } from '../utils/config';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import BrandLoader from '../components/BrandLoader';

export default function ProductPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Touch/swipe handling refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const photoInputRef = useRef(null);

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

  // Detect personalized products that require photo upload (Lithophane etc.)
  const isPersonalizedProduct = useMemo(() => {
    if (!product) return false;
    const name = product.name?.toLowerCase() || '';
    const customization = product.specifications?.customization || '';
    return name.includes('lithophane') || customization.toLowerCase().includes('photo upload');
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product?.specifications?.sizes) return [];
    return Array.isArray(product.specifications.sizes) ? product.specifications.sizes : [];
  }, [product]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) {
      alert('File size must be less than 300 MB');
      return;
    }
    setUploadedPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleWhatsAppOrder = () => {
    if (isPersonalizedProduct && !uploadedPhoto) {
      alert('Please upload your photo first.');
      return;
    }
    if (isPersonalizedProduct && !whatsappNumber) {
      alert('Please enter your WhatsApp number.');
      return;
    }
    const sizePart = selectedSize ? `Size: ${selectedSize}` : '';
    const photoPart = uploadedPhoto ? `Photo: ${uploadedPhoto.name}` : '';
    const lines = [
      `Hi ${CONFIG.businessName}! I want to order:`,
      `*${product.name}*`,
      sizePart,
      photoPart,
      `Qty: ${quantity}`,
      whatsappNumber ? `My WhatsApp: ${whatsappNumber}` : '',
      `\nPlease share sample preview before printing.`
    ].filter(Boolean);
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(getWhatsAppUrl(msg), '_blank');
  };

  const handleCustomizationRequest = () => {
    const optionsSummary = product.customizationOptions && Object.keys(product.customizationOptions).length > 0
      ? Object.entries(product.customizationOptions)
          .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'Available' : 'Not available') : value}`)
          .join(', ')
      : '';

    navigate('/custom-order', {
      state: {
        sourceProduct: {
          id: product.id,
          name: product.name
        },
        prefill: {
          category: '3d-printing',
          quantity: String(quantity),
          notes: optionsSummary
            ? `Selected product: ${product.name}\nCustomization preferences: ${optionsSummary}`
            : `Selected product: ${product.name}`
        }
      }
    });
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
    return <BrandLoader message="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h2>
          <Link to="/" className="text-cyan-600 hover:text-blue-700">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-6 sm:mb-8 text-xs sm:text-sm text-slate-600">
          <Link to="/" className="hover:text-cyan-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-cyan-600">Categories</Link>
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
                <ProductImage
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain select-none pointer-events-none"
                  containerClassName="w-full h-full"
                  fallback={<span className="text-6xl">{product.emoji || '📦'}</span>}
                  loading="eager"
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
              <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-full">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === index 
                        ? 'border-cyan-500 ring-2 ring-cyan-200' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      fallback={<span className="text-xl">📦</span>}
                    />
                  </button>
                ))}
              </div>
            )}
            
            {product.isNew && (
              <span className="absolute top-6 left-6 px-4 py-2 bg-gradient-to-r from-[#0F2740] to-[#29C4FF] text-white text-sm font-bold rounded-full animate-badge-pulse">NEW</span>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">{product.name}</h1>
            
            {/* Reviews removed per product owner request. */}

            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700">{formatPrice(product.price)}</span>
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

            {/* ── Personalized Product Fields (Lithophane / Photo Upload) ── */}
            {isPersonalizedProduct && (
              <div className="mb-8 space-y-5">
                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Size</label>
                    <div className="flex flex-wrap gap-3">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                            selectedSize === size
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-slate-300 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Upload Your Photo{' '}
                    <span className="text-slate-400 font-normal text-xs">(max 300 MB)</span>
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {!photoPreview ? (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-slate-50 hover:bg-cyan-50"
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span className="font-medium">Click to choose your photo</span>
                      <span className="text-xs text-slate-400">JPG, PNG, WEBP supported</span>
                    </button>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-cyan-400 bg-slate-100">
                      <img src={photoPreview} alt="Preview" className="w-full max-h-56 object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedPhoto(null);
                          setPhotoPreview(null);
                          if (photoInputRef.current) photoInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow"
                      >
                        ✕
                      </button>
                      <div className="px-3 py-2 bg-white text-sm text-slate-500 truncate border-t border-slate-200">
                        📷 {uploadedPhoto?.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Your WhatsApp Number</label>
                  <div className="flex items-center border-2 border-slate-300 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                    <span className="px-3 py-3 bg-slate-100 text-slate-500 text-sm font-medium border-r border-slate-300">+91</span>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-4 py-3 text-slate-800 bg-white focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Sample preview note */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm text-amber-700">
                    Sample will be shown to you before printing and framing on WhatsApp.
                  </p>
                </div>
              </div>
            )}

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
            <div className="flex flex-col gap-3 mb-6 sm:mb-8">
              {isPersonalizedProduct ? (
                <>
                  {/* Primary: Order on WhatsApp */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-2xl hover:shadow-green-400/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Order on WhatsApp
                  </button>
                  {/* Secondary: Add to Cart */}
                  <div className="flex gap-3">
                    <button onClick={() => addToCart(product.id, product, quantity)} className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all flex items-center justify-center gap-2 touch-manipulation">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                      Add to Cart
                    </button>
                    <button onClick={() => toggleWishlist(product.id)} className={`px-4 py-3 border-2 rounded-xl transition-all flex items-center justify-center touch-manipulation ${wishlistItems.includes(product.id) ? 'bg-red-50 border-red-500 text-red-500' : 'border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-500'}`}>
                      <svg className={`w-6 h-6 ${wishlistItems.includes(product.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-row gap-3 sm:gap-4">
                  <button onClick={() => addToCart(product.id, product, quantity)} className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-2xl hover:shadow-cyan-400/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2 touch-manipulation">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                    Add to Cart
                  </button>
                  <button onClick={() => toggleWishlist(product.id)} className={`px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl transition-all transform hover:scale-105 touch-manipulation flex items-center justify-center ${wishlistItems.includes(product.id) ? 'bg-red-50 border-red-500 text-red-500' : 'border-slate-300 text-slate-600 hover:border-cyan-500 hover:text-cyan-600'}`}>
                    <svg className={`w-6 h-6 ${wishlistItems.includes(product.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                </div>
              )}
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
            <button onClick={() => setSelectedTab('description')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'description' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}>
              Description
              {selectedTab === 'description' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F2740] to-[#29C4FF] tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('specs')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'specs' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}>
              Specification
              {selectedTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F2740] to-[#29C4FF] tab-underline"></div>}
            </button>
            <button onClick={() => setSelectedTab('customization')} className={`flex-1 pb-3 sm:pb-4 font-semibold text-sm sm:text-base text-center transition-colors relative touch-manipulation ${selectedTab === 'customization' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}>
              Customization
              {selectedTab === 'customization' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F2740] to-[#29C4FF] tab-underline"></div>}
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-slate-800 mb-2">Need more custom changes?</h3>
                  <p className="text-sm text-slate-600 mb-3">Share extra requirements like text, logo placement, dimensions, finish, color, and quantity in a dedicated custom order request.</p>
                  <ul className="text-sm text-slate-600 space-y-1 mb-4">
                    <li>• Product details are auto-filled from this page</li>
                    <li>• Upload reference images and sketches</li>
                    <li>• Mention timeline and budget preferences</li>
                  </ul>
                  <button
                    type="button"
                    onClick={handleCustomizationRequest}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                  >
                    Continue in Custom Order
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
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
