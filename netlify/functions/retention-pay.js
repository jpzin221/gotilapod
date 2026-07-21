/**
 * Netlify Function: Retention Payment
 * Cria e verifica status de PIX para etapas de retenção
 * Usa a gateway padrão configurada no Supabase
 */

const fetch = require('node-fetch');
const QRCode = require('qrcode');

const ALLOWED_ORIGINS = [
    'https://gorilapod.netlify.app',
    'https://gorilapod.shop',
    'https://www.gorilapod.shop',
    'https://gorilapod.com.br',
    'https://www.gorilapod.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8888',
    'null'
];

function getAllowedOrigin(requestOrigin) {
    if (requestOrigin === 'null') return 'null';
    return requestOrigin || '*';
}

function sanitize(str) {
    if (!str) return '';
    return String(str).replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 200);
}

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

let bspayToken = null;
let bspayTokenExpires = null;

async function getBSPayToken(clientId, clientSecret) {
    if (bspayToken && bspayTokenExpires && Date.now() < bspayTokenExpires) return bspayToken;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://api.bspay.co/v2/oauth/token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Authorization': `Basic ${credentials}` }
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error(data.message || 'Erro ao obter token');
    bspayToken = data.access_token;
    bspayTokenExpires = Date.now() + ((data.expires_in - 300) * 1000);
    return data.access_token;
}

async function getDefaultGateway(supabase) {
    const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
    if (error || !data) throw new Error('Nenhuma gateway de pagamento ativa encontrada');
    return data;
}

async function createBSPayPIX(gateway, amount, externalId, customerName, customerDocument) {
    let accessToken;
    if (gateway.access_token) {
        accessToken = gateway.access_token;
    } else if (gateway.client_id && gateway.client_secret) {
        accessToken = await getBSPayToken(gateway.client_id, gateway.client_secret);
    } else {
        const envClientId = process.env.BSPAY_CLIENT_ID;
        const envClientSecret = process.env.BSPAY_CLIENT_SECRET;
        if (envClientId && envClientSecret) {
            accessToken = await getBSPayToken(envClientId, envClientSecret);
        } else {
            throw new Error('Credenciais BS Pay não configuradas');
        }
    }

    const payload = {
        amount: parseFloat(amount),
        external_id: externalId || `retencao_${Date.now()}`,
        postbackUrl: '',
        payerQuestion: `Taxa de retenção - Pedido`,
        payer: {
            name: sanitize(customerName) || 'Cliente',
            document: customerDocument?.replace(/\D/g, '') || '',
            email: ''
        }
    };

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
    if (!response.ok) throw new Error(data.message || data.error || 'Erro ao criar PIX');

    let imagemQrcode = null;
    if (data.qrcode) {
        imagemQrcode = await QRCode.toDataURL(data.qrcode, { width: 256, margin: 2 });
    }

    return {
        txid: data.transactionId,
        transactionId: data.transactionId,
        pixCopiaECola: data.qrcode,
        imagemQrcode,
        status: data.status,
        expiresAt: new Date(Date.now() + ((data.calendar?.expiration || 3600) * 1000)).toISOString()
    };
}

