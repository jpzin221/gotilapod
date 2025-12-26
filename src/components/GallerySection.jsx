import { useState } from 'react';
import { X, ZoomIn, Sparkles } from 'lucide-react';

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const images = [
    { id: 1, src: '/images/fotosdiversas (1).webp', alt: 'Produtos POD EXPRESSS', category: 'Destaque' },
    { id: 2, src: '/images/fotosdiversas (2).webp', alt: 'Vaporizadores de Alta Durabilidade', category: 'Mais Vendidos' },
    { id: 3, src: '/images/fotosdiversas (3).webp', alt: 'Variedade de Pods', category: 'Variedade' },
    { id: 4, src: '/images/fotosdiversas (4).webp', alt: 'Ignite Collection', category: 'Ignite' },
    { id: 5, src: '/images/fotosdiversas (5).webp', alt: 'Geek Bar 25K', category: 'Geek Bar' },
    { id: 6, src: '/images/fotosdiversas (6).webp', alt: 'Acessórios', category: 'Acessórios' },
    { id: 7, src: '/images/fotosdiversas (7).webp', alt: 'Pods Descartáveis', category: 'Pods' },
    { id: 8, src: '/images/fotosdiversas (8).webp', alt: 'Produtos em Destaque', category: 'Novidades' }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Título moderno */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Explore</span>
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nossa Galeria
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Confira nossos produtos premium e a variedade que oferecemos
          </p>
        </div>
        
        {/* Grid de imagens moderno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group cursor-pointer overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedImage(image)}
              onMouseEnter={() => setHoveredId(image.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Imagem */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                {/* Ícone de zoom */}
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
                
                {/* Badge de categoria */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
                  {image.category}
                </div>
              </div>
              
              {/* Informações */}
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-bold text-sm mb-1">{image.alt}</h3>
                <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"></div>
              </div>
              
              {/* Efeito de brilho */}
              <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal moderno para imagem ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl w-full">
            {/* Botão fechar */}
            <button
              className="absolute -top-16 right-0 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-300 hover:scale-110 hover:rotate-90 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Container da imagem */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl border border-gray-700/50">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Informações da imagem */}
            <div className="mt-6 text-center">
              <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full mb-3">
                {selectedImage.category}
              </span>
              <h3 className="text-white text-2xl font-bold">
                {selectedImage.alt}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
