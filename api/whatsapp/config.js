import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase nao configurado' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .order('id')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const config = data ? { ...data } : null;
      if (config?.api_key) {
        config.api_key = config.api_key.substring(0, 8) + '...' + config.api_key.substring(config.api_key.length - 4);
      }

      return res.status(200).json({ success: true, config: data });
    }

    if (req.method === 'POST') {
      const { action, phone, message, cart_id } = req.body;

      // Acao: testar conexao
      if (action === 'test') {
        if (!phone || !message) return res.status(400).json({ success: false, error: 'phone e message obrigatorios' });

        const { data: config } = await supabase.from('whatsapp_config').select('*').eq('is_active', true).single();
        if (!config || !config.api_url || !config.api_key) {
          return res.status(400).json({ success: false, error: 'WhatsApp nao configurado' });
        }

        const formattedPhone = phone.replace(/\D/g, '');
        const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

        const response = await fetch(`https://${config.api_url}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: { 'Authorization': `App ${config.api_key}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ from: config.phone_number || '', to: phoneWithCountryCode, messageId: `test-${Date.now()}`, content: { text: message } })
        });

        const apiResponse = await response.json();
        return res.status(200).json({ success: response.ok, message: response.ok ? 'Mensagem enviada' : 'Erro ao enviar', api_response: apiResponse });
      }

      // Acao: enviar manual
      if (action === 'send-manual') {
        if (!phone || !message) return res.status(400).json({ success: false, error: 'phone e message obrigatorios' });

        const { data: config } = await supabase.from('whatsapp_config').select('*').eq('is_active', true).single();
        if (!config || !config.api_url || !config.api_key) {
          return res.status(400).json({ success: false, error: 'WhatsApp nao configurado' });
        }

        const formattedPhone = phone.replace(/\D/g, '');
        const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

        const response = await fetch(`https://${config.api_url}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: { 'Authorization': `App ${config.api_key}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ from: config.phone_number || '', to: phoneWithCountryCode, messageId: `manual-${Date.now()}`, content: { text: message } })
        });

        const apiResponse = await response.json();

        await supabase.from('whatsapp_messages').insert({
          abandoned_cart_id: cart_id || null, phone: formattedPhone, message,
          status: response.ok ? 'sent' : 'failed', api_response: apiResponse, sent_by: 'manual'
        });

        return res.status(200).json({ success: response.ok, message: response.ok ? 'Mensagem enviada' : 'Erro ao enviar', api_response: apiResponse });
      }

      // Acao: salvar configuracao
      const { api_provider, api_url, api_key, instance_name, phone_number, is_active,
              reminder_delay_minutes, max_reminders, welcome_message, followup_message } = req.body;

      const { data: existing } = await supabase.from('whatsapp_config').select('id').limit(1).single();

      const updateData = {
        api_provider, api_url, api_key, instance_name, phone_number, is_active,
        reminder_delay_minutes, max_reminders, welcome_message, followup_message,
        updated_at: new Date().toISOString()
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      if (existing) {
        const { error } = await supabase.from('whatsapp_config').update(updateData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('whatsapp_config').insert(updateData);
        if (error) throw error;
      }

      return res.status(200).json({ success: true, message: 'Configuracao salva' });
    }
  } catch (error) {
    console.error('WhatsApp config error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
