/**
 * Netlify Function: Poseidon Pay - Webhook
 * Recebe notificações de status da Poseidon Pay
 * 
 * Eventos esperados:
 * - TRANSACTION_CREATED: Transação criada
 * - TRANSACTION_PAID: Pagamento confirmado ✓
 * - TRANSACTION_CANCELED: Transação cancelada
 * - TRANSACTION_REFUNDED: Transação estornada
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
    };

    // Webhook só aceita POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        if (!event.body) {
            console.log('⚠️ Webhook recebido sem body');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Corpo vazio' })
            };
        }

        const webhookData = JSON.parse(event.body);

        console.log('🔱 [Poseidon Pay Webhook] Recebido:');
        console.log('📦 Evento:', webhookData.event);
        console.log('📦 Dados:', JSON.stringify(webhookData, null, 2));

        // Validar token de segurança (se configurado)
        const expectedToken = process.env.POSEIDONPAY_WEBHOOK_SECRET;
        if (expectedToken && webhookData.token !== expectedToken) {
            console.warn('⚠️ Token de webhook inválido');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, error: 'Token inválido' })
            };
        }

        // Conectar ao Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Credenciais Supabase não configuradas');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, error: 'Configuração de banco inválida' })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Extrair dados da transação
        const transaction = webhookData.transaction || {};
        const transactionId = transaction.id || webhookData.transactionId;
        const identifier = transaction.identifier || webhookData.identifier;
        const eventType = webhookData.event;

        console.log('🔍 Processando:', { eventType, transactionId, identifier });

        // Processar evento
        switch (eventType) {
            case 'TRANSACTION_CREATED':
                console.log('📝 Transação criada:', transactionId);
                // Atualizar status para pendente (opcional)
                if (identifier) {
                    await supabase
                        .from('pedidos')
                        .update({
                            txid: transactionId,
                            status: 'aguardando_pagamento',
                            updated_at: new Date().toISOString()
                        })
                        .eq('numero_pedido', identifier);
                }
                break;

            case 'TRANSACTION_PAID':
                console.log('✅ PAGAMENTO CONFIRMADO:', transactionId);

                // Buscar e atualizar pedido
                const { data: pedido, error: findError } = await supabase
                    .from('pedidos')
                    .select('*')
                    .or(`txid.eq.${transactionId},numero_pedido.ilike.%${identifier}%`)
                    .single();

                if (findError && findError.code !== 'PGRST116') {
                    console.error('❌ Erro ao buscar pedido:', findError);
                }

                if (pedido) {
                    console.log('📦 Pedido encontrado:', pedido.id, pedido.numero_pedido);

                    const { error: updateError } = await supabase
                        .from('pedidos')
                        .update({
                            pago: true,
                            pago_em: new Date().toISOString(),
                            status: 'confirmado',
                            forma_pagamento: 'pix_poseidonpay',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', pedido.id);

                    if (updateError) {
                        console.error('❌ Erro ao atualizar pedido:', updateError);
                    } else {
                        console.log('✅ Pedido atualizado com sucesso!');
                    }
                } else {
                    console.warn('⚠️ Pedido não encontrado para:', { transactionId, identifier });

                    // Tentar criar registro de pagamento pendente
                    console.log('📝 Salvando pagamento para processamento posterior...');
                    await supabase
                        .from('webhook_logs')
                        .insert({
                            provider: 'poseidonpay',
                            event: eventType,
                            transaction_id: transactionId,
                            identifier: identifier,
                            payload: webhookData,
                            processed: false,
                            created_at: new Date().toISOString()
                        })
                        .select();
                }
                break;

            case 'TRANSACTION_CANCELED':
                console.log('❌ Transação cancelada:', transactionId);
                if (identifier || transactionId) {
                    await supabase
                        .from('pedidos')
                        .update({
                            status: 'cancelado',
                            updated_at: new Date().toISOString()
                        })
                        .or(`txid.eq.${transactionId},numero_pedido.ilike.%${identifier}%`);
                }
                break;

            case 'TRANSACTION_REFUNDED':
                console.log('↩️ Transação estornada:', transactionId);
                if (identifier || transactionId) {
                    await supabase
                        .from('pedidos')
                        .update({
                            status: 'estornado',
                            updated_at: new Date().toISOString()
                        })
                        .or(`txid.eq.${transactionId},numero_pedido.ilike.%${identifier}%`);
                }
                break;

            default:
                console.log('📌 Evento não tratado:', eventType);
        }

        // Sempre retornar 200 para confirmar recebimento
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Webhook processado com sucesso',
                event: eventType
            })
        };

    } catch (error) {
        console.error('❌ [Poseidon Pay Webhook] Erro:', error);

        // Mesmo com erro, retornar 200 para não reenviar
        // (log do erro já foi feito)
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Webhook recebido mas houve erro no processamento'
            })
        };
    }
};
