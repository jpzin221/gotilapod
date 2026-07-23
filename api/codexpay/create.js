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

let cachedToken = null;
let tokenExpiry = null;

async function getAuthToken(clientId, clientSecret) {
  const now = Date.now();
  if (cachedToken && tokenExpiry && (tokenExpiry - now) > 300000) {
    return cachedToken;
  }

  const response = await fetch('https://api.codexpay.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
  });

  const data = await response.json();
  if (!response.ok || !data.token) throw new Error(data.message || 'Falha na autenticação CodexPay');

  cachedToken = data.token;
  tokenExpiry = now + (55 * 60 * 1000);
  return cachedToken;
}

export default async function handler(req, res) {
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
    const { amount, customerName, customerDocument, customerEmail, externalId } = req.body;

    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ success: false, error: 'Valor inválido' });
    }
    // Converter reais para centavos (API espera centavos: 10000 = R$ 100,00)
    parsedAmount = Math.round(parsedAmount * 100);

    // Fallback hardcoded para garantir funcionamento mesmo sem env vars ou banco
    const FALLBACK_CLIENT_ID = 'odairschneider_N5T1EY9Z';
    const FALLBACK_CLIENT_SECRET = 'HR2pWFVxgUFGXV1Y72xpG7TPF88IeyAyksUqEQIbq8adMCma9OaIM6tbLx8lO70pJUYp9WVXTFNnibXygfQrWDyzN40qWbSkuBbY';

    let clientId = process.env.CODEXPAY_CLIENT_ID || FALLBACK_CLIENT_ID;
    let clientSecret = process.env.CODEXPAY_CLIENT_SECRET || FALLBACK_CLIENT_SECRET;
    let webhookUrl = process.env.CODEXPAY_CALLBACK_URL;

    if (!clientId || !clientSecret) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: gateways } = await supabase
          .from('payment_gateways')
          .select('client_id, client_secret, callback_url')
          .eq('provider', 'codexpay')
          .eq('is_active', true)
          .limit(1);
        if (gateways && gateways.length > 0) {
          clientId = gateways[0].client_id || clientId;
          clientSecret = gateways[0].client_secret || clientSecret;
          webhookUrl = gateways[0].callback_url || webhookUrl;
        }
      }
    }

    if (!clientId || !clientSecret) {
      return res.status(400).json({ success: false, error: 'Credenciais CodexPay não configuradas' });
    }

    const authToken = await getAuthToken(clientId, clientSecret);
    const safeCustomerName = sanitize(customerName);
    const externalReference = externalId || `PEDIDO-${Date.now()}`;
    const cleanDocument = customerDocument?.replace(/\D/g, '') || '';

    const payload = {
      amount: parsedAmount,
      external_id: externalReference,
      clientCallbackUrl: webhookUrl || `${origin}/api/codexpay/webhook`,
      payer: {
        name: safeCustomerName || 'Cliente',
        email: customerEmail || 'cliente@gorilapod.com.br',
        document: cleanDocument
      }
    };

    const response = await fetch('https://api.codexpay.app/api/payments/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Erro ao gerar PIX', details: data });
    }

    const qrCodeResponse = data.qrCodeResponse || data;
    if (!qrCodeResponse.qrcode) {
      return res.status(500).json({ success: false, error: 'QR Code não retornado' });
    }

    let qrCodeBase64 = '';
    try {
      const QRCode = (await import('qrcode')).default;
      qrCodeBase64 = await QRCode.toDataURL(qrCodeResponse.qrcode, {
        width: 300, margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (e) {
      console.warn('QR Code image generation failed');
    }

    return res.status(200).json({
      success: true,
      txid: qrCodeResponse.transactionId,
      transactionId: qrCodeResponse.transactionId,
      externalReference,
      status: qrCodeResponse.status || 'PENDING',
      amount: parsedAmount,
      pixCopiaECola: qrCodeResponse.qrcode,
      qrcode: qrCodeResponse.qrcode,
      imagemQrcode: qrCodeBase64,
      provider: 'codexpay',
      raw: data
    });
  } catch (error) {
    console.error('CodexPay create error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao gerar PIX' });
  }
}
