import { createContext, useContext, useState, useEffect } from 'react';
import { usuarioService, pedidoService } from '../lib/supabase';

const PhoneAuthContext = createContext();

export function PhoneAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const storedUser = localStorage.getItem('phoneAuthUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('phoneAuthUser');
      }
    }
    setLoading(false);
  }, []);

  // Registrar novo usuário (após primeira compra)
  const register = async (phone, pin, nome) => {
    try {
      console.log('📝 Registrando usuário:', phone);

      // Criar usuário via Supabase
      const newUser = await usuarioService.create({
        telefone: phone,
        pin,
        nome
      });

      console.log('✅ Usuário criado:', newUser);

      // Salvar no localStorage para sessão
      localStorage.setItem('phoneAuthUser', JSON.stringify(newUser));

      setUser(newUser);

      console.log('✅ Usuário registrado e logado com sucesso!');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Erro ao registrar:', error);
      return { success: false, error: error.message };
    }
  };

  // Login com telefone + PIN
  const login = async (phone, pin) => {
    try {
      console.log('🔐 Tentando login:', phone);

      // Verificar PIN no Supabase
      const result = await usuarioService.verifyPin(phone, pin);

      if (!result.success) {
        return result;
      }

      // Buscar pedidos do usuário por ID
      let pedidos = await pedidoService.getByUsuario(result.user.id);

      // Se não encontrou por ID, buscar por telefone (pedidos antigos não vinculados)
      if (pedidos.length === 0) {
        console.log('🔍 Buscando pedidos por telefone...');
        pedidos = await pedidoService.getByTelefone(phone);

        // Vincular pedidos órfãos ao usuário
        for (const pedido of pedidos) {
          if (!pedido.usuario_id) {
            try {
              await pedidoService.vincularUsuario(pedido.id, result.user.id);
              console.log('🔗 Pedido', pedido.id, 'vinculado ao usuário');
            } catch (err) {
              console.error('Erro ao vincular pedido:', err);
            }
          }
        }
      }

      const userData = { ...result.user, pedidos };

      // Salvar no localStorage para sessão
      localStorage.setItem('phoneAuthUser', JSON.stringify(userData));
      setUser(userData);

      console.log('✅ Login realizado com sucesso!');
      console.log('📦 Pedidos encontrados:', pedidos.length);
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('phoneAuthUser');
    setUser(null);
    console.log('👋 Logout realizado');
  };

  // Adicionar pedido ao usuário (pedido já existe no banco, apenas atualiza contexto)
  const addPedido = async (pedido) => {
    if (!user) {
      console.warn('⚠️ Não há usuário logado para adicionar pedido');
      return;
    }

    try {
      console.log('📦 Adicionando pedido ao contexto do usuário:', pedido);

      // Pedido já foi criado no banco, apenas adicionar ao contexto local
      const updatedUser = {
        ...user,
        pedidos: [pedido, ...(user.pedidos || [])]
      };

      // Atualizar localStorage
      localStorage.setItem('phoneAuthUser', JSON.stringify(updatedUser));

      setUser(updatedUser);
      console.log('✅ Pedido adicionado ao contexto do usuário');
      console.log('📊 Total de pedidos:', updatedUser.pedidos.length);
    } catch (error) {
      console.error('❌ Erro ao adicionar pedido ao contexto:', error);
    }
  };

  // Verificar se usuário já existe
  const userExists = async (phone) => {
    try {
      console.log('🔍 PhoneAuthContext: Verificando telefone:', phone);
      const user = await usuarioService.getByPhone(phone);
      console.log('📊 PhoneAuthContext: Usuário encontrado:', user);
      const exists = !!user;
      console.log('✅ PhoneAuthContext: Resultado exists:', exists);
      return exists;
    } catch (error) {
      console.error('❌ PhoneAuthContext: Erro ao verificar:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    addPedido,
    userExists,
    isAuthenticated: !!user
  };

  return (
    <PhoneAuthContext.Provider value={value}>
      {children}
    </PhoneAuthContext.Provider>
  );
}

export function usePhoneAuth() {
  const context = useContext(PhoneAuthContext);
  if (!context) {
    throw new Error('usePhoneAuth must be used within PhoneAuthProvider');
  }
  return context;
}
