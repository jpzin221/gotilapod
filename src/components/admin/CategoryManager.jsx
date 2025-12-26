import { useState, useEffect } from 'react';
import {
    Loader2, Save, Plus, Trash2, Edit, GripVertical,
    Tag, Eye, EyeOff, CheckCircle, AlertCircle
} from 'lucide-react';
import { categoryService } from '../../lib/supabase';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        icon: '📦',
        is_active: true
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            showMessage('error', 'Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            showMessage('error', 'Nome é obrigatório');
            return;
        }

        try {
            setSaving(true);

            if (editingId) {
                await categoryService.update(editingId, formData);
                showMessage('success', 'Categoria atualizada com sucesso!');
            } else {
                await categoryService.create(formData);
                showMessage('success', 'Categoria criada com sucesso!');
            }

            await loadCategories();
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showMessage('error', error.message || 'Erro ao salvar categoria');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            icon: category.icon || '📦',
            is_active: category.is_active
        });
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;

        try {
            await categoryService.delete(id);
            showMessage('success', 'Categoria deletada com sucesso!');
            await loadCategories();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            showMessage('error', error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            icon: '📦',
            is_active: true
        });
        setEditingId(null);
        setShowForm(false);
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Gerenciar Categorias
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Organize os produtos por categorias
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    <Plus className="w-5 h-5" />
                    Nova Categoria
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`rounded-lg p-4 flex items-center gap-2 ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editingId ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                            slug: generateSlug(e.target.value)
                                        });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ex: Pods Descartáveis"
                                    required
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Slug (URL)
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="pods-descartaveis"
                                />
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Descrição
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                placeholder="Descrição da categoria..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ícone/Emoji */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Ícone (Emoji)
                                </label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-2xl text-center"
                                    placeholder="📦"
                                    maxLength={2}
                                />
                            </div>

                            {/* Ativo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Status
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer mt-2">
                                    <div className={`relative w-14 h-7 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-7' : ''
                                            }`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {formData.is_active ? 'Ativa' : 'Inativa'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {editingId ? 'Atualizar' : 'Criar'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de Categorias */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        Nenhuma categoria cadastrada
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <GripVertical className="w-4 h-4" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Descrição
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <span className="text-2xl">{category.icon || '📦'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-800">{category.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {category.slug}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {category.description || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {category.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    <Eye className="w-3 h-3" />
                                                    Ativa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                                    <EyeOff className="w-3 h-3" />
                                                    Inativa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Deletar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
