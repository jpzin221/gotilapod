import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 200);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // GET: Verificar status
    if (req.method === 'GET') {
      const { txid } = req.query;
      if (!txid) return res.status(400).json({ success: false, error: 'txid obrigatorio' });

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: pedido } = await supabase.from('pedidos').select('*').eq('txid', txid).single();

        if (pedido && (pedido.pago || pedido.status === 'confirmado')) {
          return res.status(200).json({
            success: true, status: 'CONCLUIDA', txid, pago: true,
            pedido: { id: pedido.id, numero_pedido: pedido.numero_pedido, valor_total: pedido.valor_total, status: pedido.status }
          });
        }
      }

      return res.status(200).json({ success: true, status: 'PENDENTE', txid, message: 'Aguardando confirmacao' });
    }

    // POST: Criar cobranca
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { valorTotal, nomeCliente, cpfCliente, itens } = req.body;
    const parsedValor = parseFloat(valorTotal);
    if (isNaN(parsedValor) || parsedValor <= 0 || parsedValor > 100000) {
      return res.status(400).json({ success: false, error: 'Valor invalido' });
    }

    const safeNome = sanitize(nomeCliente);
    if (!safeNome) return res.status(400).json({ success: false, error: 'Nome obrigatorio' });
    if (!itens || itens.length === 0) return res.status(400).json({ success: false, error: 'Pedido sem itens' });

    // Demo mode
    if (!process.env.EFI_CERTIFICATE_BASE64) {
      const pixCode = `00020126580014br.gov.bcb.pix0136DEMO-${Date.now()}`;
      const qr = await QRCode.toDataURL(pixCode, { width: 256, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
      return res.status(200).json({
        success: true, txid: `DEMO${Date.now()}`, qrcode: pixCode,
        imagemQrcode: qr.replace(/^data:image\/png;base64,/, ''), pixCopiaECola: pixCode,
        message: 'Cobranca PIX criada (DEMO)'
      });
    }

    // Production with EFI
    const Gerencianet = (await import('gn-api-sdk-node')).default;
    const efi = new Gerencianet({
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      certificate: Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'),
      sandbox: process.env.EFI_SANDBOX === 'true'
    });

    const body = {
      calendario: { expiracao: 3600 },
      devedor: { cpf: cpfCliente?.replace(/\D/g, ''), nome: safeNome },
      valor: { original: parsedValor.toFixed(2) },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: 'Pagamento - POD EXPRESS'
    };

    const chargeResponse = await efi.pixCreateImmediateCharge([], body);
    const qrCodeResponse = await efi.pixGenerateQRCode({ id: chargeResponse.loc.id });

    return res.status(200).json({
      success: true, txid: chargeResponse.txid, qrcode: qrCodeResponse.qrcode,
      imagemQrcode: qrCodeResponse.imagemQrcode, pixCopiaECola: qrCodeResponse.qrcode
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao processar PIX', message: error.message });
  }
}
