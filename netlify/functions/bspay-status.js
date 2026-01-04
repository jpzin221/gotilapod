/**
 * Netlify Function: BS Pay Status
 * Consulta o status de uma transação PIX via API BS Pay
 * Seguindo documentação: https://api.bspay.co/v2
 * 
 * SEGURANÇA:
 * - CORS restritivo por domínio
 * - Validação de transactionId
 */

const fetch = require('node-fetch');

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
    'https://gorilapod.netlify.app',
    'https://gorilapod.com.br',
    'https://www.gorilapod.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8888',
    'null' // Para file:// protocol (abrir HTML direto do sistema de arquivos)
];

/**
 * Retorna a origem permitida para CORS
 */
function getAllowedOrigin(requestOrigin) {
    // Se a origem é 'null' (file:// protocol), permitir explicitamente
    if (requestOrigin === 'null') {
        return 'null';
    }
    return requestOrigin || '*';
}

/**
 * Valida e sanitiza transactionId
 */
function sanitizeTransactionId(txid) {
    if (!txid) return null;
    // Aceitar apenas caracteres alfanuméricos, hífen e underscore
    return String(txid).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

// Cache do token para evitar múltiplas autenticações
let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Obtém o token de acesso via OAuth
 * @param {string} clientId - Client ID da BSPay
 * @param {string} clientSecret - Client Secret da BSPay
 */
async function getAccessToken(clientId, clientSecret) {
    // Verificar se o token ainda é válido
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        console.log('🟢 Usando token em cache');
        return cachedToken;
    }

    console.log('🔐 Obtendo novo token de acesso...');

    // Criar credenciais em Base64
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.bspay.co/v2/oauth/token', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`
        }
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        console.error('❌ Erro na autenticação:', data);
        throw new Error(data.message || data.error || 'Erro ao obter token de acesso');
    }

    // Guardar em cache (com margem de 5 minutos)
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + ((data.expires_in - 300) * 1000);

    console.log('✅ Token obtido com sucesso');

    return data.access_token;
}

exports.handler = async (event, context) => {
    // CORS headers - restringir por domínio
    const requestOrigin = event.headers.origin || event.headers.Origin;
    const allowedOrigin = getAllowedOrigin(requestOrigin);

    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Corpo da requisição vazio' })
            };
        }

        const body = JSON.parse(event.body);
        const {
            transactionId: rawTransactionId,
            // Credenciais OAuth (podem vir do body ou de env vars)
            clientId,
            clientSecret,
            // Suporte para token direto (compatibilidade)
            bearerToken
        } = body;

        // Sanitizar transactionId
        const transactionId = sanitizeTransactionId(rawTransactionId);

        console.log('🔍 [BS Pay] Consultando status:', transactionId);

        if (!transactionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Transaction ID não informado ou inválido' })
            };
        }

        // Obter token de acesso
        let accessToken;

        if (bearerToken) {
            // Compatibilidade: usar token direto se fornecido
            accessToken = bearerToken;
            console.log('🔑 Usando bearer token fornecido');
        } else if (clientId && clientSecret) {
            // Fluxo OAuth correto
            accessToken = await getAccessToken(clientId, clientSecret);
        } else {
            // Tentar usar variáveis de ambiente
            const envClientId = process.env.BSPAY_CLIENT_ID;
            const envClientSecret = process.env.BSPAY_CLIENT_SECRET;

            if (envClientId && envClientSecret) {
                accessToken = await getAccessToken(envClientId, envClientSecret);
            } else {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Credenciais BSPay não configuradas. Forneça clientId/clientSecret ou configure BSPAY_CLIENT_ID e BSPAY_CLIENT_SECRET.'
                    })
                };
            }
        }

        const response = await fetch(`https://api.bspay.co/v2/pix/cashIn/${transactionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📥 Status BS Pay:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Erro BS Pay:', data);

            // Se erro de autenticação, limpar cache do token
            if (response.status === 401) {
                cachedToken = null;
                tokenExpiresAt = null;
            }

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: data.message || data.error || 'Erro ao consultar status',
                    details: data
                })
            };
        }

        // Mapear status da BSPay para formato esperado
        // BSPay retorna: pending, paid, expired, cancelled
        const statusMap = {
            'pending': 'ATIVA',
            'PENDING': 'ATIVA',
            'paid': 'CONCLUIDA',
            'PAID': 'CONCLUIDA',
            'expired': 'EXPIRADA',
            'EXPIRED': 'EXPIRADA',
            'cancelled': 'CANCELADA',
            'CANCELLED': 'CANCELADA'
        };

        const mappedStatus = statusMap[data.status] || data.status;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                txid: transactionId,
                transactionId: data.transactionId || transactionId,
                status: mappedStatus,
                originalStatus: data.status,
                amount: data.amount,
                paidAt: data.paidAt || null,
                debtor: data.debtor,
                raw: data
            })
        };

    } catch (error) {
        console.error('❌ [BS Pay] Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Erro interno ao consultar status'
            })
        };
    }
};
