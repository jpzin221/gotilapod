import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 200);
}

async function getDefaultGateway(supabase) {
  const { data, error } = await supabase
    .from('payment_gateways').select('*')
    .eq('is_default', true).eq('is_active', true).single();
  if (error || !data) throw new Error('Nenhuma gateway ativa encontrada');
  return data;
}

async function createCodexPayPIX(gateway, amount, externalId, customerName, customerDocument) {
  const credentials = Buffer.from(`${gateway.client_id}:${gateway.client_secret}`).toString('base64');
  const authResponse = await fetch('https://api.codexpay.app/api/auth/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
  });
  const authData = await authResponse.json();
  if (!authResponse.ok || !authData.access_token) throw new Error('Erro ao autenticar CodexPay');

  const response = await fetch('https://api.codexpay.app/api/payments/deposit', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authData.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: parseFloat(amount), external_id: externalId || `retencao_${Date.now()}`,
      description: 'Taxa de retenção',
      customer: { name: sanitize(customerName) || 'Cliente', document: customerDocument?.replace(/\D/g, '') || '' }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro ao criar PIX');

  let imagemQrcode = null;
  if (data.pix?.copyPaste) imagemQrcode = await QRCode.toDataURL(data.pix.copyPaste, { width: 256, margin: 2 });

  return {
    txid: data.id || data.transactionId, transactionId: data.id || data.transactionId,
    pixCopiaECola: data.pix?.copyPaste || '', imagemQrcode, status: 'ATIVA',
    expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
  };
}

async function createUniPayPIX(gateway, amount, externalId, customerName, customerDocument) {
  const secretKey = gateway.client_secret;
  if (!secretKey) throw new Error('Secret Key UniPay nao configurada');

  const authToken = Buffer.from(`x:${secretKey}`).toString('base64');
  const parsedAmount = Math.round(parseFloat(amount) * 100);

  const response = await fetch('https://api.fastsoftbrasil.com/api/user/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: parsedAmount,
      paymentMethod: 'PIX',
      customer: {
        name: sanitize(customerName) || 'Cliente',
        email: 'retencao@gorilapod.com.br',
        document: {
          number: customerDocument?.replace(/\D/g, '') || '',
          type: 'CPF'
        }
      },
      items: [{
        title: 'Taxa de retencao',
        unitPrice: parsedAmount,
        quantity: 1,
        tangible: true
      }],
      traceable: true,
      postbackUrl: gateway.callback_url || `${process.env.SITE_URL || 'https://gorilapod.shop'}/api/unipay/webhook`,
      metadata: { pedido_id: externalId || `retencao_${Date.now()}` },
      pix: { expiresInDays: 1 }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro ao criar PIX via UniPay');

  const pixCopyPaste = data.pix?.qrcode || '';
  let imagemQrcode = null;
  if (pixCopyPaste) imagemQrcode = await QRCode.toDataURL(pixCopyPaste, { width: 256, margin: 2 });

  return {
    txid: data.id, transactionId: data.id,
    pixCopiaECola: pixCopyPaste, imagemQrcode, status: 'WAITING_PAYMENT',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { action, amount, externalId, customerName, customerDocument, transactionId } = req.body;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const gateway = await getDefaultGateway(supabase);

    if (action === 'create') {
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ success: false, error: 'Valor inválido' });
      let result;
      if (gateway.provider === 'codexpay') {
        result = await createCodexPayPIX(gateway, amount, externalId, customerName, customerDocument);
      } else if (gateway.provider === 'unipay') {
        result = await createUniPayPIX(gateway, amount, externalId, customerName, customerDocument);
      } else {
        throw new Error(`Gateway "${gateway.provider}" nao suportada`);
      }
      return res.status(200).json({ success: true, ...result, provider: gateway.provider });
    }

    return res.status(400).json({ success: false, error: 'Ação inválida. Use "create".' });
  } catch (error) {
    console.error('Retention pay error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
