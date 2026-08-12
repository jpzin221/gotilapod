import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://gorilapod.vercel.app',
  'https://gorilapod.shop',
  'https://www.gorilapod.shop',
  'https://gorilapod.com.br',
  'https://www.gorilapod.com.br',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getAllowedOrigin(origin) {
  if (!origin) return '*';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.includes('localhost')) return origin;
  return '*';
}

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 200);
}

function generateAuthToken(secretKey) {
  const tokenString = `x:${secretKey}`;
  return Buffer.from(tokenString).toString('base64');
}

async function getUniPayCredentials() {
  let secretKey = process.env.UNIPAY_SECRET_KEY || null;
  let postbackUrl = process.env.UNIPAY_POSTBACK_URL || null;

  if (!secretKey) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: gateways } = await supabase
        .from('payment_gateways')
        .select('client_secret, callback_url')
        .eq('provider', 'unipay')
        .eq('is_active', true)
        .limit(1);
      if (gateways && gateways.length > 0) {
        secretKey = gateways[0].client_secret || secretKey;
        postbackUrl = gateways[0].callback_url || postbackUrl;
      }
    }
  }

  return { secretKey, postbackUrl };
}

async function updatePedidoStatus(supabase, pedidoId) {
  await supabase
    .from('pedidos')
    .update({
      pago: true,
      status: 'confirmado',
      updated_at: new Date().toISOString()
    })
    .eq('id', pedidoId);

  await supabase
    .from('pedido_status_history')
    .insert({
      pedido_id: pedidoId,
      status: 'confirmado',
      observacao: 'Pagamento confirmado via status check direto na API UniPay'
    });
}

export async function webhookHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(200).json({ received: true });

  try {
    const body = req.body || {};
    // FastSoft envia { type, objectId, url, data: { id, status, amount, ... } }
    const inner = body.data || body;
    const transactionId = inner.id || body.transaction_id || body.transactionId;
    const status = String(inner.status || body.status || '').toUpperCase();
    const externalReference = inner.metadata?.pedido_id || body.metadata?.pedido_id || inner.externalRef || body.externalReference;

    console.log('💜 [UniPay Webhook] Recebido:', { transactionId, status, externalReference });

    if (!transactionId && !externalReference) {
      return res.status(200).json({ received: true, message: 'Missing transactionId/externalReference' });
    }

    if (status !== 'PAID' && status !== 'AUTHORIZED' && status !== 'COMPLETED') {
      return res.status(200).json({ received: true, message: `Status ${status} - no action` });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ received: true, message: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('pedidos').select('*');
    if (transactionId) query = query.eq('txid', String(transactionId));
    else if (externalReference) query = query.eq('numero_pedido', externalReference);

    const { data: pedido, error: fetchError } = await query.single();

    if (fetchError || !pedido) {
      console.warn('💜 [UniPay Webhook] Pedido nao encontrado:', { transactionId, externalReference });
      return res.status(200).json({ received: true, message: 'Order not found' });
    }

    if (pedido.pago || pedido.status === 'confirmado') {
      return res.status(200).json({ received: true, message: 'Already paid' });
    }

    const valorApi = (inner.amount ?? body.amount) ? parseFloat(inner.amount ?? body.amount) / 100 : null;
    if (valorApi && Math.abs(parseFloat(pedido.valor_total) - valorApi) > 0.01) {
      console.warn('💜 [UniPay Webhook] Valor divergente:', { db: pedido.valor_total, api: valorApi });
      return res.status(200).json({ received: true, message: 'Amount mismatch' });
    }

    const { error: updateError } = await supabase.from('pedidos').update({
      pago: true,
      status: 'confirmado',
      pago_em: new Date().toISOString(),
      webhook_received_at: new Date().toISOString()
    }).eq('id', pedido.id);

    if (updateError) throw updateError;

    try {
      await supabase.from('pedido_status_history').insert([{
        pedido_id: pedido.id,
        status: 'confirmado',
        observacao: 'Pagamento confirmado via webhook UniPay (FastSoft Brasil)'
      }]);
    } catch (histError) {
      console.warn('💜 [UniPay Webhook] Aviso: historico nao salvo:', histError.message);

      try {
        await supabase.from('status_historico').insert([{
          pedido_id: pedido.id,
          status: 'confirmado',
          descricao: 'Pagamento confirmado via webhook UniPay (FastSoft Brasil)',
          created_at: new Date().toISOString()
        }]);
      } catch (altHistError) {
        console.warn('💜 [UniPay Webhook] Aviso: status_historico tambem falhou:', altHistError.message);
      }
    }

    console.log('💜 [UniPay Webhook] Pedido confirmado:', pedido.id);
    return res.status(200).json({ received: true, message: 'Payment confirmed', orderId: pedido.id });
  } catch (error) {
    console.error('❌ [UniPay Webhook] Erro:', error);
    return res.status(200).json({ received: true, message: 'Error processing' });
  }
}

