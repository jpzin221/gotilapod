/**
 * UniPay Service
 * Servico para comunicacao com as API routes do UniPay (FastSoft Brasil)
 *
 * SEGURANCA: As credenciais NAO sao enviadas pelo frontend.
 * Elas sao buscadas diretamente do banco de dados pela funcao serverless.
 */

/**
 * Cria uma cobranca PIX via UniPay
 * @param {Object} params - Parametros da cobranca
 * @param {number} params.amount - Valor da cobranca
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.externalId - ID externo do pedido
 * @returns {Promise<Object>} Dados da cobranca PIX
 */
export async function createUniPayCharge(params) {
    const {
        amount,
        customerName,
        customerDocument,
        customerEmail,
        externalId
    } = params;

    const functionsUrl = import.meta.env.PROD
        ? '/api'
        : 'http://localhost:3000/api';

    console.log('💜 [UniPay Service] Criando cobranca...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerName);

    try {
        const response = await fetch(`${functionsUrl}/unipay/create`, {
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

    const functionsUrl = import.meta.env.PROD
        ? '/api'
        : 'http://localhost:3000/api';

    console.log('💜 [UniPay Service] Verificando status...');
    console.log('🔍 Transaction ID:', transactionId);

    try {
        const response = await fetch(`${functionsUrl}/unipay/status`, {
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
