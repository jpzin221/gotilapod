const Gerencianet = require('gn-api-sdk-node');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

class EfiService {
  constructor() {
    // Verificar se certificado existe
    const certPath = path.resolve(__dirname, '..', process.env.EFI_CERTIFICATE_PATH || './certs/certificado-efi.p12');
    
    if (!fs.existsSync(certPath)) {
      console.warn('⚠️  AVISO: Certificado EFI não encontrado em:', certPath);
      console.warn('⚠️  Baixe o certificado .p12 da EFI e coloque na pasta certs/');
      this.mockMode = true;
      return;
    }

    this.options = {
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      certificate: certPath,
      sandbox: process.env.EFI_SANDBOX === 'true'
    };

    try {
      this.efi = new Gerencianet(this.options);
      this.mockMode = false;
      console.log('✅ EfiService inicializado com SDK REAL');
      console.log(`📍 Modo: ${this.options.sandbox ? 'SANDBOX' : 'PRODUÇÃO'}`);
    } catch (error) {
      console.error('❌ Erro ao inicializar EfiService:', error.message);
      this.mockMode = true;
    }
  }

  /**
   * Criar cobrança PIX imediata
   * @param {number} valorTotal - Valor total da cobrança
   * @param {string} nomeCliente - Nome do cliente
   * @param {string} cpfCliente - CPF do cliente
   * @param {array} itens - Lista de itens do pedido
   * @returns {object} - Dados do PIX
   */
  async createPixCharge(valorTotal, nomeCliente, cpfCliente, itens) {
    // Modo mock se não tiver certificado
    if (this.mockMode) {
      console.log('📤 [DEMO] Criando cobrança PIX...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pixCode = '00020126580014br.gov.bcb.pix0136DEMO-QR-CODE-STRING-12345';
      
      // Gerar QR Code real como imagem base64
      const qrCodeImage = await QRCode.toDataURL(pixCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Remover o prefixo "data:image/png;base64," para retornar apenas o base64
      const base64Image = qrCodeImage.replace(/^data:image\/png;base64,/, '');
      
      console.log('✅ [DEMO] QR Code gerado com sucesso');
      
      return {
        success: true,
        txid: `DEMO${Date.now()}`,
        qrcode: pixCode,
        imagemQrcode: base64Image,
        pixCopiaECola: pixCode
      };
    }

    const body = {
      calendario: {
        expiracao: 3600 // 1 hora para pagar
      },
      devedor: {
        cpf: cpfCliente.replace(/\D/g, ''),
        nome: nomeCliente
      },
      valor: {
        original: parseFloat(valorTotal).toFixed(2)
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

    try {
      console.log('📤 Criando cobrança PIX REAL...');
      console.log('💰 Valor:', valorTotal);
      console.log('👤 Cliente:', nomeCliente);

      const chargeResponse = await this.efi.pixCreateImmediateCharge([], body);
      const txid = chargeResponse.txid;
      const locId = chargeResponse.loc.id;

      console.log('✅ Cobrança criada:', txid);

      const qrCodeResponse = await this.efi.pixGenerateQRCode({ id: locId });

      console.log('✅ QR Code gerado');

      return {
        success: true,
        txid,
        locId,
        qrcode: qrCodeResponse.qrcode,
        imagemQrcode: qrCodeResponse.imagemQrcode,
        pixCopiaECola: qrCodeResponse.qrcode
      };
    } catch (error) {
      console.error('❌ Erro ao criar cobrança PIX:', error);
      throw {
        error: 'Erro ao criar cobrança PIX',
        message: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Verificar status do pagamento
   * @param {string} txid - ID da transação
   * @returns {object} - Status do pagamento
   */
  async checkPaymentStatus(txid) {
    if (this.mockMode) {
      console.log('🔍 [DEMO] Verificando status:', txid);
      return {
        success: true,
        txid,
        status: 'ATIVA',
        valor: { original: '85.00' }
      };
    }

    try {
      console.log('🔍 Verificando status do pagamento:', txid);
      
      const response = await this.efi.pixDetailCharge({ txid });
      
      console.log('📊 Status:', response.status);
      
      return {
        success: true,
        txid: response.txid,
        status: response.status,
        valor: response.valor,
        horario: response.horario,
        pix: response.pix || []
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw {
        error: 'Erro ao verificar status do pagamento',
        message: error.message
      };
    }
  }

  /**
   * Configurar webhook na EFI
   * @param {string} chave - Chave PIX
   * @param {string} webhookUrl - URL do webhook
   */
  async configureWebhook(chave, webhookUrl) {
    if (this.mockMode) {
      console.log('🔗 [DEMO] Webhook configurado');
      return { success: true, message: 'Webhook configurado (DEMO)' };
    }

    try {
      console.log('🔗 Configurando webhook...');
      console.log('🔑 Chave:', chave);
      console.log('🌐 URL:', webhookUrl);

      const response = await this.efi.pixConfigWebhook(
        { chave },
        { webhookUrl }
      );

      console.log('✅ Webhook configurado');
      return response;
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
      throw error;
    }
  }
}

module.exports = new EfiService();
