const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key para bypass do RLS
);

/**
 * POST /api/pedidos/criar
 * Criar pedido após pagamento confirmado
 */
router.post('/criar', async (req, res) => {
  try {
    const {
      txid,
      e2eId,
      nomeCliente,
      cpfCliente,
      telefone,
      endereco,
      itens,
      valorTotal
    } = req.body;

    console.log('📦 Criando pedido...');
    console.log('👤 Cliente:', nomeCliente);
    console.log('📧 CPF:', cpfCliente);
    console.log('📞 Telefone:', telefone);
    console.log('🏠 Endereço recebido:', endereco);
    console.log('💰 Valor:', valorTotal);

    // 1. Verificar se usuário existe (NÃO criar automaticamente)
    let { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telefone', telefone.replace(/\D/g, ''))
      .single();

    // Se usuário não existe, deixar usuario_id como null
    // O usuário será criado depois quando preencher o PIN no modal
    if (!usuario) {
      console.log('👤 Usuário não cadastrado - pedido será criado sem vínculo');
      console.log('📝 Cliente precisará criar conta para vincular o pedido');
      usuario = { id: null };
    } else {
      console.log('✅ Usuário existente:', usuario.id);
    }

    // 2. Gerar número do pedido
    const { data: numeroPedido } = await supabase
      .rpc('gerar_numero_pedido');

    // 3. Criar pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: usuario.id,
        numero_pedido: numeroPedido,
        nome_cliente: nomeCliente,
        cpf_cliente: cpfCliente,
        telefone: telefone,
        txid: txid,
        e2e_id: e2eId,
        status: 'confirmado',
        valor_total: valorTotal,
        itens: itens,
        endereco_entrega: endereco,
        forma_pagamento: 'pix',
        pago: true,
        pago_em: new Date().toISOString(),
        estimativa_entrega: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('❌ Erro ao criar pedido:', pedidoError);
      throw pedidoError;
    }

    console.log('✅ Pedido criado:', pedido.numero_pedido);

    // 4. Criar primeiro status no histórico
    await supabase
      .from('status_historico')
      .insert({
        pedido_id: pedido.id,
        status: 'confirmado',
        observacao: 'Pedido confirmado - Pagamento recebido',
        automatico: false
      });

    // 5. Agendar próxima mudança de status
    agendarProximaMudanca(pedido.id);

    res.json({
      success: true,
      pedido: {
        id: pedido.id,
        numeroPedido: pedido.numero_pedido,
        status: pedido.status,
        valorTotal: pedido.valor_total,
        telefone: telefone
      },
      message: 'Pedido criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar pedido',
      message: error.message
    });
  }
});

/**
 * GET /api/pedidos/:id/status
 * Buscar status atual do pedido
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Buscar histórico
    const { data: historico } = await supabase
      .from('status_historico')
      .select('*')
      .eq('pedido_id', id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      status: pedido.status,
      historico: historico || [],
      updated_at: pedido.updated_at
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar status do pedido'
    });
  }
});

/**
 * PUT /api/pedidos/:id/status
 * Atualizar status do pedido (MANUAL - Admin)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacao, forceUpdate } = req.body;

    console.log(`🔄 Atualizando status do pedido ${id} para: ${status}`);

    // Verificar horário de funcionamento (a menos que forceUpdate seja true)
    if (!forceUpdate) {
      const isOpen = await verificarHorarioFuncionamento();
      if (!isOpen) {
        return res.status(403).json({
          success: false,
          error: 'Não é possível atualizar o status fora do horário de funcionamento',
          message: 'A loja está fechada. Atualizações de status só podem ser feitas durante o horário de funcionamento.'
        });
      }
    }

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .update({
        status: status,
        ...(status === 'entregue' && { entregue_em: new Date().toISOString() })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Adicionar ao histórico
    await supabase
      .from('status_historico')
      .insert({
        pedido_id: id,
        status: status,
        observacao: observacao || 'Status atualizado manualmente',
        automatico: false
      });

    // Se não for status final, agendar próxima mudança
    if (status !== 'entregue' && status !== 'cancelado') {
      agendarProximaMudanca(id);
    }

    res.json({
      success: true,
      pedido: pedido,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status'
    });
  }
});

/**
 * PUT /api/pedidos/:id/vincular-usuario
 * Vincular pedido a um usuário após criação de conta
 */
