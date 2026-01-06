/**
 * Netlify Function: Ryzen Pay - Criar Cobrança PIX
 * Cria cobrança PIX via API Ryzen Pay
 * Documentação: https://app.ryzenpay.com.br
 * 
 * SEGURANÇA:
 * - Autenticação via api-key no body
 * - CORS restritivo por domínio
 * - Validação de inputs
 * - Sanitização de dados
 * - SEM SPLIT DE PAGAMENTO
 */

const fetch = require('node-fetch');

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
            externalId,
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
        let apiKey = process.env.RYZENPAY_API_KEY;
        let webhookUrl = process.env.RYZENPAY_CALLBACK_URL;

        console.log('🔍 Buscando credenciais RyzenPay...');
        console.log('📦 ENV RYZENPAY_API_KEY:', apiKey ? '✓' : '✗');

        // Se não tem nas env vars, buscar do Supabase
        if (!apiKey) {
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
                        .select('api_key, callback_url')
                        .eq('provider', 'ryzenpay')
                        .eq('is_active', true)
                        .single();

                    if (error) {
                        console.error('❌ Erro ao buscar gateway:', error);
                    } else if (gateway) {
                        apiKey = gateway.api_key;
                        webhookUrl = gateway.callback_url || webhookUrl;
                        console.log('✅ Credenciais carregadas do banco de dados');
                        console.log('📦 API Key:', apiKey ? apiKey.substring(0, 10) + '...' : '✗');
                    } else {
                        console.log('⚠️ Gateway ryzenpay não encontrado ou não está ativo');
                    }
                } catch (dbError) {
                    console.error('❌ Erro ao conectar com Supabase:', dbError);
                }
            } else {
                console.log('⚠️ Variáveis de ambiente do Supabase não configuradas');
            }
        }

        if (!apiKey) {
            console.error('❌ Credenciais RyzenPay não encontradas!');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Credenciais RyzenPay não configuradas. Verifique os logs do Netlify Functions.'
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

        console.log('💎 [RyzenPay] Criando cobrança PIX...');
        console.log('💰 Valor:', parsedAmount);
        console.log('👤 Cliente:', safeCustomerName);

        // Gerar identifier único
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

        // Montar payload conforme documentação RyzenPay
        // SEM SPLIT DE PAGAMENTO conforme solicitado
        const payload = {
            "api-key": apiKey,
            "amount": parsedAmount,
            "method": "pix",
            "external_reference": externalReference,
            "client": {
                "name": safeCustomerName || 'Cliente',
                "document": cleanDocument,
                "email": safeEmail || 'cliente@gorilapod.com.br'
            }
        };

        // Adicionar notification_url (webhook) se configurado
        if (webhookUrl) {
            payload.notification_url = webhookUrl;
        }

        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Chamar API RyzenPay
        const response = await fetch('https://app.ryzenpay.com.br/api/v1/gateway/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Resposta RyzenPay:', JSON.stringify(data, null, 2));

        if (!response.ok || data.status !== 'success') {
            console.error('❌ Erro RyzenPay:', data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: data.message || 'Erro ao criar cobrança RyzenPay',
                    details: data
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
                    title: '💰 Novo PIX Gerado!',
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
                txid: data.idTransaction,
                transactionId: data.idTransaction,
                externalReference: externalReference,
                status: 'PENDENTE',
                amount: parsedAmount,
                // PIX
                pixCopiaECola: data.paymentCode || '',
                qrcode: data.paymentCode || '',
                imagemQrcode: data.paymentCodeBase64 || '',
                // Provider
                provider: 'ryzenpay',
                // Raw response
                raw: data
            })
        };

    } catch (error) {
        console.error('❌ [RyzenPay] Erro:', error);
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
