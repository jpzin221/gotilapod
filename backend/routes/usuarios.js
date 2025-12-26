const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Função para hash do PIN
 */
function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

/**
 * POST /api/usuarios/criar-pin
 * Criar PIN para usuário após primeira compra
 */
router.post('/criar-pin', async (req, res) => {
  try {
    const { telefone, pin, nome, cpf, endereco } = req.body;

    if (!telefone || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e PIN são obrigatórios'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN deve ter 4 dígitos numéricos'
      });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const pinHash = hashPin(pin);

    console.log('🔐 Criando PIN para:', telefoneLimpo);

    // Verificar se usuário existe
    let { data: usuario, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, pin')
      .eq('telefone', telefoneLimpo)
      .single();

    if (usuario && usuario.pin) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já possui PIN cadastrado'
      });
    }

    let usuarioCompleto;

    if (usuario) {
      // Atualizar PIN do usuário existente
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ pin: pinHash })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      console.log('✅ PIN atualizado para usuário existente');
      
      // Buscar usuário completo
      const { data: userUpdated } = await supabase
        .from('usuarios')
        .select('id, telefone, nome, cpf, email, endereco_completo, created_at')
        .eq('id', usuario.id)
        .single();
      
      usuarioCompleto = userUpdated;
    } else {
      // Criar novo usuário com PIN
      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert({
          telefone: telefoneLimpo,
          pin: pinHash,
          nome: nome || '',
          cpf: cpf?.replace(/\D/g, ''),
          endereco_completo: endereco
        })
        .select('id, telefone, nome, cpf, email, endereco_completo, created_at')
        .single();

      if (insertError) throw insertError;

      console.log('✅ Novo usuário criado com PIN');
      usuarioCompleto = newUser;
    }

    res.json({
      success: true,
      message: 'PIN criado com sucesso',
      usuario: usuarioCompleto
    });

  } catch (error) {
    console.error('❌ Erro ao criar PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar PIN',
      message: error.message
    });
  }
});

/**
 * POST /api/usuarios/login
 * Login com telefone e PIN
 */
router.post('/login', async (req, res) => {
  try {
    const { telefone, pin } = req.body;

    if (!telefone || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e PIN são obrigatórios'
      });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const pinHash = hashPin(pin);

    console.log('🔑 Tentativa de login:', telefoneLimpo);

    // Buscar usuário
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, telefone, nome, cpf, email, endereco_completo, created_at')
      .eq('telefone', telefoneLimpo)
      .eq('pin', pinHash)
      .single();

    if (error || !usuario) {
      console.log('❌ Login falhou: usuário não encontrado ou PIN incorreto');
      return res.status(401).json({
        success: false,
        error: 'Telefone ou PIN incorretos'
      });
    }

    console.log('✅ Login bem-sucedido:', usuario.nome);

    // Buscar pedidos do usuário
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, status, valor_total, created_at, estimativa_entrega')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      usuario: {
        id: usuario.id,
        telefone: usuario.telefone,
        nome: usuario.nome,
        cpf: usuario.cpf,
        email: usuario.email,
        endereco: usuario.endereco_completo
      },
      pedidos: pedidos || [],
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar login'
    });
  }
});

/**
 * PUT /api/usuarios/atualizar-telefone
 * Atualizar número de telefone
 */
router.put('/atualizar-telefone', async (req, res) => {
  try {
    const { telefoneAntigo, telefoneNovo, pin } = req.body;

    if (!telefoneAntigo || !telefoneNovo || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Telefone antigo, novo e PIN são obrigatórios'
      });
    }

    const telefoneAntigoLimpo = telefoneAntigo.replace(/\D/g, '');
    const telefoneNovoLimpo = telefoneNovo.replace(/\D/g, '');
    const pinHash = hashPin(pin);

    console.log('📱 Atualizando telefone:', telefoneAntigoLimpo, '→', telefoneNovoLimpo);

    // Verificar se o usuário existe e PIN está correto
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telefone', telefoneAntigoLimpo)
      .eq('pin', pinHash)
      .single();

    if (fetchError || !usuario) {
      return res.status(401).json({
        success: false,
        error: 'Telefone ou PIN incorretos'
      });
    }

    // Verificar se o novo telefone já está em uso
    const { data: telefoneExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telefone', telefoneNovoLimpo)
      .single();

    if (telefoneExistente) {
      return res.status(400).json({
        success: false,
        error: 'Este telefone já está cadastrado'
      });
    }

    // Atualizar telefone
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ telefone: telefoneNovoLimpo })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    console.log('✅ Telefone atualizado com sucesso');

    res.json({
      success: true,
      message: 'Telefone atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar telefone:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar telefone'
    });
  }
});

/**
 * POST /api/usuarios/verificar-pin
 * Verificar PIN do usuário (compara hash)
 */
router.post('/verificar-pin', async (req, res) => {
  try {
    const { telefone, pin } = req.body;
    
    if (!telefone || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e PIN são obrigatórios'
      });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const pinHash = hashPin(pin);
    
    console.log('🔐 Verificando PIN para telefone:', telefoneLimpo);
    
    // Buscar usuário no banco
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefone', telefoneLimpo)
      .single();
    
    if (error || !usuario) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    // Verificar se tem PIN cadastrado
    if (!usuario.pin) {
      console.log('❌ Usuário não tem PIN cadastrado');
      return res.status(400).json({
        success: false,
        error: 'PIN não cadastrado'
      });
    }
    
    console.log('🔐 PIN fornecido (hash):', pinHash);
    console.log('🔐 PIN no banco:', usuario.pin);
    
    // Comparar hashes
    if (pinHash !== usuario.pin) {
      console.log('❌ PIN incorreto');
      return res.status(401).json({
        success: false,
        error: 'PIN incorreto'
      });
    }
    
    console.log('✅ PIN correto! Login bem-sucedido');
    
    // Retornar usuário (sem o PIN)
    const { pin: _, ...usuarioSemPin } = usuario;
    
    res.json({
      success: true,
      usuario: usuarioSemPin
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar PIN'
    });
  }
});

/**
 * GET /api/usuarios/verificar/:telefone
 * Verificar se usuário existe e tem PIN
 */
router.get('/verificar/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    const telefoneLimpo = telefone.replace(/\D/g, '');

    console.log('🔍 Verificando usuário:', telefoneLimpo);

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, telefone, nome, pin')
      .eq('telefone', telefoneLimpo)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const exists = !!usuario;
    const hasPin = !!(usuario && usuario.pin);

    console.log('📊 Resultado:', { exists, hasPin });

    res.json({
      success: true,
      exists,
      usuario: exists ? {
        id: usuario.id,
        telefone: usuario.telefone,
        nome: usuario.nome,
        pin: usuario.pin
      } : null
    });

  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
    res.json({
      success: true,
      exists: false,
      usuario: null
    });
  }
});

module.exports = router;
