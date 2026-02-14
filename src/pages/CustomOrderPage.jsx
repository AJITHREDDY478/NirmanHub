import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  category: '',
  quantity: '1',
  budget: '',
  deadline: '',
  dimensions: '',
  material: '',
  color: '',
  description: '',
  notes: ''
};

export default function CustomOrderPage({ showToast }) {
  const [formData, setFormData] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
  };

  const handleRemoveImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showToast) {
      showToast('Custom order submitted! Our team will contact you shortly.');
    }
    setFormData(initialForm);
    setFiles([]);
  };

  return (
    <div className="page-view active bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="min-h-screen py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>

          <div className="text-center mb-12 sm:mb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 mb-4">Start Custom Order</h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
              Tell us about your custom order and upload reference images. Our team will review and get back with a quote.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-8">Order Details</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                    >
                      <option value="">Select Category</option>
                      <option value="3d-printing">🖨️ 3D Printing</option>
                      <option value="custom-engraving">✨ Custom Engraving</option>
                      <option value="product-design">🧩 Product Design</option>
                      <option value="prototype">🧪 Prototype</option>
                      <option value="gift">🎁 Custom Gift</option>
                      <option value="other">💬 Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Budget (Optional)</label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="₹5,000 - ₹10,000"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Deadline (Optional)</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Dimensions (Optional)</label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="e.g., 120mm x 80mm x 30mm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Material Preference</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="PLA, Resin, Wood, Metal..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Color Preference</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                      placeholder="Black, White, Multicolor..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Order Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all resize-none"
                    placeholder="Describe your idea, use-case, and any special requirements..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all resize-none"
                    placeholder="Anything else we should know?"
                  ></textarea>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                  <label className="block text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📸</span>
                    Upload Your Design / Reference Images
                  </label>
                  <p className="text-sm text-slate-600 mb-4">
                    Help us visualize your idea! Upload photos, sketches, drawings, or any reference images that show what you want. The more details you share, the better we can create your custom order.
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-4 py-3.5 bg-white border-2 border-dashed border-amber-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <span>✅ Multiple images allowed</span>
                    <span>•</span>
                    <span>✅ JPG, PNG, GIF, WEBP</span>
                    {files.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-green-600">{files.length} file(s) uploaded</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 text-slate-800 font-bold text-lg rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  Submit Custom Order
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-bold text-slate-800">Reference Images</h3>
                  {previews.length > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      {previews.length} image{previews.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {previews.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previews.map((src, index) => (
                      <div key={src} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group">
                        <img src={src} alt={`Upload preview ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">Image {index + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                          aria-label="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="font-medium">No images uploaded yet</p>
                    <p className="text-xs mt-1">Upload multiple images to help us understand your project</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h3 className="font-display text-xl font-bold text-slate-800 mb-4">What happens next?</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">1</span>
                    <p>We review your request and validate feasibility.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">2</span>
                    <p>We send a quote with timeline and material options.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">3</span>
                    <p>Once approved, we start production and update you.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
