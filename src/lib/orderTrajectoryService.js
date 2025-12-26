import { supabase } from './supabase';

/**
 * Serviço para gerenciar trajetos de pedidos
 */
export const orderTrajectoryService = {
  /**
   * Verificar se a loja está aberta
   */
  async isStoreOpen() {
    try {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('business_hours')
        .single();

      if (!settings?.business_hours) return false;

      const now = new Date();
      const currentDay = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const todayHours = settings.business_hours[currentDay];
      
      if (!todayHours || !todayHours.open) return false;

      return currentTime >= todayHours.start && currentTime <= todayHours.end;
    } catch (error) {
      console.error('Erro ao verificar horário:', error);
      return false;
    }
  },

  /**
   * Buscar trajeto padrão (global)
   */
  async getDefaultTrajectory() {
    try {
      const { data, error } = await supabase
        .from('config_status_tempo')
        .select('*')
        .eq('ativo', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar trajeto padrão:', error);
      return [];
    }
  },

  /**
   * Buscar trajeto personalizado de um pedido
   */
  async getOrderTrajectory(pedidoId) {
    try {
      const { data, error } = await supabase
        .from('pedido_trajeto_personalizado')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar trajeto do pedido:', error);
      return [];
    }
  },

  /**
   * Criar trajeto personalizado para um pedido
   */
  async createCustomTrajectory(pedidoId, trajeto) {
    try {
      // Deletar trajeto existente
      await supabase
        .from('pedido_trajeto_personalizado')
        .delete()
        .eq('pedido_id', pedidoId);

      // Inserir novo trajeto
      const trajetoFormatado = trajeto.map((item, index) => ({
        pedido_id: pedidoId,
        status_atual: item.status_atual,
        proximo_status: item.proximo_status,
        minutos_espera: item.minutos_espera,
        ordem: index + 1,
        descricao: item.descricao
      }));

      const { data, error } = await supabase
        .from('pedido_trajeto_personalizado')
        .insert(trajetoFormatado)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar trajeto personalizado:', error);
      throw error;
    }
  },

  /**
   * Atualizar trajeto padrão (global)
   */
  async updateDefaultTrajectory(trajeto) {
    try {
      // Desativar todos
      await supabase
        .from('config_status_tempo')
        .update({ ativo: false })
        .eq('ativo', true);

      // Atualizar cada item
      const promises = trajeto.map((item, index) =>
        supabase
          .from('config_status_tempo')
          .upsert({
            id: item.id,
            status_atual: item.status_atual,
            proximo_status: item.proximo_status,
            minutos_espera: item.minutos_espera,
            descricao: item.descricao,
            display_order: index + 1,
            ativo: true
          })
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar trajeto padrão:', error);
      throw error;
    }
  },

  /**
   * Remover trajeto personalizado (volta ao padrão)
   */
  async removeCustomTrajectory(pedidoId) {
    try {
      const { error } = await supabase
        .from('pedido_trajeto_personalizado')
        .delete()
        .eq('pedido_id', pedidoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao remover trajeto personalizado:', error);
      throw error;
    }
  },

  /**
   * Atualizar status do pedido (com validação de horário)
   */
  async updateOrderStatus(pedidoId, novoStatus, observacao = '') {
    try {
      // Verificar se loja está aberta
      const isOpen = await this.isStoreOpen();
      
      if (!isOpen) {
        throw new Error('Não é possível atualizar o status fora do horário de funcionamento');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/pedidos/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacao
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
};

/**
 * Converter minutos em formato legível
 */
export function formatarTempo(minutos) {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  
  if (minutos < 1440) { // Menos de 24 horas
    if (minutosRestantes === 0) {
      return `${horas}h`;
    }
    return `${horas}h ${minutosRestantes}min`;
  }
  
  // Dias
  const dias = Math.floor(minutos / 1440);
  const horasRestantes = Math.floor((minutos % 1440) / 60);
  
  if (horasRestantes === 0) {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  
  return `${dias} ${dias === 1 ? 'dia' : 'dias'} e ${horasRestantes}h`;
}

/**
 * Converter tempo legível para minutos
 */
export function parseTempoParaMinutos(texto) {
  let totalMinutos = 0;
  
  // Dias
  const diasMatch = texto.match(/(\d+)\s*(?:dia|dias)/i);
  if (diasMatch) {
    totalMinutos += parseInt(diasMatch[1]) * 1440;
  }
  
  // Horas
  const horasMatch = texto.match(/(\d+)h/i);
  if (horasMatch) {
    totalMinutos += parseInt(horasMatch[1]) * 60;
  }
  
  // Minutos
  const minutosMatch = texto.match(/(\d+)\s*min/i);
  if (minutosMatch) {
    totalMinutos += parseInt(minutosMatch[1]);
  }
  
  return totalMinutos || 0;
}

/**
 * Status disponíveis
 */
export const STATUS_PEDIDO = {
  confirmado: 'Pedido Confirmado',
  preparando: 'Preparando Pedido',
  guardando: 'Pedido Esperando Retirada',
  motoboy_caminho: 'Motoboy a Caminho',
  coleta: 'Aguardando Coleta',
  em_rota: 'Em Rota de Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  problema: 'Pedido com Problema',
  aguardando_cliente: 'Aguardando Cliente',
  motoboy_destino: 'O motoboy tem como destino sua localização',
  ocorrencia_entrega: 'Ocorrência com a entrega',
  endereco_incorreto: 'Endereço incorreto',
  cliente_ausente: 'Cliente ausente'
};

/**
 * Status especiais (erro/problema/informação)
 */
export const STATUS_ESPECIAIS = {
  motoboy_destino: 'O motoboy tem como destino sua localização',
  ocorrencia_entrega: 'Ocorrência com a entrega',
  problema: 'Pedido com Problema',
  aguardando_cliente: 'Aguardando Cliente',
  endereco_incorreto: 'Endereço incorreto',
  cliente_ausente: 'Cliente ausente',
  cancelado: 'Cancelado'
};

/**
 * Obter próximos status possíveis
 */
export function getProximosStatus(statusAtual) {
  const fluxo = {
    confirmado: ['preparando', 'cancelado'],
    preparando: ['guardando', 'cancelado'],
    guardando: ['motoboy_caminho', 'coleta', 'cancelado'],
    motoboy_caminho: ['coleta', 'cancelado'],
    coleta: ['em_rota', 'cancelado'],
    em_rota: ['entregue', 'cancelado'],
    entregue: [],
    cancelado: []
  };
  
  return fluxo[statusAtual] || [];
}
