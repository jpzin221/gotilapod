import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, MessageCircle, Clock, Package, Shield } from 'lucide-react';

/**
 * Thank You Page - Página de Agradecimento pós-pagamento
 * 
 * SEGURANÇA:
 * - Só renderiza se receber ?status=aprovado
 * - Redireciona para home se parâmetro inválido
 * - Não indexável por buscadores (noindex, nofollow)
 * 
 * RASTREAMENTO:
 * - Dispara evento 'purchase' via dataLayer (GTM/GA4)
 * - Compatível com Google Ads conversion tracking
 */
export default function ObrigadoCompra() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isValidAccess, setIsValidAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // WhatsApp link com mensagem pré-definida
    const whatsappLink = 'https://api.whatsapp.com/send?phone=5575988361209&text=Oi,%20acabei%20de%20finalizar%20meu%20pagamento.';

    useEffect(() => {
        // Validar parâmetro de status
        const status = searchParams.get('status');

        if (status !== 'aprovado') {
            // Acesso inválido - redirecionar para home
            console.log('⚠️ Acesso inválido à página de agradecimento. Redirecionando...');
            navigate('/', { replace: true });
            return;
        }

        // Acesso válido
        setIsValidAccess(true);
        setIsLoading(false);

        // Adicionar meta tags noindex/nofollow
        const metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        metaRobots.content = 'noindex, nofollow';
        document.head.appendChild(metaRobots);

        // Disparar evento de conversão para GA4 e GTM
        try {
            const transactionId = `order_${Date.now()}`;
            const value = parseFloat(searchParams.get('valor')) || 0;

            // GA4 via gtag() - método direto
            if (typeof gtag === 'function') {
                gtag('event', 'purchase', {
                    transaction_id: transactionId,
                    value: value,
                    currency: 'BRL'
                });
                console.log('✅ Evento de conversão disparado (GA4 gtag)');
            }

            // Também via dataLayer para compatibilidade com GTM
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'purchase',
                ecommerce: {
                    transaction_id: transactionId,
                    currency: 'BRL',
                    value: value
                }
            });
            console.log('✅ Evento de conversão disparado (dataLayer)');

            // Também disparar para Utmify se disponível
            if (window.utmify) {
                window.utmify.track('purchase', {
                    value: value,
                    currency: 'BRL',
                    orderId: transactionId
                });
                console.log('✅ Evento de conversão disparado (Utmify)');
            }
        } catch (error) {
            console.error('❌ Erro ao disparar evento de conversão:', error);
        }

        // Cleanup - remover meta tag ao desmontar
        return () => {
            const meta = document.querySelector('meta[name="robots"]');
            if (meta) {
                document.head.removeChild(meta);
            }
        };
    }, [searchParams, navigate]);

    // Loading state enquanto valida
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Não renderizar se acesso inválido
    if (!isValidAccess) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header Success */}
            <header className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-12 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                        Pagamento confirmado com sucesso!
                    </h1>
                    <p className="text-lg sm:text-xl text-green-100">
                        Obrigado pela sua compra. Seu pedido foi recebido.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-8 -mt-6">
                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
                    <div className="space-y-6">
                        {/* Pedido Confirmado */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Pedido Confirmado</h3>
                                <p className="text-gray-600">
                                    Seu pedido foi registrado com sucesso e já está sendo processado.
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Atendimento via WhatsApp</h3>
                                <p className="text-gray-600">
                                    Nossa equipe entrará em contato pelo WhatsApp para confirmar os detalhes do seu pedido.
                                </p>
                            </div>
                        </div>

                        {/* Prazo */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Prazo de Resposta</h3>
                                <p className="text-gray-600">
                                    Respondemos em até <strong>2 horas</strong> em horário comercial (9h às 18h).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-8"></div>

                    {/* WhatsApp Button */}
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-center transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <MessageCircle className="w-6 h-6" />
                            Falar com o atendimento
                        </span>
                    </a>

                    {/* Voltar para loja */}
                    <button
                        onClick={() => navigate('/')}
                        className="block w-full mt-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition text-center"
                    >
                        ← Voltar para a loja
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-auto">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    {/* Legal Notice */}
                    <div className="flex items-center justify-center gap-2 mb-4 text-amber-400">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">
                            Venda proibida para menores de 18 anos.
                        </span>
                    </div>

                    {/* Privacy Link */}
                    <Link
                        to="/privacidade"
                        className="text-gray-400 hover:text-white text-sm transition underline"
                    >
                        Política de Privacidade
                    </Link>

                    {/* Copyright */}
                    <p className="text-gray-500 text-xs mt-4">
                        © {new Date().getFullYear()} Gorila Pod. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
