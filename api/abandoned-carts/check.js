import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ ok: true, message: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // POST: Marcar carrinho como convertido
    if (req.method === 'POST') {
      const { cart_id, pedido_id } = req.body;
      if (!cart_id) return res.status(400).json({ success: false, error: 'cart_id obrigatorio' });

      await supabase
        .from('abandoned_carts')
        .update({ status: 'converted', converted_at: new Date().toISOString(), pedido_id: pedido_id || null, updated_at: new Date().toISOString() })
        .eq('id', cart_id);

      return res.status(200).json({ success: true, message: 'Carrinho marcado como convertido' });
    }

    // GET: Verificar e enviar lembretes
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config || !config.api_url || !config.api_key) {
      return res.status(200).json({ ok: true, message: 'WhatsApp not configured' });
    }

    const delayMinutes = config.reminder_delay_minutes || 30;
    const maxReminders = config.max_reminders || 2;
    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000);

    // Buscar carrinhos pendentes que atingiram o delay
    const { data: carts } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'pending')
      .lt('first_attempt_at', cutoffTime.toISOString())
      .lt('attempts', maxReminders);

    if (!carts || carts.length === 0) {
      return res.status(200).json({ ok: true, message: 'No carts to process', count: 0 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const cart of carts) {
      try {
        // Montar mensagem
        const customerName = cart.customer_name || 'Cliente';
        const storeUrl = process.env.SITE_URL || 'https://www.gorilapodoficial.shop';
        const itemCount = cart.cart_items?.length || 0;
        const total = parseFloat(cart.cart_total) || 0;

        const isFirstAttempt = cart.attempts === 0;
        const template = isFirstAttempt ? config.welcome_message : config.followup_message;

        let message = template
          .replace('{nome}', customerName)
          .replace('{itens}', `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`)
          .replace('{total}', `R$ ${total.toFixed(2)}`)
          .replace('{link}', storeUrl);

        // Enviar via Infobip API
        const apiUrl = config.api_url.replace(/\/$/, '');
        const apiKey = config.api_key;
        const senderNumber = config.phone_number || '';

        const phone = cart.phone.replace(/\D/g, '');
        const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

        const response = await fetch(`https://${apiUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: {
            'Authorization': `App ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            from: senderNumber,
            to: formattedPhone,
            messageId: `abandoned-${cart.id}-${Date.now()}`,
            content: {
              text: message
            }
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
          sent_by: 'auto'
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

        if (response.ok) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Rate limit: 1 msg por segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (sendError) {
        console.error(`Error sending to ${cart.phone}:`, sendError);
        failedCount++;
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Processed ${carts.length} carts`,
      sent: sentCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('Check abandoned carts error:', error);
    return res.status(200).json({ ok: true, error: error.message });
  }
}
