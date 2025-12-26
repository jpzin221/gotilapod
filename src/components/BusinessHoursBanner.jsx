import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const DAYS_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const DAYS_LABEL = {
  sunday: 'Domingo',
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
};

export default function BusinessHoursBanner({ businessHours }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [todayHours, setTodayHours] = useState(null);

  useEffect(() => {
    if (!businessHours) return;

    const checkIfOpen = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayKey = DAYS_MAP[dayOfWeek];
      const hours = businessHours[dayKey];

      setCurrentDay(DAYS_LABEL[dayKey]);
      setTodayHours(hours);

      if (!hours || hours.closed) {
        setIsOpen(false);
        return;
      }

      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [openHour, openMin] = hours.open.split(':').map(Number);
      const [closeHour, closeMin] = hours.close.split(':').map(Number);
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;

      setIsOpen(currentTime >= openTime && currentTime < closeTime);
    };

    checkIfOpen();
    const interval = setInterval(checkIfOpen, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [businessHours]);

  if (!businessHours || !todayHours) return null;

  return (
    <div className={`${
      isOpen 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
        : 'bg-gradient-to-r from-red-500 to-orange-600'
    } text-white shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3 flex-wrap text-sm sm:text-base">
          {/* Status */}
          <div className="flex items-center gap-2">
            {isOpen ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-bold">ABERTO AGORA</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-bold">FECHADO</span>
              </>
            )}
          </div>

          {/* Separador */}
          <span className="hidden sm:inline opacity-50">•</span>

          {/* Dia e horário */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-semibold">{currentDay}:</span>
            {todayHours.closed ? (
              <span>Fechado</span>
            ) : (
              <span>{todayHours.open} - {todayHours.close}</span>
            )}
          </div>

          {/* Mensagem adicional */}
          {!isOpen && !todayHours.closed && (
            <>
              <span className="hidden sm:inline opacity-50">•</span>
              <span className="text-xs sm:text-sm opacity-90">
                Abrimos às {todayHours.open}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
