import { useState, useEffect } from 'react';
import { QrCode, Clock, X } from 'lucide-react';
import PixSessionRestore from './PixSessionRestore';

export default function PixSessionBanner({ onRestore }) {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    const savedSession = localStorage.getItem('pixPaymentSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const oneHour = 3600000; // 1 hora em ms

        // Se a sessão tem menos de 1 hora
        if (sessionAge < oneHour) {
          const remainingMinutes = Math.floor((oneHour - sessionAge) / 60000);
          setSessionData({ ...session, remainingMinutes });
          setHasSession(true);
        } else {
          // Sessão expirada, limpar
          localStorage.removeItem('pixPaymentSession');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        localStorage.removeItem('pixPaymentSession');
      }
    }
  };

  const handleDismiss = () => {
    localStorage.removeItem('pixPaymentSession');
    setHasSession(false);
  };

  if (!hasSession || !sessionData) return null;

  // Se já foi pago, não mostrar banner
  if (sessionData.paymentStatus === 'paid') return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 animate-slide-down">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-full">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm sm:text-base">
                Você tem um pagamento PIX pendente!
              </h3>
              <p className="text-xs sm:text-sm opacity-90 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expira em {sessionData.remainingMinutes} minutos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRestoreModal(true)}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition whitespace-nowrap"
            >
              Continuar Pagamento
            </button>
            <button
              onClick={handleDismiss}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Restauração */}
      <PixSessionRestore
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          checkSession(); // Recheck session after closing
        }}
        sessionData={sessionData}
      />
    </div>
  );
}
