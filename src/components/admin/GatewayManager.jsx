import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Check, X, Eye, EyeOff, Save, Settings, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PROVIDER_CONFIG = {
    mercadopago: {
        name: 'Mercado Pago',
        color: 'bg-blue-500',
        fields: ['access_token', 'public_key'],
        labels: {
            access_token: 'Access Token',
            public_key: 'Public Key'
        }
    },
    pagseguro: {
        name: 'PagSeguro',
        color: 'bg-green-500',
        fields: ['api_key', 'api_secret'],
        labels: {
            api_key: 'Email',
            api_secret: 'Token'
        }
    },
    pix_manual: {
        name: 'PIX Manual',
        color: 'bg-purple-500',
        fields: ['pix_key', 'pix_key_type', 'pix_name'],
        labels: {
            pix_key: 'Chave PIX',
            pix_key_type: 'Tipo de Chave',
            pix_name: 'Nome do Recebedor'
        }
    },
    stripe: {
        name: 'Stripe',
        color: 'bg-indigo-500',
        fields: ['api_key', 'public_key', 'webhook_secret'],
        labels: {
            api_key: 'Secret Key',
            public_key: 'Publishable Key',
            webhook_secret: 'Webhook Secret'
        }
    },
    picpay: {
        name: 'PicPay',
        color: 'bg-green-400',
        fields: ['api_key'],
        labels: {
            api_key: 'X-PicPay-Token'
        }
    },
    bspay: {
        name: 'BS Pay',
        color: 'bg-orange-500',
        fields: ['client_id', 'client_secret', 'webhook_secret'],
        labels: {
            client_id: 'Client ID',
            client_secret: 'Secret Key',
            webhook_secret: 'Postback URL (opcional)'
        }
    },
    poseidonpay: {
        name: 'Poseidon Pay',
        color: 'bg-cyan-500',
        fields: ['public_key', 'api_secret', 'callback_url'],
        labels: {
            public_key: 'x-public-key',
            api_secret: 'x-secret-key',
            callback_url: 'URL de Callback (Webhook)'
        }
    }
};

const PIX_KEY_TYPES = [
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'aleatoria', label: 'Chave Aleatória' }
];

