// Função Serverless: Carregar produtos do Supabase
// Evita expor a chave do Supabase no frontend (opcional, mas boa prática)

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Apenas GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Criar cliente Supabase com credenciais do servidor
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log('📦 Buscando produtos do Supabase...');

    // Buscar produtos com sabores
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        flavors:product_flavors(
          flavor:flavors(*)
        )
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} produtos carregados`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache de 5 minutos
      },
      body: JSON.stringify({
        success: true,
        products: data,
        count: data?.length || 0
      })
    };

  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Erro ao carregar produtos',
        message: error.message
      })
    };
  }
};
