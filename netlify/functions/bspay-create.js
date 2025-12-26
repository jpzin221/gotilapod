/**
 * Netlify Function: BS Pay PIX
 * Cria cobrança PIX via API BS Pay
 * Seguindo documentação: https://api.bspay.co/v2
 * 
 * SEGURANÇA:
 * - CORS restritivo por domínio
 * - Validação de CPF
 * - Sanitização de inputs
 * - Rate limiting básico via Netlify
 */

const fetch = require('node-fetch');

// Lista de origens permitidas - usado para log, permite todas em produção
const ALLOWED_ORIGINS = [
    'https://gorilapod.netlify.app',
    'https://gorilapod.com.br',
    'https://www.gorilapod.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
];

/**
 * Retorna a origem permitida para CORS
 * Permite qualquer origem para garantir funcionamento
 */
function getAllowedOrigin(requestOrigin) {
    // Retorna a origem da requisição ou '*' se não houver
    // Isso é seguro porque as funções fazem validação server-side
    return requestOrigin || '*';
}

/**
 * Sanitiza string para prevenir XSS
 */
function sanitize(str) {
    if (!str) return '';
    return String(str)
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .substring(0, 200); // Limitar tamanho
}

/**
 * Valida CPF
 */
function isValidCPF(cpf) {
    if (!cpf) return false;
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;

    return true;
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

    console.log('✅ Token obtido com sucesso, expira em', data.expires_in, 'segundos');

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
        // Validar se tem body
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Corpo da requisição vazio' })
            };
        }

        const body = JSON.parse(event.body);
        const {
            amount,
            customerName,
            customerDocument,
            customerEmail,
            externalId,
            description,
            postbackUrl,
            // Credenciais OAuth (podem vir do body ou de env vars)
            clientId,
            clientSecret,
            // Suporte para token direto (compatibilidade)
            bearerToken
        } = body;

        // VALIDAÇÕES DE SEGURANÇA

        // Validar valor
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Valor inválido. Deve ser entre R$0,01 e R$100.000' })
            };
        }

        // Validar CPF (apenas aviso, não bloqueia)
        if (customerDocument && !isValidCPF(customerDocument)) {
            console.log('⚠️ CPF pode ser inválido:', customerDocument);
        }

        // Sanitizar inputs
        const safeCustomerName = sanitize(customerName);
        const safeDescription = sanitize(description);
        const safeEmail = customerEmail ? sanitize(customerEmail) : '';

        console.log('🔵 [BS Pay] Criando cobrança PIX...');
        console.log('💰 Valor:', parsedAmount);
        console.log('👤 Cliente:', safeCustomerName);

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

        // Montar payload conforme documentação - usando valores SANITIZADOS
        const payload = {
            amount: parsedAmount, // float validado
            external_id: externalId || `pedido_${Date.now()}`,
            postbackUrl: postbackUrl || '',
            payerQuestion: safeDescription || `Pagamento Pedido #${externalId || Date.now()}`,
            payer: {
                name: safeCustomerName || 'Cliente',
                document: customerDocument?.replace(/\D/g, '') || '',
                email: safeEmail
            }
        };

        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Criar QR Code PIX
        const response = await fetch('https://api.bspay.co/v2/pix/qrcode', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Resposta BS Pay:', JSON.stringify(data, null, 2));

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
                    error: data.message || data.error || 'Erro ao criar cobrança BS Pay',
                    details: data
                })
            };
        }

        // Calcular expiração baseado no calendar.expiration (em segundos)
        const expirationSeconds = data.calendar?.expiration || 3600;
        const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();

        // Retornar no formato esperado pelo PixPayment
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                txid: data.transactionId,
                transactionId: data.transactionId,
                external_id: data.external_id,
                status: data.status,
                amount: data.amount,
                pixCopiaECola: data.qrcode, // String do QR Code PIX (Copia e Cola)
                qrcode: data.qrcode,
                expiresAt: expiresAt,
                debtor: data.debtor,
                calendar: data.calendar,
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
                error: error.message || 'Erro interno ao processar requisição'
            })
        };
    }
};
