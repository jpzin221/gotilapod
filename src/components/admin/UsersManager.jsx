import { useState, useEffect } from 'react';
import { Users, Phone, Package, Search, Eye, X, Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function UsersManager() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
    const [pedidosUsuario, setPedidosUsuario] = useState([]);
    const [loadingPedidos, setLoadingPedidos] = useState(false);

    useEffect(() => {
        carregarUsuarios();
    }, []);

    const carregarUsuarios = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar usuários:', error);
                return;
            }

            console.log('👥 Usuários carregados:', data?.length || 0);
            setUsuarios(data || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarPedidosUsuario = async (usuario) => {
        setUsuarioSelecionado(usuario);
        setLoadingPedidos(true);

        try {
            // Buscar por usuario_id ou por telefone
            const { data: pedidosPorId } = await supabase
                .from('pedidos')
                .select('*')
                .eq('usuario_id', usuario.id)
                .order('created_at', { ascending: false });

            const { data: pedidosPorTelefone } = await supabase
                .from('pedidos')
                .select('*')
                .eq('telefone', usuario.telefone?.replace(/\D/g, ''))
                .order('created_at', { ascending: false });

            // Combinar pedidos (removendo duplicatas)
            const todosIds = new Set();
            const todosPedidos = [];

            [...(pedidosPorId || []), ...(pedidosPorTelefone || [])].forEach(p => {
                if (!todosIds.has(p.id)) {
                    todosIds.add(p.id);
                    todosPedidos.push(p);
                }
            });

            // Ordenar por data
            todosPedidos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            console.log('📦 Pedidos do usuário:', todosPedidos.length);
            setPedidosUsuario(todosPedidos);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoadingPedidos(false);
        }
    };

    const excluirUsuario = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setUsuarios(usuarios.filter(u => u.id !== id));
            alert('✅ Usuário excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir usuário: ' + error.message);
        }
    };

    const usuariosFiltrados = usuarios.filter(usuario => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
            usuario.nome?.toLowerCase().includes(termo) ||
            usuario.telefone?.includes(termo) ||
            usuario.email?.toLowerCase().includes(termo)
        );
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const formatPrice = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const getStatusColor = (status) => {
        const cores = {
            confirmado: 'blue',
            preparando: 'yellow',
            entregue: 'green',
            cancelado: 'red'
        };
        return cores[status] || 'gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Gerenciar Usuários
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {usuarios.length} usuários cadastrados
                    </p>
                </div>
                <button
                    onClick={carregarUsuarios}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    🔄 Atualizar
                </button>
            </div>

            {/* Busca */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou email..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telefone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cadastro</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {usuariosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    Nenhum usuário encontrado
                                </td>
                            </tr>
                        ) : (
                            usuariosFiltrados.map(usuario => (
                                <tr key={usuario.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{usuario.nome || 'Sem nome'}</div>
                                        {usuario.email && (
                                            <div className="text-sm text-gray-500">{usuario.email}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            {usuario.telefone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(usuario.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => carregarPedidosUsuario(usuario)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Ver pedidos"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => excluirUsuario(usuario.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Pedidos do Usuário */}
            {usuarioSelecionado && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary to-secondary text-white">
                            <div>
                                <h3 className="text-xl font-bold">{usuarioSelecionado.nome}</h3>
                                <p className="text-sm opacity-90">{usuarioSelecionado.telefone}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setUsuarioSelecionado(null);
                                    setPedidosUsuario([]);
                                }}
                                className="p-2 hover:bg-white/20 rounded-lg transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {loadingPedidos ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : pedidosUsuario.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-2" />
                                    Nenhum pedido encontrado
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pedidosUsuario.map(pedido => (
                                        <div key={pedido.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-gray-800">{pedido.numero_pedido}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(pedido.status)}-100 text-${getStatusColor(pedido.status)}-800`}>
                                                    {pedido.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p><strong>Valor:</strong> {formatPrice(pedido.valor_total)}</p>
                                                <p><strong>Data:</strong> {formatDate(pedido.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