export default function GatewayManager() {
    const [gateways, setGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [showSecrets, setShowSecrets] = useState({});
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadGateways();
    }, []);

    const loadGateways = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_gateways')
                .select('*')
                .order('name');

            if (error) throw error;
            setGateways(data || []);
        } catch (error) {
            console.error('Erro ao carregar gateways:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (gateway) => {
        setEditingId(gateway.id);
        setFormData({
            ...gateway,
            api_key: gateway.api_key || '',
            api_secret: gateway.api_secret || '',
            access_token: gateway.access_token || '',
            public_key: gateway.public_key || '',
            webhook_secret: gateway.webhook_secret || '',
            client_id: gateway.client_id || '',
            client_secret: gateway.client_secret || '',
            callback_url: gateway.callback_url || '',
            pix_key: gateway.pix_key || '',
            pix_key_type: gateway.pix_key_type || 'cpf',
            pix_name: gateway.pix_name || '',
            sandbox_mode: gateway.sandbox_mode ?? true
        });
    };

    const handleSave = async () => {
        try {
            setSaving(editingId);

            const { error } = await supabase
                .from('payment_gateways')
                .update({
                    api_key: formData.api_key || null,
                    api_secret: formData.api_secret || null,
                    access_token: formData.access_token || null,
                    public_key: formData.public_key || null,
                    webhook_secret: formData.webhook_secret || null,
                    client_id: formData.client_id || null,
                    client_secret: formData.client_secret || null,
                    callback_url: formData.callback_url || null,
                    pix_key: formData.pix_key || null,
                    pix_key_type: formData.pix_key_type || null,
                    pix_name: formData.pix_name || null,
                    sandbox_mode: formData.sandbox_mode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingId);

            if (error) throw error;

            await loadGateways();
            setEditingId(null);
            setFormData({});
        } catch (error) {
            console.error('Erro ao salvar gateway:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(null);
        }
    };

    const toggleActive = async (gateway) => {
        try {
            const { error } = await supabase
                .from('payment_gateways')
                .update({ is_active: !gateway.is_active })
                .eq('id', gateway.id);

            if (error) throw error;
            await loadGateways();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
        }
    };

    const setAsDefault = async (gateway) => {
        try {
            // Remove default de todos
            await supabase
                .from('payment_gateways')
                .update({ is_default: false })
                .neq('id', 0);

            // Define este como default
            const { error } = await supabase
                .from('payment_gateways')
                .update({ is_default: true, is_active: true })
                .eq('id', gateway.id);

            if (error) throw error;
            await loadGateways();
        } catch (error) {
            console.error('Erro ao definir padrão:', error);
        }
    };

    const toggleShowSecret = (gatewayId, field) => {
        setShowSecrets(prev => ({
            ...prev,
            [`${gatewayId}-${field}`]: !prev[`${gatewayId}-${field}`]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Gateways de Pagamento
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Configure os métodos de pagamento da sua loja
                    </p>
                </div>
            </div>

            {/* Grid de Gateways */}
            <div className="grid gap-4">
                {gateways.map((gateway) => {
                    const config = PROVIDER_CONFIG[gateway.provider] || {};
                    const isEditing = editingId === gateway.id;

                    return (
                        <div
                            key={gateway.id}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${gateway.is_active
                                ? 'border-green-300 bg-green-50/50'
                                : 'border-gray-200 bg-white'
                                }`}
                        >
                            {/* Header do Gateway */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 ${config.color || 'bg-gray-500'} rounded-xl flex items-center justify-center`}>
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            {gateway.name}
                                            {gateway.is_default && (
                                                <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                                                    Padrão
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">{gateway.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Toggle Ativo */}
                                    <button
                                        onClick={() => toggleActive(gateway)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${gateway.is_active
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                    >
                                        {gateway.is_active ? (
                                            <span className="flex items-center gap-1">
                                                <Check className="w-4 h-4" /> Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <X className="w-4 h-4" /> Inativo
                                            </span>
                                        )}
                                    </button>

                                    {/* Botão Padrão */}
                                    {!gateway.is_default && gateway.is_active && (
                                        <button
                                            onClick={() => setAsDefault(gateway)}
                                            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
                                        >
                                            <Zap className="w-4 h-4 inline mr-1" />
                                            Definir Padrão
                                        </button>
                                    )}

                                    {/* Botão Configurar */}
                                    <button
                                        onClick={() => isEditing ? setEditingId(null) : handleEdit(gateway)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                    >
                                        <Settings className="w-4 h-4 inline mr-1" />
                                        {isEditing ? 'Fechar' : 'Configurar'}
                                    </button>
                                </div>
                            </div>

                            {/* Formulário de Configuração */}
                            {isEditing && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Campos específicos do provider */}
                                        {config.fields?.map((field) => (
                                            <div key={field}>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    {config.labels?.[field] || field}
                                                </label>

                                                {field === 'pix_key_type' ? (
                                                    <select
                                                        value={formData.pix_key_type || 'cpf'}
                                                        onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                    >
                                                        {PIX_KEY_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type={showSecrets[`${gateway.id}-${field}`] ? 'text' : 'password'}
                                                            value={formData[field] || ''}
                                                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                            placeholder={`Digite o ${config.labels?.[field] || field}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleShowSecret(gateway.id, field)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            {showSecrets[`${gateway.id}-${field}`] ? (
                                                                <EyeOff className="w-5 h-5" />
                                                            ) : (
                                                                <Eye className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Modo Sandbox */}
                                        {gateway.provider !== 'pix_manual' && (
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.sandbox_mode}
                                                        onChange={(e) => setFormData({ ...formData, sandbox_mode: e.target.checked })}
                                                        className="w-5 h-5 text-primary rounded"
                                                    />
                                                    <div>
                                                        <span className="font-semibold text-gray-800">🧪 Modo Sandbox/Teste</span>
                                                        <p className="text-xs text-gray-600">
                                                            Ative para usar em ambiente de testes (não processa pagamentos reais)
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botões */}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving === gateway.id}
                                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving === gateway.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Save className="w-5 h-5" />
                                            )}
                                            Salvar Configurações
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Como funciona:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Ativo:</strong> O gateway aparecerá como opção de pagamento</li>
                    <li>• <strong>Padrão:</strong> Será o gateway pré-selecionado no checkout</li>
                    <li>• <strong>Sandbox:</strong> Use para testar antes de ir para produção</li>
                    <li>• <strong>PIX Manual:</strong> Cliente copia a chave e faz transferência</li>
                </ul>
            </div>
        </div>
    );
}
