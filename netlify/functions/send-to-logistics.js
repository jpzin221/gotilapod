// Função Serverless: Enviar pedido para transportadora
// Integração entre a loja e o sistema de logística

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase da Transportadora (Sistema de Logística)
const LOGISTICS_SUPABASE_URL = 'https://xsygzynmfzvpsvfivdoz.supabase.co';
const LOGISTICS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzeWd6eW5tZnp2cHN2Zml2ZG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODIzNDUsImV4cCI6MjA3ODM1ODM0NX0.Ai15O3OaAra0ctWiHLfsvGdJSNdA6lOAissz2QjT5jA';

// Criar cliente Supabase da transportadora
const supabaseLogistics = createClient(LOGISTICS_SUPABASE_URL, LOGISTICS_SUPABASE_ANON_KEY);

exports.handler = async (event, context) => {
  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Permitir CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    const pedido = JSON.parse(event.body);

    console.log('📦 Novo pedido recebido da loja para enviar à transportadora');
    console.log('🆔 ID do Pedido:', pedido.numero_pedido);
    console.log('👤 Cliente:', pedido.nome_cliente);
    console.log('📍 Endereço:', pedido.endereco_entrega);

    // Validações
    if (!pedido.numero_pedido) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Número do pedido é obrigatório' 
        })
      };
    }

    if (!pedido.nome_cliente) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Nome do cliente é obrigatório' 
        })
      };
    }

    if (!pedido.endereco_entrega) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Endereço de entrega é obrigatório' 
        })
      };
    }

    // Gerar código de rastreamento único
    const codigoRastreio = gerarCodigoRastreio();

    // Preparar dados para a transportadora
    const dadosTransportadora = {
      // Identificação
      codigo_rastreio: codigoRastreio,
      pedido_origem_id: pedido.numero_pedido,
      
      // Dados do Cliente
      cliente: pedido.nome_cliente,
      cpf: pedido.cpf_cliente || null,
      telefone: pedido.telefone || null,
      
      // Endereço de Entrega
      origem: 'POD EXPRESSS - Loja Virtual',
      destino: `${pedido.endereco_entrega.cidade} - ${pedido.endereco_entrega.estado}`,
      endereco_completo: {
        cep: pedido.endereco_entrega.cep,
        logradouro: pedido.endereco_entrega.endereco,
        numero: pedido.endereco_entrega.numero,
        complemento: pedido.endereco_entrega.complemento || '',
        bairro: pedido.endereco_entrega.bairro,
        cidade: pedido.endereco_entrega.cidade,
        estado: pedido.endereco_entrega.estado
      },
      
      // Valores e Itens
      valor: pedido.valor_total || 0,
      itens: pedido.itens || [],
      quantidade_itens: pedido.itens ? pedido.itens.length : 0,
      
      // Status e Datas
      status: 'pendente',
      status_detalhado: 'Pedido recebido da loja',
      data_pedido: pedido.pago_em || new Date().toISOString(),
      previsao_entrega: calcularPrevisaoEntrega(pedido.endereco_entrega.cidade, pedido.endereco_entrega.estado),
      
      // Metadados
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      origem_sistema: 'loja_online',
      pago: pedido.pago || false,
      txid: pedido.txid || null
    };

    console.log('📤 Enviando pedido para o sistema de logística...');
    console.log('🔑 Código de rastreio gerado:', codigoRastreio);

    // Inserir no banco de dados da transportadora
    const { data, error } = await supabaseLogistics
      .from('pedidos')
      .insert([dadosTransportadora])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar no banco da transportadora:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Erro ao registrar pedido na transportadora',
          details: error.message
        })
      };
    }

    console.log('✅ Pedido registrado com sucesso na transportadora!');
    console.log('📋 ID do registro:', data.id);

    // Criar histórico inicial
    await supabaseLogistics
      .from('historico_rastreamento')
      .insert([{
        pedido_id: data.id,
        status: 'pendente',
        descricao: 'Pedido recebido da loja online',
        localizacao: 'POD EXPRESSS - Loja Virtual',
        observacao: `Pedido ${pedido.numero_pedido} importado do e-commerce`,
        created_at: new Date().toISOString()
      }]);

    // Responder com sucesso
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Pedido enviado com sucesso para a transportadora',
        data: {
          id: data.id,
          codigo_rastreio: codigoRastreio,
          pedido_origem: pedido.numero_pedido,
          status: 'pendente',
          previsao_entrega: data.previsao_entrega,
          cliente: pedido.nome_cliente,
          destino: `${pedido.endereco_entrega.cidade} - ${pedido.endereco_entrega.estado}`
        }
      })
    };

  } catch (error) {
    console.error('❌ Erro ao processar pedido:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Erro ao processar pedido',
        message: error.message
      })
    };
  }
};

/**
 * Gera um código de rastreamento único
 * Formato: EXP-CUR-SAO-YYMMDD-XX01-0001
 */
function gerarCodigoRastreio() {
  const hoje = new Date();
  const ano = hoje.getFullYear().toString().slice(-2);
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const dia = hoje.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Formato simplificado para pedidos da loja
  return `EXP-LOJA-${ano}${mes}${dia}-${random}`;
}

/**
 * Calcula a previsão de entrega baseada na localização
 */
function calcularPrevisaoEntrega(cidade, estado) {
  const hoje = new Date();
  
  // Prazo em dias úteis baseado no estado
  let diasUteis = 5; // Padrão para outros estados
  
  if (estado === 'PR') {
    // Paraná - entrega mais rápida
    diasUteis = cidade.toLowerCase().includes('curitiba') ? 2 : 3;
  } else if (['SP', 'SC', 'RS'].includes(estado)) {
    // Estados próximos
    diasUteis = 4;
  } else if (['RJ', 'MG', 'ES', 'MS'].includes(estado)) {
    // Estados médio alcance
    diasUteis = 5;
  } else {
    // Estados distantes
    diasUteis = 7;
  }
  
  // Adicionar dias úteis
  let dataPrevisao = new Date(hoje);
  let diasAdicionados = 0;
  
  while (diasAdicionados < diasUteis) {
    dataPrevisao.setDate(dataPrevisao.getDate() + 1);
    const diaSemana = dataPrevisao.getDay();
    
    // Pular fins de semana (0 = domingo, 6 = sábado)
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++;
    }
  }
  
  return dataPrevisao.toISOString();
}
