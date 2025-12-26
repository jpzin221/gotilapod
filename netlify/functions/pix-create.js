// Função Serverless: Criar cobrança PIX
// Mantém as credenciais EFI seguras no backend
//
// SEGURANÇA:
// - CORS restritivo por domínio
// - Validação de CPF
// - Sanitização de inputs

const Gerencianet = require('gn-api-sdk-node');
const QRCode = require('qrcode');

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
 * Sanitiza string para prevenir XSS
 */
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 200);
}

/**
 * Valida CPF
 */
function isValidCPF(cpf) {
  if (!cpf) return false;
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

exports.handler = async (event, context) => {
  // CORS headers - restringir por domínio
  const requestOrigin = event.headers.origin || event.headers.Origin;
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Corpo da requisição vazio' })
      };
    }

    const { valorTotal, nomeCliente, cpfCliente, itens, pedidoId } = JSON.parse(event.body);

    // Validações de entrada
    const parsedValor = parseFloat(valorTotal);
    if (isNaN(parsedValor) || parsedValor <= 0 || parsedValor > 100000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Valor total inválido. Deve ser entre R$0,01 e R$100.000' })
      };
    }

    // Sanitizar nome
    const safeNomeCliente = sanitize(nomeCliente);
    if (!safeNomeCliente) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Nome do cliente é obrigatório' })
      };
    }

    // Validar CPF (apenas aviso no log, não bloqueia)
    if (cpfCliente && !isValidCPF(cpfCliente)) {
      console.log('⚠️ CPF pode ser inválido:', cpfCliente);
    }

    if (!itens || itens.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Pedido sem itens' })
      };
    }

    console.log('📥 Nova cobrança PIX solicitada');
    console.log('💰 Valor:', parsedValor);
    console.log('👤 Cliente:', safeNomeCliente);

    // Verificar se está em modo DEMO (sem certificado)
    const isDemoMode = !process.env.EFI_CERTIFICATE_BASE64;

    if (isDemoMode) {
      console.log('📤 [DEMO] Gerando cobrança PIX de demonstração...');

      // Gerar PIX de demonstração
      const pixCode = `00020126580014br.gov.bcb.pix0136DEMO-${Date.now()}`;
      const qrCodeImage = await QRCode.toDataURL(pixCode, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      const base64Image = qrCodeImage.replace(/^data:image\/png;base64,/, '');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          txid: `DEMO${Date.now()}`,
          qrcode: pixCode,
          imagemQrcode: base64Image,
          pixCopiaECola: pixCode,
          message: 'Cobrança PIX criada (MODO DEMONSTRAÇÃO)'
        })
      };
    }

    // Modo PRODUÇÃO - Usar EFI real
    const options = {
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      certificate: Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'),
      sandbox: process.env.EFI_SANDBOX === 'true'
    };

    const efi = new Gerencianet(options);

    const body = {
      calendario: {
        expiracao: 3600 // 1 hora
      },
      devedor: {
        cpf: cpfCliente.replace(/\D/g, ''),
        nome: safeNomeCliente
      },
      valor: {
        original: parsedValor.toFixed(2)
      },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: 'Pagamento - POD EXPRESSS',
      infoAdicionais: [
        {
          nome: 'Itens',
          valor: `${itens.length} produto(s)`
        }
      ]
    };

    console.log('📤 Criando cobrança PIX REAL...');

    const chargeResponse = await efi.pixCreateImmediateCharge([], body);
    const txid = chargeResponse.txid;
    const locId = chargeResponse.loc.id;

    console.log('✅ Cobrança criada:', txid);

    const qrCodeResponse = await efi.pixGenerateQRCode({ id: locId });

    console.log('✅ QR Code gerado');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        txid,
        locId,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        pixCopiaECola: qrCodeResponse.qrcode,
        message: 'Cobrança PIX criada com sucesso'
      })
    };

  } catch (error) {
    console.error('❌ Erro ao criar cobrança:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao criar cobrança PIX',
        message: error.message
      })
    };
  }
};
