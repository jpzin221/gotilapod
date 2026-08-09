import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Gift, Sparkles, Timer } from 'lucide-react';
import Portal from './Portal';

const COUPON_CODE = 'PRIMEIRA10';
const DISCOUNT_PERCENT = 10;
const STORAGE_KEY = 'exitIntentPopupShown';
const SHOW_AGAIN_DAYS = 7;

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0); // 0: entrada, 1: revelado, 2: copiado
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Verificar se ja foi mostrado recentemente
  const wasRecentlyShown = () => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return false;
    const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
    return daysSince < SHOW_AGAIN_DAYS;
  };

  // Detectar exit intent
  const handleMouseLeave = useCallback((e) => {
    if (wasRecentlyShown()) return;
    if (isVisible) return;
    // Detectar quando o mouse sai pelo topo da tela
    if (e.clientY <= 0) {
      setIsVisible(true);
      setStep(0);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  }, [isVisible]);

  // Detectar tecla ESC
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isVisible) {
      handleClose();
    }
  }, [isVisible]);

  useEffect(() => {
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseLeave, handleKeyDown]);

  // Animacao de entrada apos abrir
  useEffect(() => {
    if (isVisible && step === 0) {
      const timer = setTimeout(() => setStep(1), 600);
      return () => clearTimeout(timer);
    }
  }, [isVisible, step]);

  const handleClose = () => {
    setIsVisible(false);
    setStep(0);
    setCopied(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setStep(2);
      // Auto-fechar apos 2 segundos
      setTimeout(handleClose, 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = COUPON_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setStep(2);
      setTimeout(handleClose, 2500);
    }
  };

  if (!isVisible) return null;

  return (
    <Portal>
      {/* Overlay com blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500"
        style={{ zIndex: 9999999 }}
        onClick={handleClose}
      />

      {/* Popup Principal */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999999 }}>
        <div
          className={`
            relative w-full max-w-lg transform transition-all duration-700 ease-out
            ${step >= 0 ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}
          `}
        >
          {/* Efeito de brilho ao redor */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-2xl blur-lg opacity-75 animate-pulse" />

          {/* Conteudo do popup */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl">
            {/* Particulas decorativas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="absolute top-8 right-8 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-12 left-12 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
              <div className="absolute top-1/2 right-4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.9s' }} />
            </div>

            {/* Botao fechar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6 text-center overflow-hidden">
              {/* Efeito de brilho no header */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-white animate-bounce" />
                  <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                    Oferta por tempo limitado
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Gift className="w-10 h-10 text-white animate-bounce" />
                  <div>
                    <h2 className="text-4xl font-black text-white drop-shadow-lg">
                      {DISCOUNT_PERCENT}% OFF
                    </h2>
                  </div>
                  <Gift className="w-10 h-10 text-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>

                <p className="text-white/90 text-lg mt-2 font-medium">
                  Antes de ir... pegue seu desconto!
                </p>
              </div>
            </div>

            {/* Corpo do popup */}
            <div className="p-6 text-center">
              {/* Icone de presente animado */}
              <div
                className={`
                  w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500
                  flex items-center justify-center transform transition-all duration-700
                  ${step >= 1 ? 'scale-100 rotate-0' : 'scale-0 -rotate-180'}
                `}
              >
                <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>

              {/* Mensagem */}
              <h3
                className={`
                  text-xl font-bold text-white mb-2 transform transition-all duration-500 delay-300
                  ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                `}
              >
                Seu cupom esta pronto!
              </h3>

              <p
                className={`
                  text-gray-400 mb-6 transform transition-all duration-500 delay-500
                  ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                `}
              >
                Use o codigo abaixo no seu pedido e economize {DISCOUNT_PERCENT}% em qualquer produto!
              </p>

              {/* Codigo do cupom */}
              <div
                className={`
                  relative mb-6 transform transition-all duration-700 delay-700
                  ${step >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
                `}
              >
                <div className="bg-gray-800 border-2 border-dashed border-yellow-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Seu codigo</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-widest">
                        {COUPON_CODE}
                      </p>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                        transform transition-all duration-300 hover:scale-105 active:scale-95
                        ${copied
                          ? 'bg-green-500 text-white'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30'
                        }
                      `}
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Selo de desconto */}
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">
                  -{DISCOUNT_PERCENT}%
                </div>
              </div>

              {/* Instrucoes */}
              <div
                className={`
                  bg-gray-800/50 rounded-xl p-4 mb-4 transform transition-all duration-500 delay-1000
                  ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                `}
              >
                <p className="text-sm text-gray-400">
                  {step === 2 ? (
                    <span className="text-green-400 font-semibold flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Codigo copiado! Cole no carrinho para usar
                    </span>
                  ) : (
                    <>
                      <span className="text-yellow-400">1.</span> Copie o codigo acima{' '}
                      <span className="text-yellow-400">2.</span> Adicione itens ao carrinho{' '}
                      <span className="text-yellow-400">3.</span> Cole no campo "Cupom"
                    </>
                  )}
                </p>
              </div>

              {/* Contador regressivo fake */}
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Timer className="w-4 h-4" />
                <span>Esta oferta expira quando voce fechar esta pagina</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
