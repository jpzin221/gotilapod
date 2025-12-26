import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop.webp',
      alt: 'Promoção 1 - POD EXPRESSS'
    },
    {
      id: 2,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular2.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop2.webp',
      alt: 'Promoção 2 - POD EXPRESSS'
    },
    {
      id: 3,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular3.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp',
      alt: 'Promoção 3 - POD EXPRESSS'
    },
    {
      id: 4,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular4.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp',
      alt: 'Promoção 4 - POD EXPRESSS'
    },
    {
      id: 5,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular5.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp',
      alt: 'Promoção 5 - POD EXPRESSS'
    },
    {
      id: 6,
      imageMobile: '/src/Imagens/Fotos-site/foto-carrosel-celular6.webp',
      imageDesktop: '/src/Imagens/Fotos-site/foto-carrosel-desktop3.webp',
      alt: 'Promoção 6 - POD EXPRESSS'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-xl sm:rounded-2xl shadow-2xl mx-auto max-w-7xl">
      {/* Container com aspect-ratio responsivo */}
      <div className="relative w-full" style={{ paddingBottom: 'clamp(45%, 50vw, 35%)' }}>
        {/* Slides */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
              <picture>
                {/* Imagem para desktop (telas maiores que 768px) */}
                <source
                  media="(min-width: 768px)"
                  srcSet={slide.imageDesktop}
                />
                {/* Imagem para mobile (telas menores que 768px) */}
                <img
                  src={slide.imageMobile}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </picture>
            </div>
          ))}
        </div>

        {/* Botões de navegação - menores no mobile */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-1.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 z-10"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-1.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 z-10"
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        {/* Indicadores - menores e mais discretos no mobile */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentSlide
                  ? 'w-5 sm:w-8 h-2 sm:h-3 bg-white shadow-md'
                  : 'w-2 sm:w-3 h-2 sm:h-3 bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
