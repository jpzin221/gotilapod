import { useState } from 'react';
import { Save, Loader2, Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function BusinessHoursForm({ initialHours, onSave }) {
  const [hours, setHours] = useState(initialHours || {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '14:00', closed: true },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await onSave(hours);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Erro ao salvar horários. Tente novamente.');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Horário de Funcionamento</h2>
          <p className="text-sm text-gray-600">Configure os horários de abertura e fechamento</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700 font-semibold">✓ Horários salvos com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(({ key, label }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 sm:w-48">
                <input
                  type="checkbox"
                  checked={!hours[key]?.closed}
                  onChange={(e) => handleChange(key, 'closed', !e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <label className="font-semibold text-gray-800">{label}</label>
              </div>

              {!hours[key]?.closed ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Abre:</label>
                    <input
                      type="time"
                      value={hours[key]?.open || '09:00'}
                      onChange={(e) => handleChange(key, 'open', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Fecha:</label>
                    <input
                      type="time"
                      value={hours[key]?.close || '18:00'}
                      onChange={(e) => handleChange(key, 'close', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-red-600 font-semibold">Fechado</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Horários
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
