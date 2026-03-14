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

        {/* Subcategory Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedSubcategory === 'all'
                  ? 'bg-gradient-to-r from-\[#0F2740\] to-\[#0A78D1\] text-white shadow-lg'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-cyan-400'
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
                    ? 'bg-gradient-to-r from-\[#0F2740\] to-\[#0A78D1\] text-white shadow-lg'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-cyan-400'
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
            <button onClick={() => setSelectedSubcategory('all')} className="px-6 py-3 bg-gradient-to-r from-\[#0F2740\] to-\[#0A78D1\] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
