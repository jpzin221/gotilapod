import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(200).json({ ok: true });

  try {
    const { cart_id, limit = 50 } = req.query;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ messages: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(parseInt(limit));

    if (cart_id) {
      query = query.eq('abandoned_cart_id', cart_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ messages: data || [] });
  } catch (error) {
    console.error('History error:', error);
    return res.status(200).json({ messages: [] });
  }
}
