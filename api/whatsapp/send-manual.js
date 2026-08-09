import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { cart_id, phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'phone e message obrigatorios' });
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

    // Enviar via Evolution API
    const apiUrl = config.api_url.replace(/\/$/, '');
    const response = await fetch(`${apiUrl}/message/sendText/${config.instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''),
        text: message
      })
    });

    const apiResponse = await response.json();

    // Registrar mensagem
    await supabase.from('whatsapp_messages').insert({
      abandoned_cart_id: cart_id || null,
      phone: phone.replace(/\D/g, ''),
      message,
      status: response.ok ? 'sent' : 'failed',
      api_response: apiResponse,
      sent_by: 'manual'
    });

    // Atualizar tentativas se tem cart_id
    if (cart_id) {
      await supabase.rpc('increment', { table_name: 'abandoned_carts', column_name: 'attempts', row_id: cart_id }).catch(() => {
        // Fallback: update manual
        supabase.from('abandoned_carts').update({
          attempts: supabase.rpc ? undefined : 0,
          last_attempt_at: new Date().toISOString(),
          status: 'contacted',
          updated_at: new Date().toISOString()
        }).eq('id', cart_id);
      });
    }

    return res.status(200).json({
      success: response.ok,
      message: response.ok ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem',
      api_response: apiResponse
    });
  } catch (error) {
    console.error('Send manual WhatsApp error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
