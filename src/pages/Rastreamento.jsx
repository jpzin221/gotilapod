import { Clock, CheckCircle, Package, TrendingUp, MapPin, Zap, ArrowRight, Home, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import Header from '../components/Header';
import PhoneAuthModal from '../components/PhoneAuthModal';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import { storeInfo } from '../data/products';

export default function Rastreamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, addPedido, logout } = usePhoneAuth();
  const [pedidoData, setPedidoData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(() => {
    // Recuperar status salvo do sessionStorage
    const savedStatus = sessionStorage.getItem('rastreamentoStatus');
    return savedStatus ? parseInt(savedStatus) : 1;
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [userHasPin, setUserHasPin] = useState(false); // Controla se usuário já tem PIN
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [acessoNegado, setAcessoNegado] = useState(false);

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // VERIFICAÇÃO DE ACESSO - Simplificada para não bloquear após pagamento
  useEffect(() => {
    const verificarAcesso = () => {
      const justPaid = sessionStorage.getItem('justCompletedPayment');
      const lastPedido = sessionStorage.getItem('lastPedido');
      const numeroPedido = searchParams.get('pedido');

      console.log('🔍 Verificando acesso à página de rastreamento...');
      console.log('  justPaid:', justPaid);
      console.log('  lastPedido:', lastPedido ? 'existe' : 'não existe');
      console.log('  isAuthenticated:', isAuthenticated);
      console.log('  numeroPedido:', numeroPedido);

      // SIMPLIFICADO: Permitir acesso em mais cenários
      // CASO 1: Usuário acabou de fazer pagamento
      const hasValidPayment = justPaid === 'true';

      // CASO 2: Tem pedido salvo no sessionStorage
      const hasPedidoSaved = !!lastPedido;

      // CASO 3: Usuário autenticado
      const hasAuthenticatedAccess = isAuthenticated;

      // CASO 4: Tem número de pedido na URL
      const hasPedidoInUrl = !!numeroPedido;

      console.log('📊 Condições de acesso:');
      console.log('  hasValidPayment:', hasValidPayment);
      console.log('  hasPedidoSaved:', hasPedidoSaved);
      console.log('  hasAuthenticatedAccess:', hasAuthenticatedAccess);
      console.log('  hasPedidoInUrl:', hasPedidoInUrl);

      // Se não tem nenhum acesso válido, redireciona
      if (!hasValidPayment && !hasPedidoSaved && !hasAuthenticatedAccess && !hasPedidoInUrl) {
        console.log('⚠️ ACESSO NEGADO - Nenhum contexto válido');
        console.log('🔙 Redirecionando para home...');

        setAcessoNegado(true);
        setVerificandoAcesso(false);

        // Redireciona após delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
        return;
      }

      console.log('✅ Acesso permitido');
      setVerificandoAcesso(false);
    };

    // Delay pequeno para garantir que estados estejam prontos
    const timer = setTimeout(verificarAcesso, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate, searchParams]);

  // Carregar dados do pedido
  useEffect(() => {
    // Só carrega se acesso foi permitido
    if (verificandoAcesso || acessoNegado) return;

    console.log('📦 Carregando dados do pedido...');

    // Função para formatar pedido (parse de JSON strings)
    const formatarPedido = (pedido) => {
      if (!pedido) return null;

      try {
        return {
          ...pedido,
          endereco_entrega: typeof pedido.endereco_entrega === 'string'
            ? JSON.parse(pedido.endereco_entrega)
            : pedido.endereco_entrega,
          itens: typeof pedido.itens === 'string'
            ? JSON.parse(pedido.itens)
            : pedido.itens
        };
      } catch (error) {
        console.error('Erro ao formatar pedido:', error);
        return pedido;
      }
    };

    // Limpar sessão PIX antiga se existir
    const sessionData = localStorage.getItem('pixPaymentSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.paymentStatus === 'paid') {
          console.log('🗑️ Limpando sessão PIX antiga');
          localStorage.removeItem('pixPaymentSession');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    }

    // Tentar carregar do sessionStorage
    const lastPedidoStr = sessionStorage.getItem('lastPedido');
    if (lastPedidoStr) {
      try {
        const pedido = JSON.parse(lastPedidoStr);
        const pedidoFormatado = formatarPedido(pedido);
        console.log('📦 Pedido carregado do sessionStorage:', pedidoFormatado);
        console.log('📱 Telefone:', pedidoFormatado?.telefone || pedidoFormatado?.cliente_telefone);
        console.log('👤 Nome:', pedidoFormatado?.nome_cliente || pedidoFormatado?.nomeCliente || pedidoFormatado?.cliente_nome);
        console.log('🏠 Endereço:', pedidoFormatado?.endereco_entrega);
        setPedidoData(pedidoFormatado);
      } catch (error) {
        console.error('Erro ao carregar último pedido:', error);
      }
    } else {
      console.warn('⚠️ Nenhum pedido encontrado no sessionStorage');
    }
  }, [verificandoAcesso, acessoNegado]);

  // Verificar autenticação e mostrar modal de registro
  useEffect(() => {
    console.log('🎬 useEffect de verificação de autenticação executado');
    console.log('  verificandoAcesso:', verificandoAcesso);
    console.log('  acessoNegado:', acessoNegado);
    console.log('  pedidoData:', pedidoData);

    // Só executa se acesso foi permitido e pedido foi carregado
    if (verificandoAcesso || acessoNegado || !pedidoData) {
      console.log('⏸️ Verificação pausada - aguardando dados');
      return;
    }

    const justPaid = sessionStorage.getItem('justCompletedPayment');
    const lastPedidoStr = sessionStorage.getItem('lastPedido');

    // VERIFICAR SE USUÁRIO JÁ EXISTE NO BANCO
    // Se não estiver autenticado E acabou de pagar, verificar se telefone existe
    console.log('🔍 Verificação de autenticação:');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  justPaid:', justPaid);
    console.log('  lastPedidoStr:', lastPedidoStr ? 'existe' : 'vazio');
    console.log('  pedidoData:', pedidoData);

    // Se já está autenticado, não precisa pedir PIN novamente
    if (isAuthenticated && justPaid) {
      console.log('✅ Usuário já está autenticado, não precisa pedir PIN');
      console.log('🎉 Pedido será vinculado automaticamente');
      // Limpar flag de justPaid para não ficar verificando sempre
      sessionStorage.removeItem('justCompletedPayment');
      return;
    }

    // IMPORTANTE: Só pede PIN se NÃO estiver autenticado
    if (!isAuthenticated && (justPaid || pedidoData)) {
      // Se não tem pedido salvo, abrir modal direto
      if (!lastPedidoStr) {
        console.log('⚠️ Nenhum pedido encontrado no sessionStorage');
        console.log('🎯 Abrindo modal para cadastro');
        const timer = setTimeout(() => {
          console.log('🎯 Abrindo modal de registro agora!');
          setShowRegisterModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
      const checkUserExists = async () => {
        try {
          const pedidoInfo = JSON.parse(lastPedidoStr);
          // Buscar telefone em todos os campos possíveis
          const telefone = pedidoInfo.telefone || pedidoInfo.cliente_telefone;

          console.log('🔍 Verificando usuário...');
          console.log('📦 Pedido Info completo:', JSON.stringify(pedidoInfo, null, 2));
          console.log('📱 Telefone extraído (original):', telefone);
          console.log('📱 Tipo do telefone:', typeof telefone);
          console.log('📱 Telefone existe?', !!telefone);

          if (!telefone || telefone === '' || telefone === 'undefined') {
            console.log('⚠️ Telefone não encontrado ou inválido no pedido');
            console.log('🎯 Abrindo modal mesmo assim (usuário novo)');
            // Se não tem telefone, abrir modal para cadastro
            const timer = setTimeout(() => {
              console.log('🎯 Abrindo modal de registro agora!');
              setShowRegisterModal(true);
            }, 2000);
            return () => clearTimeout(timer);
          }

          // Limpar telefone (remover formatação)
          const telefoneLimpo = telefone.replace(/\D/g, '');
          console.log('📱 Telefone limpo:', telefoneLimpo);
          console.log('🔍 Verificando se telefone já existe no banco...');

          // Buscar usuário completo do banco
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const url = `${backendUrl}/api/usuarios/verificar/${telefoneLimpo}`;
          console.log('🌐 URL da requisição:', url);

          const response = await fetch(url);
          const data = await response.json();

          console.log('📡 Response status:', response.status);
          console.log('📡 Response ok:', response.ok);

          console.log('📊 Dados do usuário:', data);

          if (data.exists && data.usuario) {
            const usuario = data.usuario;
            console.log('👤 Usuário encontrado:', usuario);
            console.log('🔐 PIN value:', usuario.pin);
            console.log('🔐 PIN type:', typeof usuario.pin);
            console.log('🔐 PIN cadastrado?', !!usuario.pin);
            console.log('🔐 PIN vazio?', usuario.pin === '');
            console.log('🔐 PIN null?', usuario.pin === null);

            // Verificar se tem PIN cadastrado
            if (!usuario.pin || usuario.pin === '' || usuario.pin === null) {
              console.log('⚠️ Usuário existe mas NÃO tem PIN cadastrado!');
              console.log('📝 Abrindo modal para cadastrar PIN...');
              // Usuário existe mas não tem PIN, precisa cadastrar
              setUserHasPin(false); // Não tem PIN
              const timer = setTimeout(() => {
                console.log('🎯 Abrindo modal de registro agora!');
                setShowRegisterModal(true);
              }, 2000);

              return () => clearTimeout(timer);
            } else {
              console.log('✅ Usuário já existe e tem PIN cadastrado');

              // IMPORTANTE: Se já está autenticado, NÃO pedir PIN novamente
              if (isAuthenticated) {
                console.log('✅ Usuário já está autenticado, não precisa fazer login novamente');
                return;
              }

              console.log('🔐 Abrindo modal para fazer login com PIN...');

              // Usuário existe e tem PIN, mas NÃO está autenticado - abrir modal para fazer login
              setUserHasPin(true); // Tem PIN
              const timer = setTimeout(() => {
                console.log('🎯 Abrindo modal de login agora!');
                setShowRegisterModal(true);
              }, 2000);

              return () => clearTimeout(timer);
            }
          } else {
            console.log('📝 Usuário novo detectado!');
            console.log('⏰ Aguardando 2 segundos para abrir modal...');
            // Usuário não existe, abrir modal após 2 segundos
            setUserHasPin(false); // Usuário novo, não tem PIN
            const timer = setTimeout(() => {
              console.log('🎯 Abrindo modal de registro agora!');
              setShowRegisterModal(true);
            }, 2000);

            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar usuário:', error);
          console.log('⚠️ Erro na verificação, abrindo modal por segurança...');
          // Em caso de erro, abrir modal para garantir que usuário possa se cadastrar
          const timer = setTimeout(() => {
            console.log('🎯 Abrindo modal de registro (fallback após erro)');
            setShowRegisterModal(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      };

      checkUserExists();
    }

    // Limpar flag de "acabou de pagar" após 1 minuto
    const timeout = setTimeout(() => {
      sessionStorage.removeItem('justCompletedPayment');
    }, 60000);

    return () => clearTimeout(timeout);
  }, [navigate, isAuthenticated, pedidoData, verificandoAcesso, acessoNegado]);

  // Salvar status no sessionStorage sempre que mudar
  useEffect(() => {
    if (currentStatus > 1) {
      sessionStorage.setItem('rastreamentoStatus', currentStatus.toString());
      console.log('💾 Status salvo no sessionStorage:', currentStatus);
    }
  }, [currentStatus]);

  // Após 8 segundos, marca "Pagamento aprovado" como concluído (verde)
  useEffect(() => {
    // Só executar o timer se ainda estiver no status 1
    if (currentStatus !== 1) {
      console.log('⏭️ Status já avançado, pulando timer');
      return;
    }

    console.log('⏰ Timer iniciado - aguardando 8 segundos...');
    console.log('📊 Status atual:', currentStatus);

    const timer = setTimeout(() => {
      console.log('✅ 8 segundos passados - Pagamento aprovado confirmado!');
      console.log('🔄 Mudando status de', currentStatus, 'para 2');
      setCurrentStatus(2); // Avança para "Preparando pedido"
    }, 8000);

    return () => {
      console.log('🧹 Limpando timer');
      clearTimeout(timer);
    };
  }, [currentStatus]);

  // Log quando currentStatus mudar
  useEffect(() => {
    console.log('📊 currentStatus atualizado para:', currentStatus);
    const safe = Math.min(Math.max(0, Math.floor(currentStatus)), 9); // 9 = steps.length - 1
    console.log('🎨 safeCurrentStatus:', safe);
    console.log('✅ isCompleted (index 1)?', currentStatus >= 1.5 ? 1 <= 1 : 1 < currentStatus);
  }, [currentStatus]);

  // Callback de sucesso do registro
  const handleRegisterSuccess = async (userData) => {
    console.log('✅ Registro concluído com sucesso!');
    console.log('📊 userData recebido:', userData);
    console.log('📊 userData.user:', userData?.user);
    console.log('📦 Dados do pedido atual:', pedidoData);

    // Extrair usuário correto (pode vir em userData.user)
    const usuario = userData?.user || userData;
    console.log('👤 Usuário extraído:', usuario);
    console.log('🆔 ID do usuário:', usuario?.id);

    // Vincular pedido ao usuário recém-criado
    if (pedidoData && pedidoData.id) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

        console.log('🔗 Vinculando pedido ao usuário...');
        console.log('🆔 Pedido ID:', pedidoData.id);
        console.log('👤 Usuário ID:', usuario?.id);

        const response = await fetch(`${backendUrl}/api/pedidos/${pedidoData.id}/vincular-usuario`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuario.id })
        });

        const result = await response.json();
        console.log('📊 Resultado da vinculação:', result);

        if (result.success) {
          console.log('✅ Pedido vinculado ao usuário com sucesso!');

          // Adicionar pedido ao contexto para aparecer em "Meus Pedidos"
          if (addPedido && pedidoData.numero_pedido) {
            console.log('📦 Adicionando pedido ao contexto...');
            addPedido({
              numero_pedido: pedidoData.numero_pedido || pedidoData.numeroPedido,
              id: pedidoData.id,
              status: pedidoData.status || 'confirmado',
              valor_total: pedidoData.valor_total || pedidoData.valorTotal,
              created_at: pedidoData.created_at || new Date().toISOString()
            });
            console.log('✅ Pedido adicionado ao contexto!');
          }
        } else {
          console.error('❌ Erro ao vincular pedido:', result.error);
        }
      } catch (error) {
        console.error('❌ Erro ao vincular pedido:', error);
      }
    } else {
      console.warn('⚠️ Não foi possível vincular pedido - dados não disponíveis');
      console.log('📦 pedidoData:', pedidoData);
    }

    // Fechar modal
    setShowRegisterModal(false);

    // Forçar recarregamento da página para atualizar estado de autenticação
    console.log('🔄 Recarregando página para atualizar autenticação...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const steps = [
    { id: 0, label: 'Pedido recebido', icon: CheckCircle, desc: 'Recebemos seu pedido' },
    { id: 1, label: 'Pagamento aprovado', icon: TrendingUp, desc: 'Pagamento confirmado' },
    { id: 2, label: 'Preparando pedido', icon: Package, desc: 'Separando produtos' },
    { id: 3, label: 'Aguardando coleta', icon: Clock, desc: 'Pronto para envio' },
    { id: 4, label: 'Aguardando transportadora', icon: Clock, desc: 'Aguardando entregador' },
    { id: 5, label: 'Pedido coletado', icon: CheckCircle, desc: 'Coletado pela transportadora' },
    { id: 6, label: 'Entregador iniciou rota', icon: TrendingUp, desc: 'Rota de entrega iniciada' },
    { id: 7, label: 'Entregador saiu', icon: ArrowRight, desc: 'Saiu para entrega' },
    { id: 8, label: 'Indo em sua direção', icon: MapPin, desc: 'Chegando em breve' },
    { id: 9, label: 'Entregue', icon: CheckCircle, desc: 'Pedido entregue!' }
  ];

  // Garantir que currentStatus está dentro dos limites
  const safeCurrentStatus = Math.min(Math.max(0, Math.floor(currentStatus)), steps.length - 1);
  const currentStep = steps[safeCurrentStatus] || steps[1]; // Fallback para step 1
  const progressPercent = (safeCurrentStatus / (steps.length - 1)) * 100;
  const orderId = pedidoData?.numero_pedido || pedidoData?.numeroPedido || '#XP-000000';
  const estimatedTime = '40-50 minutos';
  const deliveryPerson = '#ALE-302';

  // Formatar valor total
  const formatPrice = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // SE ACESSO FOI NEGADO, MOSTRAR MENSAGEM
  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Esta página só pode ser acessada após realizar uma compra ou através do seu perfil.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para a página inicial...
          </p>
        </div>
      </div>
    );
  }

  // SE AINDA ESTÁ VERIFICANDO, MOSTRAR LOADING
  if (verificandoAcesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // SE PEDIDO AINDA NÃO FOI CARREGADO, MOSTRAR LOADING
  if (!pedidoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <Header storeInfo={storeInfo} />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-8">
        {/* Header do Pedido */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pedido Confirmado!</h1>
                <p className="text-gray-600">Acompanhe seu pedido em tempo real</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">Número do Pedido</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{orderId}</p>
            </div>
          </div>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-primary hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 font-semibold">Status Atual</p>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{currentStep.label}</p>
            <p className="text-sm text-gray-500 mt-1">{currentStep.desc}</p>
            {safeCurrentStatus === 5 && (
              <p className="text-xs text-primary font-semibold mt-2 flex items-center gap-1">
                🏍️ Entregador: {deliveryPerson}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-secondary hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-pink-600 flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 font-semibold">Tempo Estimado</p>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-secondary to-pink-600 bg-clip-text text-transparent">{estimatedTime}</p>
            <div className="w-full bg-gray-200 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-secondary via-pink-500 to-pink-600 h-2.5 rounded-full transition-all duration-500 progress-shimmer"
                style={{
                  width: '65%',
                  background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 25%, #ec4899 50%, #db2777 75%, #be185d 100%)'
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 font-semibold">Progresso</p>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">{Math.round(progressPercent)}%</p>
            <p className="text-sm text-gray-500 mt-1">{safeCurrentStatus + 1} de {steps.length} etapas concluídas</p>
          </div>
        </div>

        {/* Timeline de Rastreamento */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            📍 Rastreamento em Tempo Real
          </h2>

          <div className="mb-2 overflow-x-auto pb-4 pt-2" style={{ overflowY: 'visible', minHeight: '140px' }}>
            <div className="relative min-w-[800px] py-3">
              {/* Linha de fundo */}
              <div className="absolute top-10 left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
              {/* Linha de progresso - GRADIENTE MODERNO COM SHIMMER */}
              <div
                className="absolute top-10 left-0 h-1.5 rounded-full transition-all duration-1000 ease-out progress-shimmer"
                style={{
                  width: `${progressPercent}%`,
                  background: safeCurrentStatus >= 2
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 25%, #10b981 50%, #059669 75%, #047857 100%)' // Verde com shimmer
                    : 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 25%, #8b5cf6 50%, #7c3aed 75%, #6d28d9 100%)', // Roxo com shimmer
                  boxShadow: safeCurrentStatus >= 2
                    ? '0 2px 12px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)'
                    : '0 2px 12px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)'
                }}
              />

              {/* Etapas */}
              <div className="relative flex justify-between z-10">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < safeCurrentStatus;
                  const isCurrent = index === safeCurrentStatus;

                  return (
                    <div key={step.id} className="flex flex-col items-center min-h-[100px] py-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${isCompleted
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg ring-2 ring-green-200'
                          : isCurrent
                            ? 'bg-gradient-to-br from-primary via-purple-600 to-secondary text-white shadow-xl ring-4 ring-purple-200 scale-110'
                            : 'bg-gray-200 text-gray-400'
                          }`}
                        style={{
                          boxShadow: isCompleted
                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                            : isCurrent
                              ? '0 6px 20px rgba(139, 92, 246, 0.5)'
                              : 'none'
                        }}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <p
                        className={`text-[10px] text-center transition-all duration-500 leading-tight ${isCurrent
                          ? 'text-primary font-bold'
                          : isCompleted
                            ? 'text-green-600 font-semibold'
                            : 'text-gray-400'
                          }`}
                        style={{ maxWidth: '70px' }}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Etapas Principais - SEM SCROLL */}
          <div className="space-y-2 mt-2">
            <h3 className="text-base font-bold text-gray-800 mb-2">📋 Status do Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative pb-4">
              {/* Etapa Anterior (Concluída) */}
              {safeCurrentStatus > 1 && (
                <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200 animate-slide-up opacity-60 -translate-y-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-xs font-bold text-green-700">✓ Concluído</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{steps[safeCurrentStatus - 1].label}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{steps[safeCurrentStatus - 1].desc}</p>
                </div>
              )}

              {/* Etapa Atual (Em Andamento) */}
              <div className="p-3 rounded-lg border-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary shadow-md animate-slide-in-center transform transition-all duration-500">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary">⚡ Agora</span>
                </div>
                <p className="text-base font-bold text-gray-800">
                  {safeCurrentStatus >= 1.5 ? steps[2].label : steps[1].label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {safeCurrentStatus >= 1.5 ? steps[2].desc : steps[1].desc}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <span className="text-[10px] font-bold text-primary">Em andamento</span>
                </div>
              </div>

              {/* Próxima Etapa */}
              <div className="p-3 rounded-lg border-2 bg-gray-50 border-gray-200 opacity-60 translate-y-2 transition-all duration-500">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">⏰ Próximo</span>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  {safeCurrentStatus >= 1.5 ? steps[3].label : steps[2].label}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {safeCurrentStatus >= 1.5 ? steps[3].desc : steps[2].desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Pedido */}
        {pedidoData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📦 Detalhes do Pedido</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informações do Cliente */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Cliente</h4>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Nome:</span> {pedidoData.cliente_nome || pedidoData.nome_cliente || pedidoData.nomeCliente}</p>
                  <p><span className="font-medium">CPF:</span> {pedidoData.cliente_cpf || pedidoData.cpf_cliente || pedidoData.cpfCliente}</p>
                  <p><span className="font-medium">Telefone:</span> {pedidoData.cliente_telefone || pedidoData.telefone}</p>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Endereço de Entrega</h4>
                <div className="text-sm space-y-2">
                  {(() => {
                    // Suporta tanto endereco quanto endereco_entrega
                    const endereco = pedidoData.endereco_entrega || pedidoData.endereco;
                    // Se vier como string, fazer parse
                    const enderecoObj = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;

                    if (!enderecoObj) {
                      return <p className="text-gray-500">Endereço não disponível</p>;
                    }

                    return (
                      <>
                        <p>{enderecoObj.endereco || ''}, {enderecoObj.numero || 'S/N'}</p>
                        {enderecoObj.complemento && <p>{enderecoObj.complemento}</p>}
                        <p>{enderecoObj.bairro || ''}</p>
                        <p>{enderecoObj.cidade || ''} - {enderecoObj.estado || ''}</p>
                        <p>CEP: {enderecoObj.cep || 'N/A'}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="space-y-3 md:col-span-2">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Itens</h4>
                <div className="space-y-2">
                  {pedidoData.itens?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                      <span>
                        {item.quantidade}x {item.nome}
                        {item.sabor && <span className="text-gray-600"> - {item.sabor}</span>}
                      </span>
                      <span className="font-medium">{formatPrice(item.preco * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(pedidoData.valor_total || pedidoData.valorTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card de Ajuda */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">💡 Fique Atento!</h3>
              <p className="text-sm text-gray-600 mb-3">
                Você receberá uma notificação quando o entregador sair para sua rua. Mantenha seu telefone por perto!
              </p>
              <p className="text-xs text-gray-500">
                Em caso de dúvidas, entre em contato pelo WhatsApp: <span className="font-bold text-primary">{storeInfo.phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Voltar para a Loja
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-dark via-gray-900 to-dark text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {storeInfo.name}
          </h3>
          <p className="text-gray-400 mb-4">Vaporizadores e Pods de Qualidade</p>

          {/* Instagram */}
          <div className="flex justify-center mb-4">
            <a
              href={storeInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition transform hover:scale-105 shadow-lg"
              title="Siga-nos no Instagram"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-semibold">{storeInfo.instagramHandle}</span>
            </a>
          </div>

          <p className="text-gray-500 text-xs">© 2024 {storeInfo.name}. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modal de Registro/Login (aparece após pagamento se não estiver autenticado) */}
      <PhoneAuthModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        mode={userHasPin ? "login" : "register"}
        onSuccess={handleRegisterSuccess}
        prefilledPhone={pedidoData?.telefone}
        prefilledName={pedidoData?.nome_cliente || pedidoData?.nomeCliente}
      />
    </div>
  );
}
