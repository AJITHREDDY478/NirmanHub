// Example: ProductDetailPage.jsx - How to integrate LithophaneCustomizer

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo';
import LithophaneCustomizer from '@/components/LithophaneCustomizer';
import ReviewSection from '@/components/ReviewSection';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    // Fetch product from Supabase or your API
    const fetchProduct = async () => {
      try {
        // Example: fetch from Supabase
        // const { data } = await supabase
        //   .from('catalog_entities')
        //   .select('*')
        //   .eq('id', productId)
        //   .single();
        // setProduct(data);
        
        // For now, assume product is passed or fetched
        setProduct({
          id: productId,
          name: 'Lithophane Photo Frame - 3D Personalized Art',
          description: '...',
          price: 449,
          originalPrice: 599,
          image: 'https://...',
          category: 'Photo Frames',
          emoji: '🖼️'
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  /**
   * Handle customization completion for personalized products
   * Stores the customization metadata with the cart item
   */
  const handleCustomizationComplete = (customizationData) => {
    console.log('Customization received:', customizationData);
    
    // Add product to cart with customization metadata
    const cartItem = {
      ...product,
      quantity: 1,
      customization: {
        ...customizationData,
        status: 'pending-confirmation',
        addedToCartAt: new Date().toISOString()
      }
    };

    // Your cart logic here
    // store.addToCart(cartItem);
    // OR dispatch to Redux
    // dispatch(addToCart(cartItem));

    setAddedToCart(true);

    // Show success notification
    // toast.success('Product added to cart with customization!');

    // Scroll to cart button or show confirmation
    setTimeout(() => setAddedToCart(false), 3000);
  };

  /**
   * Check if this is a customizable product
   * You can use category, tags, or name patterns
   */
  const isCustomizable = product?.category === 'Photo Frames' && 
    (product?.name?.includes('Lithophane') || product?.tags?.includes('customizable'));

  /**
   * Get the appropriate component based on product type
   */
  const getProductActionComponent = () => {
    if (isCustomizable) {
      return (
        <LithophaneCustomizer 
          product={product}
          onCustomizationComplete={handleCustomizationComplete}
        />
      );
    } else {
      // Standard add to cart for non-customized products
      return (
        <StandardAddToCart 
          product={product}
          onSuccess={() => setAddedToCart(true)}
        />
      );
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!product) {
    return <div className="flex items-center justify-center h-screen">Product not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Success Toast */}
      {addedToCart && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          ✅ {isCustomizable ? 'Customization saved and added to cart!' : 'Product added to cart!'}
        </motion.div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span className="mx-2">/</span>
          <a href={`/category/${product.category}`} className="hover:text-blue-600">
            {product.category}
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>
      </div>

      {/* Main Product Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="sticky top-24">
            <ProductGallery 
              product={product}
              className="rounded-2xl overflow-hidden"
            />
          </div>

          {/* Product Info & Customization */}
          <div className="flex flex-col gap-6">
            {/* Basic Product Info */}
            <ProductInfo product={product} />

            {/* Customization Section for Lithophane */}
            {isCustomizable && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-t pt-6"
              >
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✨ Personalized Product
                  </span>
                </div>
                <p className="text-gray-600 mb-4">
                  This product is fully customizable. Upload your photo below to create your unique piece!
                </p>
              </motion.div>
            )}

            {/* Action Component (Customizer or Add to Cart) */}
            <div className="mt-4">
              {getProductActionComponent()}
            </div>

            {/* Product Highlights (for Lithophane) */}
            {isCustomizable && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">🎯 Why Choose Lithophane?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✅ Completely personalized with your photo</li>
                  <li>✅ Stunning backlit 3D effect</li>
                  <li>✅ Perfect for any occasion</li>
                  <li>✅ Sample preview via WhatsApp</li>
                  <li>✅ Premium quality 3D printing</li>
                  <li>✅ Pan India delivery</li>
                </ul>
              </div>
            )}

            {/* Trust Badges */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span>WhatsApp Support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span>Money Back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border-t pt-12"
        >
          <h2 className="text-2xl font-bold mb-4">📖 About This Product</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications */}
          {product.specifications && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">📋 Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase font-semibold">{key}</p>
                    <p className="text-gray-800 font-medium">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordering Process for Lithophane */}
          {isCustomizable && product.orderingProcess && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">🔄 How It Works</h3>
              <div className="space-y-4">
                {Object.entries(product.orderingProcess).map(([step, description]) => (
                  step.startsWith('step') && (
                    <div key={step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {step.replace('step', '')}
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">{description}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t pt-12 mt-12"
        >
          <ReviewSection productId={productId} />
        </motion.div>
      </div>

      {/* Related Products */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🎁 Related Products</h2>
          {/* Your related products component here */}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Standard Add to Cart Component (for non-customized products)
 */
function StandardAddToCart({ product, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      // Your add to cart logic
      // dispatch(addToCart({ ...product, quantity }));
      onSuccess?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="font-semibold">Quantity:</label>
        <div className="flex items-center border rounded-lg">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100"
          >
            −
          </button>
          <span className="px-6 py-2 font-semibold">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Adding...' : '🛒 Add to Cart'}
      </button>
    </div>
  );
}
