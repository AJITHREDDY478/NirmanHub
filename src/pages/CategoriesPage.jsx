import { Link } from 'react-router-dom';
import { departments } from '../data/products';

export default function CategoriesPage() {
  return (
    <div className="page-view active">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-3 sm:mb-4">Explore Our Departments</h1>
          <p className="text-base sm:text-lg text-slate-600">Browse through our carefully curated collections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {departments.map((dept, i) => (
            <Link key={dept.id} to={`/department/${dept.id}`} className="group reveal touch-manipulation" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative p-5 sm:p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">{dept.name}</h2>
                      <p className="text-sm sm:text-base text-slate-600">{dept.subcategories.length} Categories</p>
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-teal-500 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl transform group-hover:scale-110 transition-transform flex-shrink-0">
                      {dept.icon}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {dept.subcategories.slice(0, 6).map(sub => (
                      <span key={sub} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                        {sub}
                      </span>
                    ))}
                    {dept.subcategories.length > 6 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                        +{dept.subcategories.length - 6} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center text-amber-600 font-semibold group-hover:gap-3 transition-all">
                    <span>Browse Collection</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
