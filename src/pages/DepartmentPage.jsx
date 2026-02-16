import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { departments as defaultDepartments, subcategoryEmojis } from '../data/products';
import { getAllProducts, getAllDepartments } from '../utils/catalogService';
import { renderStars, formatPrice } from '../utils/helpers';

export default function DepartmentPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { departmentId } = useParams();
  const id = departmentId;
  const navigate = useNavigate();
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [departmentProducts, setDepartmentProducts] = useState([]);
  const [department, setDepartment] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // Fetch both products and database departments
      const [{ data }, { data: dbDepartments }] = await Promise.all([
        getAllProducts(),
        getAllDepartments()
      ]);
      
      console.log('Department ID from URL:', id);
      console.log('All products departments:', data.map(p => p.department));
      console.log('Database departments:', dbDepartments.map(d => ({ id: d.id, name: d.name })));
      
      // First check if ID matches a database department
      const dbDept = dbDepartments.find(d => d.id === id);
      
      let dept = null;
      
      if (dbDept) {
        // Found database department - filter products by department name
        console.log('Found database department:', dbDept.name);
        const filtered = data.filter(p => 
          p.department?.toLowerCase() === dbDept.name.toLowerCase()
        );
        
        const subs = [...new Set(filtered.map(p => p.subcategory).filter(Boolean))];
        
        dept = {
          id: dbDept.id,
          name: dbDept.name,
          icon: dbDept.item_details_data?.icon || getIconForDepartment(dbDept.name),
          subcategories: subs
        };
        
        setDepartmentProducts(filtered);
        setSubcategories(subs);
      } else {
        // Try to find department from hardcoded list
        dept = defaultDepartments.find(d => d.id === id);
        
        // If not found, convert slug to department name and search products
        if (!dept) {
          // Convert slug like "miniatures-&-models" to "Miniatures & Models"
          const deptName = decodeURIComponent(id).split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          console.log('Converted department name:', deptName);
          
          // Filter products by this department name (case insensitive)
          const filtered = data.filter(p => {
            if (!p.department) return false;
            const productDept = p.department.toLowerCase();
            const productDeptSlug = productDept.replace(/\s+/g, '-');
            const searchName = deptName.toLowerCase();
            const searchSlug = id.toLowerCase();
            
            return productDept === searchName ||
                   productDeptSlug === searchSlug ||
                   searchName.includes(productDept) ||
                   productDept.includes(searchName.split(' ')[0]);
          });
          
          console.log('Filtered products:', filtered.length);
          
          if (filtered.length > 0) {
            const subs = [...new Set(filtered.map(p => p.subcategory).filter(Boolean))];
            
            dept = {
              id: id,
              name: filtered[0].department || deptName,
              icon: getIconForDepartment(deptName),
              subcategories: subs
            };
            
            setDepartmentProducts(filtered);
            setSubcategories(subs);
          }
        } else {
          // Use hardcoded department
          const filtered = data.filter(p => 
            p.department?.toLowerCase() === dept.name.toLowerCase()
          );
          setDepartmentProducts(filtered);
          setSubcategories(dept.subcategories || []);
        }
      }
      
      setDepartment(dept);
      setLoading(false);
    };
    
    fetchProducts();
    setSelectedSubcategory('all');
  }, [id]);

  const getIconForDepartment = (name) => {
    const icons = {
      'electronics': '📱',
      'fashion': '👗',
      'home': '🏠',
      'accessories': '💎',
      'religious': '🙏',
      'spiritual': '🕉️',
      'miniatures': '🏗️',
      'models': '🏗️',
      'figurines': '🗿',
      'collectibles': '🏆',
      'keychains': '🔑',
      'decor': '🎨',
      'toys': '🧸',
      'gifts': '🎁'
    };
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) return icon;
    }
    return '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }

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

  const filteredProducts = selectedSubcategory === 'all' 
    ? departmentProducts 
    : departmentProducts.filter(p => p.subcategory === selectedSubcategory);

  console.log('Rendering - departmentProducts:', departmentProducts.length, 'filteredProducts:', filteredProducts.length);

  const handleProductClick = (productId) => {
    addToRecentlyViewed(productId);
    navigate(`/product/${productId}`);
  };

  return (
    <div className="page-view active">
      <div className="max-w-7xl mx-auto px-6 py-6">
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
            {subcategories.map(sub => (
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
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="product-card bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative">
                  <div onClick={() => handleProductClick(product.id)} className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center product-image cursor-pointer overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{product.emoji}</span>
                    )}
                  </div>
                  {product.isNew && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-[10px] font-bold rounded-full">NEW</span>
                  )}
                  <button onClick={() => toggleWishlist(product.id)} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <svg className={`w-4 h-4 ${wishlistItems.includes(product.id) ? 'text-red-500 fill-current' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-medium text-slate-800 text-sm sm:text-base truncate">{product.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{product.subcategory || 'Other'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex items-center">{renderStars(product.rating)}</div>
                    <span className="text-[10px] sm:text-xs text-slate-500">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-amber-600 font-bold text-base sm:text-lg">{formatPrice(product.price)}</p>
                    <button onClick={() => addToCart(product.id, product)} className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                    </button>
                  </div>
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
