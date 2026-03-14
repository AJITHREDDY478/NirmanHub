import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { departments as defaultDepartments, subcategoryEmojis } from '../data/products';
import { getAllProducts, getAllDepartments } from '../utils/catalogService';
import { getDepartmentIcon } from '../utils/departmentIcons';
import BrandLoader from '../components/BrandLoader';
import ProductCard from '../components/ProductCard';

export default function DepartmentPage({ addToCart, toggleWishlist, wishlistItems, addToRecentlyViewed }) {
  const { departmentId } = useParams();
  const id = departmentId;
  const navigate = useNavigate();
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
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
          icon: getDepartmentIcon(dbDept.name, dbDept.item_details_data?.icon),
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
              icon: getDepartmentIcon(deptName),
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

  if (loading) {
    return <BrandLoader message="Loading products..." />;
  }

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Department Not Found</h2>
          <Link to="/categories" className="text-cyan-600 hover:text-cyan-700">Browse Categories</Link>
        </div>
      </div>
    );
  }

  const filtered = selectedSubcategory === 'all'
    ? departmentProducts
    : departmentProducts.filter(p => p.subcategory === selectedSubcategory);

  const filteredProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc')  return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc')  return b.name.localeCompare(a.name);
    if (sortBy === 'newest')     return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });

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
          <Link to="/" className="hover:text-cyan-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-cyan-600">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{department.name}</span>
        </div>

        {/* Department Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-\[#0F2740\] to-\[#0A78D1\] flex items-center justify-center text-3xl">
              {department.icon}
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-slate-800">{department.name}</h1>
              <p className="text-slate-600 mt-1">{filteredProducts.length} products available</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Subcategory Dropdown */}
          <div className="relative flex-1 sm:max-w-xs">
            <label className="sr-only">Filter by category</label>
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
              </svg>
            </div>
            <select
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
              className="w-full appearance-none pl-9 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="all">All Categories ({departmentProducts.length})</option>
              {subcategories.map(sub => {
                const count = departmentProducts.filter(p => p.subcategory === sub).length;
                return (
                  <option key={sub} value={sub}>{sub} ({count})</option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:max-w-xs">
            <label className="sr-only">Sort products</label>
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full appearance-none pl-9 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
              <option value="newest">New Arrivals First</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Result count */}
          <p className="text-sm text-slate-500 font-medium sm:ml-auto whitespace-nowrap self-center">
            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
            {selectedSubcategory !== 'all' && (
              <button
                onClick={() => { setSelectedSubcategory('all'); setSortBy('default'); }}
                className="ml-2 text-cyan-600 hover:text-cyan-700 underline"
              >
                Clear
              </button>
            )}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <BrandLoader message="Loading products..." compact />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistItems.includes(product.id)}
                onViewDetails={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Products Found</h3>
            <p className="text-slate-600 mb-6">Try selecting a different subcategory</p>
            <button onClick={() => { setSelectedSubcategory('all'); setSortBy('default'); }} className="px-6 py-3 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
