/**
 * Poseidon Pay Service
 * Serviço para comunicação com as Netlify Functions do Poseidon Pay
 * 
 * SEGURANÇA: As credenciais NÃO são enviadas pelo frontend.
 * Elas são buscadas diretamente do banco de dados pela função serverless.
 */

/**
 * Cria uma cobrança PIX via Poseidon Pay
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor da cobrança
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.customerPhone - Telefone do cliente
 * @param {string} params.externalId - ID externo do pedido
 * @param {string} params.description - Descrição do pagamento
 * @param {Array} params.products - Lista de produtos
 * @returns {Promise<Object>} Dados da cobrança PIX
 */
export async function createPoseidonPayCharge(params) {
    const {
        amount,
        customerName,
        customerDocument,
        customerEmail,
        customerPhone,
        externalId,
        description,
        products
        // REMOVIDO: publicKey, secretKey, callbackUrl - nunca enviar credenciais do frontend!
    } = params;

    // Determinar URL da função (produção vs desenvolvimento)
    const functionsUrl = import.meta.env.PROD
        ? '/.netlify/functions'
        : 'http://localhost:8888/.netlify/functions';

    console.log('🔱 [Poseidon Pay Service] Criando cobrança...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerName);
    console.log('🔗 Função URL:', `${functionsUrl}/poseidonpay-create`);

    try {
        const response = await fetch(`${functionsUrl}/poseidonpay-create`, {
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
                externalId,
                description,
                products
                // Credenciais são buscadas do banco de dados pelo backend
            })
        });

        const data = await response.json();

        console.log('📥 Resposta Poseidon Pay:', data);

        if (!data.success) {
            throw new Error(data.error || 'Erro ao criar cobrança Poseidon Pay');
        }

        return data;
    } catch (error) {
        console.error('❌ [Poseidon Pay Service] Erro:', error);
        throw error;
    }
}

/**
 * Verifica o status de uma transação
 * @param {Object} params - Parâmetros da consulta
 * @param {string} params.transactionId - ID da transação
 * @param {string} params.identifier - Identificador do pedido
 * @param {string} params.publicKey - x-public-key
 * @param {string} params.secretKey - x-secret-key
 * @returns {Promise<Object>} Status da transação
 */
export async function checkPoseidonPayStatus(params) {
    const {
        transactionId,
        identifier,
        publicKey,
        secretKey
    } = params;

    const functionsUrl = import.meta.env.PROD
        ? '/.netlify/functions'
        : 'http://localhost:8888/.netlify/functions';

    console.log('🔱 [Poseidon Pay Service] Verificando status...');
    console.log('🔍 Transaction ID:', transactionId);

    try {
        const response = await fetch(`${functionsUrl}/poseidonpay-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId,
                identifier,
                publicKey,
                secretKey
            })
        });

        const data = await response.json();

        console.log('📥 Status Poseidon Pay:', data);

        return data;
    } catch (error) {
        console.error('❌ [Poseidon Pay Service] Erro ao verificar status:', error);
        throw error;
    }
}

export default {
    createPoseidonPayCharge,
    checkPoseidonPayStatus
};
