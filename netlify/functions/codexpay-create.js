/**
 * Netlify Function: CodexPay - Criar Cobrança PIX
 * Cria cobrança PIX via API CodexPay
 * Documentação: https://api.codexpay.app/api-docs
 * 
 * SEGURANÇA:
 * - Autenticação via JWT (obtido dinamicamente)
 * - CORS restritivo por domínio
 * - Validação de inputs
 * - Sanitização de dados
 * - Cache de token JWT
 */

const fetch = require('node-fetch');

// Cache do token JWT (em memória)
let cachedToken = null;
let tokenExpiry = null;

// Lista de origens permitidas
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

/**
 * Retorna a origem permitida para CORS
 */
function getAllowedOrigin(requestOrigin) {
    if (requestOrigin === 'null') {
        return 'null';
    }
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
        .substring(0, 200);
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

/**
 * Obtém token JWT do CodexPay (com cache)
 */
async function getAuthToken(clientId, clientSecret) {
    // Se tem token em cache e ainda é válido (com margem de 5 minutos)
    const now = Date.now();
    if (cachedToken && tokenExpiry && (tokenExpiry - now) > 300000) {
        console.log('🔐 Usando token JWT em cache');
        return cachedToken;
    }

    console.log('🔐 Obtendo novo token JWT do CodexPay...');

    try {
        const response = await fetch('https://api.codexpay.app/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        const data = await response.json();

        if (!response.ok || !data.token) {
            console.error('❌ Erro ao obter token:', data);
            throw new Error(data.message || 'Falha na autenticação CodexPay');
        }

        // Cachear token (assumindo expiração de 1 hora)
        cachedToken = data.token;
        tokenExpiry = now + (55 * 60 * 1000); // 55 minutos (margem de segurança)

        console.log('✅ Token JWT obtido com sucesso');
        return cachedToken;

    } catch (error) {
        console.error('❌ Erro na autenticação CodexPay:', error);
        throw error;
    }
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
            amount,
            customerName,
            customerDocument,
            customerEmail,
            externalId
        } = body;

        // VALIDAÇÕES
        let parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Valor inválido. Deve ser entre R$0,01 e R$100.000' })
            };
        }

        // Garantir que o valor tenha exatamente 2 casas decimais
        parsedAmount = Math.round(parsedAmount * 100) / 100;

        // ============================================
        // BUSCAR CREDENCIAIS DO BANCO DE DADOS (SEGURO)
        // ============================================
        let clientId = process.env.CODEXPAY_CLIENT_ID;
        let clientSecret = process.env.CODEXPAY_CLIENT_SECRET;
        let webhookUrl = process.env.CODEXPAY_CALLBACK_URL;

        console.log('🔍 Buscando credenciais CodexPay...');
        console.log('📦 ENV CLIENT_ID:', clientId ? '✓' : '✗');

        // Se não tem nas env vars, buscar do Supabase
        if (!clientId || !clientSecret) {
            const { createClient } = require('@supabase/supabase-js');

            const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

            console.log('🔗 Supabase URL:', supabaseUrl ? '✓' : '✗');
            console.log('🔑 Supabase Key:', supabaseKey ? '✓' : '✗');

            if (supabaseUrl && supabaseKey) {
                try {
                    const supabase = createClient(supabaseUrl, supabaseKey);

                    console.log('📡 Consultando payment_gateways...');

                    const { data: gateways, error } = await supabase
                        .from('payment_gateways')
                        .select('client_id, client_secret, callback_url')
                        .eq('provider', 'codexpay')
                        .eq('is_active', true)
                        .limit(1);

                    if (error) {
                        console.error('❌ Erro ao buscar gateway:', error);
                    } else if (gateways && gateways.length > 0) {
                        const gateway = gateways[0];
                        clientId = gateway.client_id;
                        clientSecret = gateway.client_secret;
                        webhookUrl = gateway.callback_url || webhookUrl;
                        console.log('✅ Credenciais carregadas do banco de dados');
                        console.log('📦 Client ID:', clientId ? clientId.substring(0, 10) + '...' : '✗');
                    } else {
                        console.log('⚠️ Gateway codexpay não encontrado ou não está ativo');
                    }
                } catch (dbError) {
                    console.error('❌ Erro ao conectar com Supabase:', dbError);
                }
            } else {
                console.log('⚠️ Variáveis de ambiente do Supabase não configuradas');
            }
        }

        if (!clientId || !clientSecret) {
            console.error('❌ Credenciais CodexPay não encontradas!');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Erro ao gerar PIX. Por favor, tente outro método de pagamento.'
                })
            };
        }

        // Obter token JWT
        let authToken;
        try {
            authToken = await getAuthToken(clientId, clientSecret);
        } catch (authError) {
            console.error('❌ Falha na autenticação:', authError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Erro ao gerar PIX. Por favor, tente outro método de pagamento.'
                })
            };
        }

        // Validar CPF (aviso apenas)
        if (customerDocument && !isValidCPF(customerDocument)) {
            console.log('⚠️ CPF pode ser inválido:', customerDocument);
        }

        // Sanitizar inputs
        const safeCustomerName = sanitize(customerName);
        const safeEmail = customerEmail ? sanitize(customerEmail) : '';

        console.log('💚 [CodexPay] Criando cobrança PIX...');
        console.log('💰 Valor:', parsedAmount);
        console.log('👤 Cliente:', safeCustomerName);

        // Gerar external_id único
        const externalReference = externalId || `PEDIDO-${Date.now()}`;

        // Limpar CPF
        const cleanDocument = customerDocument?.replace(/\D/g, '') || '';
        if (!cleanDocument || cleanDocument.length < 11) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'CPF é obrigatório e deve ter 11 dígitos'
                })
            };
        }

        // Montar payload conforme documentação CodexPay
        const payload = {
            amount: parsedAmount,
            external_id: externalReference,
            clientCallbackUrl: webhookUrl || `${requestOrigin}/.netlify/functions/codexpay-webhook`,
            payer: {
                name: safeCustomerName || 'Cliente',
                email: safeEmail || 'cliente@gorilapod.com.br',
                document: cleanDocument
            }
        };

        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Chamar API CodexPay
        const response = await fetch('https://api.codexpay.app/api/payments/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Resposta CodexPay:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Erro CodexPay:', data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Erro ao gerar PIX. Por favor, tente outro método de pagamento.',
                    details: data
                })
            };
        }

        // Extrair dados da resposta
        const qrCodeResponse = data.qrCodeResponse || data;

        if (!qrCodeResponse.qrcode) {
            console.error('❌ QR Code não retornado:', data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Erro ao gerar QR Code PIX. Tente novamente.'
                })
            };
        }

        // ============================================
        // WEBHOOK PUSHCUT - Notificar quando PIX for gerado
        // ============================================
        try {
            const pushcutUrl = process.env.PUSHCUT_WEBHOOK_URL || 'https://api.pushcut.io/xJuUY4a088xUfbdPMDrke/notifications/Jhotta';

            console.log('🔔 Enviando notificação Pushcut...');

            await fetch(pushcutUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '💰 Novo PIX Gerado! (CodexPay)',
                    text: `Cliente: ${safeCustomerName}\nValor: R$ ${parsedAmount.toFixed(2)}\nRef: ${externalReference}`,
                    input: `Pedido de R$ ${parsedAmount.toFixed(2)}`
                })
            });

            console.log('✅ Notificação Pushcut enviada!');
        } catch (webhookError) {
            console.error('⚠️ Erro ao enviar notificação Pushcut:', webhookError);
            // Não bloqueia o fluxo se falhar
        }

        // Retornar no formato esperado pelo PixPayment
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                txid: qrCodeResponse.transactionId,
                transactionId: qrCodeResponse.transactionId,
                externalReference: externalReference,
                status: qrCodeResponse.status || 'PENDING',
                amount: parsedAmount,
                // PIX
                pixCopiaECola: qrCodeResponse.qrcode,
                qrcode: qrCodeResponse.qrcode,
                imagemQrcode: qrCodeResponse.qrcode, // Base64 do QR Code
                // Provider
                provider: 'codexpay',
                // Raw response
                raw: data
            })
        };

    } catch (error) {
        console.error('❌ [CodexPay] Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Erro ao gerar PIX. Por favor, tente outro método de pagamento.'
            })
        };
    }
};
