export default function Toast({ show, message }) {
  return (
    <div className={`fixed top-6 right-6 z-[100] transform transition-all duration-300 ${
      show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
    }`}>
      <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
