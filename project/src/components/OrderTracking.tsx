import { Clock, CheckCircle, Package, Truck, Home } from 'lucide-react';

type OrderStatus = 'processing' | 'approved' | 'analyzing' | 'in_transit' | 'delivered';

interface OrderTrackingProps {
  orderId?: string;
  customerPhone?: string;
  status?: OrderStatus;
}

const OrderTracking = ({
  orderId = '#12345',
  customerPhone = '(11) 98765-4321',
  status = 'processing'
}: OrderTrackingProps) => {
  const steps = [
    { id: 'processing', label: 'Processando', icon: Clock },
    { id: 'approved', label: 'Aprovado', icon: CheckCircle },
    { id: 'analyzing', label: 'Em análise', icon: Package },
    { id: 'in_transit', label: 'Entregando', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: Home }
  ];

  const statusOrder: OrderStatus[] = ['processing', 'approved', 'analyzing', 'in_transit', 'delivered'];
  const currentStepIndex = statusOrder.indexOf(status);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-1">Pedido {orderId}</p>
          <p className="text-sm text-gray-600">{customerPhone}</p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center relative mb-6">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-gray-900 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const stepStatus = getStepStatus(index);
              const isCompleted = stepStatus === 'completed';
              const isCurrent = stepStatus === 'current';

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted ? 'bg-gray-900 text-white' :
                    isCurrent ? 'bg-gray-900 text-white' :
                    'bg-white border-2 border-gray-300 text-gray-600'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs text-center whitespace-nowrap ${
                    isCurrent ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-gray-300 mb-8" />

        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
            Alterar senha
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
            Meus pedidos
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
            Suporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
