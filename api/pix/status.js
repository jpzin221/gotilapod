export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const txid = req.query.txid?.replace(/[^a-zA-Z-9_-]/g, '').substring(0, 100);
    if (!txid) return res.status(400).json({ success: false, error: 'TXID não fornecido' });

    // Demo mode
    if (!process.env.EFI_CERTIFICATE_BASE64 || txid.startsWith('DEMO')) {
      return res.status(200).json({
        success: true, txid, status: 'ATIVA', valor: { original: '85.00' },
        message: 'Status de demonstração'
      });
    }

    const Gerencianet = (await import('gn-api-sdk-node')).default;
    const efi = new Gerencianet({
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      certificate: Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'),
      sandbox: process.env.EFI_SANDBOX === 'true'
    });

    const response = await efi.pixDetailCharge({ txid });
    return res.status(200).json({
      success: true, txid: response.txid, status: response.status,
      valor: response.valor, horario: response.horario, pix: response.pix || []
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao verificar status', message: error.message });
  }
}
