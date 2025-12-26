/**
 * Servidor Express local para APIs de PIX
 * Substitui as Netlify Functions para desenvolvimento e VPS
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache do token BSPay
let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Obtém o token de acesso via OAuth
 */
async function getAccessToken(clientId, clientSecret) {
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        console.log('🟢 Usando token em cache');
        return cachedToken;
    }

    console.log('🔐 Obtendo novo token de acesso...');

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.bspay.co/v2/oauth/token', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`
        }
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        console.error('❌ Erro na autenticação:', data);
        throw new Error(data.message || data.error || 'Erro ao obter token de acesso');
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + ((data.expires_in - 300) * 1000);

    console.log('✅ Token obtido com sucesso, expira em', data.expires_in, 'segundos');
    return data.access_token;
}

// ================================
// ROTA: Criar cobrança PIX
// ================================
app.post('/api/pix/create', async (req, res) => {
    try {
        const {
            amount,
            customerName,
            customerDocument,
            customerEmail,
            externalId,
            description,
            postbackUrl,
            clientId,
            clientSecret,
            bearerToken
        } = req.body;

        console.log('🔵 [BS Pay] Criando cobrança PIX...');
        console.log('💰 Valor:', amount);
        console.log('👤 Cliente:', customerName);
        console.log('🔑 Credenciais recebidas:', { clientId: clientId ? '✓' : '✗', clientSecret: clientSecret ? '✓' : '✗' });

        // Obter token de acesso - PRIORIZAR env vars se credenciais não forem válidas
        let accessToken;

        // Primeiro tentar usar env vars (mais confiável durante desenvolvimento)
        const envClientId = process.env.BSPAY_CLIENT_ID;
        const envClientSecret = process.env.BSPAY_CLIENT_SECRET;

        if (envClientId && envClientSecret) {
            console.log('🔑 Usando credenciais do ambiente (env vars)');
            accessToken = await getAccessToken(envClientId, envClientSecret);
        } else if (clientId && clientSecret && clientId.length > 5 && clientSecret.length > 5) {
            console.log('🔑 Usando credenciais do banco');
            accessToken = await getAccessToken(clientId, clientSecret);
        } else if (bearerToken) {
            accessToken = bearerToken;
            console.log('🔑 Usando bearer token fornecido');
        } else {
            return res.status(400).json({
                success: false,
                error: 'Credenciais BSPay não configuradas. Configure no Admin > Pagamentos ou defina BSPAY_CLIENT_ID e BSPAY_CLIENT_SECRET.'
            });
        }

        // Montar payload conforme documentação
        const payload = {
            amount: parseFloat(amount),
            external_id: externalId || `pedido_${Date.now()}`,
            postbackUrl: postbackUrl || '',
            payerQuestion: description || `Pagamento Pedido #${externalId || Date.now()}`,
            payer: {
                name: customerName || 'Cliente',
                document: customerDocument?.replace(/\D/g, '') || '',
                email: customerEmail || ''
            }
        };

        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Criar QR Code PIX
        const response = await fetch('https://api.bspay.co/v2/pix/qrcode', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Resposta BS Pay:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Erro BS Pay:', data);

            if (response.status === 401) {
                cachedToken = null;
                tokenExpiresAt = null;
            }

            return res.status(response.status).json({
                success: false,
                error: data.message || data.error || 'Erro ao criar cobrança BS Pay',
                details: data
            });
        }

        const expirationSeconds = data.calendar?.expiration || 3600;
        const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();

        // Gerar imagem QR Code localmente (BSPay retorna apenas o código)
        let qrcodeImage = null;
        if (data.qrcode) {
            try {
                qrcodeImage = await QRCode.toDataURL(data.qrcode, {
                    errorCorrectionLevel: 'M',
                    type: 'image/png',
                    width: 300,
                    margin: 2
                });
                console.log('✅ QR Code imagem gerada com sucesso');
            } catch (qrError) {
                console.error('⚠️ Erro ao gerar imagem QR Code:', qrError);
            }
        }

        res.json({
            success: true,
            txid: data.transactionId,
            transactionId: data.transactionId,
            external_id: data.external_id,
            status: data.status,
            amount: data.amount,
            pixCopiaECola: data.qrcode,
            qrcode: data.qrcode,
            imagemQrcode: qrcodeImage,
            expiresAt: expiresAt,
            debtor: data.debtor,
            calendar: data.calendar,
            raw: data
        });

    } catch (error) {
        console.error('❌ [BS Pay] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao processar requisição'
        });
    }
});

// ================================
// ROTA: Consultar status do PIX
// ================================
app.post('/api/pix/status', async (req, res) => {
    try {
        const { transactionId, clientId, clientSecret, bearerToken } = req.body;

        console.log('🔍 [BS Pay] Consultando status:', transactionId);

        if (!transactionId) {
            return res.status(400).json({ success: false, error: 'Transaction ID não informado' });
        }

        // Obter token de acesso
        let accessToken;

        if (bearerToken) {
            accessToken = bearerToken;
        } else if (clientId && clientSecret) {
            accessToken = await getAccessToken(clientId, clientSecret);
        } else {
            const envClientId = process.env.BSPAY_CLIENT_ID;
            const envClientSecret = process.env.BSPAY_CLIENT_SECRET;

            if (envClientId && envClientSecret) {
                accessToken = await getAccessToken(envClientId, envClientSecret);
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Credenciais BSPay não configuradas.'
                });
            }
        }

        const response = await fetch(`https://api.bspay.co/v2/pix/cashIn/${transactionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log('📥 Status BS Pay:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            if (response.status === 401) {
                cachedToken = null;
                tokenExpiresAt = null;
            }

            return res.status(response.status).json({
                success: false,
                error: data.message || data.error || 'Erro ao consultar status',
                details: data
            });
        }

        // Mapear status
        const statusMap = {
            'pending': 'ATIVA',
            'PENDING': 'ATIVA',
            'paid': 'CONCLUIDA',
            'PAID': 'CONCLUIDA',
            'expired': 'EXPIRADA',
            'EXPIRED': 'EXPIRADA',
            'cancelled': 'CANCELADA',
            'CANCELLED': 'CANCELADA'
        };

        const mappedStatus = statusMap[data.status] || data.status;

        res.json({
            success: true,
            txid: transactionId,
            transactionId: data.transactionId || transactionId,
            status: mappedStatus,
            originalStatus: data.status,
            amount: data.amount,
            paidAt: data.paidAt || null,
            debtor: data.debtor,
            raw: data
        });

    } catch (error) {
        console.error('❌ [BS Pay] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao consultar status'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    console.log(`📌 Rotas disponíveis:`);
    console.log(`   POST /api/pix/create - Criar cobrança PIX`);
    console.log(`   POST /api/pix/status - Consultar status do PIX`);
    console.log(`   GET  /api/health    - Health check`);
});
