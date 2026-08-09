import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(200).json({ ok: true });

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ stats: null });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os carrinhos
    const { data: carts } = await supabase
      .from('abandoned_carts')
      .select('*');

    // Buscar todas as mensagens
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calcular estatisticas
    const stats = {
      total: carts?.length || 0,
      pending: carts?.filter(c => c.status === 'pending').length || 0,
      contacted: carts?.filter(c => c.status === 'contacted').length || 0,
      converted: carts?.filter(c => c.status === 'converted').length || 0,
      expired: carts?.filter(c => c.status === 'expired').length || 0,

      today: carts?.filter(c => new Date(c.created_at) >= today).length || 0,
      last7days: carts?.filter(c => new Date(c.created_at) >= sevenDaysAgo).length || 0,
      last30days: carts?.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length || 0,

      totalRecovered: carts?.filter(c => c.status === 'converted')
        .reduce((sum, c) => sum + (parseFloat(c.cart_total) || 0), 0) || 0,

      messagesSent: messages?.length || 0,
      messagesAuto: messages?.filter(m => m.sent_by === 'auto').length || 0,
      messagesManual: messages?.filter(m => m.sent_by === 'manual').length || 0,

      conversionRate: 0
    };

    if (stats.total > 0) {
      stats.conversionRate = ((stats.converted / stats.total) * 100).toFixed(1);
    }

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(200).json({ stats: null });
  }
}
