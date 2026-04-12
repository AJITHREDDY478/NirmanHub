import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * LithophaneCustomizer Component
 * Handles photo upload for Lithophane Photo Frame customization
 * Integrates with WhatsApp for order confirmation and sample preview
 */
export default function LithophaneCustomizer({ product, onCustomizationComplete }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('5x7');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const sizes = [
    { value: '5x7', label: '5x7 Inches', price: 449 },
    { value: '6x8', label: '6x8 Inches', price: 449 }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 300 MB as per website)
    if (file.size > 300 * 1024 * 1024) {
      alert('File size must be less than 300 MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage({
        data: event.target.result,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async () => {
    if (!uploadedImage || !whatsappNumber) {
      alert('Please upload an image and enter your WhatsApp number');
      return;
    }

    setLoading(true);

    try {
      // Prepare customization data
      const customizationData = {
        productId: product.id,
        productName: product.name,
        selectedSize,
        uploadedImage: uploadedImage.name,
        whatsappNumber,
        timestamp: new Date().toISOString(),
        orderNotes: `Lithophane Frame Order - Size: ${selectedSize} inches - Photo: ${uploadedImage.name}`
      };

      // Send to WhatsApp (implement your WhatsApp integration)
      const whatsappMessage = encodeURIComponent(
        `Hi! I'm interested in ordering a ${selectedSize}" Lithophane Photo Frame. I've uploaded my photo. Please share the sample preview. Order details: ${JSON.stringify(customizationData, null, 2)}`
      );
      
      const whatsappLink = `https://wa.me/917678642888?text=${whatsappMessage}`;

      // Trigger the customization complete callback
      if (onCustomizationComplete) {
        onCustomizationComplete({
          ...customizationData,
          status: 'pending-confirmation',
          whatsappLink
        });
      }

      // Open WhatsApp
      window.open(whatsappLink, '_blank');

      alert('Opening WhatsApp. Please share your photo upload confirmation with the seller.');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        ✨ Customize Your Lithophane Photo Frame
      </h2>
      <p className="text-gray-600 mb-6">
        Upload your favorite photo to create a beautiful 3D personalized frame
      </p>

      {/* Size Selection */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          📏 Select Size:
        </label>
        <div className="grid grid-cols-2 gap-3">
          {sizes.map((size) => (
            <button
              key={size.value}
              onClick={() => setSelectedSize(size.value)}
              className={`p-4 rounded-lg font-semibold transition-all ${
                selectedSize === size.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400'
              }`}
            >
              {size.label}
              <br />
              <span className="text-sm">₹{size.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          📸 Upload Your Photo:
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {!uploadedImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-blue-300 rounded-lg bg-white hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <p className="text-4xl mb-2">📷</p>
                <p className="text-gray-700 font-semibold">Click to upload or drag & drop</p>
                <p className="text-sm text-gray-500">Max file size: 300 MB</p>
              </div>
            </button>
          ) : (
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">✅ Photo Uploaded</span>
                <button
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  ✕ Remove
                </button>
              </div>
              <div className="relative w-full max-h-64 overflow-hidden rounded-lg">
                <img
                  src={uploadedImage.data}
                  alt="Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                File: {uploadedImage.name} ({Math.round(uploadedImage.size / 1024)} KB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Contact */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          💬 Your WhatsApp Number:
        </label>
        <input
          type="tel"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
          placeholder="+91 98765 43210"
          maxLength="10"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Order Summary */}
      <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">📋 Order Summary:</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>✓ Product: Lithophane Photo Frame</p>
          <p>✓ Size: {selectedSize} inches</p>
          <p>✓ Photo Status: {uploadedImage ? '✅ Uploaded' : '⏳ Pending'}</p>
          <p className="font-semibold text-gray-800 mt-2">
            Total: ₹449
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmitOrder}
        disabled={loading || !uploadedImage || !whatsappNumber}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
          loading || !uploadedImage || !whatsappNumber
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg'
        }`}
      >
        {loading ? '⏳ Processing...' : '🟢 Proceed to WhatsApp'}
      </motion.button>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-900">
          <strong>📌 How it works:</strong>
          <br />
          1. Upload your favorite photo
          <br />
          2. Select your preferred size
          <br />
          3. Click "Proceed to WhatsApp" to share details
          <br />
          4. Our team will send a sample preview on WhatsApp
          <br />
          5. Confirm and proceed with payment
          <br />
          6. Your personalized frame will be 3D printed and delivered!
        </p>
      </div>
    </motion.div>
  );
}
