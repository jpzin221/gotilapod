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
    }

    return res.status(200).json({
      success: true,
      status: 'PENDENTE',
      transactionId,
      externalReference,
      message: 'Aguardando confirmação via webhook'
    });
  } catch (error) {
    console.error('CodexPay status error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
