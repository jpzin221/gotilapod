import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Search, Edit2, Check, X, Sparkles } from 'lucide-react';
import { flavorService } from '../../lib/supabase';

export default function FlavorManager() {
    const [flavors, setFlavors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', emoji: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFlavors();
    }, []);

    const loadFlavors = async () => {
        try {
            setLoading(true);
            const data = await flavorService.getAll();
            setFlavors(data || []);
        } catch (error) {
            console.error('Erro ao carregar sabores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        try {
            setSaving(true);

            if (editingId) {
                await flavorService.update(editingId, formData);
            } else {
                await flavorService.create(formData);
            }

            await loadFlavors();
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', emoji: '' });
        } catch (error) {
            console.error('Erro ao salvar sabor:', error);
            alert('Erro ao salvar sabor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir este sabor?')) return;

        try {
            await flavorService.delete(id);
            await loadFlavors();
        } catch (error) {
            console.error('Erro ao excluir sabor:', error);
            alert('Erro ao excluir sabor. Pode estar vinculado a produtos.');
        }
    };

    const handleEdit = (flavor) => {
        setFormData({ name: flavor.name, emoji: flavor.emoji || '' });
        setEditingId(flavor.id);
        setShowForm(true);
    };

    const toggleActive = async (flavor) => {
        try {
            await flavorService.update(flavor.id, { is_active: !flavor.is_active });
            await loadFlavors();
        } catch (error) {
            console.error('Erro ao atualizar sabor:', error);
        }
    };

    const filteredFlavors = flavors.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Gerenciar Sabores
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        {flavors.length} sabores cadastrados
                    </p>
                </div>

                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData({ name: '', emoji: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Novo Sabor
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {editingId ? 'Editar Sabor' : 'Novo Sabor'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Sabor *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Ex: Strawberry Ice"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emoji (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.emoji}
                                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Ex: 🍓❄️"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name.trim()}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Buscar sabor..."
                />
            </div>

            {/* Flavors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFlavors.map((flavor) => (
                    <div
                        key={flavor.id}
                        className={`relative p-3 rounded-lg border-2 transition ${flavor.is_active
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                    >
                        <div className="text-center">
                            <span className="text-2xl">{flavor.emoji || '🍬'}</span>
                            <p className="text-sm font-medium text-gray-800 mt-1 truncate" title={flavor.name}>
                                {flavor.name}
                            </p>
                        </div>

                        <div className="flex justify-center gap-1 mt-2">
                            <button
                                onClick={() => toggleActive(flavor)}
                                className={`p-1 rounded ${flavor.is_active ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                                    }`}
                                title={flavor.is_active ? 'Desativar' : 'Ativar'}
                            >
                                {flavor.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleEdit(flavor)}
                                className="p-1 rounded text-blue-600 hover:bg-blue-100"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(flavor.id)}
                                className="p-1 rounded text-red-600 hover:bg-red-100"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredFlavors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum sabor encontrado</p>
                </div>
            )}
        </div>
    );
}
