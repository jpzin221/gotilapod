import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://gorilapod.vercel.app',
  'https://gorilapod.shop',
  'https://www.gorilapod.shop',
  'https://www.gorilapodoficial.shop',
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
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(origin));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { session_id, phone, customer_name, cart_items, cart_total, shipping_address } = req.body;

    if (!session_id || !phone) {
      return res.status(400).json({ success: false, error: 'session_id e phone obrigatorios' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase nao configurado' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se ja existe registro para esta sessao
    const { data: existing } = await supabase
      .from('abandoned_carts')
      .select('id, status')
      .eq('session_id', session_id)
      .single();

    if (existing) {
      // Atualizar registro existente
      const { error } = await supabase
        .from('abandoned_carts')
        .update({
          phone,
          customer_name,
          cart_items,
          cart_total,
          shipping_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Carrinho atualizado',
        cart_id: existing.id
      });
    }

    // Criar novo registro
    const { data, error } = await supabase
      .from('abandoned_carts')
      .insert({
        session_id,
        phone: phone.replace(/\D/g, ''),
        customer_name,
        cart_items,
        cart_total,
        shipping_address,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Carrinho registrado para acompanhamento',
      cart_id: data.id
    });
  } catch (error) {
    console.error('Track abandoned cart error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
