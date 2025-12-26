import { Clock, CheckCircle, XCircle, Bike } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGeolocation, calculateDistance, formatDistance } from '../hooks/useGeolocation';
import { physicalStoresService, carouselService } from '../lib/supabase';
import { obterLocalizacaoPrecisa } from '../services/geolocation-service';

const DAYS_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

export default function HeroSection({ businessHours, storeLocation, deliveryRadius }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentHours, setCurrentHours] = useState('');
  const [nearestStore, setNearestStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { location, loading: loadingLocation, error } = useGeolocation();
  const [localizacaoIP, setLocalizacaoIP] = useState(null);
  const [loadingIP, setLoadingIP] = useState(true);

  // Buscar localização por IP
  useEffect(() => {
    const fetchLocationIP = async () => {
      try {
        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
        setLocalizacaoIP(loc);
      } catch (error) {
        console.error('Erro ao buscar localização por IP:', error);
      } finally {
        setLoadingIP(false);
      }
    };
    fetchLocationIP();
  }, []);

  // Carregar slides do banco de dados
  useEffect(() => {
    const loadSlides = async () => {
      try {
        // Buscar slides ativos do banco de dados
        const slidesData = await carouselService.getActiveSlides();

        if (slidesData && slidesData.length > 0) {
          // Usar slides do banco
          const formattedSlides = slidesData.map(slide => ({
            id: slide.id,
            imageMobile: slide.image_mobile_url,
            imageDesktop: slide.image_desktop_url,
            title: slide.title,
            subtitle: slide.subtitle,
            badge: slide.badge
          }));
          setSlides(formattedSlides);
        } else {
          // Fallback: usar slides locais se não houver no banco
          console.warn('Nenhum slide ativo encontrado no banco. Usando slides padrão.');
          setSlides([
            {
              id: 1,
              imageMobile: '/images/Fotos-site/foto-carrosel-celular.webp',
              imageDesktop: '/images/Fotos-site/foto-carrosel-desktop.webp',
              title: 'O POD que redefine o prazer do vapor!',
              subtitle: 'Confira nossas ofertas',
              badge: 'Destaque'
            },
            {
              id: 2,
              imageMobile: '/images/Fotos-site/foto-carrosel-celular2.webp',
              imageDesktop: '/images/Fotos-site/foto-carrosel-desktop2.webp',
              title: 'Até 40.000 puffs de pura intensidade 🔥',
              subtitle: 'Últimas unidades disponíveis',
              badge: 'Promoção'
            },
            {
              id: 3,
              imageMobile: '/images/Fotos-site/foto-carrosel-celular3.webp',
              imageDesktop: '/images/Fotos-site/foto-carrosel-desktop3.webp',
              title: 'Variedade de sabores incríveis',
              subtitle: 'Encontre seu favorito',
              badge: 'Novidade'
            }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar slides:', error);
        // Em caso de erro, usar slides padrão
        setSlides([
          {
            id: 1,
            imageMobile: '/images/Fotos-site/foto-carrosel-celular.webp',
            imageDesktop: '/images/Fotos-site/foto-carrosel-desktop.webp',
            title: 'O POD que redefine o prazer do vapor!',
            subtitle: 'Confira nossas ofertas',
            badge: 'Destaque'
          },
          {
            id: 2,
            imageMobile: '/images/Fotos-site/foto-carrosel-celular2.webp',
            imageDesktop: '/images/Fotos-site/foto-carrosel-desktop2.webp',
            title: 'Até 40.000 puffs de pura intensidade 🔥',
            subtitle: 'Últimas unidades disponíveis',
            badge: 'Promoção'
          },
          {
            id: 3,
            imageMobile: '/images/Fotos-site/foto-carrosel-celular3.webp',
            imageDesktop: '/images/Fotos-site/foto-carrosel-desktop3.webp',
            title: 'Variedade de sabores incríveis',
            subtitle: 'Encontre seu favorito',
            badge: 'Novidade'
          }
        ]);
      } finally {
        setLoadingSlides(false);
      }
    };

    loadSlides();
  }, []);

  // Carrossel automático - 4 segundos
  useEffect(() => {
    if (slides.length === 0) return; // Não iniciar se não houver slides

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // 4 segundos

    return () => clearInterval(timer);
  }, [slides.length]); // Reiniciar quando slides mudarem

  // Verificar horário de funcionamento
  useEffect(() => {
    if (!businessHours) return;

    const checkBusinessHours = () => {
      const now = new Date();
      const currentDay = DAYS_MAP[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const todayHours = businessHours[currentDay];

      if (!todayHours || !todayHours.open || !todayHours.close) {
        setIsOpen(false);
        setCurrentHours('Fechado hoje');
        return;
      }

      const [openHour, openMin] = todayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;

      const open = currentTime >= openTime && currentTime < closeTime;
      setIsOpen(open);
      setCurrentHours(`${todayHours.open} - ${todayHours.close}`);
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000);
    return () => clearInterval(interval);
  }, [businessHours]);

  // Buscar loja mais próxima
  useEffect(() => {
    const findNearestStore = async () => {
      if (!location) return;

      try {
        const store = await physicalStoresService.findNearest(
          location.latitude,
          location.longitude
        );
        setNearestStore(store);
      } catch (error) {
        console.error('Erro ao buscar loja mais próxima:', error);
      } finally {
        setLoadingStore(false);
      }
    };

    findNearestStore();
  }, [location]);

  // Funções de navegação
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Funções de Touch/Swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const minSwipeDistance = 50; // Distância mínima para considerar um swipe
    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe para esquerda - próximo slide
        nextSlide();
      } else {
        // Swipe para direita - slide anterior
        prevSlide();
      }
    }

    setIsDragging(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse drag para desktop
  const handleMouseDown = (e) => {
    e.preventDefault(); // Previne comportamento padrão
    setTouchStart(e.clientX);
    setTouchEnd(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const minSwipeDistance = 50;
    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setIsDragging(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTouchStart(0);
      setTouchEnd(0);
    }
  };

  const distance = location && storeLocation
    ? calculateDistance(
      location.latitude,
      location.longitude,
      storeLocation.latitude,
      storeLocation.longitude
    )
    : null;

  const isInDeliveryArea = distance !== null && distance <= deliveryRadius;

  // Função para adicionar espaço não-quebrável antes de emojis
  const processTextWithEmojis = (text) => {
    if (!text) return text;
    // Regex para encontrar emojis
    const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
    // Substitui espaço normal antes de emoji por espaço não-quebrável
    return text.replace(/\s+([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, '\u00A0$1');
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Barra de Status Compacta */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 py-1.5 sm:py-3 bg-black/30 backdrop-blur-sm">
          {/* Status de Funcionamento */}
          <div className="flex items-center gap-2">
            {isOpen ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <span className="font-semibold text-green-400">ABERTO</span>
                  <span className="text-gray-300 text-sm ml-2">{currentHours}</span>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <span className="font-semibold text-red-400">FECHADO</span>
                  <span className="text-gray-300 text-sm ml-2">{currentHours}</span>
                </div>
              </>
            )}
          </div>

          {/* Status de Entrega */}
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-300">
              {loadingIP ? (
                'Detectando localização...'
              ) : localizacaoIP?.cidade ? (
                `Atendemos ${localizacaoIP.cidade}, ${localizacaoIP.estado}`
              ) : (
                'Atendemos todo o Paraná'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Carrossel Principal - Largura Total com Swipe */}
      <div
        className={`relative overflow-hidden w-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div
          className={`flex ${isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full">
              {/* Container com aspect-ratio adaptativo - sem barras pretas:
                  - Mobile: proporção 16:9 para banners widescreen
                  - Desktop: proporção mais larga para telas grandes
              */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[5/2] lg:aspect-[21/8] flex items-center justify-center overflow-hidden">
                <picture className="absolute inset-0 w-full h-full">
                  <source
                    media="(min-width: 768px)"
                    srcSet={slide.imageDesktop}
                  />
                  <img
                    src={slide.imageMobile || slide.imageDesktop}
                    alt={slide.title || 'Banner promocional'}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </picture>

                {/* Overlay e texto apenas se tiver título definido */}
                {slide.title && slide.title.trim() !== '' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Conteúdo do Slide - Sempre no rodapé */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 w-full p-3 sm:p-4 md:p-6 lg:p-8">
                      <div className="max-w-2xl">
                        {slide.badge && (
                          <span className="inline-block bg-gradient-to-r from-primary to-secondary text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full mb-1 sm:mb-2">
                            {slide.badge}
                          </span>
                        )}
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-white drop-shadow-lg leading-tight">
                          {processTextWithEmojis(slide.title)}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-snug mt-1">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botão Flutuante de Entrega Rápida */}
        <div className="absolute top-3 right-3 md:top-6 md:right-6 z-10 animate-pulse pointer-events-auto">
          <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
            <Bike className="w-4 h-4 md:w-5 md:h-5 text-white" />
            <span className="font-bold text-white text-xs md:text-base">Entrega Rápida</span>
          </div>
        </div>

        {/* Dica de Arraste (Apenas Desktop) */}
        <div className="absolute top-4 left-4 z-10 hidden lg:block pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-white text-xs font-medium flex items-center gap-1.5">
              <span className="text-lg">👆</span>
              <span className="hidden xl:inline">Arraste para navegar</span>
              <span className="xl:hidden">Arraste</span>
            </p>
          </div>
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
                }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
