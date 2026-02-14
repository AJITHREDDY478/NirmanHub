import { useState, useEffect } from 'react';

const promos = [
  'Free Shipping on Orders Over ₹999',
  '✨ New Arrivals: 20% Off First Order',
  '🎁 Member Exclusive: Extra 10% Off'
];

export default function PromoBanner() {
  const [currentPromo, setCurrentPromo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPromo((prev) => (prev + 1) % promos.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 text-white py-2 px-4 text-center text-sm font-medium animate-slide-down relative overflow-hidden">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block">✨</span>
        <span className={`relative transition-all duration-300 ${
          isTransitioning ? 'opacity-0 translate-y-[-10px]' : 'opacity-100 translate-y-0'
        }`}>
          {promos[currentPromo]}
        </span>
        <span className="inline-block">✨</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" style={{ backgroundSize: '200% 100%' }}></div>
    </div>
  );
}
