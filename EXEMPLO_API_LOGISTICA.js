/**
 * EXEMPLO DE API DE LOGÍSTICA
 * 
 * Este arquivo mostra como criar uma API para receber os pedidos
 * do seu e-commerce e gerenciar a logística de entrega.
 * 
 * Tecnologias usadas neste exemplo:
 * - Node.js + Express
 * - PostgreSQL (ou qualquer outro banco SQL)
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// 1️⃣ ENDPOINT: RECEBER PEDIDO DO E-COMMERCE
// ============================================

/**
 * Recebe um novo pedido do e-commerce
 * POST /api/pedidos/criar
 */
app.post('/api/pedidos/criar', async (req, res) => {
  try {
    const {
      id,              // ID do pedido no e-commerce
      valorTotal,      // Valor total
      nomeCliente,     // Nome completo
      cpfCliente,      // CPF sem formatação
      telefone,        // Telefone com formatação
      endereco,        // Objeto com endereço completo
      itens            // Array de produtos
    } = req.body;

    // ========================================
    // VALIDAÇÕES
    // ========================================
    
    // Validar dados do cliente
    if (!nomeCliente || nomeCliente.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Nome do cliente é obrigatório'
      });
    }

    if (!cpfCliente || cpfCliente.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido'
      });
    }

    if (!telefone) {
      return res.status(400).json({
        success: false,
        error: 'Telefone é obrigatório'
      });
    }

    // Validar endereço
    if (!endereco) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de entrega é obrigatório'
      });
    }

    const { cep, endereco: logradouro, numero, bairro, cidade, estado } = endereco;

    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de entrega incompleto'
      });
    }

    // Validar itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pedido sem itens'
      });
    }

    // ========================================
    // PROCESSAR PEDIDO
    // ========================================

    console.log('📦 Novo pedido recebido do e-commerce');
    console.log('🆔 ID:', id);
    console.log('👤 Cliente:', nomeCliente);
    console.log('📍 Cidade:', cidade, '-', estado);
    console.log('📦 Itens:', itens.length);

    // Gerar código de rastreamento único
    const codigoRastreio = gerarCodigoRastreio();

    // ========================================
    // SALVAR NO BANCO DE DADOS
    // ========================================

    // EXEMPLO COM SQL (PostgreSQL, MySQL, etc)
    const pedidoSalvo = await salvarPedidoNoBanco({
      // Dados do pedido
      pedido_ecommerce_id: id,
      codigo_rastreio: codigoRastreio,
      valor_total: valorTotal,
      
      // Dados do cliente
      cliente_nome: nomeCliente,
      cliente_cpf: cpfCliente,
      cliente_telefone: telefone,
      
      // Endereço de entrega
      entrega_cep: cep,
      entrega_logradouro: logradouro,
      entrega_numero: numero,
      entrega_complemento: endereco.complemento || '',
      entrega_bairro: bairro,
      entrega_cidade: cidade,
      entrega_estado: estado,
      
      // Status
      status_entrega: 'pendente',
      data_criacao: new Date(),
      previsao_entrega: calcularPrevisaoEntrega(cidade, estado)
    });

    // Salvar itens do pedido
    for (const item of itens) {
      await salvarItemPedido({
        pedido_id: pedidoSalvo.id,
        produto_nome: item.nome,
        produto_sabor: item.sabor,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      });
    }

    // ========================================
    // NOTIFICAR EQUIPE DE LOGÍSTICA
    // ========================================
    
    await notificarEquipeLogistica({
      pedidoId: pedidoSalvo.id,
      codigoRastreio,
      cliente: nomeCliente,
      cidade: cidade,
      itens: itens.length
    });

    // ========================================
    // RESPONDER PARA O E-COMMERCE
    // ========================================

    res.json({
      success: true,
      pedido: {
        id: pedidoSalvo.id,
        codigo_rastreio: codigoRastreio,
        status: 'pendente',
        previsao_entrega: pedidoSalvo.previsao_entrega,
        mensagem: 'Pedido recebido com sucesso!'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar pedido',
      detalhes: error.message
    });
  }
});

// ============================================
// 2️⃣ ENDPOINT: ATUALIZAR STATUS DE ENTREGA
// ============================================