async function checkBSPayStatus(gateway, transactionId) {
    let accessToken;
    if (gateway.access_token) {
        accessToken = gateway.access_token;
    } else if (gateway.client_id && gateway.client_secret) {
        accessToken = await getBSPayToken(gateway.client_id, gateway.client_secret);
    } else {
        const envClientId = process.env.BSPAY_CLIENT_ID;
        const envClientSecret = process.env.BSPAY_CLIENT_SECRET;
        if (envClientId && envClientSecret) {
            accessToken = await getBSPayToken(envClientId, envClientSecret);
        } else {
            throw new Error('Credenciais BS Pay não configuradas');
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
    if (!response.ok) throw new Error(data.message || 'Erro ao consultar status');

    const statusMap = {
        'pending': 'ATIVA', 'PENDING': 'ATIVA',
        'paid': 'CONCLUIDA', 'PAID': 'CONCLUIDA',
        'expired': 'EXPIRADA', 'EXPIRED': 'EXPIRADA',
        'cancelled': 'CANCELADA', 'CANCELLED': 'CANCELADA'
    };

    return {
        txid: transactionId,
        status: statusMap[data.status] || data.status,
        originalStatus: data.status,
        paidAt: data.paidAt || null
    };
}

async function createPoseidonPayPIX(gateway, amount, externalId, customerName, customerDocument) {
    const payload = {
        amount: parseFloat(amount),
        external_id: externalId || `retencao_${Date.now()}`,
        description: `Taxa de retenção`,
        customer: {
            name: sanitize(customerName) || 'Cliente',
            document: customerDocument?.replace(/\D/g, '') || ''
        }
    };

    const response = await fetch('https://app.poseidonpay.site/api/v1/gateway/pix/receive', {
        method: 'POST',
        headers: {
            'x-public-key': gateway.public_key,
            'x-secret-key': gateway.api_secret,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar PIX');

    return {
        txid: data.id || data.transactionId,
        transactionId: data.id || data.transactionId,
        pixCopiaECola: data.pix?.base64 || data.pix?.copyPaste || '',
        imagemQrcode: data.pix?.base64 || null,
        status: 'ATIVA',
        expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
    };
}

async function createRyzenPayPIX(gateway, amount, externalId, customerName, customerDocument) {
    const payload = {
        amount: parseFloat(amount),
        external_id: externalId || `retencao_${Date.now()}`,
        description: `Taxa de retenção`,
        customer: {
            name: sanitize(customerName) || 'Cliente',
            document: customerDocument?.replace(/\D/g, '') || ''
        }
    };

    const response = await fetch('https://app.ryzenpay.com.br/api/v1/gateway/pix/receive', {
        method: 'POST',
        headers: {
            'x-api-key': gateway.api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar PIX');

    return {
        txid: data.id || data.transactionId,
        transactionId: data.id || data.transactionId,
        pixCopiaECola: data.paymentCode || data.pixCode || '',
        imagemQrcode: data.paymentCodeBase64 || null,
        status: 'ATIVA',
        expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
    };
}

async function createCodexPayPIX(gateway, amount, externalId, customerName, customerDocument) {
    let accessToken;
    const credentials = Buffer.from(`${gateway.client_id}:${gateway.client_secret}`).toString('base64');
    const authResponse = await fetch('https://api.codexpay.app/api/auth/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
    });
    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) throw new Error('Erro ao autenticar CodexPay');
    accessToken = authData.access_token;

    const payload = {
        amount: parseFloat(amount),
        external_id: externalId || `retencao_${Date.now()}`,
        description: `Taxa de retenção`,
        customer: {
            name: sanitize(customerName) || 'Cliente',
            document: customerDocument?.replace(/\D/g, '') || ''
        }
    };

    const response = await fetch('https://api.codexpay.app/api/payments/deposit', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar PIX');

    let imagemQrcode = null;
    if (data.pix?.copyPaste) {
        imagemQrcode = await QRCode.toDataURL(data.pix.copyPaste, { width: 256, margin: 2 });
    }

    return {
        txid: data.id || data.transactionId,
        transactionId: data.id || data.transactionId,
        pixCopiaECola: data.pix?.copyPaste || '',
        imagemQrcode,
        status: 'ATIVA',
        expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
    };
}

exports.handler = async (event, context) => {
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

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Corpo da requisição vazio' }) };
        }

        const body = JSON.parse(event.body);
        const { action, amount, externalId, customerName, customerDocument, transactionId } = body;

        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const gateway = await getDefaultGateway(supabase);

        if (action === 'create') {
            if (!amount || parseFloat(amount) <= 0) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Valor inválido' }) };
            }

            let result;
            switch (gateway.provider) {
                case 'bspay':
                    result = await createBSPayPIX(gateway, amount, externalId, customerName, customerDocument);
                    break;
                case 'poseidonpay':
                    result = await createPoseidonPayPIX(gateway, amount, externalId, customerName, customerDocument);
                    break;
                case 'ryzenpay':
                    result = await createRyzenPayPIX(gateway, amount, externalId, customerName, customerDocument);
                    break;
                case 'codexpay':
                    result = await createCodexPayPIX(gateway, amount, externalId, customerName, customerDocument);
                    break;
                default:
                    throw new Error(`Gateway "${gateway.provider}" não suportada para retenção`);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, ...result, provider: gateway.provider })
            };
        }

        if (action === 'status') {
            if (!transactionId) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Transaction ID obrigatório' }) };
            }

            let result;
            switch (gateway.provider) {
                case 'bspay':
                    result = await checkBSPayStatus(gateway, transactionId);
                    break;
                default:
                    throw new Error(`Verificação de status não suportada para "${gateway.provider}"`);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, ...result })
            };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Ação inválida. Use "create" ou "status".' }) };

    } catch (error) {
        console.error('❌ [Retention Pay] Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message || 'Erro interno' })
        };
    }
};
