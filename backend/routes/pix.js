const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const efiService = require('../services/efiService');

// Cache do token BS Pay
let bspayToken = null;
let bspayTokenExpiresAt = null;

/**
 * Obtém token de acesso BS Pay via OAuth
 */
async function getBSPayToken(clientId, clientSecret) {
  // Verificar se o token ainda é válido
  if (bspayToken && bspayTokenExpiresAt && Date.now() < bspayTokenExpiresAt) {
    console.log('🟢 [BS Pay] Usando token em cache');
    return bspayToken;
  }

  console.log('🔐 [BS Pay] Obtendo novo token de acesso...');

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
    console.error('❌ [BS Pay] Erro na autenticação:', data);
    throw new Error(data.message || data.error || 'Erro ao obter token BS Pay');
  }

  // Guardar em cache (com margem de 5 minutos)
  bspayToken = data.access_token;
  bspayTokenExpiresAt = Date.now() + ((data.expires_in - 300) * 1000);

  console.log('✅ [BS Pay] Token obtido com sucesso');
  return bspayToken;
}

/**
 * POST /api/pix/create
 * Criar cobrança PIX via BS Pay
 */
router.post('/create', async (req, res) => {
  try {
    const {
      amount,
      customerName,
      customerDocument,
      customerEmail,
      externalId,
      description,
      postbackUrl,
      clientId,
      clientSecret,
      bearerToken
    } = req.body;

    console.log('🔵 [BS Pay] Criando cobrança PIX...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerName);

    // Validar valor
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Valor inválido. Deve ser entre R$0,01 e R$100.000'
      });
    }

    // Obter token de acesso
    let accessToken;
    if (bearerToken) {
      accessToken = bearerToken;
      console.log('🔑 Usando bearer token fornecido');
    } else if (clientId && clientSecret) {
      accessToken = await getBSPayToken(clientId, clientSecret);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Credenciais BSPay não fornecidas (clientId/clientSecret ou bearerToken)'
      });
    }

    // Montar payload conforme documentação BS Pay
    const payload = {
      amount: parsedAmount,
      external_id: externalId || `pedido_${Date.now()}`,
      postbackUrl: postbackUrl || '',
      payerQuestion: description || `Pagamento Pedido #${externalId || Date.now()}`,
      payer: {
        name: customerName || 'Cliente',
        document: customerDocument?.replace(/\D/g, '') || '',
        email: customerEmail || ''
      }
    };

    console.log('📤 [BS Pay] Payload:', JSON.stringify(payload, null, 2));

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
    console.log('📥 [BS Pay] Resposta:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [BS Pay] Erro:', data);

      // Se erro de autenticação, limpar cache
      if (response.status === 401) {
        bspayToken = null;
        bspayTokenExpiresAt = null;
      }

      return res.status(response.status).json({
        success: false,
        error: data.message || data.error || 'Erro ao criar cobrança BS Pay',
        details: data
      });
    }

    // Calcular expiração
    const expirationSeconds = data.calendar?.expiration || 3600;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();

    // Gerar imagem QR Code base64 a partir do código PIX
    let imagemQrcode = null;
    if (data.qrcode) {
      try {
        const QRCode = require('qrcode');
        imagemQrcode = await QRCode.toDataURL(data.qrcode, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        console.log('✅ [BS Pay] QR Code gerado com sucesso');
      } catch (qrError) {
        console.warn('⚠️ [BS Pay] Erro ao gerar QR Code:', qrError.message);
      }
    }

    res.json({
      success: true,
      txid: data.transactionId,
      transactionId: data.transactionId,
      external_id: data.external_id,
      status: data.status,
      amount: data.amount,
      pixCopiaECola: data.qrcode,
      qrcode: data.qrcode,
      imagemQrcode: imagemQrcode,
      expiresAt: expiresAt,
      debtor: data.debtor,
      calendar: data.calendar,
      raw: data
    });

  } catch (error) {
    console.error('❌ [BS Pay] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao criar cobrança BS Pay'
    });
  }
});

/**
 * POST /api/pix/status
 * Verificar status do pagamento BS Pay
 */
router.post('/status', async (req, res) => {
  try {
    const { transactionId, clientId, clientSecret, bearerToken } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    console.log('🔍 [BS Pay] Consultando status:', transactionId);

    // Obter token
    let accessToken;
    if (bearerToken) {
      accessToken = bearerToken;
    } else if (clientId && clientSecret) {
      accessToken = await getBSPayToken(clientId, clientSecret);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Credenciais não fornecidas'
      });
    }

    // Consultar status
    const response = await fetch(`https://api.bspay.co/v2/pix/qrcode/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Erro ao consultar status'
      });
    }

    // Mapear status BS Pay para formato esperado
    let mappedStatus = data.status;
    if (data.status === 'PAID' || data.status === 'paid') {
      mappedStatus = 'CONCLUIDA';
    }

    res.json({
      success: true,
      txid: data.transactionId,
      transactionId: data.transactionId,
      status: mappedStatus,
      originalStatus: data.status,
      amount: data.amount,
      paidAt: data.paidAt || null,
      raw: data
    });

  } catch (error) {
    console.error('❌ [BS Pay] Erro ao consultar status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao consultar status'
    });
  }
});

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
