import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Copy, CheckCircle, Clock, X, AlertCircle, RefreshCw } from 'lucide-react';

export default function PixSessionRestore({ isOpen, onClose, sessionData }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!sessionData) return;

    const now = Date.now();
    const sessionAge = now - sessionData.timestamp;
    const oneHour = 3600000;
    const remainingTime = Math.max(0, Math.floor((oneHour - sessionAge) / 1000));
    setTimeLeft(remainingTime);
  }, [sessionData]);

  // Timer de expiração
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const copyToClipboard = () => {
    if (!sessionData?.pixData?.pixCopiaECola) return;
    navigator.clipboard.writeText(sessionData.pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkPaymentStatus = async () => {
    if (!sessionData?.pixData?.txid) return;

    setChecking(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/pix/status/${sessionData.pixData.txid}`);
      const data = await response.json();

      if (data.success && data.status === 'CONCLUIDA') {
        alert('✅ Pagamento confirmado! Redirecionando...');
        localStorage.removeItem('pixPaymentSession');
        onClose();
        navigate('/pedido');
      } else {
        alert('⏳ Pagamento ainda não confirmado. Continue aguardando ou efetue o pagamento.');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      alert('Erro ao verificar status do pagamento. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleDiscard = () => {
    const confirm = window.confirm(
      'Tem certeza que deseja descartar este pagamento? Você perderá o QR Code e precisará fazer um novo pedido.'
    );
    if (confirm) {
      localStorage.removeItem('pixPaymentSession');
      onClose();
    }
  };

  if (!isOpen || !sessionData) return null;

  const pixData = sessionData.pixData;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            Pagamento PIX Pendente
          </h3>
          <p className="text-gray-600 text-sm">
            Continue de onde parou
          </p>

          {/* Timer */}
          {timeLeft > 0 ? (
            <div className="flex items-center justify-center gap-2 mt-3 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Expira em {formatTime(timeLeft)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-3 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                QR Code Expirado
              </span>
            </div>
          )}
        </div>

        {timeLeft > 0 ? (
          <>
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 flex items-center justify-center">
              {pixData?.imagemQrcode ? (
                <img
                  src={
                    pixData.imagemQrcode.startsWith('data:image')
                      ? pixData.imagemQrcode
                      : `data:image/png;base64,${pixData.imagemQrcode}`
                  }
                  alt="QR Code PIX"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-gray-500 text-sm">QR Code não disponível</p>
                </div>
              )}
            </div>

            {/* PIX Copia e Cola */}
            {pixData?.pixCopiaECola && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIX Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixData.pixCopiaECola}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Como pagar:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com <strong>PIX</strong></li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
                <li>Clique em "Verificar Pagamento" abaixo</li>
              </ol>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={checkPaymentStatus}
                disabled={checking}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verificar Pagamento
                  </>
                )}
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
                title="Descartar pagamento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          /* QR Code Expirado */
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              QR Code Expirado
            </h4>
            <p className="text-gray-600 mb-6">
              Este QR Code expirou. Faça um novo pedido para gerar um novo código PIX.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('pixPaymentSession');
                onClose();
              }}
              className="bg-primary hover:bg-secondary text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Fazer Novo Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
