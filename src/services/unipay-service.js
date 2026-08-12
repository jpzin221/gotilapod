/**
 * UniPay Service
 * Servico para comunicacao com as API routes do UniPay (FastSoft Brasil)
 *
 * SEGURANCA: As credenciais NAO sao enviadas pelo frontend.
 * Elas sao buscadas diretamente do banco de dados pela funcao serverless.
 */

/**
 * Returns the URL base das API routes do UniPay
 */
function getUniPayApiUrl() {
  if (import.meta.env.PROD) {
    return '/api/unipay';
  }
  return 'http://localhost:3000/api/unipay';
}

/**
 * Cria uma cobranca PIX via UniPay
 * @param {Object} params - Parametros da cobranca
 * @param {number} params.amount - Valor da cobranca
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.customerPhone - Telefone do cliente
 * @param {Object} params.customerAddress - Endereco do cliente
 * @param {string} params.externalId - ID externo do pedido
 * @returns {Promise<Object>} Dados da cobranca PIX
 */
export async function createUniPayCharge(params) {
  const {
    amount,
    customerName,
    customerDocument,
    customerEmail,
    customerPhone,
    customerAddress,
    externalId
  } = params;

  const apiUrl = getUniPayApiUrl();

  console.log('💜 [UniPay Service] Criando cobranca...');
  console.log('💰 Valor:', amount);
  console.log('👤 Cliente:', customerName);
  console.log('📱 Telefone:', customerPhone);

  try {
    const response = await fetch(`${apiUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        customerName,
        customerDocument,
        customerEmail,
        customerPhone,
        customerAddress,
        externalId
      })
    });

    const data = await response.json();

    console.log('📥 Resposta UniPay:', data);

    if (!data.success) {
      throw new Error(data.error || 'Erro ao criar cobranca UniPay');
    }

    return data;
  } catch (error) {
    console.error('❌ [UniPay Service] Erro:', error);
    throw error;
  }
}

/**
 * Verifica o status de uma transacao
 * @param {Object} params - Parametros da consulta
 * @param {string} params.transactionId - ID da transacao
 * @param {string} params.externalReference - Referencia externa do pedido
 * @returns {Promise<Object>} Status da transacao
 */
export async function checkUniPayStatus(params) {
  const {
    transactionId,
    externalReference
  } = params;

  const apiUrl = getUniPayApiUrl();

  console.log('💜 [UniPay Service] Verificando status...');
  console.log('🔍 Transaction ID:', transactionId);

  try {
    const response = await fetch(`${apiUrl}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId,
        externalReference
      })
    });

    const data = await response.json();

    console.log('📥 Status UniPay:', data);

    return data;
  } catch (error) {
    console.error('❌ [UniPay Service] Erro ao verificar status:', error);
    throw error;
  }
}

export default {
  createUniPayCharge,
  checkUniPayStatus
};