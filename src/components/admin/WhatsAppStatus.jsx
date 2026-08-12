import { useState, useEffect } from 'react';
import { Loader2, Check, X, Wifi, WifiOff, MessageSquare } from 'lucide-react';

export default function WhatsAppStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/config');
      const data = await res.json();
      setStatus(data.config ? {
        connected: data.config.is_active && data.config.api_url && data.config.api_key,
        config: data.config
      } : { connected: false, config: null });
    } catch (error) {
      setStatus({ connected: false, config: null, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Verificando WhatsApp...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      status?.connected 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {status?.connected ? (
        <>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">WhatsApp Conectado</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Infobip • {status.config?.phone_number || 'Configurado'}
            </p>
          </div>
          <Check className="w-5 h-5 text-green-500" />
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <WifiOff className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">WhatsApp Desconectado</p>
            <p className="text-xs text-gray-500">Configure na aba Carrinhos</p>
          </div>
          <X className="w-5 h-5 text-gray-400" />
        </>
      )}
    </div>
  );
}