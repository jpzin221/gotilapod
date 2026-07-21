import QRCode from 'qrcode';

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 200);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { valorTotal, nomeCliente, cpfCliente, itens } = req.body;
    const parsedValor = parseFloat(valorTotal);
    if (isNaN(parsedValor) || parsedValor <= 0 || parsedValor > 100000) {
      return res.status(400).json({ success: false, error: 'Valor inválido' });
    }

    const safeNome = sanitize(nomeCliente);
    if (!safeNome) return res.status(400).json({ success: false, error: 'Nome obrigatório' });
    if (!itens || itens.length === 0) return res.status(400).json({ success: false, error: 'Pedido sem itens' });

    // Demo mode
    if (!process.env.EFI_CERTIFICATE_BASE64) {
      const pixCode = `00020126580014br.gov.bcb.pix0136DEMO-${Date.now()}`;
      const qr = await QRCode.toDataURL(pixCode, { width: 256, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
      return res.status(200).json({
        success: true, txid: `DEMO${Date.now()}`, qrcode: pixCode,
        imagemQrcode: qr.replace(/^data:image\/png;base64,/, ''), pixCopiaECola: pixCode,
        message: 'Cobrança PIX criada (DEMO)'
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
      solicitacaoPagador: 'Pagamento - POD EXPRESSS'
    };

    const chargeResponse = await efi.pixCreateImmediateCharge([], body);
    const qrCodeResponse = await efi.pixGenerateQRCode({ id: chargeResponse.loc.id });

    return res.status(200).json({
      success: true, txid: chargeResponse.txid, qrcode: qrCodeResponse.qrcode,
      imagemQrcode: qrCodeResponse.imagemQrcode, pixCopiaECola: qrCodeResponse.qrcode
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao criar cobrança', message: error.message });
  }
}
