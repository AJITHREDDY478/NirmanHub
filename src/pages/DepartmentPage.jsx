import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { products, departments, subcategoryEmojis } from '../data/products';
import { renderStars, formatPrice } from '../utils/helpers';

export default function DepartmentPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const department = departments.find(d => d.id === id);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Department Not Found</h2>
          <Link to="/categories" className="text-amber-600 hover:text-amber-700">Browse Categories</Link>
        </div>
      </div>
    );
  }

  const departmentProducts = products.filter(p => p.department === department.name);
  const filteredProducts = selectedSubcategory === 'all' 
    ? departmentProducts 
    : departmentProducts.filter(p => p.subcategory === selectedSubcategory);

  const handleProductClick = (productId) => {
    addToRecentlyViewed(productId);
    navigate(`/product/${productId}`);
  };

  return (
    <div className="page-view active">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-slate-600">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-amber-600">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{department.name}</span>
        </div>

        {/* Department Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-teal-500 flex items-center justify-center text-3xl">
              {department.icon}
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-slate-800">{department.name}</h1>
              <p className="text-slate-600 mt-1">{filteredProducts.length} products available</p>
            </div>
          </div>
        </div>

        {/* Subcategory Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedSubcategory === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-teal-500 text-white shadow-lg'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-amber-500'
              }`}
            >
              All Products
            </button>
            {department.subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  selectedSubcategory === sub
                    ? 'bg-gradient-to-r from-amber-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-amber-500'
                }`}
              >
                <span>{subcategoryEmojis[sub] || '📦'}</span>
                <span>{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="product-card bg-white rounded-2xl overflow-hidden shadow-lg reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative">
                  <div onClick={() => handleProductClick(product.id)} className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl product-image cursor-pointer">
                    {product.emoji}
                  </div>
                  {product.isNew && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-xs font-bold rounded-full animate-badge-pulse">NEW</span>
                  )}
                  <button onClick={() => toggleWishlist(product.id)} className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <svg className={`w-5 h-5 ${wishlistItems.includes(product.id) ? 'text-red-500 fill-current' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                  <button onClick={() => addToCart(product.id, product)} className="add-to-cart-btn absolute bottom-3 left-3 right-3 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                    Add to Cart
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-800 truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{product.subcategory}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center">{renderStars(product.rating)}</div>
                    <span className="text-xs text-slate-500">({product.reviews})</span>
                  </div>
                  <p className="text-amber-600 font-bold text-lg mt-2">{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Products Found</h3>
            <p className="text-slate-600 mb-6">Try selecting a different subcategory</p>
            <button onClick={() => setSelectedSubcategory('all')} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
