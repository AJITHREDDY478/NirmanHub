import { useEffect, useRef, useState } from 'react';

export default function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
  fallback = null,
  loading = 'lazy'
}) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(loading === 'eager');
  const [isLoading, setIsLoading] = useState(Boolean(src) && loading === 'eager');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    const eager = loading === 'eager';
    setShouldLoad(eager);
    setIsLoading(Boolean(src) && eager);
  }, [src, loading]);

  useEffect(() => {
    if (!src || hasError || shouldLoad || loading === 'eager') return undefined;

    const element = containerRef.current;
    if (!element) return undefined;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      setIsLoading(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        setIsLoading(true);
        observer.disconnect();
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [src, hasError, shouldLoad, loading]);

  if (!src || hasError) {
    return <div className={containerClassName}>{fallback}</div>;
  }

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse">
          <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={shouldLoad ? src : undefined}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading={loading}
        decoding="async"
        fetchPriority={loading === 'eager' ? 'high' : 'low'}
      />
    </div>
  );
}
