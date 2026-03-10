export default function BrandLoader({ message = 'Loading...', compact = false }) {
  if (compact) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm py-12 sm:py-14 px-6 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></span>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:120ms]"></span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:240ms]"></span>
        </div>
        <p className="font-display text-2xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 bg-clip-text text-transparent animate-pulse">AR Print Lab</p>
        <p className="text-slate-600 mt-2">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm py-16 sm:py-20 px-6 sm:px-8 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></span>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:120ms]"></span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:240ms]"></span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 bg-clip-text text-transparent animate-pulse">
          AR Print Lab
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
}
