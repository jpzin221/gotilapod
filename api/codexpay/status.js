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

async function getCodexPayCredentials() {
  const FALLBACK_CLIENT_ID = 'odairschneider_N5T1EY9Z';
  const FALLBACK_CLIENT_SECRET = 'HR2pWFVxgUFGXV1Y72xpG7TPF88IeyAyksUqEQIbq8adMCma9OaIM6tbLx8lO70pJUYp9WVXTFNnibXygfQrWDyzN40qWbSkuBbY';

  let clientId = process.env.CODEXPAY_CLIENT_ID || FALLBACK_CLIENT_ID;
  let clientSecret = process.env.CODEXPAY_CLIENT_SECRET || FALLBACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: gateways } = await supabase
        .from('payment_gateways')
        .select('client_id, client_secret')
        .eq('provider', 'codexpay')
        .eq('is_active', true)
        .limit(1);
      if (gateways && gateways.length > 0) {
        clientId = gateways[0].client_id || clientId;
        clientSecret = gateways[0].client_secret || clientSecret;
      }
    }
  }

  return { clientId, clientSecret };
}

async function checkCodexPayApiStatus(transactionId, authToken) {
  const response = await fetch(`https://api.codexpay.app/api/payments/${transactionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `CodexPay API returned ${response.status}`);
  }

  return await response.json();
}

async function updatePedidoStatus(supabase, pedidoId, statusData) {
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
      observacao: 'Pagamento confirmado via status check direto na API CodexPay'
    });
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
    const { transactionId, externalReference } = req.body;
    if (!transactionId && !externalReference) {
      return res.status(400).json({ success: false, error: 'transactionId ou externalReference obrigatório' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase.from('pedidos').select('*');
      if (transactionId) query = query.eq('txid', transactionId);
      else if (externalReference) query = query.eq('numero_pedido', externalReference);

      const { data: pedido, error } = await query.single();

      if (pedido && !error && (pedido.pago || pedido.status === 'confirmado' || pedido.status === 'pago')) {
        return res.status(200).json({
          success: true,
          status: 'CONCLUIDA',
          transactionId,
          externalReference,
          pago: true,
          pedido: { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: pedido.status }
        });
      }

      if (transactionId) {
        try {
          const { clientId, clientSecret } = await getCodexPayCredentials();
          const authToken = await getAuthToken(clientId, clientSecret);
          const codexResponse = await checkCodexPayApiStatus(transactionId, authToken);
          const paymentStatus = codexResponse.status?.toUpperCase();

          if (paymentStatus === 'CONCLUIDA' || paymentStatus === 'PAID' || paymentStatus === 'APPROVED') {
            if (pedido && !pedido.pago) {
              await updatePedidoStatus(supabase, pedido.id, codexResponse);
            }

            return res.status(200).json({
              success: true,
              status: 'CONCLUIDA',
              transactionId,
              externalReference,
              pago: true,
              pedido: pedido ? { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: 'confirmado' } : null,
              source: 'codexpay_api'
            });
          }

          if (paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
            return res.status(200).json({
              success: true,
              status: paymentStatus,
              transactionId,
              externalReference,
              pago: false,
              message: 'Pagamento não realizado ou expirado'
            });
          }
        } catch (apiError) {
          console.warn('CodexPay API status check failed, falling back to Supabase:', apiError.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      status: 'PENDENTE',
      transactionId,
      externalReference,
      message: 'Aguardando confirmação de pagamento'
    });
  } catch (error) {
    console.error('CodexPay status error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