/**
 * Atualiza o status de entrega de um pedido
 * PUT /api/pedidos/:id/status
 */
app.put('/api/pedidos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, localizacao_atual, observacao } = req.body;

    // Status válidos: pendente, separacao, em_transito, saiu_entrega, entregue, cancelado
    const statusValidos = ['pendente', 'separacao', 'em_transito', 'saiu_entrega', 'entregue', 'cancelado'];
    
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }

    // Atualizar no banco
    await atualizarStatusPedido(id, {
      status_entrega: status,
      localizacao_atual: localizacao_atual || null,
      observacao: observacao || null,
      atualizado_em: new Date()
    });

    // OPCIONAL: Enviar webhook para o e-commerce
    await enviarWebhookParaEcommerce({
      pedido_id: id,
      status: status,
      localizacao: localizacao_atual
    });

    res.json({
      success: true,
      mensagem: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status'
    });
  }
});

// ============================================
// 3️⃣ ENDPOINT: CONSULTAR RASTREAMENTO
// ============================================

/**
 * Consulta o rastreamento de um pedido
 * GET /api/rastreamento/:codigo
 */
app.get('/api/rastreamento/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const pedido = await buscarPedidoPorRastreio(codigo);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }

    res.json({
      success: true,
      rastreamento: {
        codigo_rastreio: pedido.codigo_rastreio,
        status: pedido.status_entrega,
        cliente: pedido.cliente_nome,
        endereco: {
          cidade: pedido.entrega_cidade,
          estado: pedido.entrega_estado
        },
        previsao_entrega: pedido.previsao_entrega,
        localizacao_atual: pedido.localizacao_atual,
        historico: await buscarHistoricoRastreamento(pedido.id)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar rastreamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao consultar rastreamento'
    });
  }
});

// ============================================
// 4️⃣ ENDPOINT: LISTAR PEDIDOS PENDENTES
// ============================================

/**
 * Lista todos os pedidos pendentes de entrega
 * GET /api/pedidos/pendentes
 */
