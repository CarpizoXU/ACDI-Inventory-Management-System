export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
        <button
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>×</span>
        </button>
        {title && <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
