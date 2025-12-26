/**
 * Sistema de Geolocalização por IP - Vanilla JavaScript
 * Versão standalone para incluir em qualquer página HTML
 * 
 * Uso:
 * 1. Inclua este script no HTML: <script src="js/location-banner.js"></script>
 * 2. Adicione o container: <div id="location-banner-root"></div>
 * 3. Personalize SEDE_BASE com suas coordenadas
 */
(function(window, document) {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO DA SEDE BASE (ALTERE AQUI)
  // ============================================
  var SEDE_BASE = {
    lat: -25.4284,  // Latitude da sua sede
    lon: -49.2733,  // Longitude da sua sede
    cidade: 'Curitiba',
    estado: 'PR'
  };

  // ============================================
  // CONFIGURAÇÕES DO SISTEMA
  // ============================================
  var CONFIG = {
    distanciaProxima: 8,
    cacheExpiracao: 24 * 60 * 60 * 1000,
    locationCacheKey: 'userLocation',
    bannerClosedKey: 'locationBannerClosed'
  };

  // ============================================
  // APIs DE GEOLOCALIZAÇÃO
  // ============================================
  var GEOLOCATION_APIS = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parseResponse: function(data) {
        return {
          ip: data.ip,
          cidade: data.city,
          estado: data.region_code || data.region,
          pais: data.country_name,
          paisCodigo: data.country_code,
          lat: data.latitude,
          lon: data.longitude,
          provedor: data.org
        };
      }
    },
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      parseResponse: function(data) {
        return {
          ip: data.ip,
          cidade: data.city,
          estado: data.region_code || data.region,
          pais: data.country,
          paisCodigo: data.country_code,
          lat: data.latitude,
          lon: data.longitude,
          provedor: data.connection ? data.connection.org : null
        };
      }
    },
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/',
      parseResponse: function(data) {
        return {
          ip: data.query,
          cidade: data.city,
          estado: data.region,
          pais: data.country,
          paisCodigo: data.countryCode,
          lat: data.lat,
          lon: data.lon,
          provedor: data.isp
        };
      }
    }
  ];

  // ============================================
  // ESTILOS CSS (injetados automaticamente)
  // ============================================
  var CSS_STYLES = `
    @keyframes locationBannerSlideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes locationBannerSlideUp {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(-100%); opacity: 0; }
    }
    @keyframes locationBannerSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes locationBannerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .location-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      animation: locationBannerSlideDown 0.4s ease-out forwards;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .location-banner--closing { animation: locationBannerSlideUp 0.3s ease-in forwards; }
    .location-banner--hidden { display: none; }
    .location-banner--normal { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .location-banner--proximo { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
    .location-banner--loading { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; }
    .location-banner--fallback { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .location-banner__container {
      max-width: 80rem;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .location-banner__icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
    }
    .location-banner__pin { width: 1.125rem; height: 1.125rem; }
    .location-banner__spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: locationBannerSpin 0.8s linear infinite;
    }
    .location-banner__content { flex: 1; min-width: 0; }
    .location-banner__text { font-size: 0.8125rem; font-weight: 500; line-height: 1.4; margin: 0; }
    .location-banner__subtext { font-size: 0.6875rem; opacity: 0.9; margin: 0.125rem 0 0 0; line-height: 1.3; }
    .location-banner--loading .location-banner__text { animation: locationBannerPulse 1.5s ease-in-out infinite; }
    .location-banner__close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      color: inherit;
      cursor: pointer;
      transition: background-color 0.2s ease;
      opacity: 0.8;
    }
    .location-banner__close:hover { background: rgba(255, 255, 255, 0.2); opacity: 1; }
    .location-banner__close:focus { outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: 2px; }
    .location-banner__close-icon { width: 1rem; height: 1rem; }
    @media (min-width: 640px) {
      .location-banner { padding: 0.875rem 1.5rem; }
      .location-banner__container { gap: 1rem; }
      .location-banner__icon { width: 2.25rem; height: 2.25rem; }
      .location-banner__pin { width: 1.25rem; height: 1.25rem; }
      .location-banner__text { font-size: 0.875rem; }
      .location-banner__subtext { font-size: 0.75rem; }
      .location-banner__close { width: 2rem; height: 2rem; }
      .location-banner__close-icon { width: 1.125rem; height: 1.125rem; }
    }
    @media (min-width: 1024px) {
      .location-banner { padding: 1rem 2rem; }
      .location-banner__container { gap: 1.25rem; }
      .location-banner__icon { width: 2.5rem; height: 2.5rem; }
      .location-banner__pin { width: 1.375rem; height: 1.375rem; }
      .location-banner__text { font-size: 0.9375rem; }
      .location-banner__subtext { font-size: 0.8125rem; margin-top: 0.25rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .location-banner { animation: none; opacity: 1; transform: none; }
      .location-banner--closing { animation: none; display: none; }
      .location-banner__spinner { animation: none; }
      .location-banner--loading .location-banner__text { animation: none; }
    }
  `;

  // ============================================
  // INJETAR ESTILOS CSS
  // ============================================
  function injetarEstilos() {
    if (document.getElementById('location-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'location-banner-styles';
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
  }

  // ============================================
  // FUNÇÕES DE CÁLCULO
  // ============================================
  function calcularDistancia(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var toRad = function(deg) { return deg * (Math.PI / 180); };
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatarDistancia(km) {
    if (km < 1) return Math.round(km * 1000) + 'm';
    if (km < 10) return km.toFixed(1) + 'km';
    return Math.round(km) + 'km';
  }

  // ============================================
  // FUNÇÕES DE CACHE
  // ============================================
  function salvarCache(localizacao) {
    try {
      var cacheData = Object.assign({}, localizacao, { cachedAt: Date.now() });
      localStorage.setItem(CONFIG.locationCacheKey, JSON.stringify(cacheData));
    } catch (e) { console.warn('Erro ao salvar cache:', e); }
  }

  function obterCache() {
    try {
      var cached = localStorage.getItem(CONFIG.locationCacheKey);
      if (!cached) return null;
      var data = JSON.parse(cached);
      if (Date.now() - data.cachedAt > CONFIG.cacheExpiracao) {
        localStorage.removeItem(CONFIG.locationCacheKey);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  function isBannerFechado() {
    try { return localStorage.getItem(CONFIG.bannerClosedKey) === 'true'; }
    catch (e) { return false; }
  }

  function salvarBannerFechado() {
    try { localStorage.setItem(CONFIG.bannerClosedKey, 'true'); }
    catch (e) { console.warn('Erro ao salvar preferência:', e); }
  }

  // ============================================
  // FUNÇÕES DE GEOLOCALIZAÇÃO
  // ============================================
  function buscarLocalizacao() {
    return new Promise(function(resolve) {
      var cached = obterCache();
      if (cached) {
        console.log('📍 Localização obtida do cache');
        resolve(cached);
        return;
      }

      var tryApi = function(index) {
        if (index >= GEOLOCATION_APIS.length) {
          console.error('❌ Todas as APIs falharam');
          resolve({ erro: true, mensagem: 'Não foi possível detectar sua localização' });
          return;
        }

        var api = GEOLOCATION_APIS[index];
        console.log('🔍 Tentando API: ' + api.name);

        var timeout = setTimeout(function() {
          console.warn('⚠️ Timeout na API ' + api.name);
          tryApi(index + 1);
        }, 5000);

        fetch(api.url, { headers: { 'Accept': 'application/json' } })
          .then(function(response) {
            clearTimeout(timeout);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
          })
          .then(function(data) {
            if (api.name === 'ipwho.is' && data.success === false) {
              throw new Error(data.message || 'API retornou erro');
            }
            if (api.name === 'ip-api.com' && data.status === 'fail') {
              throw new Error(data.message || 'API retornou erro');
            }

            var localizacao = api.parseResponse(data);
            if (!localizacao.cidade || !localizacao.lat || !localizacao.lon) {
              throw new Error('Dados incompletos');
            }

            localizacao.fonte = api.name;
            localizacao.timestamp = Date.now();
            localizacao.distanciaParaSede = calcularDistancia(
              localizacao.lat, localizacao.lon,
              SEDE_BASE.lat, SEDE_BASE.lon
            );

            salvarCache(localizacao);
            console.log('✅ Localização obtida via ' + api.name + ':', localizacao);
            resolve(localizacao);
          })
          .catch(function(error) {
            clearTimeout(timeout);
            console.warn('⚠️ Falha na API ' + api.name + ':', error.message);
            tryApi(index + 1);
          });
      };

      tryApi(0);
    });
  }

  function gerarMensagem(localizacao) {
    if (!localizacao || localizacao.erro) {
      return {
        mensagem: 'Lojas parceiras perto de você • Atendemos sua região',
        tipo: 'fallback',
        subtexto: null
      };
    }

    var distancia = localizacao.distanciaParaSede;
    var cidade = localizacao.cidade;
    var estado = localizacao.estado;

    if (distancia <= CONFIG.distanciaProxima) {
      return {
        mensagem: '🎉 Estamos na mesma cidade que você (' + distancia.toFixed(1) + ' km)! Entrega ultra rápida disponível.',
        tipo: 'proximo',
        subtexto: null
      };
    }

    return {
      mensagem: 'Atendemos ' + cidade + (estado ? ', ' + estado : '') + ' com entrega rápida. Consulte disponibilidade.',
      tipo: 'normal',
      subtexto: cidade + ', ' + estado + ' • ' + formatarDistancia(distancia) + ' de distância'
    };
  }

  function atualizarElementosDOM(localizacao) {
    if (!localizacao || localizacao.erro) return;

    var cidade = localizacao.cidade || 'sua região';
    var estado = localizacao.estado || 'BR';

    var elCidade = document.getElementById('localCidade');
    var elEstado = document.getElementById('localEstado');
    var elDistancia = document.getElementById('localDistancia');

    if (elCidade) elCidade.textContent = cidade;
    if (elEstado) elEstado.textContent = estado;
    if (elDistancia && localizacao.distanciaParaSede) {
      elDistancia.textContent = formatarDistancia(localizacao.distanciaParaSede);
    }

    var cidadeElements = document.querySelectorAll('[data-local="cidade"]');
    var estadoElements = document.querySelectorAll('[data-local="estado"]');
    
    for (var i = 0; i < cidadeElements.length; i++) {
      cidadeElements[i].textContent = cidade;
    }
    for (var j = 0; j < estadoElements.length; j++) {
      estadoElements[j].textContent = estado;
    }

    console.log('🔄 Elementos DOM atualizados');
  }

  // ============================================
  // FUNÇÕES DO BANNER
  // ============================================
  function criarBannerHTML(estado, mensagem, subtexto) {
    var classeEstado = 'location-banner--' + estado;
    var mostrarClose = estado !== 'loading';
    var mostrarSpinner = estado === 'loading';

    return '<div class="location-banner ' + classeEstado + '" id="locationBanner" role="banner" aria-label="Informação de localização">' +
      '<div class="location-banner__container">' +
        '<div class="location-banner__icon" aria-hidden="true">' +
          (mostrarSpinner ? 
            '<div class="location-banner__spinner"></div>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-banner__pin">' +
              '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
              '<circle cx="12" cy="10" r="3"></circle>' +
            '</svg>'
          ) +
        '</div>' +
        '<div class="location-banner__content">' +
          '<p class="location-banner__text">' + mensagem + '</p>' +
          (subtexto ? '<p class="location-banner__subtext">' + subtexto + '</p>' : '') +
        '</div>' +
        (mostrarClose ? 
          '<button class="location-banner__close" aria-label="Fechar banner de localização" title="Fechar" id="locationBannerClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-banner__close-icon">' +
              '<line x1="18" y1="6" x2="6" y2="18"></line>' +
              '<line x1="6" y1="6" x2="18" y2="18"></line>' +
            '</svg>' +
          '</button>' : ''
        ) +
      '</div>' +
    '</div>';
  }

  function renderizarBanner(estado, mensagem, subtexto) {
    var root = document.getElementById('location-banner-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'location-banner-root';
      document.body.insertBefore(root, document.body.firstChild);
    }
    root.innerHTML = criarBannerHTML(estado, mensagem, subtexto);

    var closeBtn = document.getElementById('locationBannerClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', fecharBanner);
    }
  }

  function fecharBanner() {
    var banner = document.getElementById('locationBanner');
    if (banner) {
      banner.classList.add('location-banner--closing');
      setTimeout(function() {
        banner.classList.add('location-banner--hidden');
        salvarBannerFechado();
      }, 300);
    }
  }

  function resetBanner() {
    try {
      localStorage.removeItem(CONFIG.bannerClosedKey);
    } catch (e) {}
    inicializar();
  }

  function limparCache() {
    try {
      localStorage.removeItem(CONFIG.locationCacheKey);
      localStorage.removeItem(CONFIG.bannerClosedKey);
      console.log('🗑️ Cache limpo');
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function inicializar() {
    injetarEstilos();

    if (isBannerFechado()) {
      console.log('🚫 Banner foi fechado anteriormente');
      return;
    }

    renderizarBanner('loading', 'Detectando sua localização...', null);

    buscarLocalizacao().then(function(localizacao) {
      var msg = gerarMensagem(localizacao);
      renderizarBanner(msg.tipo, msg.mensagem, msg.subtexto);
      atualizarElementosDOM(localizacao);
    });
  }

  // Iniciar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  // API Pública
  window.LocationBannerSystem = {
    fecharBanner: fecharBanner,
    resetBanner: resetBanner,
    limparCache: limparCache,
    buscarLocalizacao: buscarLocalizacao,
    calcularDistancia: calcularDistancia,
    formatarDistancia: formatarDistancia,
    atualizarElementosDOM: atualizarElementosDOM,
    CONFIG: CONFIG,
    SEDE_BASE: SEDE_BASE
  };

})(window, document);
