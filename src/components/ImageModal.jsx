import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ImageModal({ imageUrl, imageName, onClose }) {
  if (!imageUrl) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-[999999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all hover:scale-110 z-[1000000]"
        aria-label="Fechar"
      >
        <X className="w-6 h-6 text-gray-800" />
      </button>

      {/* Imagem */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>,
    document.body
  );
}
