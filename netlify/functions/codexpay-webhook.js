/**
 * Netlify Function: CodexPay - Webhook
 * Recebe callbacks da CodexPay para atualização de status de transações
 * 
 * IMPORTANTE:
 * - Sempre retorna 200 OK rapidamente para evitar retentativas
 * - Valida os dados antes de atualizar o pedido
 * - Logs detalhados para debugging
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
    };

    // Aceitar apenas POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 200, // Retornar 200 mesmo assim para evitar retentativas
            headers,
            body: JSON.stringify({ received: true, message: 'Method ignored' })
        };
    }

    console.log('📨 [CodexPay Webhook] Recebendo callback...');
    console.log('📦 Body:', event.body);
    console.log('📋 Headers:', JSON.stringify(event.headers, null, 2));

    try {
        // Responder rapidamente primeiro (sucesso)
        // O processamento real será feito em seguida

        if (!event.body) {
            console.log('⚠️ Webhook recebido sem body');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'No body' })
            };
        }

        const payload = JSON.parse(event.body);

        console.log('📥 Payload parsed:', JSON.stringify(payload, null, 2));

        // Extrair dados do payload
        const {
            transaction_id,
            status,
            amount,
            type
        } = payload;

        // Validar campos obrigatórios
        if (!transaction_id) {
            console.log('⚠️ transaction_id não encontrado no payload');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Missing transaction_id' })
            };
        }

        console.log('💚 [CodexPay Webhook] Processando...');
        console.log('🆔 Transaction ID:', transaction_id);
        console.log('📊 Status:', status);
        console.log('💰 Amount:', amount);
        console.log('📋 Type:', type);

        // Verificar se é um depósito com status COMPLETED
        if (type !== 'Deposit') {
            console.log('⚠️ Tipo não é Deposit, ignorando:', type);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Type ignored' })
            };
        }

        if (status !== 'COMPLETED') {
            console.log('⚠️ Status não é COMPLETED:', status);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Status noted', status })
            };
        }

        // ============================================
        // ATUALIZAR PEDIDO NO BANCO DE DADOS
        // ============================================
        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Variáveis de ambiente do Supabase não configuradas');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Supabase not configured' })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Buscar pedido pelo txid
        console.log('🔍 Buscando pedido com txid:', transaction_id);

        const { data: pedido, error: fetchError } = await supabase
            .from('pedidos')
            .select('*')
            .eq('txid', transaction_id)
            .single();

        if (fetchError || !pedido) {
            console.log('⚠️ Pedido não encontrado para txid:', transaction_id);
            console.log('⚠️ Erro:', fetchError);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Order not found' })
            };
        }

        console.log('📦 Pedido encontrado:', pedido.id, pedido.numero_pedido);

        // Verificar se o valor confere (com margem de 1 centavo)
        if (amount && Math.abs(parseFloat(pedido.valor_total) - parseFloat(amount)) > 0.01) {
            console.error('❌ Valor não confere! Esperado:', pedido.valor_total, 'Recebido:', amount);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Amount mismatch' })
            };
        }

        // Verificar se já foi pago
        if (pedido.pago || pedido.status === 'confirmado') {
            console.log('⚠️ Pedido já está pago, ignorando duplicata');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Already paid' })
            };
        }

        // Atualizar pedido como pago
        console.log('✅ Atualizando pedido como pago...');

        const { error: updateError } = await supabase
            .from('pedidos')
            .update({
                pago: true,
                status: 'confirmado',
                pago_em: new Date().toISOString(),
                webhook_received_at: new Date().toISOString()
            })
            .eq('id', pedido.id);

        if (updateError) {
            console.error('❌ Erro ao atualizar pedido:', updateError);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ received: true, message: 'Update failed', error: updateError.message })
            };
        }

        console.log('🎉 Pedido atualizado com sucesso!');

        // ============================================
        // NOTIFICAÇÃO PUSHCUT (OPCIONAL)
        // ============================================
        try {
            const pushcutUrl = process.env.PUSHCUT_WEBHOOK_URL || 'https://api.pushcut.io/xJuUY4a088xUfbdPMDrke/notifications/Jhotta';

            await fetch(pushcutUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '✅ Pagamento Confirmado! (CodexPay)',
                    text: `Pedido: ${pedido.numero_pedido}\nValor: R$ ${pedido.valor_total}\nCliente: ${pedido.cliente_nome || 'N/A'}`,
                    input: `PIX confirmado - R$ ${pedido.valor_total}`
                })
            });

            console.log('🔔 Notificação Pushcut enviada!');
        } catch (pushError) {
            console.error('⚠️ Erro ao enviar notificação Pushcut:', pushError);
            // Não bloqueia o fluxo
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                received: true,
                message: 'Payment confirmed',
                orderId: pedido.id,
                orderNumber: pedido.numero_pedido
            })
        };

    } catch (error) {
        console.error('❌ [CodexPay Webhook] Erro:', error);
        // Sempre retornar 200 para evitar retentativas infinitas
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                received: true,
                message: 'Error processing',
                error: error.message
            })
        };
    }
};
