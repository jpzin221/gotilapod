import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Não detectar sessão na URL
  },
  realtime: {
    params: {
      eventsPerSecond: 2 // Limitar eventos em tempo real
    }
  },
  global: {
    headers: {
      'x-client-info': 'loja-vape',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  db: {
    schema: 'public'
  }
});

// Funções auxiliares para produtos
export const productService = {
  // Listar todos os produtos com sabores
  async getAll() {
    const timestamp = new Date().getTime();
    console.log(`📦 Buscando produtos do banco... [${timestamp}]`);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        flavors:product_flavors(
          id,
          stock,
          is_available,
          flavor:flavors(id, name, emoji, is_active)
        )
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }

    console.log('✅ Produtos carregados:', data?.length || 0);
    console.log('  Timestamp:', new Date(timestamp).toLocaleTimeString());

    return data;
  },

  // Buscar produto por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo produto
  async create(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar produto
  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar produto
  async delete(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Deduzir estoque após compra
  async deductStock(productId, quantity) {
    console.log(`📉 Deduzindo ${quantity} unidades do produto ${productId}`);

    // Buscar produto atual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar produto:', fetchError);
      throw fetchError;
    }

    const newStock = Math.max(0, (product.stock_quantity || 0) - quantity);

    // Atualizar estoque
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar estoque:', error);
      throw error;
    }

    console.log(`✅ Estoque atualizado: ${product.stock_quantity} → ${newStock}`);
    return data;
  }
};

