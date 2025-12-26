import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  obterLocalizacaoPrecisa,
  gerarMensagemBanner,
  isBannerFechado,
  salvarBannerFechado,
  formatarDistancia
} from '../services/geolocation-service';
import './LocationBannerIP.css';

/**
 * Componente de Banner de Localização por IP
 * Exibe um banner fixo no topo com mensagem personalizada baseada na localização
 */
export default function LocationBannerIP() {
  const [loading, setLoading] = useState(true);
  const [localizacao, setLocalizacao] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Verificar se o banner foi fechado anteriormente
    if (isBannerFechado()) {
      setIsVisible(false);
      setLoading(false);
      return;
    }

    // Buscar localização
    const fetchLocation = async () => {
      try {
        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
        setLocalizacao(loc);

        // Gerar mensagem baseada na localização
        const msg = gerarMensagemBanner(loc);
        setMensagem(msg);

      } catch (error) {
        console.error('Erro ao buscar localização:', error);
        setMensagem({
          mensagem: 'Lojas parceiras perto de você • Atendemos sua região',
          tipo: 'fallback',
          icone: '📍'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const handleClose = () => {
    setAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      salvarBannerFechado();
    }, 300);
  };

  if (!isVisible) return null;

  // Determinar classe do banner baseada no tipo
  const getBannerClass = () => {
    if (loading) return 'location-banner location-banner--loading';
    if (mensagem?.tipo === 'proximo') return 'location-banner location-banner--proximo';
    if (mensagem?.tipo === 'fallback') return 'location-banner location-banner--fallback';
    return 'location-banner location-banner--normal';
  };

  return (
    <div
      className={`${getBannerClass()} ${animating ? 'location-banner--closing' : ''} `}
      role="banner"
      aria-label="Informação de localização"
    >
      <div className="location-banner__container">
        {/* Ícone de Localização */}
        <div className="location-banner__icon" aria-hidden="true">
          {loading ? (
            <div className="location-banner__spinner" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="location-banner__pin"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </div>

        {/* Conteúdo */}
        <div className="location-banner__content">
          {loading ? (
            <p className="location-banner__text">
              Detectando sua localização...
            </p>
          ) : (
            <>
              <p className="location-banner__text">
                {mensagem?.mensagem}
              </p>
              {localizacao && !localizacao.erro && mensagem?.tipo !== 'proximo' && (
                <p className="location-banner__subtext">
                  {localizacao.cidade}, {localizacao.estado} • {formatarDistancia(localizacao.distanciaParaSede)} de distância
                </p>
              )}
            </>
          )}
        </div>

        {/* Botão Fechar */}
        {!loading && (
          <button
            onClick={handleClose}
            className="location-banner__close"
            aria-label="Fechar banner de localização"
            title="Fechar"
          >
            <X className="location-banner__close-icon" />
          </button>
        )}
      </div>
    </div>
  );
}