export default async function handler(req, res) {
  const isWebhook = (req.url || '').includes('/unipay/webhook');
  if (isWebhook) {
    return webhookHandler(req, res);
  }

  const origin = req.headers.origin;
  const allowedOrigin = getAllowedOrigin(origin);

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { amount, customerName, customerDocument, customerEmail, customerPhone, customerAddress, externalId } = req.body;

    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ success: false, error: 'Valor invalido' });
    }
    // API UniPay espera centavos
    parsedAmount = Math.round(parsedAmount * 100);

    const { secretKey, postbackUrl } = await getUniPayCredentials();
    if (!secretKey) {
      return res.status(400).json({ success: false, error: 'Credenciais UniPay nao configuradas' });
    }

    const authToken = generateAuthToken(secretKey);
    const safeCustomerName = sanitize(customerName);
    const externalReference = externalId || `PEDIDO-${Date.now()}`;
    const cleanDocument = customerDocument?.replace(/\D/g, '') || '';
    const cleanPhone = customerPhone?.replace(/\D/g, '').replace(/^55/, '') || '';

    const addr = customerAddress || {};
    const shipping = {
      fee: 0,
      address: {
        street: sanitize(addr.endereco) || 'Sem Logradouro',
        streetNumber: sanitize(addr.numero) || 'S/N',
        complement: sanitize(addr.complemento) || '',
        zipCode: (addr.cep || '').replace(/\D/g, '') || '00000000',
        neighborhood: sanitize(addr.bairro) || 'Centro',
        city: sanitize(addr.cidade) || 'Sao Paulo',
        state: (addr.estado || 'SP').toUpperCase().substring(0, 2),
        country: 'br'
      }
    };

    const payload = {
      amount: parsedAmount,
      paymentMethod: 'PIX',
      customer: {
        name: safeCustomerName || 'Cliente',
        email: customerEmail || 'cliente@gorilapod.com.br',
        document: {
          number: cleanDocument,
          type: 'CPF'
        },
        phone: cleanPhone,
        externalRef: externalReference
      },
      shipping,
      items: [
        {
          title: 'Produto Gorila Pod',
          unitPrice: parsedAmount,
          quantity: 1,
          tangible: true,
          externalRef: externalReference
        }
      ],
      traceable: true,
      postbackUrl: postbackUrl || `${origin}/api/unipay/webhook`,
      metadata: {
        pedido_id: externalReference
      },
      pix: {
        expiresInDays: 1
      }
    };

    const response = await fetch('https://api.fastsoftbrasil.com/api/user/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('UniPay API error:', response.status, JSON.stringify(data));
      const errorMsg = data.message || 'Erro ao gerar PIX via UniPay';
      return res.status(response.status).json({ success: false, error: errorMsg, details: data });
    }

    const transactionId = data.id;
    const pixData = data.pix || {};
    const pixCopyPaste = pixData.qrcode || '';

    let qrCodeBase64 = '';
    if (pixCopyPaste) {
      try {
        const QRCode = (await import('qrcode')).default;
        qrCodeBase64 = await QRCode.toDataURL(pixCopyPaste, {
          width: 300, margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
      } catch (e) {
        console.warn('QR Code image generation failed');
      }
    }

    return res.status(200).json({
      success: true,
      txid: transactionId,
      transactionId: transactionId,
      externalReference,
      status: data.status || 'WAITING_PAYMENT',
      amount: parsedAmount,
      pixCopiaECola: pixCopyPaste,
      qrcode: pixCopyPaste,
      imagemQrcode: qrCodeBase64,
      provider: 'unipay',
      raw: data
    });
  } catch (error) {
    console.error('UniPay create error:', error.message || error);
    return res.status(500).json({ success: false, error: 'Erro ao gerar PIX via UniPay' });
  }
}
