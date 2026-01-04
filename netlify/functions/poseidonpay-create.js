/**
 * Netlify Function: Poseidon Pay - Criar Cobrança PIX
 * Cria cobrança PIX via API Poseidon Pay
 * Documentação: https://app.poseidonpay.site/docs
 * 
 * SEGURANÇA:
 * - Autenticação via headers x-public-key e x-secret-key
 * - CORS restritivo por domínio
 * - Validação de inputs
 * - Sanitização de dados
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
 * Formata telefone para padrão brasileiro
 */
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    // Adiciona código do país se necessário
    if (cleaned.length === 11) {
        return `+55${cleaned}`;
    } else if (cleaned.length === 10) {
        return `+55${cleaned}`;
    }
    return cleaned;
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
            customerPhone,
            externalId,
            description,
            callbackUrl,
            // Produtos (opcional)
            products
            // REMOVIDO: publicKey e secretKey - nunca receber credenciais do frontend!
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
        let apiPublicKey = process.env.POSEIDONPAY_PUBLIC_KEY;
        let apiSecretKey = process.env.POSEIDONPAY_SECRET_KEY;
        let webhookUrl = process.env.POSEIDONPAY_CALLBACK_URL;

        console.log('🔍 Buscando credenciais...');
        console.log('📦 ENV POSEIDONPAY_PUBLIC_KEY:', apiPublicKey ? '✓' : '✗');
        console.log('📦 ENV POSEIDONPAY_SECRET_KEY:', apiSecretKey ? '✓' : '✗');

        // Se não tem nas env vars, buscar do Supabase
        if (!apiPublicKey || !apiSecretKey) {
            const { createClient } = require('@supabase/supabase-js');

            const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

            console.log('🔗 Supabase URL:', supabaseUrl ? '✓' : '✗');
            console.log('🔑 Supabase Key:', supabaseKey ? '✓' : '✗');

            if (supabaseUrl && supabaseKey) {
                try {
                    const supabase = createClient(supabaseUrl, supabaseKey);

                    console.log('📡 Consultando payment_gateways...');

                    const { data: gateway, error } = await supabase
                        .from('payment_gateways')
                        .select('public_key, api_secret, callback_url')
                        .eq('provider', 'poseidonpay')
                        .eq('is_active', true)
                        .single();

                    if (error) {
                        console.error('❌ Erro ao buscar gateway:', error);
                    } else if (gateway) {
                        apiPublicKey = gateway.public_key;
                        apiSecretKey = gateway.api_secret;
                        webhookUrl = gateway.callback_url || webhookUrl;
                        console.log('✅ Credenciais carregadas do banco de dados');
                        console.log('📦 Public Key:', apiPublicKey ? apiPublicKey.substring(0, 10) + '...' : '✗');
                        console.log('📦 Secret Key:', apiSecretKey ? apiSecretKey.substring(0, 10) + '...' : '✗');
                    } else {
                        console.log('⚠️ Gateway poseidonpay não encontrado ou não está ativo');
                    }
                } catch (dbError) {
                    console.error('❌ Erro ao conectar com Supabase:', dbError);
                }
            } else {
                console.log('⚠️ Variáveis de ambiente do Supabase não configuradas');
            }
        }

        if (!apiPublicKey || !apiSecretKey) {
            console.error('❌ Credenciais Poseidon Pay não encontradas!');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Credenciais Poseidon Pay não configuradas. Verifique os logs do Netlify Functions.'
                })
            };
        }

        // Validar CPF (aviso apenas)
        if (customerDocument && !isValidCPF(customerDocument)) {
            console.log('⚠️ CPF pode ser inválido:', customerDocument);
        }

        // Sanitizar inputs
        const safeCustomerName = sanitize(customerName);
        const safeDescription = sanitize(description);
        const safeEmail = customerEmail ? sanitize(customerEmail) : '';
        const safePhone = formatPhone(customerPhone);

        console.log('🔱 [Poseidon Pay] Criando cobrança PIX...');
        console.log('💰 Valor:', parsedAmount);
        console.log('👤 Cliente:', safeCustomerName);

        // Gerar identifier único
        const identifier = externalId || `pedido_${Date.now()}`;

        // Validar CPF - obrigatório para Poseidon Pay
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

        // Montar payload conforme documentação Poseidon Pay
        // Campos obrigatórios: identifier, amount, client (name, email, phone, document)
        // IMPORTANTE: amount deve ser um número (float) com até 2 casas decimais
        const payload = {
            identifier: identifier,
            amount: parsedAmount,
            client: {
                name: safeCustomerName || 'Cliente',
                email: safeEmail || 'cliente@gorilapod.com.br',
                phone: safePhone || '11999999999',
                document: cleanDocument
            }
        };

        // Adicionar callbackUrl do banco de dados (configurado no admin)
        if (webhookUrl) {
            payload.callbackUrl = webhookUrl;
        }

        // Adicionar produtos se fornecidos (campo opcional)
        if (products && Array.isArray(products) && products.length > 0) {
            payload.products = products.map(p => ({
                id: p.id || String(Date.now()),
                name: sanitize(p.name || p.nome),
                quantity: parseInt(p.quantity || p.quantidade) || 1,
                price: parseFloat(p.price || p.preco) || 0
            }));
        }

        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Chamar API Poseidon Pay
        const response = await fetch('https://app.poseidonpay.site/api/v1/gateway/pix/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-public-key': apiPublicKey,
                'x-secret-key': apiSecretKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Resposta Poseidon Pay:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Erro Poseidon Pay:', data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: data.message || data.error || 'Erro ao criar cobrança Poseidon Pay',
                    details: data
                })
            };
        }

        // Retornar no formato esperado pelo PixPayment
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                txid: data.transactionId,
                transactionId: data.transactionId,
                identifier: identifier,
                status: data.status,
                amount: parsedAmount,
                // PIX
                pixCopiaECola: data.pix?.code || '',
                qrcode: data.pix?.code || '',
                imagemQrcode: data.pix?.base64 || data.pix?.image || '',
                qrcodeUrl: data.pix?.image || '',
                // Order info
                orderId: data.order?.id || '',
                orderUrl: data.order?.url || '',
                receiptUrl: data.order?.receiptUrl || '',
                // Provider
                provider: 'poseidonpay',
                // Raw response
                raw: data
            })
        };

    } catch (error) {
        console.error('❌ [Poseidon Pay] Erro:', error);
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
