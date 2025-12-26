import { Clock, CheckCircle, Package, TrendingUp, MapPin, Zap, ArrowRight } from 'lucide-react';

type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface OrderTrackingAdvancedProps {
  orderId?: string;
  status?: OrderStatus;
  estimatedTime?: string;
  deliveryPerson?: string;
}

const OrderTrackingAdvanced = ({
  orderId = '#XP-948',
  status = 6,
  estimatedTime = '~35 minutos',
  deliveryPerson = '#ALE-302'
}: OrderTrackingAdvancedProps) => {
  const steps = [
    { id: 0, label: 'Pedido recebido', icon: CheckCircle },
    { id: 1, label: 'Pagamento aprovado', icon: TrendingUp },
    { id: 2, label: 'Preparando o pedido', icon: Package },
    { id: 3, label: 'Nota fiscal emitida', icon: Zap },
    { id: 4, label: 'Aguardando coleta', icon: Clock },
    { id: 5, label: 'Entregador designado', icon: MapPin },
    { id: 6, label: 'Em trânsito', icon: ArrowRight },
    { id: 7, label: 'Loja parceira', icon: Package },
    { id: 8, label: 'Saiu para entrega', icon: TrendingUp },
    { id: 9, label: 'Entregue', icon: CheckCircle }
  ];

  const currentStep = steps[status];
  const progressPercent = (status / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Rastreamento de Pedido</h1>
                <p className="text-cyan-400 text-sm mt-1">Sistema de Logística POD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Pedido</p>
              <p className="text-2xl font-bold text-cyan-400">{orderId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border border-slate-600">
              <p className="text-gray-400 text-sm mb-1">Status Atual</p>
              <p className="text-xl font-bold text-cyan-400">{currentStep.label}</p>
              {status === 5 && (
                <p className="text-purple-400 text-sm mt-2">Entregador: {deliveryPerson}</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border border-slate-600">
              <p className="text-gray-400 text-sm mb-1">Tempo Estimado</p>
              <p className="text-xl font-bold text-purple-400">{estimatedTime}</p>
              <div className="w-full bg-slate-600 h-1 rounded-full mt-3">
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-1 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border border-slate-600">
              <p className="text-gray-400 text-sm mb-1">Progresso</p>
              <p className="text-xl font-bold text-purple-400">{Math.round(progressPercent)}%</p>
              <p className="text-gray-400 text-xs mt-2">{status + 1} de {steps.length} etapas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700 rounded-lg p-8 border border-slate-600 shadow-2xl">
          <div className="mb-8">
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-slate-600 rounded-full" />
              <div
                className="absolute top-5 left-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />

              <div className="relative flex justify-between z-10">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < status;
                  const isCurrent = index === status;
                  const isPending = index > status;

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-slate-900 shadow-lg shadow-cyan-400/50'
                            : isCurrent
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110'
                            : 'bg-slate-600 text-gray-400'
                        }`}
                      >
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <p
                        className={`text-xs text-center transition-all duration-300 ${
                          isCurrent
                            ? 'text-cyan-400 font-bold'
                            : isCompleted
                            ? 'text-cyan-300'
                            : 'text-gray-500'
                        }`}
                        style={{ maxWidth: '70px' }}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Histórico de Etapas</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {steps.map((step, index) => {
                const isCompleted = index < status;
                const isCurrent = index === status;

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-purple-500/50'
                        : isCompleted
                        ? 'bg-slate-700/50 border-cyan-400/30'
                        : 'bg-slate-700/30 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                        {isCurrent && <Zap className="w-4 h-4 text-purple-400 animate-pulse" />}
                        {!isCompleted && !isCurrent && <Clock className="w-4 h-4 text-gray-500" />}
                        <span
                          className={`text-sm font-medium ${
                            isCurrent ? 'text-cyan-400' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index === 5 && status >= 5 && (
                        <span className="text-xs text-purple-400 font-semibold">{deliveryPerson}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 rounded-lg p-4 border border-cyan-400/20">
          <p className="text-sm text-gray-300">
            <span className="text-cyan-400 font-semibold">💡 Dica:</span> Você receberá uma notificação quando o entregador sair para sua rua. Fique atento ao seu telefone!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingAdvanced;
