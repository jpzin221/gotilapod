import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Copy, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import Portal from './Portal';
import { usePhoneAuth } from '../context/PhoneAuthContext';
import { pedidoService, productService, supabase, couponService } from '../lib/supabase';

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

        // Validar se sessão tem dados completos (imagemQrcode + pixCopiaECola)
        const hasValidData = session.pixData?.imagemQrcode && session.pixData?.pixCopiaECola;

        // Se a sessão tem menos de 1 hora, está pendente E tem dados válidos, restaurar
        if (sessionAge < oneHour && session.paymentStatus === 'pending' && hasValidData) {
          setPixData(session.pixData);
          setPaymentStatus(session.paymentStatus);
          const remainingTime = Math.max(0, 3600 - Math.floor(sessionAge / 1000));
          setTimeLeft(remainingTime);
        } else if (session.paymentStatus === 'paid') {
          // Se já foi pago, limpar e não restaurar (permite novo pagamento)
          localStorage.removeItem('pixPaymentSession');
          sessionStorage.removeItem('justCompletedPayment');
          sessionStorage.removeItem('lastPedido');
        } else {
          // Sessão expirada, sem dados válidos ou corrompida - limpar e criar nova
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
    }
  }, [pixData, paymentStatus]);

  // Criar cobrança PIX quando modal abre
  useEffect(() => {
    if (isOpen && pedido && !pixData) {
      // 🎯 UTMFY - Disparar evento de início de checkout
      try {
        if (window.utmify) {
          window.utmify.track('InitiateCheckout', {
            value: pedido.valorTotal,
            currency: 'BRL',
            content_ids: pedido.itens?.map(item => item.id || item.nome) || [],
            num_items: pedido.itens?.length || 0
          });
        }
      } catch (e) {
        console.warn('⚠️ UTMFY InitiateCheckout error:', e);
      }

      createPixCharge();
    }

    return () => {
      // NÃO limpar ao fechar - manter sessão
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
        if (pixData.provider === 'codexpay') {
          // Usar API route do CodexPay
          const functionsUrl = import.meta.env.PROD
            ? '/api'
            : 'http://localhost:3000/api';

          const response = await fetch(`${functionsUrl}/codexpay/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: pixData.txid,
              externalReference: pixData.externalReference
            })
          });
          data = await response.json();
        } else if (pixData.provider === 'unipay') {
          // Usar API route do UniPay
          const functionsUrl = import.meta.env.PROD
            ? '/api'
            : 'http://localhost:3000/api';

          const response = await fetch(`${functionsUrl}/unipay/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: pixData.txid,
              externalReference: pixData.externalReference
            })
          });
          data = await response.json();
        } else {
          // Backend padrao - usa /api/pix/create (que tambem serve para status via GET)
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const response = await fetch(`${backendUrl}/api/pix/create?txid=${pixData.txid}`);
          data = await response.json();
        }

        if (data.success && (data.status === 'CONCLUIDA' || data.status === 'PAID' || data.status === 'AUTHORIZED' || data.status === 'COMPLETED' || data.status === 'paid' || data.pago === true)) {
          setPaymentStatus('paid');
          clearInterval(checkInterval);
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
          // 🎯 UTMFY - Disparar evento de conversão (Purchase)
        try {
          if (window.utmify) {
            window.utmify.track('purchase', {
              value: pedido.valorTotal,
              orderId: pedido.id || `pedido_${Date.now()}`,
              currency: 'BRL'
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

          // Gerar código único do pedido
          const codigoPedido = pedidoService.generateOrderCode();

          const pedidoCompleto = {
          numero_pedido: codigoPedido,
          txid: pixData?.txid,
          valor_total: pedido.valorTotal,
          cliente_nome: pedido.nomeCliente || user?.nome || 'Cliente',
          cliente_telefone: (pedido.telefone || user?.telefone)?.replace(/\D/g, ''),
          // Alias para compatibilidade com PhoneAuthModal e Rastreamento
          telefone: (pedido.telefone || user?.telefone)?.replace(/\D/g, ''),
          cliente_cpf: pedido.cpfCliente,
          endereco_entrega: pedido.endereco,
          itens: pedido.itens,
          desconto: pedido.couponDiscount || 0,
          cupom_codigo: pedido.appliedCoupon?.code || null,
          status: 'confirmado',
          pago: true,
          pago_em: new Date().toISOString(),
          forma_pagamento: 'pix',
          // VINCULAR AO USUÁRIO SE AUTENTICADO
          usuario_id: isAuthenticated && user?.id ? user.id : null
        };

        // Salvar pedido no banco de dados
        try {
          const pedidoSalvo = await pedidoService.create(pedidoCompleto);

          // Insert initial status history
          try {
            await supabase.from('status_historico').insert([{
              pedido_id: pedidoSalvo.id,
              status: 'confirmado',
              descricao: 'Pedido confirmado após pagamento',
              created_at: new Date().toISOString()
            }]);
          } catch (statusError) {
            console.warn('⚠️ Erro ao salvar histórico de status:', statusError);
          }

          // Registrar uso do cupom se aplicado
          if (pedido.appliedCoupon && pedido.couponDiscount > 0) {
            try {
              await couponService.registerUse(
                pedido.appliedCoupon.id,
                pedidoSalvo.id,
                (pedido.telefone || user?.telefone)?.replace(/\D/g, ''),
                pedido.nomeCliente || user?.nome || 'Cliente',
                pedido.couponDiscount,
                pedido.valorTotal,
                'exit_intent'
              );
            } catch (couponError) {
              console.warn('⚠️ Erro ao registrar uso do cupom:', couponError);
            }
          }

          // Marcar carrinho abandonado como convertido
          try {
            const sessionId = localStorage.getItem('cart_session_id');
            if (sessionId) {
              const { supabase: supabaseClient } = await import('../lib/supabase');
              const { data: abandonedCart } = await supabaseClient
                .from('abandoned_carts')
                .select('id')
                .eq('session_id', sessionId)
                .single();

              if (abandonedCart) {
                await supabaseClient
                  .from('abandoned_carts')
                  .update({
                    status: 'converted',
                    converted_at: new Date().toISOString(),
                    pedido_id: pedidoSalvo.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', abandonedCart.id);

                localStorage.removeItem('cart_session_id');
              }
            }
          } catch (convertError) {
            console.warn('⚠️ Erro ao marcar conversao:', convertError);
          }

          try {
            const functionsUrl = import.meta.env.PROD
              ? '/api'
              : 'http://localhost:3000/api';

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

          sessionStorage.setItem('lastPedido', JSON.stringify(pedidoParaSalvar));
          // Limpar status anterior para novo pedido começar do zero
          sessionStorage.removeItem('rastreamentoStatus');

          // Se já está autenticado, vincular pedido ao usuário NO BANCO
          if (isAuthenticated && user) {
            try {
              // Vincular pedido ao usuário no banco
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
              const response = await fetch(`${backendUrl}/api/pedidos/${pedidoSalvo.id}/vincular-usuario`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user.id })
              });

              const result = await response.json();

              if (result.success) {
                // Adicionar ao contexto local
                await addPedido(pedidoSalvo);
              } else {
                console.error('❌ Erro ao vincular pedido:', result.error);
              }
            } catch (error) {
              console.error('❌ Erro ao vincular pedido:', error);
            }
          } else {
          }
        } catch (error) {
          console.error('❌ Erro ao salvar pedido:', error);
          console.error('❌ Erro detalhado:', JSON.stringify(error, null, 2));
        }

        // SEMPRE salvar no sessionStorage ANTES de redirecionar (independente de sucesso/erro)
        sessionStorage.setItem('justCompletedPayment', 'true');
        sessionStorage.setItem('lastPedido', JSON.stringify(pedidoCompleto));

        // PRIMEIRO: Redirecionar para /rastreamento (modal abrirá lá se necessário)
        onClose();
        navigate('/rastreamento');

        // DEPOIS: Deduzir estoque em background (não bloqueia o fluxo do usuário)
        setTimeout(async () => {
          try {
            for (const item of pedido.itens) {
              // Buscar o produto pelo nome para obter o ID
              const produtos = await productService.getAll();
              const produto = produtos.find(p => p.name === item.nome);

              if (produto) {
                await productService.deductStock(produto.id, item.quantidade);
              } else {
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
        const pedidoData = {
          id: data.pedido.id,
          numeroPedido: data.pedido.numeroPedido,
          valorTotal: pedido.valorTotal,
          telefone: pedido.telefone,
          nomeCliente: pedido.nomeCliente,
          cpfCliente: pedido.cpfCliente,
          endereco: pedido.endereco
        };

        // Salvar no localStorage E sessionStorage
        const session = {
          pixData,
          paymentStatus: 'paid',
          pedidoCriado: pedidoData,
          timestamp: Date.now()
        };
        localStorage.setItem('pixPaymentSession', JSON.stringify(session));
        sessionStorage.setItem('lastPedido', JSON.stringify(pedidoData));

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

      // Buscar gateway padrão ativo
      const gateway = await paymentGatewayService.getDefault();

      if (!gateway) {
        throw new Error('Nenhum gateway de pagamento configurado. Configure em Admin > Pagamentos.');
      }

      let data;

      // Roteamento por provider
      switch (gateway.provider) {
        case 'pix_manual':
          // PIX Manual - gera dados localmente
          data = {
            success: true,
            txid: `manual_${Date.now()}`,
            pixCopiaECola: gateway.pix_key,
            pixKeyType: gateway.pix_key_type,
            pixName: gateway.pix_name,
            isManual: true
          };
          break;

        case 'codexpay':
          // Usar CodexPay
          const codexPayService = await import('../services/codexpay-service');
          data = await codexPayService.createCodexPayCharge({
            amount: pedido.valorTotal,
            customerName: pedido.nomeCliente,
            customerDocument: pedido.cpfCliente,
            customerEmail: '',
            externalId: `pedido_${Date.now()}_${pedido.id || ''}`
          });
          break;

        case 'unipay':
          // Usar UniPay (FastSoft Brasil)
          const uniPayService = await import('../services/unipay-service');
          data = await uniPayService.createUniPayCharge({
            amount: pedido.valorTotal,
            customerName: pedido.nomeCliente,
            customerDocument: pedido.cpfCliente,
            customerEmail: pedido.emailCliente || '',
            customerPhone: pedido.telefone || '',
            customerAddress: pedido.endereco || null,
            externalId: `pedido_${Date.now()}_${pedido.id || ''}`
          });
          break;

        default:
          // Fallback para backend original
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

      if (data.success) {
        setPixData({ ...data, provider: gateway.provider });
        setPaymentStatus('pending');
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
              {/* Cabeçalho */}
              <div className="text-center mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Pague com PIX
                </h3>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">
                  R$ {(pedido.valorTotal || 0).toFixed(2)}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-orange-50 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-600">
                    Expira em {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                  {(() => {
                    const isValidBase64Image = pixData.imagemQrcode && (
                      pixData.imagemQrcode.startsWith('data:image') ||
                      /^(iVBOR|\/9j\/|R0lGOD)/.test(pixData.imagemQrcode)
                    );

                    if (isValidBase64Image) {
                      return (
                        <img
                          src={
                            pixData.imagemQrcode.startsWith('data:image')
                              ? pixData.imagemQrcode
                              : `data:image/png;base64,${pixData.imagemQrcode}`
                          }
                          alt="QR Code PIX"
                          className="w-48 h-48 sm:w-56 sm:h-56"
                        />
                      );
                    } else {
                      return (
                        <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <QrCode className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400 text-center px-4">
                            Use o código PIX abaixo
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* PIX Copia e Cola */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  PIX Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixData.pixCopiaECola}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="flex-1 px-3 py-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 font-mono truncate"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Instrução simples */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">
                  Abra o app do seu banco, escolha pagar via PIX e escaneie o QR Code ou cole o código acima.
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="relative flex w-2.5 h-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-green-500"></span>
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  Aguardando pagamento...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Registro foi movido para a página /rastreamento */}
      </div>
    </Portal>
  );
}
