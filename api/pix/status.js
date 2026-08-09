import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(200).json({ ok: true });

  try {
    const { txid } = req.query;
    if (!txid) return res.status(400).json({ success: false, error: 'txid obrigatorio' });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('*')
        .eq('txid', txid)
        .single();

      if (pedido && (pedido.pago || pedido.status === 'confirmado')) {
        return res.status(200).json({
          success: true,
          status: 'CONCLUIDA',
          txid,
          pago: true,
          pedido: { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: pedido.status }
        });
      }
    }

    return res.status(200).json({
      success: true,
      status: 'PENDENTE',
      txid,
      message: 'Aguardando confirmacao de pagamento'
    });
  } catch (error) {
    console.error('PIX status error:', error);
    return res.status(200).json({ success: true, status: 'PENDENTE', message: 'Erro ao verificar status' });
  }
}
