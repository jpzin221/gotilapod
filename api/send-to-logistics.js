import { createClient } from '@supabase/supabase-js';

const LOGISTICS_SUPABASE_URL = 'https://xsygzynmfzvpsvfivdoz.supabase.co';
const LOGISTICS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzeWd6eW5tZnp2cHN2Zml2ZG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODIzNDUsImV4cCI6MjA3ODM1ODM0NX0.Ai15O3OaAra0ctWiHLfsvGdJSNdA6lOAissz2QjT5jA';
const supabaseLogistics = createClient(LOGISTICS_SUPABASE_URL, LOGISTICS_SUPABASE_ANON_KEY);

function gerarCodigoRastreio() {
  const hoje = new Date();
  const ano = hoje.getFullYear().toString().slice(-2);
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const dia = hoje.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EXP-LOJA-${ano}${mes}${dia}-${random}`;
}

function calcularPrevisaoEntrega(cidade, estado) {
  const hoje = new Date();
  let diasUteis = 5;
  if (estado === 'PR') diasUteis = cidade?.toLowerCase().includes('curitiba') ? 2 : 3;
  else if (['SP', 'SC', 'RS'].includes(estado)) diasUteis = 4;
  else if (['RJ', 'MG', 'ES', 'MS'].includes(estado)) diasUteis = 5;
  else diasUteis = 7;

  let dataPrevisao = new Date(hoje);
  let diasAdicionados = 0;
  while (diasAdicionados < diasUteis) {
    dataPrevisao.setDate(dataPrevisao.getDate() + 1);
    const diaSemana = dataPrevisao.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) diasAdicionados++;
  }
  return dataPrevisao.toISOString();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pedido = req.body;
    if (!pedido.numero_pedido) return res.status(400).json({ success: false, error: 'Número do pedido é obrigatório' });
    if (!pedido.nome_cliente) return res.status(400).json({ success: false, error: 'Nome do cliente é obrigatório' });
    if (!pedido.endereco_entrega) return res.status(400).json({ success: false, error: 'Endereço de entrega é obrigatório' });

    const codigoRastreio = gerarCodigoRastreio();

    const dadosTransportadora = {
      codigo_rastreio: codigoRastreio,
      pedido_origem_id: pedido.numero_pedido,
      cliente: pedido.nome_cliente,
      cpf: pedido.cpf_cliente || null,
      telefone: pedido.telefone || null,
      origem: 'GorilaPod - Loja Virtual',
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
      valor: pedido.valor_total || 0,
      itens: pedido.itens || [],
      quantidade_itens: pedido.itens ? pedido.itens.length : 0,
      status: 'pendente',
      status_detalhado: 'Pedido recebido da loja',
      data_pedido: pedido.pago_em || new Date().toISOString(),
      previsao_entrega: calcularPrevisaoEntrega(pedido.endereco_entrega.cidade, pedido.endereco_entrega.estado),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      origem_sistema: 'loja_online',
      pago: pedido.pago || false,
      txid: pedido.txid || null
    };

    const { data, error } = await supabaseLogistics.from('pedidos').insert([dadosTransportadora]).select().single();
    if (error) return res.status(500).json({ success: false, error: 'Erro ao registrar pedido na transportadora', details: error.message });

    await supabaseLogistics.from('historico_rastreamento').insert([{
      pedido_id: data.id, status: 'pendente', descricao: 'Pedido recebido da loja online',
      localizacao: 'GorilaPod - Loja Virtual', observacao: `Pedido ${pedido.numero_pedido} importado do e-commerce`,
      created_at: new Date().toISOString()
    }]);

    return res.status(200).json({
      success: true, message: 'Pedido enviado com sucesso',
      data: { id: data.id, codigo_rastreio: codigoRastreio, pedido_origem: pedido.numero_pedido, status: 'pendente', previsao_entrega: data.previsao_entrega }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro ao processar pedido', message: error.message });
  }
}