app.get('/api/pedidos/pendentes', async (req, res) => {
  try {
    const pedidos = await listarPedidosPendentes();

    res.json({
      success: true,
      total: pedidos.length,
      pedidos: pedidos.map(p => ({
        id: p.id,
        codigo_rastreio: p.codigo_rastreio,
        cliente: p.cliente_nome,
        cidade: p.entrega_cidade,
        status: p.status_entrega,
        valor_total: p.valor_total,
        data_criacao: p.data_criacao
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar pedidos'
    });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Gera um código de rastreamento único
 */
function gerarCodigoRastreio() {
  const prefixo = 'BR';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefixo}${timestamp}${random}`;
}

/**
 * Calcula a previsão de entrega baseada na localização
 */
function calcularPrevisaoEntrega(cidade, estado) {
  const hoje = new Date();
  
  // Exemplo: Curitiba = 2 dias, outras cidades do PR = 3 dias, outros estados = 5 dias
  let diasUteis = 5;
  
  if (estado === 'PR') {
    diasUteis = cidade.toLowerCase().includes('curitiba') ? 2 : 3;
  }
  
  // Adicionar dias úteis
  let dataPrevisao = new Date(hoje);
  let diasAdicionados = 0;
  
  while (diasAdicionados < diasUteis) {
    dataPrevisao.setDate(dataPrevisao.getDate() + 1);
    const diaSemana = dataPrevisao.getDay();
    
    // Pular fins de semana
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++;
    }
  }
  
  return dataPrevisao.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
}

/**
 * Salva o pedido no banco de dados
 */
async function salvarPedidoNoBanco(dados) {
  // EXEMPLO COM SQL
  // const query = `
  //   INSERT INTO pedidos (
  //     pedido_ecommerce_id, codigo_rastreio, valor_total,
  //     cliente_nome, cliente_cpf, cliente_telefone,
  //     entrega_cep, entrega_logradouro, entrega_numero, entrega_complemento,
  //     entrega_bairro, entrega_cidade, entrega_estado,
  //     status_entrega, data_criacao, previsao_entrega
  //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  //   RETURNING *
  // `;
  
  // const result = await db.query(query, [
  //   dados.pedido_ecommerce_id, dados.codigo_rastreio, dados.valor_total,
  //   dados.cliente_nome, dados.cliente_cpf, dados.cliente_telefone,
  //   dados.entrega_cep, dados.entrega_logradouro, dados.entrega_numero, dados.entrega_complemento,
  //   dados.entrega_bairro, dados.entrega_cidade, dados.entrega_estado,
  //   dados.status_entrega, dados.data_criacao, dados.previsao_entrega
  // ]);
  
  // return result.rows[0];
  
  // SIMULAÇÃO (remover em produção)
  return {
    id: Math.floor(Math.random() * 10000),
    ...dados
  };
}

/**
 * Salva um item do pedido
 */
async function salvarItemPedido(dados) {
  // EXEMPLO COM SQL
  // const query = `
  //   INSERT INTO itens_pedido (
  //     pedido_id, produto_nome, produto_sabor, quantidade, preco_unitario
  //   ) VALUES ($1, $2, $3, $4, $5)
  // `;
  
  // await db.query(query, [
  //   dados.pedido_id, dados.produto_nome, dados.produto_sabor,
  //   dados.quantidade, dados.preco_unitario
  // ]);
  
  console.log('✅ Item salvo:', dados.produto_nome);
}

/**
 * Notifica a equipe de logística sobre novo pedido
 */
async function notificarEquipeLogistica(dados) {
  console.log('📧 Notificando equipe de logística...');
  console.log(`   Pedido: ${dados.codigRastreio}`);
  console.log(`   Cliente: ${dados.cliente}`);
  console.log(`   Cidade: ${dados.cidade}`);
  
  // Aqui você pode:
  // - Enviar e-mail
  // - Enviar SMS
  // - Notificar via WhatsApp
  // - Adicionar em sistema de gestão
}

/**
 * Atualiza o status de um pedido
 */
async function atualizarStatusPedido(id, dados) {
  // EXEMPLO COM SQL
  // const query = `
  //   UPDATE pedidos
  //   SET status_entrega = $1, localizacao_atual = $2, observacao = $3, atualizado_em = $4
  //   WHERE id = $5
  // `;
  
  // await db.query(query, [
  //   dados.status_entrega, dados.localizacao_atual, dados.observacao, dados.atualizado_em, id
  // ]);
  
  console.log(`✅ Status atualizado: Pedido ${id} -> ${dados.status_entrega}`);
}

/**
 * Busca pedido por código de rastreamento
 */
async function buscarPedidoPorRastreio(codigo) {
  // EXEMPLO COM SQL
  // const query = `SELECT * FROM pedidos WHERE codigo_rastreio = $1`;
  // const result = await db.query(query, [codigo]);
  // return result.rows[0];
  
  return null; // Simulação
}

/**
 * Busca histórico de rastreamento
 */
async function buscarHistoricoRastreamento(pedidoId) {
  // EXEMPLO COM SQL
  // const query = `
  //   SELECT * FROM historico_rastreamento
  //   WHERE pedido_id = $1
  //   ORDER BY data_hora DESC
  // `;
  // const result = await db.query(query, [pedidoId]);
  // return result.rows;
  
  return []; // Simulação
}

/**
 * Lista pedidos pendentes
 */
async function listarPedidosPendentes() {
  // EXEMPLO COM SQL
  // const query = `
  //   SELECT * FROM pedidos
  //   WHERE status_entrega IN ('pendente', 'separacao', 'em_transito', 'saiu_entrega')
  //   ORDER BY data_criacao DESC
  // `;
  // const result = await db.query(query);
  // return result.rows;
  
  return []; // Simulação
}

/**
 * Envia webhook para o e-commerce
 */
async function enviarWebhookParaEcommerce(dados) {
  // OPCIONAL: Notificar o e-commerce sobre mudanças de status
  // const webhookUrl = 'https://seu-ecommerce.com/api/webhook/status-entrega';
  
  // await fetch(webhookUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(dados)
  // });
  
  console.log('🔔 Webhook enviado para e-commerce:', dados);
}

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 API de Logística rodando na porta ${PORT}`);
  console.log(`📦 Pronta para receber pedidos do e-commerce!`);
});

module.exports = app;
