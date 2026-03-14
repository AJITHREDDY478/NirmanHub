import { useEffect, useState } from 'react';

export default function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
  fallback = null,
  loading = 'lazy'
}) {
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(src));
  }, [src]);

  if (!src || hasError) {
    return <div className={containerClassName}>{fallback}</div>;
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse">
          <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading={loading}
      />
    </div>
  );
}
