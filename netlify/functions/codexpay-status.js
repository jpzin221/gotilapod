/**
 * Netlify Function: CodexPay - Verificar Status
 * Verifica o status de uma transação via consulta no Supabase
 * 
 * Nota: O status real é atualizado via webhook
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
            externalReference
        } = body;

        if (!transactionId && !externalReference) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'transactionId ou externalReference é obrigatório' })
            };
        }

        console.log('💚 [CodexPay] Verificando status da transação:', transactionId || externalReference);

        // Buscar status no Supabase (onde o webhook salva)
        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Buscar pedido pelo txid ou external_reference
            let query = supabase.from('pedidos').select('*');

            if (transactionId) {
                query = query.eq('txid', transactionId);
            } else if (externalReference) {
                query = query.eq('numero_pedido', externalReference);
            }

            const { data: pedido, error } = await query.single();

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
                            externalReference: externalReference,
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
                externalReference: externalReference,
                message: 'Aguardando confirmação de pagamento via webhook'
            })
        };

    } catch (error) {
        console.error('❌ [CodexPay] Erro ao verificar status:', error);
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