router.put('/:id/vincular-usuario', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    console.log(`🔗 Vinculando pedido ${id} ao usuário ${usuario_id}`);

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .update({ usuario_id: usuario_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      pedido: pedido,
      message: 'Pedido vinculado ao usuário com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao vincular pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao vincular pedido ao usuário'
    });
  }
});

/**
 * GET /api/pedidos/todos
 * Listar TODOS os pedidos (Admin)
 */
router.get('/todos', async (req, res) => {
  try {
    console.log('📋 Buscando todos os pedidos...');
    
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        usuario:usuarios(nome, telefone)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Formatar dados
    const pedidosFormatados = pedidos.map(p => ({
      ...p,
      nome_cliente: p.usuario?.nome || p.nome_cliente || 'Cliente não cadastrado',
      telefone: p.usuario?.telefone || p.telefone
    }));
    
    console.log(`✅ ${pedidosFormatados.length} pedidos encontrados`);
    
    res.json({
      success: true,
      pedidos: pedidosFormatados
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar todos os pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedidos'
    });
  }
});

/**
 * GET /api/pedidos/usuario/:telefone
 * Listar todos os pedidos de um usuário
 */
router.get('/usuario/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    const telefoneLimpo = telefone.replace(/\D/g, '');

    // Buscar usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telefone', telefoneLimpo)
      .single();

    if (!usuario) {
      return res.json({
        success: true,
        pedidos: []
      });
    }

    // Buscar pedidos
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      pedidos: pedidos || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedidos do usuário'
    });
  }
});

/**
 * FUNÇÃO AUXILIAR: Verificar horário de funcionamento
 */
async function verificarHorarioFuncionamento() {
  try {
    const { data: settings } = await supabase
      .from('store_settings')
      .select('business_hours')
      .single();

    if (!settings?.business_hours) return false;

    const now = new Date();
    const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const currentDay = diasSemana[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const todayHours = settings.business_hours[currentDay];
    
    if (!todayHours || !todayHours.open) return false;

    return currentTime >= todayHours.start && currentTime <= todayHours.end;
  } catch (error) {
    console.error('❌ Erro ao verificar horário:', error);
    return false; // Em caso de erro, bloquear por segurança
  }
}

/**
 * FUNÇÃO AUXILIAR: Agendar próxima mudança automática
 */
async function agendarProximaMudanca(pedidoId) {
  try {
    // Buscar pedido
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('status, updated_at')
      .eq('id', pedidoId)
      .single();

    // Buscar configuração de tempo
    const { data: config } = await supabase
      .from('config_status_tempo')
      .select('*')
      .eq('status_atual', pedido.status)
      .eq('ativo', true)
      .single();

    if (!config) {
      console.log('⏹️ Sem próxima mudança configurada para:', pedido.status);
      return;
    }

    const minutosEspera = config.minutos_espera;
    const proximoStatus = config.proximo_status;

    console.log(`⏰ Agendado: ${pedido.status} → ${proximoStatus} em ${minutosEspera}min`);

    // Agendar mudança
    setTimeout(async () => {
      console.log(`🔄 Executando mudança automática: ${pedidoId} → ${proximoStatus}`);
      
      const { data: pedidoAtualizado, error } = await supabase
        .from('pedidos')
        .update({ status: proximoStatus })
        .eq('id', pedidoId)
        .select()
        .single();

      if (!error) {
        // Adicionar ao histórico
        await supabase
          .from('status_historico')
          .insert({
            pedido_id: pedidoId,
            status: proximoStatus,
            observacao: 'Mudança automática de status',
            automatico: true
          });

        // Agendar próxima mudança
        agendarProximaMudanca(pedidoId);
      }
    }, minutosEspera * 60 * 1000);

  } catch (error) {
    console.error('❌ Erro ao agendar mudança:', error);
  }
}

/**
 * INICIALIZAÇÃO: Reagendar pedidos pendentes ao iniciar servidor
 */
async function reagendarPedidosPendentes() {
  try {
    console.log('🔄 Reagendando pedidos pendentes...');

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, status, updated_at')
      .not('status', 'in', '(entregue,cancelado)');

    if (pedidos && pedidos.length > 0) {
      console.log(`📦 ${pedidos.length} pedidos pendentes encontrados`);
      pedidos.forEach(pedido => {
        agendarProximaMudanca(pedido.id);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao reagendar pedidos:', error);
  }
}

// Reagendar ao iniciar
reagendarPedidosPendentes();

module.exports = router;
