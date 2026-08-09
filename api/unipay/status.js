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

function generateAuthToken(secretKey) {
  const tokenString = `x:${secretKey}`;
  return Buffer.from(tokenString).toString('base64');
}

async function getUniPayCredentials() {
  let secretKey = process.env.UNIPAY_SECRET_KEY || null;

  if (!secretKey) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: gateways } = await supabase
        .from('payment_gateways')
        .select('client_secret')
        .eq('provider', 'unipay')
        .eq('is_active', true)
        .limit(1);
      if (gateways && gateways.length > 0) {
        secretKey = gateways[0].client_secret || secretKey;
      }
    }
  }

  return { secretKey };
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
      return res.status(400).json({ success: false, error: 'transactionId ou externalReference obrigatorio' });
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
          status: 'PAID',
          transactionId,
          externalReference,
          pago: true,
          pedido: { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: pedido.status }
        });
      }

      if (transactionId) {
        try {
          const { secretKey } = await getUniPayCredentials();
          if (secretKey) {
            const authToken = generateAuthToken(secretKey);
            const response = await fetch(`https://api.fastsoftbrasil.com/api/user/transactions/${transactionId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`
              }
            });

            if (response.ok) {
              const uniPayData = await response.json();
              const paymentStatus = uniPayData.status?.toUpperCase();

              if (paymentStatus === 'PAID' || paymentStatus === 'AUTHORIZED') {
                if (pedido && !pedido.pago) {
                  await updatePedidoStatus(supabase, pedido.id);
                }

                return res.status(200).json({
                  success: true,
                  status: 'PAID',
                  transactionId,
                  externalReference,
                  pago: true,
                  pedido: pedido ? { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: 'confirmado' } : null,
                  source: 'unipay_api'
                });
              }

              if (paymentStatus === 'REFUSED' || paymentStatus === 'CANCELED') {
                return res.status(200).json({
                  success: true,
                  status: paymentStatus,
                  transactionId,
                  externalReference,
                  pago: false,
                  message: 'Pagamento nao realizado ou cancelado'
                });
              }
            }
          }
        } catch (apiError) {
          console.warn('UniPay API status check failed, falling back to Supabase:', apiError.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      status: 'WAITING_PAYMENT',
      transactionId,
      externalReference,
      message: 'Aguardando confirmacao de pagamento'
    });
  } catch (error) {
    console.error('UniPay status error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
