// Status unificados do sistema de pedidos
export const ORDER_STATUS = {
  CONFIRMADO: 'confirmado',
  PREPARANDO: 'preparando',
  GUARDANDO: 'guardando',
  AGUARDANDO_TRANSPORTADORA: 'aguardando_transportadora',
  PEDIDO_COLETADO: 'pedido_coletado',
  ENTREGADOR_INICIOU_ROTA: 'entregador_iniciou_rota',
  ENTREGADOR_SAIU: 'entregador_saiu',
  ENTREGADOR_INDO_LOCAL: 'entregador_indo_localizacao',
  PROBLEMA_ENTREGA: 'problema_entrega',
  NAO_ENTREGUE: 'nao_conseguiu_entregar',
  RETornado_CENTRAL: 'retornado_central',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado'
};

// Labels para exibição
export const STATUS_LABELS = {
  [ORDER_STATUS.CONFIRMADO]: 'Confirmado',
  [ORDER_STATUS.PREPARANDO]: 'Preparando',
  [ORDER_STATUS.GUARDANDO]: 'Guardando',
  [ORDER_STATUS.AGUARDANDO_TRANSPORTADORA]: 'Aguard. Transportadora',
  [ORDER_STATUS.PEDIDO_COLETADO]: 'Coletado',
  [ORDER_STATUS.ENTREGADOR_INICIOU_ROTA]: 'Iniciou Rota',
  [ORDER_STATUS.ENTREGADOR_SAIU]: 'Saiu para Entrega',
  [ORDER_STATUS.ENTREGADOR_INDO_LOCAL]: 'Indo p/ Você',
  [ORDER_STATUS.PROBLEMA_ENTREGA]: 'Problema na Entrega',
  [ORDER_STATUS.NAO_ENTREGUE]: 'Não Entregue',
  [ORDER_STATUS.RETornado_CENTRAL]: 'Retornado à Central',
  [ORDER_STATUS.ENTREGUE]: 'Entregue',
  [ORDER_STATUS.CANCELADO]: 'Cancelado'
};

// Cores para Tailwind (MUST be static strings, not dynamic)
export const STATUS_COLORS = {
  [ORDER_STATUS.CONFIRMADO]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.PREPARANDO]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUS.GUARDANDO]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUS.AGUARDANDO_TRANSPORTADORA]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.PEDIDO_COLETADO]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUS.ENTREGADOR_INICIOU_ROTA]: 'bg-cyan-100 text-cyan-800',
  [ORDER_STATUS.ENTREGADOR_SAIU]: 'bg-teal-100 text-teal-800',
  [ORDER_STATUS.ENTREGADOR_INDO_LOCAL]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.PROBLEMA_ENTREGA]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.NAO_ENTREGUE]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.RETornado_CENTRAL]: 'bg-gray-100 text-gray-800',
  [ORDER_STATUS.ENTREGUE]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELADO]: 'bg-gray-200 text-gray-600'
};

// Ícones para cada status
export const STATUS_ICONS = {
  [ORDER_STATUS.CONFIRMADO]: 'CheckCircle',
  [ORDER_STATUS.PREPARANDO]: 'Package',
  [ORDER_STATUS.GUARDANDO]: 'Archive',
  [ORDER_STATUS.AGUARDANDO_TRANSPORTADORA]: 'Truck',
  [ORDER_STATUS.PEDIDO_COLETADO]: 'CheckSquare',
  [ORDER_STATUS.ENTREGADOR_INICIOU_ROTA]: 'Map',
  [ORDER_STATUS.ENTREGADOR_SAIU]: 'Navigation',
  [ORDER_STATUS.ENTREGADOR_INDO_LOCAL]: 'MapPin',
  [ORDER_STATUS.PROBLEMA_ENTREGA]: 'AlertTriangle',
  [ORDER_STATUS.NAO_ENTREGUE]: 'XCircle',
  [ORDER_STATUS.RETornado_CENTRAL]: 'RotateCcw',
  [ORDER_STATUS.ENTREGUE]: 'PackageCheck',
  [ORDER_STATUS.CANCELADO]: 'XOctagon'
};

// Ordem sequencial dos status (para timeline)
export const STATUS_ORDER = [
  ORDER_STATUS.CONFIRMADO,
  ORDER_STATUS.PREPARANDO,
  ORDER_STATUS.GUARDANDO,
  ORDER_STATUS.AGUARDANDO_TRANSPORTADORA,
  ORDER_STATUS.PEDIDO_COLETADO,
  ORDER_STATUS.ENTREGADOR_INICIOU_ROTA,
  ORDER_STATUS.ENTREGADOR_SAIU,
  ORDER_STATUS.ENTREGADOR_INDO_LOCAL,
  ORDER_STATUS.ENTREGUE
];
