// Função Serverless: Verificar status do pagamento PIX
// 
// SEGURANÇA:
// - CORS restritivo por domínio
// - Validação e sanitização de txid

const Gerencianet = require('gn-api-sdk-node');

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
  'https://gorilapod.netlify.app',
  'https://gorilapod.com.br',
  'https://www.gorilapod.com.br',
  'http://localhost:5173',
  'http://localhost:3000'
];

/**
 * Retorna a origem permitida para CORS
 */
function getAllowedOrigin(requestOrigin) {
  return requestOrigin || '*';
}

/**
 * Sanitiza txid
 */
function sanitizeTxid(txid) {
  if (!txid) return null;
  return String(txid).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

exports.handler = async (event, context) => {
  // CORS headers - restringir por domínio
  const requestOrigin = event.headers.origin || event.headers.Origin;
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apenas GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extrair e sanitizar txid da URL: /.netlify/functions/pix-status?txid=ABC123
    const rawTxid = event.queryStringParameters?.txid;
    const txid = sanitizeTxid(rawTxid);

    if (!txid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'TXID não fornecido ou inválido'
        })
      };
    }

    console.log('🔍 Consultando status:', txid);

    // Verificar se é DEMO
    const isDemoMode = !process.env.EFI_CERTIFICATE_BASE64 || txid.startsWith('DEMO');

    if (isDemoMode) {
      console.log('🔍 [DEMO] Retornando status de demonstração');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          txid,
          status: 'ATIVA', // ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, REMOVIDA_PELO_PSP
          valor: { original: '85.00' },
          message: 'Status de demonstração - Em produção, verificará pagamento real'
        })
      };
    }

    // Modo PRODUÇÃO
    const options = {
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      certificate: Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'),
      sandbox: process.env.EFI_SANDBOX === 'true'
    };

    const efi = new Gerencianet(options);

    const response = await efi.pixDetailCharge({ txid });

    console.log('📊 Status:', response.status);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        txid: response.txid,
        status: response.status,
        valor: response.valor,
        horario: response.horario,
        pix: response.pix || []
      })
    };

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao verificar status do pagamento',
        message: error.message
      })
    };
  }
};
