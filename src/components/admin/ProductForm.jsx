import { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { flavorService, productFlavorService, imageUploadService, categoryService } from '../../lib/supabase';

const CATEGORY_TEMPLATES = {
  'IGNITE': { badge: 'MAIS VENDIDO', rating: '4.8', reviews: '150', puff_count: '5000', low_stock_threshold: 5, detailedDescription: 'Pod descartavel premium com sabor intenso e duradouro.' },
  'GEEK BAR': { badge: 'NOVIDADE', rating: '4.7', reviews: '120', puff_count: '8000', low_stock_threshold: 5, detailedDescription: 'Vape descartavel com design moderno e alta qualidade.' },
  'LOST MARY': { badge: 'PROMOCAO', rating: '4.9', reviews: '200', puff_count: '5000', low_stock_threshold: 5, detailedDescription: 'Pod descartavel com sabores exclusivos e design elegante.' },
  'ELF BAR': { badge: 'TOP 10', rating: '4.8', reviews: '180', puff_count: '5000', low_stock_threshold: 5, detailedDescription: 'Vape descartavel lider de mercado com sabor autentico.' },
  'PODS': { badge: 'RECARREGAVEL', rating: '4.6', reviews: '90', puff_count: '', low_stock_threshold: 3, detailedDescription: 'Pod recarregavel compativel com diversos dispositivos.' },
  'ACESSORIOS': { badge: 'ESSENCIAL', rating: '4.5', reviews: '50', puff_count: '', low_stock_threshold: 10, detailedDescription: 'Acessorio de qualidade para seu dispositivo.' },
};

function FieldLabel({ children, hint, required }) {
  return (
    <label className="block text-xs font-medium text-gray-400 mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
      {hint && <span className="text-gray-600 ml-1 font-normal">{hint}</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${className}`}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition appearance-none ${className}`}
    >
      {children}
    </select>
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none ${className}`}
    />
  );
}

export default function ProductForm({ product, onSave, onClose }) {
  const FORM_STORAGE_KEY = 'productFormDraft';

  const getInitialFormData = () => {
    if (product?.id) {
      return {
        name: product?.name || '', description: product?.description || '',
        detailedDescription: product?.detailed_description || product?.detailedDescription || '',
        price: product?.price || '', originalPrice: product?.original_price || product?.originalPrice || '',
        image: product?.image_url || product?.image || '', category_id: product?.category_id || null,
        category: product?.category || '', badge: product?.badge || '',
        badgeColor: product?.badge_color || product?.badgeColor || 'purple',
        rating: product?.rating || '', reviews: product?.reviews || '',
        puff_count: product?.puff_count ? String(product.puff_count) : '',
        stock_quantity: product?.stock_quantity || 0, low_stock_threshold: product?.low_stock_threshold || 5,
        units_per_box: product?.units_per_box || 10, box_price: product?.box_price || '',
        box_discount_percent: product?.box_discount_percent || 15, em_promocao: product?.em_promocao || false,
      };
    }
    const savedDraft = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedDraft) { try { return JSON.parse(savedDraft); } catch (e) {} }
    return {
      name: '', description: '', detailedDescription: '', price: '', originalPrice: '',
      image: '', category_id: null, category: '', badge: '', badgeColor: 'purple',
      rating: '', reviews: '', puff_count: '', stock_quantity: 0, low_stock_threshold: 5,
      units_per_box: 10, box_price: '', box_discount_percent: 15, em_promocao: false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [calculatedBoxPrice, setCalculatedBoxPrice] = useState(0);
  const [isBoxProduct, setIsBoxProduct] = useState(product?.units_per_box > 0 || false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if (!product?.id) {
      const timeoutId = setTimeout(() => { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData)); }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, product?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const flavors = await flavorService.getAll();
        setAvailableFlavors(flavors || []);
        const categories = await categoryService.getAll();
        setAvailableCategories(categories || []);
        if (product?.id) {
          const productFlavors = await productFlavorService.getByProduct(product.id);
          setSelectedFlavors(productFlavors.map(pf => pf.flavor_id));
        }
      } catch (error) { setAvailableFlavors([]); setAvailableCategories([]); }
    };
    loadData();
  }, [product]);

  useEffect(() => {
    if (formData.price && formData.units_per_box && formData.box_discount_percent) {
      const total = parseFloat(formData.price) * parseInt(formData.units_per_box);
      const discount = total * (parseFloat(formData.box_discount_percent) / 100);
      setCalculatedBoxPrice(total - discount);
    }
  }, [formData.price, formData.units_per_box, formData.box_discount_percent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value;
    const selectedCategory = availableCategories.find(c => c.id === newCategoryId);
    const categoryName = selectedCategory?.name || '';
    const template = CATEGORY_TEMPLATES[categoryName.toUpperCase()];
    if (!product && template) {
      setFormData(prev => ({ ...prev, category_id: newCategoryId, category: categoryName, badge: template.badge, rating: template.rating, reviews: template.reviews, puff_count: template.puff_count, low_stock_threshold: template.low_stock_threshold, detailedDescription: template.detailedDescription }));
    } else {
      setFormData(prev => ({ ...prev, category_id: newCategoryId, category: categoryName }));
    }
  };

  const handleFlavorToggle = (flavorId) => {
    setSelectedFlavors(prev => prev.includes(flavorId) ? prev.filter(id => id !== flavorId) : [...prev, flavorId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const productData = {
        name: formData.name, description: formData.description,
        detailed_description: formData.detailedDescription || null,
        price: parseFloat(formData.price) || 0,
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        image_url: formData.image || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        category: formData.category, badge: formData.badge || null,
        badge_color: formData.badgeColor || 'purple',
        rating: formData.rating ? parseFloat(formData.rating) : null,
        reviews: formData.reviews ? parseInt(formData.reviews) : null,
        puff_count: formData.puff_count ? parseInt(formData.puff_count) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        units_per_box: isBoxProduct ? (formData.units_per_box || 10) : 0,
        box_price: isBoxProduct && formData.box_price ? parseFloat(formData.box_price) : null,
        box_discount_percent: isBoxProduct ? (formData.box_discount_percent || 15) : null,
        em_promocao: formData.em_promocao || false,
      };
      if (product?.id) productData.id = product.id;
      const savedProduct = await onSave(productData);
      if (savedProduct?.id) await productFlavorService.updateProductFlavors(savedProduct.id, selectedFlavors);
      if (!product?.id) localStorage.removeItem(FORM_STORAGE_KEY);
      onClose();
    } catch (err) {
      setError(`Erro ao salvar: ${err.message || 'Tente novamente'}`);
    } finally { setLoading(false); }
  };

  const sections = [
    { id: 'basic', label: 'Basico' },
    { id: 'pricing', label: 'Precos' },
    { id: 'details', label: 'Detalhes' },
    { id: 'flavors', label: 'Sabores' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-800" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
            {!product?.id && <p className="text-xs text-gray-500 mt-0.5">Salvamento automatico ativado</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-800">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg transition
                ${activeSection === s.id ? 'bg-gray-800 text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
          )}

          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <FieldLabel required>Nome do Produto</FieldLabel>
                <Input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Ex: Ignite V5000 - Blueberry Ice" />
              </div>
              <div>
                <FieldLabel required>Descricao Curta</FieldLabel>
                <Input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="Descricao breve do produto" />
              </div>
              <div>
                <FieldLabel>Descricao Detalhada</FieldLabel>
                <Textarea name="detailedDescription" value={formData.detailedDescription} onChange={handleChange} rows={3} placeholder="Descricao completa..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Categoria</FieldLabel>
                  <Select name="category_id" value={formData.category_id || ''} onChange={handleCategoryChange} required>
                    <option value="">Selecione...</option>
                    {availableCategories.filter(c => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>{c.icon || '📦'} {c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Badge</FieldLabel>
                  <Input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="Ex: MAIS VENDIDO" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Preco com Desconto (R$)</FieldLabel>
                  <Input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required placeholder="45.00" className="text-lg font-bold" />
                </div>
                <div>
                  <FieldLabel>Preco Original (R$)</FieldLabel>
                  <Input type="number" step="0.01" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="60.00" />
                  {formData.originalPrice && formData.price && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                    <p className="text-xs text-emerald-400 mt-1 font-medium">
                      Desconto de {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <input
                  type="checkbox" checked={formData.em_promocao}
                  onChange={(e) => setFormData({ ...formData, em_promocao: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-white">Produto em Promocao</span>
                  <p className="text-xs text-gray-500">Exibir na secao especial de promocoes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <input
                  type="checkbox" checked={isBoxProduct}
                  onChange={(e) => setIsBoxProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-white">Produto de Caixa (multi-unidades)</span>
                  <p className="text-xs text-gray-500">Caixa com varias unidades</p>
                </div>
              </div>

              {isBoxProduct && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Configuracao da Caixa</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>Unidades</FieldLabel>
                      <Input type="number" name="units_per_box" value={formData.units_per_box} onChange={handleChange} min="1" />
                    </div>
                    <div>
                      <FieldLabel>Desconto %</FieldLabel>
                      <Input type="number" name="box_discount_percent" value={formData.box_discount_percent} onChange={handleChange} min="0" max="100" />
                    </div>
                    <div>
                      <FieldLabel>Preco Caixa</FieldLabel>
                      <div className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm font-bold text-emerald-400">
                        R$ {calculatedBoxPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Imagem do Produto</FieldLabel>
                {formData.image && (
                  <div className="mb-3 relative inline-block">
                    <img src={formData.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-700" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 border-dashed rounded-lg hover:bg-gray-700 transition">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">{formData.image ? 'Trocar' : 'Upload'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try { const url = await imageUploadService.uploadProductImage(file, formData.name || 'produto'); setFormData(prev => ({ ...prev, image: url })); }
                        catch (err) { alert('Erro: ' + err.message); }
                      }
                    }} />
                  </label>
                  <Input type="url" name="image" value={formData.image} onChange={handleChange} placeholder="Ou cole a URL" className="flex-1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Avaliacao (0-5)</FieldLabel>
                  <Input type="number" step="0.1" min="0" max="5" name="rating" value={formData.rating} onChange={handleChange} />
                </div>
                <div>
                  <FieldLabel>Num. Avaliacoes</FieldLabel>
                  <Input type="number" name="reviews" value={formData.reviews} onChange={handleChange} />
                </div>
                <div>
                  <FieldLabel>Puffs</FieldLabel>
                  <Select name="puff_count" value={formData.puff_count} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {[600,800,1500,2000,2500,3000,4000,5000,6000,7000,8000,10000,12000,15000,20000,25000,30000,40000,50000].map(n => (
                      <option key={n} value={n}>{n.toLocaleString()} Puffs</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Estoque *</FieldLabel>
                  <Input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} min="0" required />
                </div>
                <div>
                  <FieldLabel>Alerta Estoque Baixo</FieldLabel>
                  <Input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} min="1" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'flavors' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">{selectedFlavors.length} sabor(es) selecionado(s)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {availableFlavors.map((flavor) => {
                  const isActive = flavor.is_active !== false;
                  const isSelected = selectedFlavors.includes(flavor.id);
                  return (
                    <label
                      key={flavor.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition text-sm
                        ${isSelected ? 'bg-primary text-white' : isActive ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-800/50 text-gray-600 opacity-50'}`}
                    >
                      <input type="checkbox" checked={isSelected} onChange={() => handleFlavorToggle(flavor.id)} className="w-3.5 h-3.5" disabled={!isActive} />
                      <span className="flex-1 truncate text-xs">{flavor.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isActive ? '✓' : '✗'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm font-medium">
            Cancelar
          </button>
          <button type="submit" form="product-form" onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg transition text-sm font-medium disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
