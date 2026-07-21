import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase não configurado');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('products')
      .select('*, flavors:product_flavors(flavor:flavors(*))')
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ success: true, products: data, count: data?.length || 0 });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao carregar produtos', message: error.message });
  }
}
