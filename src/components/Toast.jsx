import { CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 font-medium text-sm">{message}</p>
        <button
          onClick={onClose}
          className="hover:bg-green-700 p-1 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
