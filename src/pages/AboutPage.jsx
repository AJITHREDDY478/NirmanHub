export default function AboutPage() {
  return (
    <div className="page-view active">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-3 sm:mb-4">About NirmanHub</h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            Your trusted destination for quality products and exceptional shopping experience
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center mb-16 sm:mb-18 md:mb-20">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">Our Story</h2>
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>
                Founded with a vision to revolutionize online shopping, NirmanHub has grown from a small startup to a leading e-commerce platform serving thousands of happy customers.
              </p>
              <p>
                We believe in providing quality products at competitive prices, backed by exceptional customer service. Our carefully curated collection spans across electronics, fashion, home decor, and accessories.
              </p>
              <p>
                Every product in our store is handpicked by our expert team to ensure it meets our high standards of quality and value.
              </p>
            </div>
          </div>
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 flex items-center justify-center text-9xl">
            🏪
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16 sm:mb-18 md:mb-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-8 sm:mb-10 md:mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl">
                ✨
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Quality First</h3>
              <p className="text-slate-600">
                We never compromise on quality. Every product is carefully vetted to meet our high standards.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl">
                🤝
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Customer Focus</h3>
              <p className="text-slate-600">
                Your satisfaction is our priority. We go above and beyond to ensure a great experience.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
                🚀
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Innovation</h3>
              <p className="text-slate-600">
                We constantly evolve and improve our platform to provide you the best shopping experience.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-amber-500 to-teal-500 rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 text-white text-center mb-16 sm:mb-18 md:mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">10K+</div>
              <div className="text-white/80">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-white/80">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-white/80">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Support</div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-20">
          <h2 className="font-display text-3xl font-bold text-slate-800 text-center mb-12">Why Choose NirmanHub?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '🎁', title: 'Wide Selection', desc: 'Thousands of products across multiple categories' },
              { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing with regular deals and offers' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Quick and reliable shipping to your doorstep' },
              { icon: '🔒', title: 'Secure Shopping', desc: '100% secure payment and data protection' },
              { icon: '↩️', title: 'Easy Returns', desc: 'Hassle-free 30-day return policy' },
              { icon: '⭐', title: 'Quality Assured', desc: 'All products verified for quality and authenticity' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-4xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-slate-50 rounded-3xl p-12">
          <h2 className="font-display text-3xl font-bold text-slate-800 mb-4">Ready to Start Shopping?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover amazing products at great prices
          </p>
          <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105">
            Start Shopping Now
          </button>
        </div>
      </div>
    </div>
  );
}
