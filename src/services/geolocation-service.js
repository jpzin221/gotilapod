/**
 * Serviço de Geolocalização por IP
 * Detecta automaticamente a localização do usuário via IP usando múltiplas APIs com fallback
 */

// ============================================
// CONFIGURAÇÃO DA SEDE BASE (ALTERE AQUI)
// ============================================
export const SEDE_BASE = {
  lat: -25.4284,  // Latitude da sua sede (exemplo: Curitiba)
  lon: -49.2733,  // Longitude da sua sede
  cidade: 'Curitiba',
  estado: 'PR'
};

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================
export const CONFIG = {
  distanciaProxima: 8,                    // km para considerar "próximo"
  cacheExpiracao: 24 * 60 * 60 * 1000,    // 24 horas em milissegundos
  locationCacheKey: 'userLocation',
  bannerClosedKey: 'locationBannerClosed',
  deliveryRadius: 50,                     // km de raio de entrega
  nearbyCitiesRadius: 100                 // km para cidades próximas
};

// Configurações dinâmicas do banco (carregadas sob demanda)
let dynamicSettings = null;

/**
 * Carrega configurações do banco de dados
 * @returns {Promise<Object>}
 */
export async function carregarConfiguracoesDB() {
  if (dynamicSettings) return dynamicSettings;

  try {
    // Importar dinamicamente para evitar ciclo de dependência
    const { storeService } = await import('../lib/supabase');
    const settings = await storeService.getSettings();

    if (settings) {
      dynamicSettings = {
        sedeBase: {
          lat: settings.sede_latitude || SEDE_BASE.lat,
          lon: settings.sede_longitude || SEDE_BASE.lon,
          cidade: settings.sede_cidade || SEDE_BASE.cidade,
          estado: settings.sede_estado || SEDE_BASE.estado
        },
        deliveryRadius: settings.delivery_radius_km || CONFIG.deliveryRadius,
        nearbyCitiesRadius: settings.nearby_cities_radius_km || CONFIG.nearbyCitiesRadius,
        showDistanceBanner: settings.show_distance_banner ?? true
      };

      console.log('⚙️ Configurações carregadas do banco:', dynamicSettings);
    }

    return dynamicSettings;
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configurações do banco, usando padrões:', error);
    return null;
  }
}

/**
 * Obtém a sede base (do banco ou fallback)
 * @returns {Promise<Object>}
 */
export async function obterSedeBase() {
  const settings = await carregarConfiguracoesDB();
  return settings?.sedeBase || SEDE_BASE;
}

/**
 * Obtém o raio de entrega (do banco ou fallback)
 * @returns {Promise<number>}
 */
export async function obterRaioEntrega() {
  const settings = await carregarConfiguracoesDB();
  return settings?.deliveryRadius || CONFIG.deliveryRadius;
}

/**
 * Obtém o raio de cidades próximas (do banco ou fallback)
 * @returns {Promise<number>}
 */
export async function obterRaioCidadesProximas() {
  const settings = await carregarConfiguracoesDB();
  return settings?.nearbyCitiesRadius || CONFIG.nearbyCitiesRadius;
}

