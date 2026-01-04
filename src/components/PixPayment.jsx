import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Copy, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import Portal from './Portal';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import { pedidoService, productService } from '../lib/supabase';

export default function PixPayment({ isOpen, onClose, onBack, pedido }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, userExists, addPedido } = usePhoneAuth();
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, error
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hora em segundos
  const [error, setError] = useState(null);
  // Modal de registro foi movido para a página /rastreamento

  // Recuperar sessão PIX ao montar componente
  useEffect(() => {
    // IMPORTANTE: Só restaurar sessão se o modal estiver aberto
    if (!isOpen) return;

    const savedPixSession = localStorage.getItem('pixPaymentSession');
    if (savedPixSession) {
      try {
        const session = JSON.parse(savedPixSession);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const oneHour = 3600000; // 1 hora em ms

        // Se a sessão tem menos de 1 hora E ainda está pendente, restaurar
        if (sessionAge < oneHour && session.paymentStatus === 'pending') {
          console.log('🔄 Restaurando sessão PIX pendente...', session);
          setPixData(session.pixData);
          setPaymentStatus(session.paymentStatus);
          const remainingTime = Math.max(0, 3600 - Math.floor(sessionAge / 1000));
          setTimeLeft(remainingTime);
        } else if (session.paymentStatus === 'paid') {
          // Se já foi pago, limpar e não restaurar (permite novo pagamento)
          console.log('✅ Sessão PIX já paga - limpando para permitir novo pagamento');
          localStorage.removeItem('pixPaymentSession');
          sessionStorage.removeItem('justCompletedPayment');
          sessionStorage.removeItem('lastPedido');
        } else {
          // Sessão expirada, limpar
          console.log('⏰ Sessão PIX expirada, limpando...');
          localStorage.removeItem('pixPaymentSession');
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão PIX:', error);
        localStorage.removeItem('pixPaymentSession');
      }
    }
  }, [isOpen]);

  // Salvar sessão PIX no localStorage sempre que mudar
  useEffect(() => {
    if (pixData) {
      const session = {
        pixData,
        paymentStatus,
        timestamp: Date.now()
      };
      localStorage.setItem('pixPaymentSession', JSON.stringify(session));
      console.log('💾 Sessão PIX salva:', session);
    }
  }, [pixData, paymentStatus]);

  // Criar cobrança PIX quando modal abre
  useEffect(() => {
    if (isOpen && pedido && !pixData) {
      console.log('🎯 Modal PIX aberto, criando cobrança...', { isOpen, pedido, pixData });
      // Só criar nova cobrança se não tiver dados salvos
      const savedSession = localStorage.getItem('pixPaymentSession');
      if (!savedSession) {
        console.log('📝 Nenhuma sessão salva, criando nova cobrança PIX');

        // 🎯 UTMFY - Disparar evento de início de checkout
        try {
          if (window.utmify) {
            window.utmify.track('InitiateCheckout', {
              value: pedido.valorTotal,
              currency: 'BRL',
              content_ids: pedido.itens?.map(item => item.id || item.nome) || [],
              num_items: pedido.itens?.length || 0
            });
            console.log('✅ UTMFY: Evento InitiateCheckout disparado!');
          }
        } catch (e) {
          console.warn('⚠️ UTMFY InitiateCheckout error:', e);
        }

        createPixCharge();
      } else {
        console.log('♻️ Sessão PIX encontrada, não criando nova cobrança');
      }
    }

    return () => {
      // NÃO limpar ao fechar - manter sessão
      // setPixData(null);
      // setPaymentStatus('pending');
      // setError(null);
    };
  }, [isOpen, pedido]);

  // Timer de expiração
  useEffect(() => {
    if (!pixData || paymentStatus !== 'pending') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData, paymentStatus]);

  // Verificar status do pagamento
  useEffect(() => {
    if (!pixData || paymentStatus !== 'pending') return;

    const checkInterval = setInterval(async () => {
      try {
        let data;

        // Roteamento por provider
        if (pixData.provider === 'bspay') {
          // Usar backend Express local
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

          // Buscar token do gateway
          const { paymentGatewayService } = await import('../lib/supabase');
          const gateway = await paymentGatewayService.getByProvider('bspay');

          const response = await fetch(`${backendUrl}/api/pix/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: pixData.txid,
              bearerToken: gateway?.access_token
            })
          });
          data = await response.json();
        } else if (pixData.provider === 'poseidonpay') {
          // Usar Netlify Function do Poseidon Pay
          const functionsUrl = import.meta.env.PROD
            ? '/.netlify/functions'
            : 'http://localhost:8888/.netlify/functions';

          const { paymentGatewayService } = await import('../lib/supabase');
          const gateway = await paymentGatewayService.getByProvider('poseidonpay');

          const response = await fetch(`${functionsUrl}/poseidonpay-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: pixData.txid,
              identifier: pixData.identifier,
              publicKey: gateway?.public_key,
              secretKey: gateway?.api_secret
            })
          });
          data = await response.json();
        } else {
          // Backend padrão
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const response = await fetch(`${backendUrl}/api/pix/status/${pixData.txid}`);
          data = await response.json();
        }

        if (data.success && data.status === 'CONCLUIDA') {
          setPaymentStatus('paid');
          clearInterval(checkInterval);

          // Criar pedido no banco
          await handlePaymentConfirmed();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(checkInterval);
  }, [pixData, paymentStatus, onClose]);

  // Redirecionar quando pagamento for confirmado
  useEffect(() => {
    // PROTEÇÃO: Só redirecionar se pagamento foi REALMENTE confirmado
    if (paymentStatus === 'paid' && pixData) {
      const timer = setTimeout(async () => {
        console.log('💰 Pagamento confirmado!');

        // 🎯 UTMFY - Disparar evento de conversão (Purchase)
        try {
          if (window.utmify) {
            window.utmify.track('purchase', {
              value: pedido.valorTotal,
              orderId: pedido.id || `pedido_${Date.now()}`,
              currency: 'BRL'
            });
            console.log('✅ UTMFY: Evento de conversão disparado!', {
              value: pedido.valorTotal,
              orderId: pedido.id
            });
          } else {
            console.warn('⚠️ UTMFY: Pixel não carregado, tentando método alternativo...');
            // Fallback: Disparar evento via dataLayer (caso use GTM)
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: 'purchase',
              ecommerce: {
                transaction_id: pedido.id || `pedido_${Date.now()}`,
                value: pedido.valorTotal,
                currency: 'BRL',
                items: pedido.itens?.map(item => ({
                  item_name: item.nome,
                  quantity: item.quantidade,
                  price: item.preco
                })) || []
              }
            });
          }
        } catch (trackError) {
          console.error('❌ Erro ao disparar evento UTMFY:', trackError);
        }
        console.log('🔍 Verificando autenticação:', { isAuthenticated, pixData });

        // Gerar código único do pedido
        const codigoPedido = pedidoService.generateOrderCode();
        console.log('🎫 Código do pedido gerado:', codigoPedido);

        // Preparar dados completos do pedido - NOMES CORRETOS DAS COLUNAS
        console.log('🔍 DEBUG - pedido recebido:', pedido);
        console.log('🔍 DEBUG - pedido.nomeCliente:', pedido?.nomeCliente);
        console.log('🔍 DEBUG - pedido.telefone:', pedido?.telefone);
        console.log('🔍 DEBUG - user:', user);

        const pedidoCompleto = {
          numero_pedido: codigoPedido,
          txid: pixData?.txid,
          valor_total: pedido.valorTotal,
          cliente_nome: pedido.nomeCliente || user?.nome || 'Cliente',
          cliente_telefone: (pedido.telefone || user?.telefone)?.replace(/\D/g, ''),
          cliente_cpf: pedido.cpfCliente,
          endereco_entrega: pedido.endereco,
          itens: pedido.itens,
          status: 'confirmado',
          pago: true,
          pago_em: new Date().toISOString(),
          forma_pagamento: 'pix',
          // VINCULAR AO USUÁRIO SE AUTENTICADO
          usuario_id: isAuthenticated && user?.id ? user.id : null
        };

        console.log('📦 Dados do pedido a serem salvos:');
        console.log('👤 Nome:', pedidoCompleto.cliente_nome);
        console.log('📱 Telefone (limpo):', pedidoCompleto.cliente_telefone);
        console.log('📍 Endereço:', pedidoCompleto.endereco_entrega);
        console.log('🆔 Usuario ID:', pedidoCompleto.usuario_id);
        console.log('📦 Pedido completo:', pedidoCompleto);

        // Salvar pedido no banco de dados
        try {
          console.log('💾 Salvando pedido no banco...');
          const pedidoSalvo = await pedidoService.create(pedidoCompleto);
          console.log('✅ Pedido salvo com sucesso:', pedidoSalvo);

          // Enviar pedido para a transportadora
          console.log('🚚 Enviando pedido para a transportadora...');
          try {
            const functionsUrl = import.meta.env.PROD
              ? '/.netlify/functions'
              : 'http://localhost:8888/.netlify/functions';

            const responseLogistics = await fetch(`${functionsUrl}/send-to-logistics`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                numero_pedido: pedidoSalvo.numero_pedido,
                nome_cliente: pedidoCompleto.nome_cliente,
                cpf_cliente: pedidoCompleto.cpf_cliente,
                telefone: pedidoCompleto.telefone,
                endereco_entrega: pedidoCompleto.endereco_entrega,
                valor_total: pedidoCompleto.valor_total,
                itens: pedidoCompleto.itens,
                pago: pedidoCompleto.pago,
                pago_em: pedidoCompleto.pago_em,
                txid: pedidoCompleto.txid
              })
            });

            const resultLogistics = await responseLogistics.json();

            if (resultLogistics.success) {
              console.log('✅ Pedido enviado para transportadora com sucesso!');
              console.log('📦 Código de rastreamento:', resultLogistics.data.codigo_rastreio);

              // Salvar código de rastreamento no sessionStorage
              const pedidoComRastreio = {
                ...pedidoSalvo,
                codigo_rastreio: resultLogistics.data.codigo_rastreio
              };
              sessionStorage.setItem('lastPedido', JSON.stringify(pedidoComRastreio));
            } else {
              console.error('❌ Erro ao enviar para transportadora:', resultLogistics.error);
              // Não bloquear o fluxo se houver erro na transportadora
            }
          } catch (error) {
            console.error('❌ Erro na integração com transportadora:', error);
            // Não bloquear o fluxo se houver erro na integração
          }

          // Marcar que acabou de pagar
          sessionStorage.setItem('justCompletedPayment', 'true');

          // Salvar dados do pedido para a página de rastreamento
          const pedidoParaSalvar = {
            ...pedidoCompleto,
            id: pedidoSalvo.id
          };

          console.log('💾 Salvando no sessionStorage:', pedidoParaSalvar);
          console.log('🆔 ID do pedido:', pedidoSalvo.id);

          sessionStorage.setItem('lastPedido', JSON.stringify(pedidoParaSalvar));
          // Limpar status anterior para novo pedido começar do zero
          sessionStorage.removeItem('rastreamentoStatus');
          console.log('🗑️ Status de rastreamento anterior limpo');

          // Se já está autenticado, vincular pedido ao usuário NO BANCO
          if (isAuthenticated && user) {
            console.log('✅ Usuário já cadastrado - vinculando pedido');
            console.log('🔗 Vinculando pedido ID:', pedidoSalvo.id);
            console.log('👤 Usuário ID:', user.id);

            try {
              // Vincular pedido ao usuário no banco
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
              const response = await fetch(`${backendUrl}/api/pedidos/${pedidoSalvo.id}/vincular-usuario`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
              });

              const result = await response.json();
              console.log('📊 Resultado da vinculação:', result);

              if (result.success) {
                console.log('✅ Pedido vinculado ao usuário no banco!');
                // Adicionar ao contexto local
                await addPedido(pedidoSalvo);
              } else {
                console.error('❌ Erro ao vincular pedido:', result.error);
              }
            } catch (error) {
              console.error('❌ Erro ao vincular pedido:', error);
            }
          } else {
            console.log('📝 Usuário não cadastrado - redirecionando para criar conta na página de rastreamento');
          }
        } catch (error) {
          console.error('❌ Erro ao salvar pedido:', error);
          console.error('❌ Erro detalhado:', JSON.stringify(error, null, 2));
        }

        // SEMPRE salvar no sessionStorage ANTES de redirecionar (independente de sucesso/erro)
        console.log('💾 Salvando dados no sessionStorage para acesso ao rastreamento...');
        sessionStorage.setItem('justCompletedPayment', 'true');
        sessionStorage.setItem('lastPedido', JSON.stringify(pedidoCompleto));
        console.log('✅ Dados salvos no sessionStorage');

        // PRIMEIRO: Redirecionar para /rastreamento (modal abrirá lá se necessário)
        console.log('🔄 Redirecionando para página de rastreamento...');
        onClose();
        navigate('/rastreamento');

        // DEPOIS: Deduzir estoque em background (não bloqueia o fluxo do usuário)
        setTimeout(async () => {
          try {
            console.log('📦 Deduzindo estoque dos produtos em background...');
            for (const item of pedido.itens) {
              // Buscar o produto pelo nome para obter o ID
              const produtos = await productService.getAll();
              const produto = produtos.find(p => p.name === item.nome);

              if (produto) {
                await productService.deductStock(produto.id, item.quantidade);
                console.log(`✅ Estoque deduzido: ${item.nome} (-${item.quantidade})`);
              } else {
                console.warn(`⚠️ Produto não encontrado: ${item.nome}`);
              }
            }
          } catch (error) {
            console.error('❌ Erro ao deduzir estoque:', error);
            // Não bloqueia o fluxo se houver erro na dedução
          }
        }, 3000); // Executar 3 segundos após redirecionar (tempo para modal abrir)
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, navigate, onClose, isAuthenticated, addPedido, pedido, pixData]);

  // Callback removido - registro agora acontece na página /rastreamento

  const handlePaymentConfirmed = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      console.log('💰 Pagamento confirmado! Criando pedido no banco...');

      const response = await fetch(`${backendUrl}/api/pedidos/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: pixData.txid,
          e2eId: pixData.e2eId || null,
          nomeCliente: pedido.nomeCliente,
          cpfCliente: pedido.cpfCliente,
          telefone: pedido.telefone,
          endereco: pedido.endereco,
          itens: pedido.itens,
          valorTotal: pedido.valorTotal
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Pedido criado:', data.pedido);
        console.log('📋 Dados completos do pedido:', data);

        const pedidoData = {
          id: data.pedido.id,
          numeroPedido: data.pedido.numeroPedido,
          valorTotal: pedido.valorTotal,
          telefone: pedido.telefone,
          nomeCliente: pedido.nomeCliente,
          cpfCliente: pedido.cpfCliente,
          endereco: pedido.endereco
        };

        console.log('🎯 Salvando dados do pedido...');
        console.log('📦 Pedido ID:', pedidoData.id);
        console.log('📦 Número do Pedido:', pedidoData.numeroPedido);

        // Salvar no localStorage E sessionStorage
        const session = {
          pixData,
          paymentStatus: 'paid',
          pedidoCriado: pedidoData,
          timestamp: Date.now()
        };
        localStorage.setItem('pixPaymentSession', JSON.stringify(session));
        sessionStorage.setItem('lastPedido', JSON.stringify(pedidoData));

        console.log('✅ Pedido salvo no localStorage e sessionStorage!');
        console.log('✅ O redirecionamento será feito automaticamente...');
      } else {
        console.error('❌ Erro ao criar pedido:', data.error);
        alert('Pagamento confirmado, mas houve um erro ao registrar o pedido. Entre em contato conosco.');
      }
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      alert('Pagamento confirmado, mas houve um erro ao registrar o pedido. Entre em contato conosco.');
    }
  };

  const createPixCharge = async () => {
    try {
      setLoading(true);
      setError(null);

      // Importar serviços dinamicamente
      const { paymentGatewayService } = await import('../lib/supabase');
      const bspayService = await import('../services/bspay-service');

      // Buscar gateway padrão ativo
      const gateway = await paymentGatewayService.getDefault();

      if (!gateway) {
        throw new Error('Nenhum gateway de pagamento configurado. Configure em Admin > Pagamentos.');
      }

      console.log('🔌 Gateway ativo:', gateway.provider, gateway.name);

      let data;

      // Roteamento por provider
      switch (gateway.provider) {
        case 'bspay':
          // Usar BS Pay diretamente
          console.log('🟠 Usando BS Pay...');
          console.log('🔑 Credenciais:', {
            clientId: gateway.client_id ? '✓' : '✗',
            clientSecret: gateway.client_secret ? '✓' : '✗'
          });
          data = await bspayService.createBSPayCharge({
            amount: pedido.valorTotal,
            customerName: pedido.nomeCliente,
            customerDocument: pedido.cpfCliente,
            customerEmail: '',
            externalId: `pedido_${Date.now()}_${pedido.id || ''}`,
            description: `Pedido ${pedido.nomeCliente}`,
            clientId: gateway.client_id || '',
            clientSecret: gateway.client_secret || '',
            postbackUrl: gateway.webhook_secret || ''
          });
          break;

        case 'pix_manual':
          // PIX Manual - gera dados localmente
          console.log('🟣 Usando PIX Manual...');
          data = {
            success: true,
            txid: `manual_${Date.now()}`,
            pixCopiaECola: gateway.pix_key,
            pixKeyType: gateway.pix_key_type,
            pixName: gateway.pix_name,
            isManual: true
          };
          break;

        case 'poseidonpay':
          // Usar Poseidon Pay
          console.log('🔱 Usando Poseidon Pay...');
          // Credenciais NÃO são enviadas pelo frontend - são buscadas do banco pelo backend
          const poseidonPayService = await import('../services/poseidonpay-service');
          data = await poseidonPayService.createPoseidonPayCharge({
            amount: pedido.valorTotal,
            customerName: pedido.nomeCliente,
            customerDocument: pedido.cpfCliente,
            customerEmail: '',
            customerPhone: pedido.telefone || '',
            externalId: `pedido_${Date.now()}_${pedido.id || ''}`,
            description: `Pedido ${pedido.nomeCliente}`,
            products: pedido.itens?.map(item => ({
              id: item.id || String(Date.now()),
              name: item.nome,
              quantity: item.quantidade,
              price: item.preco
            }))
          });
          break;

        default:
          // Fallback para backend original
          console.log('🔵 Usando backend padrão...');
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const response = await fetch(`${backendUrl}/api/pix/create-charge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              valorTotal: pedido.valorTotal,
              nomeCliente: pedido.nomeCliente,
              cpfCliente: pedido.cpfCliente,
              itens: pedido.itens,
              pedidoId: pedido.id,
              gateway: gateway.provider
            })
          });
          data = await response.json();
      }

      console.log('📦 Resposta do gateway:', data);

      if (data.success) {
        console.log('✅ QR Code recebido:', {
          txid: data.txid,
          temImagem: !!data.imagemQrcode,
          tamanhoImagem: data.imagemQrcode?.length,
          provider: gateway.provider
        });
        setPixData({ ...data, provider: gateway.provider });
      } else {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      setError(error.message || 'Erro ao gerar PIX. Tente novamente.');
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-y-auto" style={{ zIndex: 999999 }}>
        <div className="bg-white rounded-xl sm:rounded-2xl w-[95vw] sm:w-auto sm:max-w-md p-3 sm:p-6 relative shadow-2xl my-4">
          <button
            onClick={() => {
              // Limpar sessão PIX ao fechar modal (permite novo pagamento)
              if (paymentStatus !== 'paid') {
                console.log('🗑️ Limpando sessão PIX ao fechar modal');
                localStorage.removeItem('pixPaymentSession');
                setPixData(null);
                setPaymentStatus('pending');
              }
              onClose();
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando QR Code PIX...</p>
            </div>
          )}

          {/* Erro */}
          {paymentStatus === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                Erro ao Gerar PIX
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    console.log('🔙 Voltando para corrigir dados no formulário');
                    localStorage.removeItem('pixPaymentSession');
                    setPixData(null);
                    setPaymentStatus('pending');
                    setError(null);

                    // Se tem callback onBack, usa ele para voltar ao checkout
                    if (onBack) {
                      onBack();
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  ← Voltar e Corrigir Dados
                </button>
                <button
                  onClick={createPixCharge}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {/* Pagamento Confirmado */}
          {paymentStatus === 'paid' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Pagamento Confirmado!
              </h3>
              <p className="text-gray-600 mb-4">
                Seu pedido foi aprovado com sucesso ✨
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Redirecionando em 2 segundos...
              </p>
              <button
                onClick={() => {
                  // Garantir que dados estão salvos no sessionStorage
                  sessionStorage.setItem('justCompletedPayment', 'true');
                  if (pedido) {
                    const pedidoParaSalvar = {
                      numero_pedido: pedido.numeroPedido || `XP-${Date.now()}`,
                      nome_cliente: pedido.nomeCliente,
                      telefone: pedido.telefone?.replace(/\D/g, ''),
                      endereco_entrega: pedido.endereco,
                      itens: pedido.itens,
                      valor_total: pedido.valorTotal,
                      status: 'confirmado',
                      pago: true,
                      pago_em: new Date().toISOString()
                    };
                    sessionStorage.setItem('lastPedido', JSON.stringify(pedidoParaSalvar));
                    console.log('💾 Dados salvos no sessionStorage ao clicar no botão');
                  }
                  onClose();
                  navigate('/rastreamento');
                }}
                className="px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Ver Meu Pedido Agora →
              </button>
            </div>
          )}

          {/* QR Code PIX */}
          {!loading && paymentStatus === 'pending' && pixData && (
            <div>
              <div className="text-center mb-3 sm:mb-6">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-1 sm:mb-2" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Pague com PIX
                </h3>
                <p className="text-xl sm:text-3xl font-bold text-primary mt-0.5 sm:mt-1">
                  R$ {pedido.valorTotal.toFixed(2)}
                </p>

                {/* Timer */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 text-orange-600">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">
                    Expira em {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QR Code Imagem */}
              <div className="bg-white p-2 sm:p-4 rounded-lg border border-gray-200 sm:border-2 mb-2 sm:mb-4 flex items-center justify-center">
                {pixData.imagemQrcode ? (
                  <img
                    src={
                      pixData.imagemQrcode.startsWith('data:image')
                        ? pixData.imagemQrcode
                        : `data:image/png;base64,${pixData.imagemQrcode}`
                    }
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                    onLoad={() => {
                      console.log('✅ QR Code carregado com sucesso!');
                    }}
                    onError={(e) => {
                      console.error('❌ Erro ao carregar QR Code');
                      console.error('Base64 length:', pixData.imagemQrcode?.length);
                      console.error('Base64 start:', pixData.imagemQrcode?.substring(0, 50));
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-gray-500 text-sm">QR Code não disponível</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {console.log('⚠️ pixData:', pixData)}
                      Debug: Verifique o console
                    </p>
                  </div>
                )}
              </div>

              {/* PIX Copia e Cola */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIX Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixData.pixCopiaECola}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Como pagar:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com <strong>PIX</strong></li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
              </div>

              {/* Status */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Aguardando pagamento...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Registro foi movido para a página /rastreamento */}
      </div>
    </Portal>
  );
}
