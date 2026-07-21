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
      // Criar usuário via Supabase
      const newUser = await usuarioService.create({
        telefone: phone,
        pin,
        nome
      });

      // Salvar no localStorage para sessão
      localStorage.setItem('phoneAuthUser', JSON.stringify(newUser));

      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Erro ao registrar:', error);
      return { success: false, error: error.message };
    }
  };

  // Login com telefone + PIN
  const login = async (phone, pin) => {
    try {
      // Verificar PIN no Supabase
      const result = await usuarioService.verifyPin(phone, pin);

      if (!result.success) {
        return result;
      }

      // Buscar pedidos do usuário por ID
      let pedidos = await pedidoService.getByUsuario(result.user.id);

      // Se não encontrou por ID, buscar por telefone (pedidos antigos não vinculados)
      if (pedidos.length === 0) {
        pedidos = await pedidoService.getByTelefone(phone);

        // Vincular pedidos órfãos ao usuário
        for (const pedido of pedidos) {
          if (!pedido.usuario_id) {
            try {
              await pedidoService.vincularUsuario(pedido.id, result.user.id);
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
  };

  // Adicionar pedido ao usuário (pedido já existe no banco, apenas atualiza contexto)
  const addPedido = async (pedido) => {
    if (!user) {
      return;
    }

    try {
      // Pedido já foi criado no banco, apenas adicionar ao contexto local
      const updatedUser = {
        ...user,
        pedidos: [pedido, ...(user.pedidos || [])]
      };

      // Atualizar localStorage
      localStorage.setItem('phoneAuthUser', JSON.stringify(updatedUser));

      setUser(updatedUser);
    } catch (error) {
      console.error('❌ Erro ao adicionar pedido ao contexto:', error);
    }
  };

  // Verificar se usuário já existe
  const userExists = async (phone) => {
    try {
      const user = await usuarioService.getByPhone(phone);
      const exists = !!user;
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
