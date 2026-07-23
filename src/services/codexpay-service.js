/**
 * CodexPay Service
 * Serviço para comunicação com as Netlify Functions do CodexPay
 * 
 * SEGURANÇA: As credenciais NÃO são enviadas pelo frontend.
 * Elas são buscadas diretamente do banco de dados pela função serverless.
 */

/**
 * Cria uma cobrança PIX via CodexPay
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor da cobrança
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.externalId - ID externo do pedido
 * @returns {Promise<Object>} Dados da cobrança PIX
 */
export async function createCodexPayCharge(params) {
    const {
        amount,
        customerName,
        customerDocument,
        customerEmail,
        externalId
        // REMOVIDO: credenciais - nunca enviar do frontend!
    } = params;

    // Determinar URL da função (produção vs desenvolvimento)
    const functionsUrl = import.meta.env.PROD
        ? '/api'
        : 'http://localhost:3000/api';

    console.log('💚 [CodexPay Service] Criando cobrança...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerName);
    console.log('🔗 Função URL:', `${functionsUrl}/codexpay/create`);

    try {
        const response = await fetch(`${functionsUrl}/codexpay/create`, {
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

        console.log('📥 Resposta CodexPay:', data);

        if (!data.success) {
            throw new Error(data.error || 'Erro ao criar cobrança CodexPay');
        }

        return data;
    } catch (error) {
        console.error('❌ [CodexPay Service] Erro:', error);
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
export async function checkCodexPayStatus(params) {
    const {
        transactionId,
        externalReference
    } = params;

    const functionsUrl = import.meta.env.PROD
        ? '/api'
        : 'http://localhost:3000/api';

    console.log('💚 [CodexPay Service] Verificando status...');
    console.log('🔍 Transaction ID:', transactionId);

    try {
        const response = await fetch(`${functionsUrl}/codexpay/status`, {
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

        console.log('📥 Status CodexPay:', data);

        return data;
    } catch (error) {
        console.error('❌ [CodexPay Service] Erro ao verificar status:', error);
        throw error;
    }
}

export default {
    createCodexPayCharge,
    checkCodexPayStatus
};
