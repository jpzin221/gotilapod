const express = require('express');
const router = express.Router();
const efiService = require('../services/efiService');

/**
 * POST /api/pix/create-charge
 * Criar cobrança PIX
 */
router.post('/create-charge', async (req, res) => {
  try {
    const { valorTotal, nomeCliente, cpfCliente, itens, pedidoId } = req.body;

    // Validação dos dados
    if (!valorTotal || valorTotal <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor total inválido'
      });
    }

    if (!nomeCliente || nomeCliente.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Nome do cliente é obrigatório'
      });
    }

    if (!cpfCliente || cpfCliente.replace(/\D/g, '').length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido'
      });
    }

    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pedido sem itens'
      });
    }

    console.log('📥 Nova cobrança PIX solicitada');
    console.log('💰 Valor:', valorTotal);
    console.log('👤 Cliente:', nomeCliente);
    console.log('📦 Itens:', itens.length);

    // Criar cobrança na EFI
    const pixData = await efiService.createPixCharge(
      valorTotal,
      nomeCliente,
      cpfCliente,
      itens
    );

    // TODO: Salvar pedido no banco de dados (Supabase)
    // const { data, error } = await supabase
    //   .from('pedidos')
    //   .insert({
    //     id: pedidoId,
    //     txid: pixData.txid,
    //     valor_total: valorTotal,
    //     nome_cliente: nomeCliente,
    //     cpf_cliente: cpfCliente,
    //     status: 'aguardando_pagamento',
    //     itens: itens,
    //     created_at: new Date().toISOString()
    //   });

    console.log('✅ Cobrança criada com sucesso');

    res.json({
      success: true,
      txid: pixData.txid,
      qrcode: pixData.qrcode,
      imagemQrcode: pixData.imagemQrcode,
      pixCopiaECola: pixData.pixCopiaECola,
      message: 'Cobrança PIX criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar cobrança:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao criar cobrança PIX',
      message: error.message,
      details: error.details
    });
  }
});

/**
 * GET /api/pix/status/:txid
 * Verificar status do pagamento
 */
router.get('/status/:txid', async (req, res) => {
  try {
    const { txid } = req.params;

    if (!txid) {
      return res.status(400).json({
        success: false,
        error: 'TXID não fornecido'
      });
    }

    console.log('🔍 Consultando status:', txid);

    const status = await efiService.checkPaymentStatus(txid);

    res.json({
      success: true,
      txid: status.txid,
      status: status.status,
      valor: status.valor,
      horario: status.horario,
      pix: status.pix
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do pagamento',
      message: error.message
    });
  }
});

/**
 * POST /api/pix/webhook
 * Webhook da EFI - Recebe notificações de pagamento
 */
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;

    console.log('🔔 ====================================');
    console.log('🔔 WEBHOOK RECEBIDO');
    console.log('🔔 ====================================');
    console.log(JSON.stringify(notification, null, 2));

    // Verificar se é notificação de PIX
    if (notification.pix) {
      for (const pix of notification.pix) {
        const txid = pix.txid;

        console.log('💰 PIX recebido para txid:', txid);

        // Buscar detalhes do pagamento
        const details = await efiService.checkPaymentStatus(txid);

        if (details.status === 'CONCLUIDA') {
          console.log('✅ ====================================');
          console.log('✅ PAGAMENTO CONFIRMADO!');
          console.log('✅ TXID:', txid);
          console.log('✅ Valor:', details.valor.original);
          console.log('✅ ====================================');

          // TODO: Atualizar pedido no banco de dados
          // const { data, error } = await supabase
          //   .from('pedidos')
          //   .update({
          //     status: 'pago',
          //     paid_at: new Date().toISOString()
          //   })
          //   .eq('txid', txid);

          // TODO: Enviar email de confirmação para o cliente

          // TODO: Notificar admin

          // TODO: Disparar eventos (ex: WhatsApp, Telegram)
        }
      }
    }

    // EFI espera resposta 200
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    // Mesmo com erro, retornar 200 para não reenviar notificação
    res.sendStatus(200);
  }
});

/**
 * POST /api/pix/configure-webhook
 * Configurar URL do webhook na EFI
 */
router.post('/configure-webhook', async (req, res) => {
  try {
    const { chave, webhookUrl } = req.body;

    if (!chave || !webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Chave PIX e URL do webhook são obrigatórios'
      });
    }

    await efiService.configureWebhook(chave, webhookUrl);

    res.json({
      success: true,
      message: 'Webhook configurado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao configurar webhook',
      message: error.message
    });
  }
});

module.exports = router;