// ============================================
// APIs DE GEOLOCALIZAÇÃO (ordem de prioridade)
// ============================================
const GEOLOCATION_APIS = [
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    parseResponse: (data) => ({
      ip: data.ip,
      cidade: data.city,
      estado: data.region_code || data.region,
      pais: data.country_name,
      paisCodigo: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
      provedor: data.org,
      postal: data.postal,
      precisao: data.city ? 70 : 50
    })
  },
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    parseResponse: (data) => ({
      ip: data.ip,
      cidade: data.city,
      estado: data.region_code || data.region,
      pais: data.country,
      paisCodigo: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
      provedor: data.connection?.org,
      postal: data.postal,
      precisao: data.city ? 68 : 48
    })
  },
  {
    name: 'ip-api.com',
    url: 'http://ip-api.com/json/',
    parseResponse: (data) => ({
      ip: data.query,
      cidade: data.city,
      estado: data.region,
      pais: data.country,
      paisCodigo: data.countryCode,
      lat: data.lat,
      lon: data.lon,
      provedor: data.isp,
      postal: data.zip,
      precisao: data.city ? 65 : 45
    })
  },
  {
    name: 'ipgeolocation.io',
    url: 'https://api.ipgeolocation.io/ipgeo',
    parseResponse: (data) => ({
      ip: data.ip,
      cidade: data.city,
      estado: data.state_code || data.state_prov,
      pais: data.country_name,
      paisCodigo: data.country_code2,
      lat: parseFloat(data.latitude),
      lon: parseFloat(data.longitude),
      provedor: data.isp,
      postal: data.zipcode,
      distrito: data.district,
      precisao: data.district ? 75 : data.city ? 72 : 50
    })
  },
  {
    name: 'ipapi.com',
    url: 'https://ipapi.co/json/',
    parseResponse: (data) => ({
      ip: data.ip,
      cidade: data.city,
      estado: data.region_code,
      pais: data.country_name,
      paisCodigo: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
      provedor: data.org,
      postal: data.postal,
      precisao: data.city ? 70 : 50
    })
  },
  {
    name: 'abstractapi.com',
    url: 'https://ipgeolocation.abstractapi.com/v1/?api_key=free',
    parseResponse: (data) => ({
      ip: data.ip_address,
      cidade: data.city,
      estado: data.region_iso_code || data.region,
      pais: data.country,
      paisCodigo: data.country_code,
      lat: parseFloat(data.latitude),
      lon: parseFloat(data.longitude),
      provedor: data.connection?.isp,
      postal: data.postal_code,
      precisao: data.city ? 68 : 48
    })
  },
  {
    name: 'freeipapi.com',
    url: 'https://freeipapi.com/api/json',
    parseResponse: (data) => ({
      ip: data.ipAddress,
      cidade: data.cityName,
      estado: data.regionName,
      pais: data.countryName,
      paisCodigo: data.countryCode,
      lat: parseFloat(data.latitude),
      lon: parseFloat(data.longitude),
      provedor: null,
      postal: data.zipCode,
      precisao: data.cityName ? 65 : 45
    })
  }
];

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Busca localização por IP usando múltiplas APIs com fallback
 * @returns {Promise<Object>} Objeto com dados de localização
 */
