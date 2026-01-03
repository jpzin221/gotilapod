/**
 * Netlify Function: Poseidon Pay - Verificar Status
 * Verifica o status de uma transação via API Poseidon Pay
 * 
 * Nota: A documentação fornecida não especifica um endpoint de status,
 * então implementamos polling baseado no webhook.
 * O status real será atualizado via webhook TRANSACTION_PAID.
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

function getAllowedOrigin(requestOrigin) {
    if (requestOrigin === 'null') {
        return 'null';
    }
    return requestOrigin || '*';
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
            transactionId,
            identifier,
            publicKey,
            secretKey
        } = body;

        if (!transactionId && !identifier) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'transactionId ou identifier é obrigatório' })
            };
        }

        const apiPublicKey = publicKey || process.env.POSEIDONPAY_PUBLIC_KEY;
        const apiSecretKey = secretKey || process.env.POSEIDONPAY_SECRET_KEY;

        if (!apiPublicKey || !apiSecretKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Credenciais Poseidon Pay não configuradas.'
                })
            };
        }

        console.log('🔱 [Poseidon Pay] Verificando status da transação:', transactionId || identifier);

        // Tentar buscar status no Supabase (onde o webhook salva)
        // Esta é uma abordagem alternativa já que a doc não especifica endpoint de status
        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Buscar pedido pelo txid ou identifier
            const { data: pedido, error } = await supabase
                .from('pedidos')
                .select('*')
                .or(`txid.eq.${transactionId},numero_pedido.eq.${identifier}`)
                .single();

            if (pedido && !error) {
                console.log('📦 Pedido encontrado:', pedido);

                // Verificar se está pago
                if (pedido.pago || pedido.status === 'confirmado' || pedido.status === 'pago') {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            status: 'CONCLUIDA',
                            transactionId: transactionId,
                            identifier: identifier,
                            pago: true,
                            pedido: {
                                id: pedido.id,
                                numero_pedido: pedido.numero_pedido,
                                valor_total: pedido.valor_total,
                                status: pedido.status
                            }
                        })
                    };
                }
            }
        }

        // Se não encontrou ou não está pago, retornar pendente
        // O status real será confirmado via webhook
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                status: 'PENDENTE',
                transactionId: transactionId,
                identifier: identifier,
                message: 'Aguardando confirmação de pagamento via webhook'
            })
        };

    } catch (error) {
        console.error('❌ [Poseidon Pay] Erro ao verificar status:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Erro ao verificar status'
            })
        };
    }
};
