import { useState, useEffect } from 'react';
import { ShoppingBag, X, MapPin } from 'lucide-react';
import { productService } from '../lib/supabase';

// Nomes brasileiros para variar
const NOMES = [
    'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda',
    'Rafael', 'Camila', 'Gabriel', 'Larissa', 'Mateus', 'Amanda', 'Bruno',
    'Patricia', 'Diego', 'Beatriz', 'Thiago', 'Carolina', 'Felipe', 'Isabela',
    'Leonardo', 'Mariana', 'Gustavo', 'Letícia', 'Rodrigo', 'Natália'
];

// Cidades brasileiras
const CIDADES = [
    'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR',
    'Porto Alegre, RS', 'Salvador, BA', 'Recife, PE', 'Fortaleza, CE',
    'Brasília, DF', 'Goiânia, GO', 'Campinas, SP', 'Santos, SP',
    'Florianópolis, SC', 'Vitória, ES', 'Natal, RN', 'João Pessoa, PB'
];

// Tempos relativos
const TEMPOS = [
    'agora mesmo',
    'há 1 minuto',
    'há 2 minutos',
    'há 3 minutos',
    'há 5 minutos',
    'há 8 minutos'
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function SocialProofNotification() {
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [produtos, setProdutos] = useState([]);

    // Carregar produtos reais do banco
    useEffect(() => {
        const carregarProdutos = async () => {
            try {
                const data = await productService.getAll();
                if (data && data.length > 0) {
                    setProdutos(data);
                }
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
            }
        };
        carregarProdutos();
    }, []);

    useEffect(() => {
        // Só inicia notificações depois de ter produtos
        if (produtos.length === 0) return;

        // Primeira notificação após 8-15 segundos
        const primeiraNotificacao = setTimeout(() => {
            mostrarNotificacao();
        }, Math.random() * 7000 + 8000);

        return () => clearTimeout(primeiraNotificacao);
    }, [produtos]);

    const gerarNotificacao = () => {
        if (produtos.length === 0) return null;

        const nome = getRandomItem(NOMES);
        const cidade = getRandomItem(CIDADES);
        const produto = getRandomItem(produtos);
        const tempo = getRandomItem(TEMPOS);
        const quantidade = Math.random() > 0.8 ? 2 : 1;

        return {
            id: Date.now(),
            nome,
            cidade,
            produto: produto.name,
            preco: `R$ ${produto.price?.toFixed(2).replace('.', ',')}`,
            imagem: produto.image,
            tempo,
            quantidade
        };
    };

    const mostrarNotificacao = () => {
        const novaNotificacao = gerarNotificacao();
        if (!novaNotificacao) return;

        setNotification(novaNotificacao);
        setIsVisible(true);

        // Esconder após 6 segundos
        setTimeout(() => {
            setIsVisible(false);

            // Próxima notificação após 20-40 segundos
            setTimeout(() => {
                mostrarNotificacao();
            }, Math.random() * 20000 + 20000);
        }, 6000);
    };

    const fechar = () => {
        setIsVisible(false);
    };

    if (!isVisible || !notification) return null;

    return (
        <div
            className={`fixed bottom-24 left-4 z-40 max-w-xs transform transition-all duration-500 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                }`}
        >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header verde */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Compra verificada
                    </div>
                    <button
                        onClick={fechar}
                        className="text-white/80 hover:text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-3">
                    <div className="flex items-start gap-3">
                        {/* Imagem real do produto */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {notification.imagem ? (
                                <img
                                    src={notification.imagem}
                                    alt={notification.produto}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">
                                <span className="font-bold">{notification.nome}</span> comprou
                            </p>
                            <p className="text-sm text-gray-900 font-semibold truncate">
                                {notification.quantidade > 1 && `${notification.quantidade}x `}
                                {notification.produto}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {notification.cidade}
                                </span>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-400">{notification.tempo}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
