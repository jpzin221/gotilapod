import { Star, Bike, MapPin, Store, Shield, Lock, User, Loader2, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import PhoneAuthModal from './PhoneAuthModal';
import {
  obterLocalizacaoPrecisa,
  formatarDistancia,
  isBannerFechado,
  salvarBannerFechado,
  CONFIG
} from '../services/geolocation-service';

export default function Header({ storeInfo }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = usePhoneAuth();
  const { get } = useSiteConfig();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [localizacao, setLocalizacao] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(!isBannerFechado());

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
        setLocalizacao(loc);
      } catch (error) {
        console.error('Erro ao buscar localização:', error);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchLocation();
  }, []);

  const handleCloseBanner = () => {
    setBannerVisible(false);
    salvarBannerFechado();
  };

  const handleUserClick = () => {
    if (isAuthenticated) {
      navigate('/meus-pedidos');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      {/* Barra de Segurança */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-1">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-semibold">Compra 100% Segura</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-semibold">Dados Protegidos</span>
          </div>
        </div>
      </div>

      {/* Barra de Geolocalização - Otimizada para Mobile */}
      {bannerVisible && (
        <div className={`${localizacao?.distanciaParaSede && localizacao.distanciaParaSede <= CONFIG.distanciaProxima
          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
          : 'bg-gradient-to-r from-green-500 to-emerald-600'
          } text-white py-1.5 sm:py-2 px-2 sm:px-4 shadow-md`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              {/* Informações Compactas */}
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Ícone + Localização */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  {loadingLocation ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  )}
                  <div className="text-[10px] sm:text-xs min-w-0">
                    {loadingLocation ? (
                      <span className="font-medium animate-pulse">Detectando...</span>
                    ) : (
                      <>
                        <div className="font-bold truncate">
                          {localizacao?.distanciaParaSede && localizacao.distanciaParaSede <= CONFIG.distanciaProxima ? '🎉 ' : ''}
                          {localizacao?.cidade || 'Sua região'}, {localizacao?.estado || 'BR'}
                        </div>
                        <div className="opacity-90 text-[9px] sm:text-[10px] truncate">
                          {localizacao?.distanciaParaSede ? (
                            <>
                              {formatarDistancia(localizacao.distanciaParaSede)}
                              <span className="hidden sm:inline"> de distância</span>
                              {' • '}
                              <span className="hidden sm:inline">
                                {!localizacao?.entregaDisponivel
                                  ? 'Verificar disponibilidade'
                                  : localizacao.distanciaParaSede <= CONFIG.distanciaProxima
                                    ? 'Entrega ultra rápida'
                                    : 'Entrega disponível'}
                              </span>
                              <span className="sm:hidden">
                                {!localizacao?.entregaDisponivel
                                  ? 'Verificar'
                                  : localizacao.distanciaParaSede <= CONFIG.distanciaProxima
                                    ? 'Ultra rápido'
                                    : 'Disponível'}
                              </span>
                            </>
                          ) : (
                            'Atendemos sua região'
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Separador - Apenas desktop */}
                <div className="hidden md:block h-4 w-px bg-white bg-opacity-30"></div>

                {/* Ícone + Entrega - Apenas desktop */}
                <div className="hidden md:flex items-center gap-2">
                  {!localizacao?.entregaDisponivel && localizacao?.distanciaParaSede ? (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Store className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="text-xs">
                    <span className="font-bold">
                      {!localizacao?.entregaDisponivel && localizacao?.distanciaParaSede
                        ? '📦 Verificar Disponibilidade'
                        : localizacao?.distanciaParaSede && localizacao.distanciaParaSede <= CONFIG.distanciaProxima
                          ? '🚀 Entrega Ultra Rápida'
                          : 'Entrega Disponível'}
                    </span>
                    <span className="opacity-90 ml-2">
                      • {!localizacao?.entregaDisponivel && localizacao?.distanciaParaSede
                        ? 'Fora do raio'
                        : localizacao?.distanciaParaSede && localizacao.distanciaParaSede <= CONFIG.distanciaProxima
                          ? 'Mesma cidade!'
                          : localizacao?.estaDentroDoRaio
                            ? 'Dentro do raio'
                            : 'Consulte-nos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão fechar */}
              <button
                onClick={handleCloseBanner}
                className="hover:bg-white hover:bg-opacity-20 p-0.5 sm:p-1 rounded transition flex-shrink-0"
                title="Fechar"
                aria-label="Fechar banner de localização"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações da loja - Compacto */}
      <div className="bg-white max-w-7xl mx-auto px-4 py-1.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="bg-white rounded-lg p-1 sm:p-1.5 shadow-md flex-shrink-0 border border-gray-200">
            <img
              src={get('logo_url') || storeInfo.logo}
              alt={get('site_name') || storeInfo.name}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          </div>

          {/* Informações - Compactas */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 truncate">
              {get('site_name') || storeInfo.name}
            </h1>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
              {/* Rating */}
              <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-700">{storeInfo.rating}</span>
              </div>

              {/* Badge Motoboy */}
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                <Bike className="w-3 h-3" />
                <span className="font-semibold hidden sm:inline">Motoboy</span>
              </div>

              {/* Badge Localização do Cliente */}
              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                {loadingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                <span className="font-semibold">
                  {loadingLocation
                    ? '...'
                    : localizacao?.cidade
                      ? `${localizacao.cidade}`
                      : 'Brasil'}
                </span>
              </div>

              {/* Badge Lojas */}
              <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                <Store className="w-3 h-3" />
                <span className="font-semibold hidden sm:inline">Parceiros</span>
              </div>
            </div>
          </div>

          {/* Botão de Usuário */}
          <button
            onClick={handleUserClick}
            className="relative bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition flex-shrink-0"
            title={isAuthenticated ? `Meus Pedidos - ${user?.nome}` : 'Acessar conta'}
          >
            <User className="w-5 h-5 text-gray-700" />
            {isAuthenticated && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Auth */}
      <PhoneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="login"
        onSuccess={() => console.log('Login realizado!')}
      />
    </header>
  );
}
