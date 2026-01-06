/**
 * Ryzen Pay Service
 * Serviço para comunicação com as Netlify Functions do Ryzen Pay
 * 
 * SEGURANÇA: As credenciais NÃO são enviadas pelo frontend.
 * Elas são buscadas diretamente do banco de dados pela função serverless.
 */

/**
 * Cria uma cobrança PIX via Ryzen Pay
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor da cobrança
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.externalId - ID externo do pedido
 * @returns {Promise<Object>} Dados da cobrança PIX
 */
export async function createRyzenPayCharge(params) {
    const {
        amount,
        customerName,
        customerDocument,
        customerEmail,
        externalId
        // REMOVIDO: apiKey - nunca enviar credenciais do frontend!
    } = params;

    // Determinar URL da função (produção vs desenvolvimento)
    const functionsUrl = import.meta.env.PROD
        ? '/.netlify/functions'
        : 'http://localhost:8888/.netlify/functions';

    console.log('💎 [RyzenPay Service] Criando cobrança...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerName);
    console.log('🔗 Função URL:', `${functionsUrl}/ryzenpay-create`);

    try {
        const response = await fetch(`${functionsUrl}/ryzenpay-create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                customerName,
                customerDocument,
                customerEmail,
                externalId
                // Credenciais são buscadas do banco de dados pelo backend
            })
        });

        const data = await response.json();

        console.log('📥 Resposta RyzenPay:', data);

        if (!data.success) {
            throw new Error(data.error || 'Erro ao criar cobrança RyzenPay');
        }

        return data;
    } catch (error) {
        console.error('❌ [RyzenPay Service] Erro:', error);
        throw error;
    }
}

/**
 * Verifica o status de uma transação
 * @param {Object} params - Parâmetros da consulta
 * @param {string} params.transactionId - ID da transação
 * @param {string} params.externalReference - Referência externa do pedido
 * @returns {Promise<Object>} Status da transação
 */
export async function checkRyzenPayStatus(params) {
    const {
        transactionId,
        externalReference
    } = params;

    const functionsUrl = import.meta.env.PROD
        ? '/.netlify/functions'
        : 'http://localhost:8888/.netlify/functions';

    console.log('💎 [RyzenPay Service] Verificando status...');
    console.log('🔍 Transaction ID:', transactionId);

    try {
        const response = await fetch(`${functionsUrl}/ryzenpay-status`, {
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

        console.log('📥 Status RyzenPay:', data);

        return data;
    } catch (error) {
        console.error('❌ [RyzenPay Service] Erro ao verificar status:', error);
        throw error;
    }
}

export default {
    createRyzenPayCharge,
    checkRyzenPayStatus
};