// Funções para configurações da loja
export const storeService = {
  // Buscar configurações
  async getSettings() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar configurações
  async updateSettings(settings) {
    const { data, error } = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar horário de funcionamento
  async updateHours(hours) {
    const { data, error } = await supabase
      .from('store_settings')
      .update({ business_hours: hours })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Funções para lojas físicas
export const physicalStoresService = {
  // Listar todas as lojas ativas
  async getAll() {
    const { data, error } = await supabase
      .from('physical_stores')
      .select('*')
      .eq('is_active', true)
      .order('city', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Buscar loja mais próxima
  async findNearest(userLat, userLon) {
    const stores = await this.getAll();
    if (!stores || stores.length === 0) return null;

    // Calcular distância para cada loja
    const storesWithDistance = stores.map(store => {
      const distance = calculateDistance(
        userLat,
        userLon,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
      return { ...store, distance };
    });

    // Ordenar por distância e retornar a mais próxima
    storesWithDistance.sort((a, b) => a.distance - b.distance);
    return storesWithDistance[0];
  },

  // Buscar lojas por cidade
  async getByCity(city) {
    const { data, error } = await supabase
      .from('physical_stores')
      .select('*')
      .eq('city', city)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
};

// Função auxiliar para calcular distância (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Funções de autenticação
export const authService = {
  // Login
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Verificar sessão atual
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Listener de mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Serviço para gerenciar slides do carrossel
export const carouselService = {
  // Listar todos os slides ativos ordenados
  async getActiveSlides() {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Listar todos os slides (admin)
  async getAll() {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Buscar slide por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo slide
  async create(slide) {
    const { data, error } = await supabase
      .from('carousel_slides')
      .insert([slide])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar slide
  async update(id, updates) {
    const { data, error } = await supabase
      .from('carousel_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar slide
  async delete(id) {
    const { error } = await supabase
      .from('carousel_slides')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Reordenar slides
  async reorder(slideIds) {
    // Atualizar cada slide individualmente
    const promises = slideIds.map((id, index) =>
      supabase
        .from('carousel_slides')
        .update({ display_order: index + 1 })
        .eq('id', id)
    );

    const results = await Promise.all(promises);

    // Verificar se houve algum erro
    const error = results.find(r => r.error);
    if (error) throw error.error;
  }
};

// Serviço de Sabores (Flavors)
export const flavorService = {
  // Listar todos sabores ativos
  async getActive() {
    const { data, error } = await supabase
      .from('flavors')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Listar todos sabores (admin)
  async getAll() {
    const { data, error } = await supabase
      .from('flavors')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Criar sabor
  async create(flavor) {
    const { data, error } = await supabase
      .from('flavors')
      .insert([flavor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar sabor
  async update(id, updates) {
    const { data, error } = await supabase
      .from('flavors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar sabor
  async delete(id) {
    const { error } = await supabase
      .from('flavors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Serviço de Sabores de Produtos
export const productFlavorService = {
  // Obter sabores de um produto
  async getByProduct(productId) {
    const { data, error } = await supabase
      .from('product_flavors')
      .select(`
        *,
        flavor:flavors(*)
      `)
      .eq('product_id', productId)
      .eq('is_available', true);

    if (error) throw error;
    return data;
  },

  // Adicionar sabores a um produto
  async addFlavors(productId, flavorIds) {
    const records = flavorIds.map(flavorId => ({
      product_id: productId,
      flavor_id: flavorId
    }));

    const { data, error } = await supabase
      .from('product_flavors')
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  },

  // Remover todos sabores de um produto
  async removeAll(productId) {
    const { error } = await supabase
      .from('product_flavors')
      .delete()
      .eq('product_id', productId);

    if (error) throw error;
  },

  // Atualizar sabores de um produto (remove antigos e adiciona novos)
  async updateProductFlavors(productId, flavorIds) {
    // Remove sabores antigos
    await this.removeAll(productId);

    // Adiciona novos sabores
    if (flavorIds && flavorIds.length > 0) {
      await this.addFlavors(productId, flavorIds);
    }
  }
};

// Serviço de upload de imagens
export const imageUploadService = {
  // Função para sanitizar nome do arquivo (remove acentos e caracteres especiais)
  sanitizeFileName(str) {
    return str
      .normalize('NFD')                    // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '')     // Remove diacríticos (acentos)
      .replace(/[—–]/g, '-')               // Substitui travessões por hífen
      .replace(/[^a-zA-Z0-9\-_.]/g, '')    // Remove caracteres não-alfanuméricos
      .replace(/\s+/g, '-')                // Espaços viram hífen
      .replace(/-+/g, '-')                 // Múltiplos hífens viram um só
      .replace(/^-|-$/g, '')               // Remove hífens no início/fim
      .toLowerCase();
  },

  // Upload de imagem para o bucket 'product-images'
  async uploadProductImage(file, productName) {
    try {
      // Gerar nome único e SANITIZADO para o arquivo
      const fileExt = file.name.split('.').pop().toLowerCase();
      const sanitizedName = this.sanitizeFileName(productName || 'produto');
      const fileName = `${sanitizedName}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('📤 Upload:', { originalName: productName, sanitizedPath: filePath });

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('✅ Upload OK:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      throw error;
    }
  },

  // Deletar imagem do storage
  async deleteProductImage(imageUrl) {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = imageUrl.split('/product-images/');
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  },

  // Upload de imagem para carrossel
  async uploadCarouselImage(file, type = 'desktop') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `carousel-${type}-${Date.now()}.${fileExt}`;
      const filePath = `carousel/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem do carrossel:', error);
      throw error;
    }
  },

  // Upload genérico de imagem (para configurações do site)
  async upload(file, folder = 'config') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }
};

// Serviço de Depoimentos
export const testimonialService = {
  // Listar depoimentos aprovados e visíveis (para o site)
  async getApproved() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('aprovado', true)
      .eq('visivel', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Listar todos os depoimentos (para admin)
  async getAll() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Listar depoimentos pendentes de aprovação
  async getPending() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('aprovado', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Upload de imagem para depoimento
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('testimonial-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('testimonial-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Criar novo depoimento
  async create(testimonial) {
    const { data, error } = await supabase
      .from('testimonials')
      .insert([{
        nome: testimonial.nome,
        telefone: testimonial.telefone,
        email: testimonial.email,
        depoimento: testimonial.depoimento,
        avaliacao: testimonial.avaliacao,
        pedido_id: testimonial.pedido_id || null,
        imagens: testimonial.imagens || null,
        aprovado: false, // Sempre começa não aprovado
        visivel: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Aprovar depoimento
  async approve(id) {
    const { data, error } = await supabase
      .from('testimonials')
      .update({
        aprovado: true,
        aprovado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Reprovar/ocultar depoimento
  async reject(id) {
    const { data, error } = await supabase
      .from('testimonials')
      .update({
        aprovado: false,
        visivel: false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alternar visibilidade
  async toggleVisibility(id, visivel) {
    const { data, error } = await supabase
      .from('testimonials')
      .update({ visivel })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar depoimento
  async delete(id) {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Atualizar depoimento
  async update(id, updates) {
    const { data, error } = await supabase
      .from('testimonials')
      .update({
        nome: updates.nome,
        depoimento: updates.depoimento,
        avaliacao: updates.avaliacao,
        created_at: updates.created_at,
        imagens: updates.imagens || null
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }
};

// Serviço de Usuários (Autenticação por Telefone)
export const usuarioService = {
  // ...
  async getByPhone(telefone) {
    console.log('🔍 Buscando usuário:', telefone);

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao buscar usuário:', error);
      throw error;
    }

    console.log(data ? '✅ Usuário encontrado' : '❌ Usuário não encontrado');
    return data;
  },

  // Criar novo usuário com PIN
  async create(userData) {
    console.log('📝 Criando usuário:', userData.telefone);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        telefone: userData.telefone,
        pin_hash: userData.pin,
        nome: userData.nome,
        cpf: userData.cpf || null,
        email: userData.email || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }

    console.log('✅ Usuário criado:', data.id);
    return data;
  },

  // Verificar PIN (diretamente no Supabase)
  async verifyPin(telefone, pin) {
    try {
      const user = await this.getByPhone(telefone);

      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      if (user.pin_hash !== pin) {
        return { success: false, error: 'PIN incorreto' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('❌ Erro ao verificar PIN:', error);
      return { success: false, error: 'Erro ao verificar PIN' };
    }
  }
};

// Serviço de Pedidos
export const pedidoService = {
  // Gerar código único do pedido (formato: #XP-123456)
  generateOrderCode() {
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `#XP-${timestamp}${random}`;
  },

  // Criar pedido
  async create(pedidoData) {
    console.log('📦 Criando pedido no banco...');
    console.log('📦 Dados recebidos:', JSON.stringify(pedidoData, null, 2));

    // Gerar código único se não existir
    if (!pedidoData.numero_pedido) {
      pedidoData.numero_pedido = this.generateOrderCode();
    }

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar pedido:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem:', error.message);
        console.error('❌ Detalhes:', error.details);
        console.error('❌ Hint:', error.hint);
        throw error;
      }

      console.log('✅ Pedido criado com sucesso:', data.numero_pedido);
      console.log('✅ ID do pedido:', data.id);
      return data;
    } catch (err) {
      console.error('❌ ERRO CRÍTICO ao criar pedido:', err);
      throw err;
    }
  },

  // Buscar pedidos do usuário
  async getByUsuario(usuarioId) {
    console.log('📋 Buscando pedidos do usuário:', usuarioId);

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      throw error;
    }

    console.log('✅ Pedidos encontrados:', data?.length || 0);
    return data || [];
  },

  // Buscar pedidos por telefone (fallback quando não há usuario_id)
  async getByTelefone(telefone) {
    console.log('📋 Buscando pedidos por telefone:', telefone);

    // Limpar telefone (remover tudo exceto números)
    const telefoneLimpo = telefone.replace(/\D/g, '');

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_telefone', telefoneLimpo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar pedidos por telefone:', error);
      throw error;
    }

    console.log('✅ Pedidos encontrados por telefone:', data?.length || 0);
    return data || [];
  },

  // Vincular pedido a um usuário
  async vincularUsuario(pedidoId, usuarioId) {
    console.log('🔗 Vinculando pedido', pedidoId, 'ao usuário', usuarioId);

    const { data, error } = await supabase
      .from('pedidos')
      .update({ usuario_id: usuarioId })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao vincular pedido:', error);
      throw error;
    }

    console.log('✅ Pedido vinculado com sucesso!');
    return data;
  }
};

// Funções para configurações do banner de promoções
export const promotionBannerService = {
  // Buscar configurações do banner
  async getSettings() {
    const { data, error } = await supabase
      .from('promotion_banner_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar configurações do banner
  async updateSettings(settings) {
    const { data, error } = await supabase
      .from('promotion_banner_settings')
      .update(settings)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Serviço de Gateways de Pagamento
export const paymentGatewayService = {
  // Buscar todos os gateways
  async getAll() {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Buscar gateways ativos
  async getActive() {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar gateway padrão
  async getDefault() {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar gateway por provider
  async getByProvider(provider) {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Atualizar gateway
  async update(id, updates) {
    const { data, error } = await supabase
      .from('payment_gateways')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Serviço de Configurações do Site
export const siteConfigService = {
  // Buscar todas as configurações
  async getAll() {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .order('category');

    if (error) throw error;

    // Converter para objeto key-value
    const config = {};
    data?.forEach(item => {
      config[item.key] = item.value;
    });
    return config;
  },

  // Buscar como array completo (para admin)
  async getAllFull() {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .order('category, key');

    if (error) throw error;
    return data || [];
  },

  // Buscar por categoria
  async getByCategory(category) {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .eq('category', category)
      .order('key');

    if (error) throw error;
    return data || [];
  },

  // Buscar valor de uma chave
  async get(key) {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || null;
  },

  // Atualizar uma configuração
  async update(key, value) {
    const { data, error } = await supabase
      .from('site_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar múltiplas configurações
  async updateBatch(configs) {
    const promises = Object.entries(configs).map(([key, value]) =>
      this.update(key, value)
    );
    return Promise.all(promises);
  },

  // Criar nova configuração (se não existir)
  async upsert(key, value, type = 'text', category = 'general', label = '') {
    const { data, error } = await supabase
      .from('site_config')
      .upsert({
        key,
        value,
        type,
        category,
        label,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============================================
// CATEGORY SERVICE
// ============================================
export const categoryService = {
  // Listar todas as categorias
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar categoria por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar categoria por slug
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova categoria
  async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryData.description,
        icon: categoryData.icon,
        display_order: categoryData.display_order || 0,
        is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar categoria
  async update(id, categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar categoria
  async delete(id) {
    // Verificar se há produtos usando esta categoria
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count > 0) {
      throw new Error(`Não é possível deletar. Existem ${count} produtos nesta categoria.`);
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Reordenar categorias
  async reorder(categoryIds) {
    const updates = categoryIds.map((id, index) => ({
      id,
      display_order: index
    }));

    const { error } = await supabase
      .from('categories')
      .upsert(updates);

    if (error) throw error;
    return true;
  }
};
