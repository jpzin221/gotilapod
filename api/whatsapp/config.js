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

      // Mascarar chave por seguranca
      const config = data ? { ...data } : null;
      if (config?.api_key) {
        config.api_key = config.api_key.substring(0, 8) + '...' + config.api_key.substring(config.api_key.length - 4);
      }

      return res.status(200).json({ success: true, config: data });
    }

    if (req.method === 'POST') {
      const { api_provider, api_url, api_key, instance_name, phone_number, is_active,
              reminder_delay_minutes, max_reminders, welcome_message, followup_message } = req.body;

      // Buscar config existente
      const { data: existing } = await supabase
        .from('whatsapp_config')
        .select('id')
        .limit(1)
        .single();

      const updateData = {
        api_provider, api_url, api_key, instance_name, phone_number, is_active,
        reminder_delay_minutes, max_reminders, welcome_message, followup_message,
        updated_at: new Date().toISOString()
      };

      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      if (existing) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert(updateData);
        if (error) throw error;
      }

      return res.status(200).json({ success: true, message: 'Configuracao salva' });
    }
  } catch (error) {
    console.error('WhatsApp config error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
