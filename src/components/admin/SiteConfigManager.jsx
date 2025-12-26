import { useState, useEffect } from 'react';
import {
    Loader2, Save, Settings, Palette, Globe, MessageSquare,
    Image, Type, Bell, Eye, EyeOff, Upload, Check
} from 'lucide-react';
import { siteConfigService, imageUploadService } from '../../lib/supabase';

const CATEGORIES = [
    { id: 'brand', name: 'Identidade', icon: Image, description: 'Nome, logo, slogan' },
    { id: 'institutional', name: 'Institucional', icon: Type, description: 'Sobre, missão, valores' },
    { id: 'contact', name: 'Contato', icon: MessageSquare, description: 'WhatsApp, redes sociais' },
    { id: 'appearance', name: 'Aparência', icon: Palette, description: 'Cores, fontes' },
    { id: 'seo', name: 'SEO', icon: Globe, description: 'Título, descrição, keywords' },
    { id: 'content', name: 'Textos', icon: Type, description: 'Banner, CTAs' },
    { id: 'general', name: 'Geral', icon: Bell, description: 'Manutenção, avisos' }
];

export default function SiteConfigManager() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState('brand');
    const [changes, setChanges] = useState({});
    const [uploadingKey, setUploadingKey] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await siteConfigService.getAllFull();
            setConfigs(data);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setChanges(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const getValue = (key) => {
        if (changes.hasOwnProperty(key)) return changes[key];
        const config = configs.find(c => c.key === key);
        return config?.value || '';
    };

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) return;

        try {
            setSaving(true);
            await siteConfigService.updateBatch(changes);
            await loadConfigs();
            setChanges({});
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (key, file) => {
        try {
            setUploadingKey(key);
            const url = await imageUploadService.upload(file, 'config');
            handleChange(key, url);
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploadingKey(null);
        }
    };

    const filteredConfigs = configs.filter(c => c.category === activeCategory);

    const renderField = (config) => {
        const value = getValue(config.key);
        const hasChange = changes.hasOwnProperty(config.key);

        switch (config.type) {
            case 'boolean':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`relative w-14 h-7 rounded-full transition-colors ${value === 'true' ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                            <input
                                type="checkbox"
                                checked={value === 'true'}
                                onChange={(e) => handleChange(config.key, e.target.checked ? 'true' : 'false')}
                                className="sr-only"
                            />
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${value === 'true' ? 'translate-x-7' : ''
                                }`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {value === 'true' ? 'Ativo' : 'Inativo'}
                        </span>
                    </label>
                );

            case 'color':
                return (
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={value || '#000000'}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            placeholder="#000000"
                            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${hasChange ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                }`}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleChange(config.key, e.target.value)}
                                placeholder="URL da imagem"
                                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${hasChange ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                    }`}
                            />
                            <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer flex items-center gap-2 transition">
                                {uploadingKey === config.key ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(config.key, e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {value && (
                            <div className="flex items-center gap-2">
                                <img src={value} alt="Preview" className="h-12 w-auto rounded border" />
                                <span className="text-xs text-gray-500">Preview</span>
                            </div>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary resize-none ${hasChange ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                            }`}
                    />
                );

            case 'json':
                return (
                    <textarea
                        value={value || '{}'}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary font-mono text-sm resize-none ${hasChange ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                            }`}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary ${hasChange ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                            }`}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" />
                        Configurações do Site
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Personalize a identidade visual e informações da loja
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || Object.keys(changes).length === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${saved
                            ? 'bg-green-500 text-white'
                            : Object.keys(changes).length > 0
                                ? 'bg-primary text-white hover:bg-primary/90'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : saved ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saved ? 'Salvo!' : `Salvar ${Object.keys(changes).length > 0 ? `(${Object.keys(changes).length})` : ''}`}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar - Categorias */}
                <div className="w-56 bg-gray-50 border-r border-gray-200 p-4">
                    <nav className="space-y-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            const categoryChanges = Object.keys(changes).filter(key =>
                                configs.find(c => c.key === key)?.category === cat.id
                            ).length;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${isActive
                                            ? 'bg-primary text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{cat.name}</div>
                                        <div className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                            {cat.description}
                                        </div>
                                    </div>
                                    {categoryChanges > 0 && (
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {categoryChanges}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content - Campos */}
                <div className="flex-1 p-6">
                    <div className="max-w-2xl space-y-6">
                        {filteredConfigs.map((config) => (
                            <div key={config.key} className="space-y-2">
                                <label className="block">
                                    <span className="text-sm font-semibold text-gray-800">
                                        {config.label || config.key}
                                    </span>
                                    {config.description && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            {config.description}
                                        </span>
                                    )}
                                </label>
                                {renderField(config)}
                            </div>
                        ))}

                        {filteredConfigs.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                Nenhuma configuração nesta categoria
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
