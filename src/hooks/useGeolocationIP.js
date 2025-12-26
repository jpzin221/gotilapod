import { useState, useEffect, useCallback } from 'react';
import {
  obterLocalizacaoPrecisa,
  buscarLocalizacaoPorIP,
  limparCacheLocalizacao,
  calcularDistancia,
  formatarDistancia,
  gerarMensagemBanner,
  isBannerFechado,
  salvarBannerFechado,
  obterSedeBase,
  CONFIG,
  SEDE_BASE
} from '../services/geolocation-service';

/**
 * Hook personalizado para geolocalização por IP
 * @returns {Object} Estado e funções de geolocalização
 */
export function useGeolocationIP() {
  const [localizacao, setLocalizacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagemBanner, setMensagemBanner] = useState(null);
  const [bannerVisivel, setBannerVisivel] = useState(!isBannerFechado());

  // Buscar localização ao montar
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      try {
        setLoading(true);
        setErro(null);

        const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });

        if (!isMounted) return;

        if (loc.erro) {
          setErro(loc.mensagem);
          setMensagemBanner(gerarMensagemBanner(null));
        } else {
          setLocalizacao(loc);
          setMensagemBanner(gerarMensagemBanner(loc));
        }
      } catch (error) {
        if (!isMounted) return;
        setErro('Erro ao buscar localização');
        setMensagemBanner(gerarMensagemBanner(null));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fechar banner
  const fecharBanner = useCallback(() => {
    salvarBannerFechado();
    setBannerVisivel(false);
  }, []);

  // Reabrir banner (limpa preferência)
  const reabrirBanner = useCallback(() => {
    try {
      localStorage.removeItem(CONFIG.bannerClosedKey);
    } catch (e) { }
    setBannerVisivel(true);
  }, []);

  // Limpar cache e recarregar
  const limparCache = useCallback(async () => {
    limparCacheLocalizacao();
    setBannerVisivel(true);
    setLoading(true);

    try {
      const loc = await obterLocalizacaoPrecisa({ validacaoCruzada: true });
      if (loc.erro) {
        setErro(loc.mensagem);
        setMensagemBanner(gerarMensagemBanner(null));
      } else {
        setLocalizacao(loc);
        setMensagemBanner(gerarMensagemBanner(loc));
      }
    } catch (error) {
      setErro('Erro ao buscar localização');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    localizacao,
    loading,
    erro,
    mensagemBanner,
    bannerVisivel,

    // Dados derivados
    cidade: localizacao?.cidade || null,
    estado: localizacao?.estado || null,
    distancia: localizacao?.distanciaParaSede || null,
    distanciaFormatada: localizacao?.distanciaParaSede
      ? formatarDistancia(localizacao.distanciaParaSede)
      : null,
    isProximo: localizacao?.distanciaParaSede
      ? localizacao.distanciaParaSede <= CONFIG.distanciaProxima
      : false,

    // Funções
    fecharBanner,
    reabrirBanner,
    limparCache,

    // Utilitários exportados
    formatarDistancia,
    calcularDistancia,

    // Configurações
    sedeBase: SEDE_BASE,
    config: CONFIG
  };
}

export default useGeolocationIP;