export async function buscarLocalizacaoPorIP() {
  // Verificar cache primeiro
  const cached = obterLocalizacaoCache();
  if (cached) {
    console.log('📍 Localização obtida do cache');
    return cached;
  }

  // Tentar cada API em ordem
  for (const api of GEOLOCATION_APIS) {
    try {
      console.log(`🔍 Tentando API: ${api.name}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Verificar se a resposta é válida
      if (api.name === 'ipwho.is' && data.success === false) {
        throw new Error(data.message || 'API retornou erro');
      }

      if (api.name === 'ip-api.com' && data.status === 'fail') {
        throw new Error(data.message || 'API retornou erro');
      }

      const localizacao = api.parseResponse(data);

      // Validar dados mínimos
      if (!localizacao.cidade || !localizacao.lat || !localizacao.lon) {
        throw new Error('Dados incompletos');
      }

      // Adicionar metadados
      localizacao.fonte = api.name;
      localizacao.timestamp = Date.now();

      // Obter sede base do banco
      const sedeBase = await obterSedeBase();

      // Calcular distância até a sede
      localizacao.distanciaParaSede = calcularDistancia(
        localizacao.lat,
        localizacao.lon,
        sedeBase.lat,
        sedeBase.lon
      );

      // Verificar se está dentro do raio de cidades próximas
      const raioCidadesProximas = await obterRaioCidadesProximas();
      localizacao.estaDentroDoRaio = localizacao.distanciaParaSede <= raioCidadesProximas;

      // Verificar se está dentro do raio de entrega
      const raioEntrega = await obterRaioEntrega();
      localizacao.entregaDisponivel = localizacao.distanciaParaSede <= raioEntrega;

      // Salvar no cache
      salvarLocalizacaoCache(localizacao);

      console.log(`✅ Localização obtida via ${api.name}:`, localizacao);
      return localizacao;

    } catch (error) {
      console.warn(`⚠️ Falha na API ${api.name}:`, error.message);
      continue;
    }
  }

  // Se todas as APIs falharem, retornar fallback
  console.error('❌ Todas as APIs de geolocalização falharam');
  return {
    cidade: null,
    estado: null,
    lat: null,
    lon: null,
    erro: true,
    mensagem: 'Não foi possível detectar sua localização'
  };
}

/**
 * Nova função inteligente: Busca localização usando múltiplas APIs em paralelo
 * para validação cruzada e maior precisão
 * @param {Object} opcoes - Opções de busca
 * @param {boolean} opcoes.permitirGPS - Permite tentar GPS (padrão: false)
 * @param {boolean} opcoes.validacaoCruzada - Tenta múltiplas APIs simultaneamente (padrão: true)
 * @returns {Promise<Object>} Objeto com dados de localização e score de confiança
 */
export async function obterLocalizacaoPrecisa(opcoes = {}) {
  const { permitirGPS = false, validacaoCruzada = true } = opcoes;

  // Verificar cache primeiro
  const cached = obterLocalizacaoCache();
  if (cached && !cached.erro) {
    const cacheAge = Date.now() - cached.cachedAt;
    const cacheRecente = cacheAge < (6 * 60 * 60 * 1000); // 6 horas

    cached.scoreConfianca = cacheRecente ? 50 : 30;
    cached.fontePrincipal = 'cache';
    console.log(`📍 Localização do cache (${Math.round(cacheAge / 3600000)}h atrás)`);

    // Se cache muito antigo e validação cruzada ativa, atualizar em background
    if (!cacheRecente && validacaoCruzada) {
      buscarLocalizacaoPorIP().catch(err =>
        console.warn('Erro ao atualizar cache em background:', err)
      );
    }

    return cached;
  }

  // Se validação cruzada está ativa, tentar múltiplas APIs em paralelo
  if (validacaoCruzada) {
    try {
      const resultados = await buscarMultiplasAPIs();

      if (resultados.length > 0) {
        const melhorResultado = validarECombinarResultados(resultados);

        // Adicionar informações adicionais
        const sedeBase = await obterSedeBase();
        melhorResultado.distanciaParaSede = calcularDistancia(
          melhorResultado.lat,
          melhorResultado.lon,
          sedeBase.lat,
          sedeBase.lon
        );

        const raioCidadesProximas = await obterRaioCidadesProximas();
        const raioEntrega = await obterRaioEntrega();

        melhorResultado.estaDentroDoRaio = melhorResultado.distanciaParaSede <= raioCidadesProximas;
        melhorResultado.entregaDisponivel = melhorResultado.distanciaParaSede <= raioEntrega;

        // Salvar no cache
        salvarLocalizacaoCache(melhorResultado);

        console.log('✅ Localização obtida com validação cruzada:', melhorResultado);
        return melhorResultado;
      }
    } catch (error) {
      console.warn('⚠️ Erro na validação cruzada, usando fallback sequencial:', error);
    }
  }

  // Fallback: usar método sequencial tradicional
  return buscarLocalizacaoPorIP();
}

/**
 * Busca localização em múltiplas APIs simultaneamente
 * @returns {Promise<Array>} Array com resultados bem-sucedidos
 */
async function buscarMultiplasAPIs() {
  const promises = GEOLOCATION_APIS.slice(0, 4).map(async (api) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Validações específicas por API
      if (api.name === 'ipwho.is' && data.success === false) {
        throw new Error(data.message || 'API retornou erro');
      }
      if (api.name === 'ip-api.com' && data.status === 'fail') {
        throw new Error(data.message || 'API retornou erro');
      }

      const localizacao = api.parseResponse(data);

      // Validar dados mínimos
      if (!localizacao.cidade || !localizacao.lat || !localizacao.lon) {
        throw new Error('Dados incompletos');
      }

      localizacao.fonte = api.name;
      localizacao.timestamp = Date.now();

      console.log(`✅ ${api.name}: ${localizacao.cidade}, ${localizacao.estado}`);
      return localizacao;

    } catch (error) {
      console.warn(`⚠️ ${api.name} falhou:`, error.message);
      return null;
    }
  });

  const resultados = await Promise.all(promises);
  return resultados.filter(r => r !== null);
}

/**
 * Valida e combina resultados de múltiplas APIs
 * @param {Array} resultados - Array de resultados de APIs
 * @returns {Object} Melhor resultado com score de confiança
 */
function validarECombinarResultados(resultados) {
  if (resultados.length === 0) {
    throw new Error('Nenhum resultado válido');
  }

  if (resultados.length === 1) {
    resultados[0].scoreConfianca = resultados[0].precisao || 60;
    resultados[0].fontePrincipal = resultados[0].fonte;
    resultados[0].fontesValidadas = 1;
    return resultados[0];
  }

  // Agrupar por cidade
  const grupos = {};
  resultados.forEach(r => {
    const chave = `${r.cidade}|${r.estado}`.toLowerCase();
    if (!grupos[chave]) {
      grupos[chave] = [];
    }
    grupos[chave].push(r);
  });

  // Encontrar o grupo com mais concordância
  let melhorGrupo = [];
  let melhorChave = '';

  Object.entries(grupos).forEach(([chave, grupo]) => {
    if (grupo.length > melhorGrupo.length) {
      melhorGrupo = grupo;
      melhorChave = chave;
    }
  });

  // Resultado mais preciso do melhor grupo
  melhorGrupo.sort((a, b) => (b.precisao || 0) - (a.precisao || 0));
  const resultado = melhorGrupo[0];

  // Calcular score de confiança baseado em concordância
  const fontesConcordantes = melhorGrupo.length;
  const scoreBase = resultado.precisao || 65;
  const bonusConcordancia = fontesConcordantes > 1 ? (fontesConcordantes - 1) * 10 : 0;

  resultado.scoreConfianca = Math.min(scoreBase + bonusConcordancia, 90);
  resultado.fontePrincipal = resultado.fonte;
  resultado.fontesValidadas = fontesConcordantes;
  resultado.fontesConsultadas = resultados.length;

  // Adicionar fontes concordantes
  resultado.fontesDetalhes = melhorGrupo.map(r => r.fonte).join(', ');

  console.log(`🎯 Validação cruzada: ${fontesConcordantes}/${resultados.length} APIs concordam em ${resultado.cidade}`);

  return resultado;
}


/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param {number} lat1 - Latitude do ponto 1
 * @param {number} lon1 - Longitude do ponto 1
 * @param {number} lat2 - Latitude do ponto 2
 * @param {number} lon2 - Longitude do ponto 2
 * @returns {number} Distância em quilômetros
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km

  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Retorna distância em km
}

/**
 * Gera mensagem personalizada para o banner baseada na localização
 * @param {Object} localizacao - Objeto com dados de localização
 * @returns {Object} Objeto com mensagem e tipo do banner
 */
export function gerarMensagemBanner(localizacao) {
  if (!localizacao || localizacao.erro) {
    return {
      mensagem: 'Lojas parceiras perto de você • Atendemos sua região',
      tipo: 'fallback',
      icone: '📍'
    };
  }

  const distancia = localizacao.distanciaParaSede;
  const cidade = localizacao.cidade;
  const estado = localizacao.estado;

  if (distancia <= CONFIG.distanciaProxima) {
    return {
      mensagem: `🎉 Estamos na mesma cidade que você (${distancia.toFixed(1)} km)! Entrega ultra rápida disponível.`,
      tipo: 'proximo',
      icone: '🚀',
      distancia: distancia
    };
  }

  return {
    mensagem: `Atendemos ${cidade}${estado ? `, ${estado}` : ''} com entrega rápida. Consulte disponibilidade.`,
    tipo: 'normal',
    icone: '📦',
    distancia: distancia
  };
}

/**
 * Atualiza elementos no DOM com a localização do usuário
 * @param {Object} localizacao - Objeto com dados de localização
 */
export function atualizarElementosLocalizacao(localizacao) {
  if (!localizacao || localizacao.erro) return;

  const cidade = localizacao.cidade || 'sua região';
  const estado = localizacao.estado || 'BR';

  // Atualizar por ID
  const elementosId = {
    'localCidade': cidade,
    'localEstado': estado
  };

  Object.entries(elementosId).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  });

  // Atualizar por data-attribute
  document.querySelectorAll('[data-local="cidade"]').forEach(el => {
    el.textContent = cidade;
  });

  document.querySelectorAll('[data-local="estado"]').forEach(el => {
    el.textContent = estado;
  });

  console.log('🔄 Elementos DOM atualizados com localização');
}

// ============================================
// FUNÇÕES DE CACHE
// ============================================

/**
 * Salva localização no localStorage
 * @param {Object} localizacao - Dados de localização
 */
function salvarLocalizacaoCache(localizacao) {
  try {
    const cacheData = {
      ...localizacao,
      cachedAt: Date.now()
    };
    localStorage.setItem(CONFIG.locationCacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Erro ao salvar cache de localização:', error);
  }
}

/**
 * Obtém localização do cache se ainda válida
 * @returns {Object|null} Dados de localização ou null se expirado
 */
function obterLocalizacaoCache() {
  try {
    const cached = localStorage.getItem(CONFIG.locationCacheKey);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const agora = Date.now();

    // Verificar expiração
    if (agora - data.cachedAt > CONFIG.cacheExpiracao) {
      localStorage.removeItem(CONFIG.locationCacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Erro ao ler cache de localização:', error);
    return null;
  }
}

/**
 * Limpa o cache de localização
 */
export function limparCacheLocalizacao() {
  try {
    localStorage.removeItem(CONFIG.locationCacheKey);
    localStorage.removeItem(CONFIG.bannerClosedKey);
    console.log('🗑️ Cache de localização limpo');
  } catch (error) {
    console.warn('Erro ao limpar cache:', error);
  }
}

// ============================================
// FUNÇÕES DE PREFERÊNCIA DO BANNER
// ============================================

/**
 * Verifica se o banner foi fechado pelo usuário (reexibe após 2 horas)
 * @returns {boolean}
 */
export function isBannerFechado() {
  try {
    const fechadoEm = localStorage.getItem(CONFIG.bannerClosedKey);
    if (!fechadoEm) return false;

    const timestamp = parseInt(fechadoEm, 10);
    const agora = Date.now();
    const duasHoras = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

    // Se passou mais de 2 horas, limpar e mostrar novamente
    if (agora - timestamp > duasHoras) {
      localStorage.removeItem(CONFIG.bannerClosedKey);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Salva preferência de banner fechado com timestamp
 */
export function salvarBannerFechado() {
  try {
    localStorage.setItem(CONFIG.bannerClosedKey, Date.now().toString());
  } catch (error) {
    console.warn('Erro ao salvar preferência do banner:', error);
  }
}

/**
 * Formata distância para exibição
 * @param {number} km - Distância em quilômetros
 * @returns {string} Distância formatada
 */
export function formatarDistancia(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km`;
  } else {
    return `${Math.round(km)}km`;
  }
}
