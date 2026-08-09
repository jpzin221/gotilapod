import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const { cart_id, pedido_id } = req.body;
    if (!cart_id) {
      return res.status(400).json({ success: false, error: 'cart_id obrigatorio' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase nao configurado' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Marcar como convertido
    const { error } = await supabase
      .from('abandoned_carts')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        pedido_id: pedido_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Carrinho marcado como convertido'
    });
  } catch (error) {
    console.error('Convert cart error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
