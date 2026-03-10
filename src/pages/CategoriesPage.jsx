import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { departments as defaultDepartments } from '../data/products';
import { getAllProducts, getAllDepartments } from '../utils/catalogService';
import { getDepartmentIcon } from '../utils/departmentIcons';
import BrandLoader from '../components/BrandLoader';

export default function CategoriesPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);

        // Fetch both database departments and products
        const [{ data: dbDepartments }, { data: products }] = await Promise.all([
          getAllDepartments(),
          getAllProducts()
        ]);

        // Create a map to merge database departments with product data
        const deptMap = new Map();

        // First add database departments
        (dbDepartments || []).forEach(dept => {
          deptMap.set(dept.name.toLowerCase(), {
            id: dept.id,
            name: dept.name,
            subcategories: new Set(),
            productCount: 0,
            icon: getDepartmentIcon(dept.name, dept.item_details_data?.icon),
            image: dept.image_url
          });
        });

        // Then add/update from products
        (products || []).forEach(product => {
          const deptName = product.department || 'General';
          const key = deptName.toLowerCase();

          if (!deptMap.has(key)) {
            deptMap.set(key, {
              id: deptName.toLowerCase().replace(/\s+/g, '-'),
              name: deptName,
              subcategories: new Set(),
              productCount: 0,
              icon: getDepartmentIcon(deptName)
            });
          }

          const dept = deptMap.get(key);
          dept.productCount++;
          if (product.subcategory) {
            dept.subcategories.add(product.subcategory);
          }
        });

        // Convert to array
        const deptArray = Array.from(deptMap.values()).map(dept => ({
          ...dept,
          subcategories: Array.from(dept.subcategories)
        }));

        setDepartments(deptArray.length > 0 ? deptArray : defaultDepartments);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartments();
  }, []);

  if (loading) {
    return <BrandLoader message="Loading products..." />;
  }

  return (
    <div className="page-view active">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-3 sm:mb-4">Browse Categories</h1>
          <p className="text-base sm:text-lg text-slate-600">Explore our collection of 3D printed products</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10 place-items-center max-[360px]:flex max-[360px]:overflow-x-auto max-[360px]:gap-3 max-[360px]:justify-start max-[360px]:pb-2 max-[360px]:px-1 max-[360px]:snap-x max-[360px]:snap-mandatory hide-scrollbar">
          {departments.map((dept, i) => (
            <Link
              key={dept.id}
              to={`/department/${dept.id}`}
              className="group touch-manipulation w-full max-w-[170px] max-[360px]:w-[140px] max-[360px]:max-w-none max-[360px]:flex-shrink-0 max-[360px]:snap-start"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[3px] border-black p-1.5 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-full border-2 border-amber-400 p-1">
                    <div className="w-full h-full rounded-full border border-rose-300 bg-white overflow-hidden flex items-center justify-center">
                      {dept.image ? (
                        <img src={dept.image} alt={dept.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-4xl sm:text-5xl">{dept.icon}</span>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="mt-3 text-lg sm:text-[1.35rem] leading-tight font-medium text-slate-800">
                  {dept.name}
                  {!dept.productCount && <span className="block text-slate-700">(Soon!)</span>}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {dept.productCount ? `${dept.productCount} items` : `${dept.subcategories.length} categories`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
