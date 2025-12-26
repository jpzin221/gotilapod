/**
 * Serviço de integração com BS Pay
 * Usa função Netlify para evitar CORS e lidar com autenticação OAuth
 * 
 * Documentação BSPay: https://api.bspay.co/v2
 */

/**
 * Cria uma cobrança PIX via BS Pay (através de Netlify Function)
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor da transação
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerDocument - CPF/CNPJ do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.externalId - ID único da transação no seu sistema
 * @param {string} params.description - Descrição do pagamento
 * @param {string} params.postbackUrl - URL do webhook para notificações
 * @param {string} params.clientId - Client ID da BSPay (opcional, usa env var se não fornecido)
 * @param {string} params.clientSecret - Client Secret da BSPay (opcional, usa env var se não fornecido)
 * @param {string} params.bearerToken - Token direto (deprecated, use clientId/clientSecret)
 */
export async function createBSPayCharge({
    amount,
    customerName,
    customerDocument,
    customerEmail = '',
    externalId,
    description = '',
    postbackUrl = '',
    clientId = '',
    clientSecret = '',
    bearerToken = '' // Mantido para compatibilidade
}) {
    try {
        console.log('🔵 [BS Pay] Criando cobrança PIX via Netlify...');
        console.log('💰 Valor:', amount);
        console.log('👤 Cliente:', customerName);

        // Em produção, usar Netlify Functions; em desenvolvimento, usar backend local
        const isProduction = import.meta.env.PROD;
        const netlifyFunctionsUrl = '/.netlify/functions/bspay-create';
        const localBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

        // Em produção, SEMPRE usar Netlify Functions
        const apiUrl = isProduction
            ? netlifyFunctionsUrl
            : `${localBackendUrl}/api/pix/create`;

        console.log('🌐 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                customerName,
                customerDocument,
                customerEmail,
                externalId: externalId || `pedido_${Date.now()}`,
                description,
                postbackUrl,
                // Credenciais OAuth
                clientId,
                clientSecret,
                // Compatibilidade
                bearerToken
            })
        });

        const data = await response.json();
        console.log('📥 Resposta BS Pay:', data);

        if (!data.success) {
            console.error('❌ Erro na resposta:', data.error);
            return {
                success: false,
                error: data.error || 'Erro ao criar cobrança BS Pay'
            };
        }

        return {
            success: true,
            txid: data.txid || data.transactionId,
            transactionId: data.transactionId,
            pixCopiaECola: data.pixCopiaECola || data.qrcode,
            qrcode: data.qrcode,
            imagemQrcode: data.imagemQrcode,
            expiresAt: data.expiresAt,
            status: data.status,
            raw: data.raw
        };

    } catch (error) {
        console.error('❌ [BS Pay] Erro:', error);
        return {
            success: false,
            error: error.message || 'Erro desconhecido ao criar cobrança BS Pay'
        };
    }
}

/**
 * Consulta o status de uma transação
 * @param {string} transactionId - ID da transação retornado pela BSPay
 * @param {Object} credentials - Credenciais para autenticação
 * @param {string} credentials.clientId - Client ID da BSPay
 * @param {string} credentials.clientSecret - Client Secret da BSPay
 * @param {string} credentials.bearerToken - Token direto (deprecated)
 */
export async function getBSPayStatus(transactionId, credentials = {}) {
    try {
        console.log('🔍 [BS Pay] Consultando status:', transactionId);

        // Em produção, usar Netlify Functions; em desenvolvimento, usar backend local
        const isProduction = import.meta.env.PROD;
        const netlifyFunctionsUrl = '/.netlify/functions/bspay-status';
        const localBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

        const apiUrl = isProduction
            ? netlifyFunctionsUrl
            : `${localBackendUrl}/api/pix/status`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId,
                clientId: credentials.clientId || '',
                clientSecret: credentials.clientSecret || '',
                bearerToken: credentials.bearerToken || ''
            })
        });

        const data = await response.json();
        console.log('📥 Status BS Pay:', data);

        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Erro ao consultar status'
            };
        }

        return {
            success: true,
            txid: data.txid,
            transactionId: data.transactionId,
            status: data.status,
            originalStatus: data.originalStatus,
            amount: data.amount,
            paidAt: data.paidAt || null,
            raw: data.raw
        };

    } catch (error) {
        console.error('❌ [BS Pay] Erro ao consultar status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    createCharge: createBSPayCharge,
    getStatus: getBSPayStatus
};
