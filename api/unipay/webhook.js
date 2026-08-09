import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') return res.status(200).json({ received: true });

  try {
    const body = req.body || {};
    const { type, data } = body;

    if (type !== 'transaction') return res.status(200).json({ received: true });

    const transactionData = data || {};
    const transactionId = transactionData.id;
    const status = transactionData.status?.toUpperCase();
    const amount = transactionData.amount;

    if (!transactionId) return res.status(200).json({ received: true, message: 'Missing transaction id' });
    if (status !== 'PAID') return res.status(200).json({ received: true, message: `Status ${status}, ignoring` });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ received: true, message: 'Supabase not configured' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: pedido, error: fetchError } = await supabase
      .from('pedidos').select('*').eq('txid', transactionId).single();

    if (fetchError || !pedido) return res.status(200).json({ received: true, message: 'Order not found' });
    if (pedido.pago || pedido.status === 'confirmado') return res.status(200).json({ received: true, message: 'Already paid' });

    if (amount && Math.abs(parseFloat(pedido.valor_total) * 100 - parseFloat(amount)) > 1) {
      return res.status(200).json({ received: true, message: 'Amount mismatch' });
    }

    await supabase.from('pedidos').update({
      pago: true,
      status: 'confirmado',
      pago_em: new Date().toISOString(),
      webhook_received_at: new Date().toISOString()
    }).eq('id', pedido.id);

    await supabase.from('pedido_status_history').insert({
      pedido_id: pedido.id,
      status: 'confirmado',
      observacao: 'Pagamento confirmado via webhook UniPay'
    });

    return res.status(200).json({ received: true, message: 'Payment confirmed', orderId: pedido.id });
  } catch (error) {
    console.error('UniPay webhook error:', error);
    return res.status(200).json({ received: true, message: 'Error processing' });
  }
}
