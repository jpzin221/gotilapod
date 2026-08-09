import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const { cart_id } = req.body;
    if (!cart_id) {
      return res.status(400).json({ success: false, error: 'cart_id obrigatorio' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase nao configurado' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuracao
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config || !config.api_url || !config.api_key) {
      return res.status(400).json({ success: false, error: 'WhatsApp nao configurado' });
    }

    // Buscar carrinho
    const { data: cart } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('id', cart_id)
      .single();

    if (!cart) {
      return res.status(404).json({ success: false, error: 'Carrinho nao encontrado' });
    }

    // Montar mensagem
    const customerName = cart.customer_name || 'Cliente';
    const itemCount = cart.cart_items?.length || 0;
    const total = parseFloat(cart.cart_total) || 0;
    const message = config.welcome_message
      .replace('{nome}', customerName)
      .replace('{itens}', `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`)
      .replace('{total}', `R$ ${total.toFixed(2)}`);

    // Enviar via Evolution API
    const apiUrl = config.api_url.replace(/\/$/, '');
    const response = await fetch(`${apiUrl}/message/sendText/${config.instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: cart.phone,
        text: message
      })
    });

    const apiResponse = await response.json();

    // Registrar mensagem
    await supabase.from('whatsapp_messages').insert({
      abandoned_cart_id: cart.id,
      phone: cart.phone,
      message,
      status: response.ok ? 'sent' : 'failed',
      api_response: apiResponse,
      sent_by: 'manual'
    });

    // Atualizar carrinho
    await supabase
      .from('abandoned_carts')
      .update({
        attempts: cart.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        status: 'contacted',
        updated_at: new Date().toISOString()
      })
      .eq('id', cart.id);

    return res.status(200).json({
      success: true,
      message: response.ok ? 'Mensagem enviada' : 'Erro ao enviar',
      api_response: apiResponse
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
