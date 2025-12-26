import { MapPin, Store, X, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  obterLocalizacaoPrecisa,
  formatarDistancia,
  isBannerFechado,
  salvarBannerFechado,
  CONFIG
} from '../services/geolocation-service';

export default function NearbyStoresBanner() {
  const [isVisible, setIsVisible] = useState(!isBannerFechado());
  const [loading, setLoading] = useState(true);
  const [localizacao, setLocalizacao] = useState(null);

  useEffect(() => {
    if (!isVisible) return;

    const fetchLocation = async () => {
      try {
        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
        setLocalizacao(loc);
      } catch (error) {
        console.error('Erro ao buscar localização:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    salvarBannerFechado();
  };

  if (!isVisible) return null;

  const cidade = localizacao?.cidade || 'sua região';
  const estado = localizacao?.estado || 'BR';
  const distancia = localizacao?.distanciaParaSede;
  const isProximo = distancia && distancia <= CONFIG.distanciaProxima;
  const estaDentroDoRaio = localizacao?.estaDentroDoRaio ?? true;
  const entregaDisponivel = localizacao?.entregaDisponivel ?? true;

  // Classe do banner baseada na proximidade
  const bannerClass = isProximo
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-green-500 to-emerald-600';

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 shadow-md sticky top-[80px] sm:top-[112px] z-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Informações Compactas */}
          <div className="flex items-center gap-4 flex-1">
            {/* Ícone + Localização */}
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 flex-shrink-0" />
              )}
              <div className="text-xs">
                {loading ? (
                  <span className="font-medium animate-pulse">Detectando sua localização...</span>
                ) : (
                  <>
                    <span className="font-bold">
                      ✅ Lojas Parceiras em {cidade}, {estado}
                    </span>
                    <span className="opacity-90 ml-2">
                      • {distancia ? `${formatarDistancia(distancia)} de distância` : 'Entrega disponível'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="hidden sm:block h-4 w-px bg-white bg-opacity-30"></div>

            {/* Ícone + Entrega */}
            <div className="hidden sm:flex items-center gap-2">
              <Store className="w-4 h-4 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold">
                  🚀 Entrega Disponível
                </span>
                <span className="opacity-90 ml-2">
                  • Atendemos sua região
                </span>
              </div>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition flex-shrink-0"
            title="Fechar"
            aria-label="Fechar banner de localização"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
