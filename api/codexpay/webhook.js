import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(200).json({ received: true });

  try {
    const { transaction_id, status, amount, type } = req.body || {};
    if (!transaction_id) return res.status(200).json({ received: true, message: 'Missing transaction_id' });
    if (type !== 'Deposit' || status !== 'COMPLETED') return res.status(200).json({ received: true });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ received: true, message: 'Supabase not configured' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: pedido, error: fetchError } = await supabase
      .from('pedidos').select('*').eq('txid', transaction_id).single();

    if (fetchError || !pedido) return res.status(200).json({ received: true, message: 'Order not found' });
    if (pedido.pago || pedido.status === 'confirmado') return res.status(200).json({ received: true, message: 'Already paid' });

    if (amount && Math.abs(parseFloat(pedido.valor_total) - parseFloat(amount)) > 0.01) {
      return res.status(200).json({ received: true, message: 'Amount mismatch' });
    }

    await supabase.from('pedidos').update({
      pago: true,
      status: 'confirmado',
      pago_em: new Date().toISOString(),
      webhook_received_at: new Date().toISOString()
    }).eq('id', pedido.id);

    return res.status(200).json({ received: true, message: 'Payment confirmed', orderId: pedido.id });
  } catch (error) {
    console.error('CodexPay webhook error:', error);
    return res.status(200).json({ received: true, message: 'Error processing' });
  }
}
