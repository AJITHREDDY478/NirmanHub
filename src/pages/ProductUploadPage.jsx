import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCatalogItem, uploadImage, getUserCatalogItems } from '../utils/catalogService';

export default function ProductUploadPage({ showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    lookup_code: '',
    description: '',
    type: 'Item',
    original_price: '',
    discount_price: '',
    stock_quantity: '',
    printing_time: '',
    is_active: true
  });

  // Load existing products
  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    const { data } = await getUserCatalogItems(user.id);
    setProducts(data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Product name is required');
      return false;
    }
    if (!formData.lookup_code.trim()) {
      showToast('Lookup code is required');
      return false;
    }
    if (!formData.original_price || parseFloat(formData.original_price) < 0) {
      showToast('Valid original price is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) {
      showToast('Please log in to upload products');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const { url, error } = await uploadImage(user.id, imageFile);
        if (error) {
          showToast('Failed to upload image');
          setLoading(false);
          return;
        }
        imageUrl = url;
      }

      // Create product
      const { data, error } = await createCatalogItem(user.id, {
        ...formData,
        image_url: imageUrl
      });

      if (error) {
        showToast('Failed to create product');
        console.error(error);
        setLoading(false);
        return;
      }

      showToast('Product uploaded successfully!');
      
      // Reset form
      setFormData({
        name: '',
        lookup_code: '',
        description: '',
        type: 'Item',
        original_price: '',
        discount_price: '',
        stock_quantity: '',
        printing_time: '',
        is_active: true
      });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      
      // Reload products
      await loadProducts();
    } catch (error) {
      showToast('Error uploading product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Product Upload</h1>
          <p className="text-lg text-slate-600">Please log in to upload products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Product Upload</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload New Product</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Wireless Earbuds Pro"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Lookup Code */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lookup Code *
                  </label>
                  <input
                    type="text"
                    name="lookup_code"
                    value={formData.lookup_code}
                    onChange={handleInputChange}
                    placeholder="e.g., PROD-001"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="Item">Item</option>
                    <option value="CategoryGroup">Category Group</option>
                    <option value="DepartmentGroup">Department Group</option>
                  </select>
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Original Price *
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Printing Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Printing Time (hours)
                  </label>
                  <input
                    type="number"
                    name="printing_time"
                    value={formData.printing_time}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="text-center">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto mb-4 rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-slate-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-slate-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{product.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-semibold">{product.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Original Price:</span>
                    <span className="font-semibold">₹{product.original_price}</span>
                  </div>
                  {product.discount_price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount Price:</span>
                      <span className="font-semibold text-green-600">₹{product.discount_price}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Stock:</span>
                    <span className="font-semibold">{product.stock_quantity}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !showForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Products Yet</h2>
            <p className="text-slate-600 mb-6">Start by adding your first product</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
