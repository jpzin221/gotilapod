import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { phone, message } = req.body;
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
      return res.status(400).json({ success: false, error: 'WhatsApp nao configurado. Configure em Admin > Carrinhos > Configuracao.' });
    }

    // Enviar via Infobip API
    const apiUrl = config.api_url.replace(/\/$/, '');
    const apiKey = config.api_key;
    const senderNumber = config.phone_number || '';

    const formattedPhone = phone.replace(/\D/g, '');
    const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    const response = await fetch(`https://${apiUrl}/whatsapp/1/message/text`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from: senderNumber,
        to: phoneWithCountryCode,
        messageId: `test-${Date.now()}`,
        content: {
          text: message
        }
      })
    });

    const apiResponse = await response.json();

    return res.status(200).json({
      success: response.ok,
      message: response.ok ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem',
      api_response: apiResponse
    });
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
