/**
 * Serviço Unificado para Funções Serverless do Netlify
 * 
 * Este arquivo centraliza todas as chamadas para as funções serverless,
 * mantendo as credenciais seguras no backend.
 * 
 * Funções disponíveis:
 * - createPixCharge: Gerar cobrança PIX
 * - checkPixStatus: Verificar status do pagamento
 * - getProducts: Carregar produtos do Supabase
 */

// Base URL das funções serverless
const getFunctionsUrl = () => {
  // Em produção no Netlify, usar URL relativa
  if (window.location.hostname !== 'localhost') {
    return '/.netlify/functions';
  }
  // Em desenvolvimento local, usar backend local
  return 'http://localhost:8888/.netlify/functions';
};

const FUNCTIONS_URL = getFunctionsUrl();

/**
 * Criar cobrança PIX
 * @param {Object} pedido - Dados do pedido
 * @returns {Promise<Object>} Dados do PIX (txid, qrcode, imagemQrcode, pixCopiaECola)
 */
export const createPixCharge = async (pedido) => {
  try {
    console.log('📤 Criando cobrança PIX via Netlify Function...');
    console.log('🎯 URL:', `${FUNCTIONS_URL}/pix-create`);
    
    const response = await fetch(`${FUNCTIONS_URL}/pix-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valorTotal: pedido.valorTotal,
        nomeCliente: pedido.nomeCliente,
        cpfCliente: pedido.cpfCliente,
        itens: pedido.itens,
        pedidoId: pedido.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar cobrança PIX');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao criar cobrança PIX');
    }

    console.log('✅ Cobrança PIX criada:', data.txid);
    
    return {
      success: true,
      txid: data.txid,
      qrcode: data.qrcode,
      imagemQrcode: data.imagemQrcode,
      pixCopiaECola: data.pixCopiaECola,
      locId: data.locId
    };

  } catch (error) {
    console.error('❌ Erro ao criar cobrança PIX:', error);
    throw error;
  }
};

/**
 * Verificar status do pagamento PIX
 * @param {string} txid - ID da transação
 * @returns {Promise<Object>} Status do pagamento
 */
export const checkPixStatus = async (txid) => {
  try {
    console.log('🔍 Verificando status do PIX:', txid);
    
    const response = await fetch(`${FUNCTIONS_URL}/pix-status?txid=${txid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao verificar status');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao verificar status');
    }

    console.log('📊 Status do PIX:', data.status);
    
    return {
      success: true,
      txid: data.txid,
      status: data.status, // ATIVA, CONCLUIDA, etc
      valor: data.valor,
      horario: data.horario,
      pix: data.pix
    };

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    throw error;
  }
};

/**
 * Carregar produtos do Supabase via função serverless
 * @returns {Promise<Array>} Lista de produtos
 */
export const getProducts = async () => {
  try {
    console.log('📦 Carregando produtos via Netlify Function...');
    
    const response = await fetch(`${FUNCTIONS_URL}/products-get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao carregar produtos');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao carregar produtos');
    }

    console.log(`✅ ${data.count} produtos carregados`);
    
    return data.products;

  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    throw error;
  }
};

/**
 * Verificar se as funções serverless estão disponíveis
 * @returns {Promise<boolean>}
 */
export const checkFunctionsAvailable = async () => {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/products-get`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Funções serverless não disponíveis:', error.message);
    return false;
  }
};

// Exportar URL base para uso em outros lugares
export { FUNCTIONS_URL };

// Exportar objeto com todas as funções (alternativa)
export default {
  createPixCharge,
  checkPixStatus,
  getProducts,
  checkFunctionsAvailable,
  FUNCTIONS_URL
};
