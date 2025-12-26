import { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { flavorService, productFlavorService, imageUploadService } from '../../lib/supabase';

// Templates por categoria
const CATEGORY_TEMPLATES = {
  'IGNITE': {
    badge: 'MAIS VENDIDO',
    rating: '4.8',
    reviews: '150',
    puff_count: '5000',
    low_stock_threshold: 5,
    detailedDescription: 'Pod descartável premium com sabor intenso e duradouro.'
  },
  'GEEK BAR': {
    badge: 'NOVIDADE',
    rating: '4.7',
    reviews: '120',
    puff_count: '8000',
    low_stock_threshold: 5,
    detailedDescription: 'Vape descartável com design moderno e alta qualidade.'
  },
  'LOST MARY': {
    badge: 'PROMOÇÃO',
    rating: '4.9',
    reviews: '200',
    puff_count: '5000',
    low_stock_threshold: 5,
    detailedDescription: 'Pod descartável com sabores exclusivos e design elegante.'
  },
  'ELF BAR': {
    badge: 'TOP 10',
    rating: '4.8',
    reviews: '180',
    puff_count: '5000',
    low_stock_threshold: 5,
    detailedDescription: 'Vape descartável líder de mercado com sabor autêntico.'
  },
  'PODS': {
    badge: 'RECARREGÁVEL',
    rating: '4.6',
    reviews: '90',
    puff_count: '',
    low_stock_threshold: 3,
    detailedDescription: 'Pod recarregável compatível com diversos dispositivos.'
  },
  'ACESSÓRIOS': {
    badge: 'ESSENCIAL',
    rating: '4.5',
    reviews: '50',
    puff_count: '',
    low_stock_threshold: 10,
    detailedDescription: 'Acessório de qualidade para seu dispositivo.'
  }
};

export default function ProductForm({ product, onSave, onClose }) {
  // Chave para localStorage
  const FORM_STORAGE_KEY = 'productFormDraft';

  // Recuperar dados salvos do localStorage ou usar valores do produto
  const getInitialFormData = () => {
    // Se está editando um produto existente, usar dados do produto
    if (product?.id) {
      return {
        name: product?.name || '',
        description: product?.description || '',
        detailedDescription: product?.detailed_description || product?.detailedDescription || '',
        price: product?.price || '',
        originalPrice: product?.original_price || product?.originalPrice || '',
        image: product?.image || '',
        category: product?.category || 'IGNITE',
        badge: product?.badge || '',
        badgeColor: product?.badge_color || product?.badgeColor || 'purple',
        rating: product?.rating || '',
        reviews: product?.reviews || '',
        puff_count: product?.puff_count ? String(product.puff_count) : '',
        stock_quantity: product?.stock_quantity || 0,
        low_stock_threshold: product?.low_stock_threshold || 5,
        units_per_box: product?.units_per_box || 10,
        box_price: product?.box_price || '',
        box_discount_percent: product?.box_discount_percent || 15,
        em_promocao: product?.em_promocao || false,
      };
    }

    // Se está criando novo produto, tentar recuperar do localStorage
    const savedDraft = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Erro ao recuperar rascunho:', e);
      }
    }

    // Valores padrão para novo produto
    return {
      name: '',
      description: '',
      detailedDescription: '',
      price: '',
      originalPrice: '',
      image: '',
      category: 'IGNITE',
      badge: '',
      badgeColor: 'purple',
      rating: '',
      reviews: '',
      puff_count: '',
      stock_quantity: 0,
      low_stock_threshold: 5,
      units_per_box: 10,
      box_price: '',
      box_discount_percent: 15,
      em_promocao: false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [calculatedBoxPrice, setCalculatedBoxPrice] = useState(0);
  const [isBoxProduct, setIsBoxProduct] = useState(product?.units_per_box > 0 || false);

  // Salvar rascunho no localStorage sempre que formData mudar (apenas para novos produtos)
  useEffect(() => {
    if (!product?.id) {
      // Debounce para não salvar a cada tecla
      const timeoutId = setTimeout(() => {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
        console.log('💾 Rascunho salvo automaticamente');
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, product?.id]);

  // Carregar sabores disponíveis e sabores do produto
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar todos sabores
        const flavors = await flavorService.getAll();
        console.log('Todos sabores carregados:', flavors);
        setAvailableFlavors(flavors || []);

        // Se está editando, carregar sabores do produto
        if (product?.id) {
          const productFlavors = await productFlavorService.getByProduct(product.id);
          const flavorIds = productFlavors.map(pf => pf.flavor_id);
          console.log('Sabores do produto:', flavorIds);
          setSelectedFlavors(flavorIds);
        }
      } catch (error) {
        console.error('Erro ao carregar sabores:', error);
        setAvailableFlavors([]);
      }
    };

    loadData();
  }, [product]);

  // Calcular preço da caixa automaticamente
  useEffect(() => {
    if (formData.price && formData.units_per_box && formData.box_discount_percent) {
      const unitPrice = parseFloat(formData.price) || 0;
      const unitsPerBox = parseInt(formData.units_per_box) || 10;
      const discount = parseFloat(formData.box_discount_percent) || 0;

      const totalWithoutDiscount = unitPrice * unitsPerBox;
      const discountAmount = totalWithoutDiscount * (discount / 100);
      const finalPrice = totalWithoutDiscount - discountAmount;

      setCalculatedBoxPrice(finalPrice);
    }
  }, [formData.price, formData.units_per_box, formData.box_discount_percent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Aplicar template quando categoria mudar (apenas para novos produtos)
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const template = CATEGORY_TEMPLATES[newCategory];

    // Só aplica template se for novo produto (não está editando)
    if (!product && template) {
      setFormData(prev => ({
        ...prev,
        category: newCategory,
        badge: template.badge,
        rating: template.rating,
        reviews: template.reviews,
        puff_count: template.puff_count,
        low_stock_threshold: template.low_stock_threshold,
        detailedDescription: template.detailedDescription
      }));
    } else {
      setFormData(prev => ({ ...prev, category: newCategory }));
    }
  };

  const handleFlavorToggle = (flavorId) => {
    setSelectedFlavors(prev => {
      if (prev.includes(flavorId)) {
        return prev.filter(id => id !== flavorId);
      } else {
        return [...prev, flavorId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        detailed_description: formData.detailedDescription || null,
        price: parseFloat(formData.price) || 0,
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        image: formData.image || null,
        category: formData.category,
        badge: formData.badge || null,
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

      // Incluir ID apenas se estiver editando
      if (product?.id) {
        productData.id = product.id;
      }

      console.log('Salvando produto:', productData);

      const savedProduct = await onSave(productData);
      console.log('Produto salvo com sucesso:', savedProduct);

      // Atualizar sabores do produto
      if (savedProduct?.id) {
        await productFlavorService.updateProductFlavors(savedProduct.id, selectedFlavors);
      }

      // Limpar rascunho do localStorage após salvar com sucesso
      if (!product?.id) {
        localStorage.removeItem(FORM_STORAGE_KEY);
        console.log('🗑️ Rascunho removido após salvar');
      }

      // Fechar modal após salvar com sucesso
      onClose();
    } catch (err) {
      console.error('Save error completo:', err);
      console.error('Mensagem:', err.message);
      console.error('Detalhes:', err.details || err.hint);
      setError(`Erro ao salvar: ${err.message || 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            {!product?.id && (
              <p className="text-xs text-white/80 mt-1">
                💾 Salvamento automático ativado
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Descrição curta */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição Curta *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Descrição detalhada */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição Detalhada
              </label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Preço com Desconto (Principal) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Preço com Desconto (R$) *
                <span className="block text-xs font-normal text-gray-500 mt-1">
                  Este é o preço que o cliente vai pagar
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Ex: 45.00"
                className="w-full px-4 py-3 text-lg border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none bg-green-50"
                required
              />
            </div>

            {/* Preço Original (Sem Desconto) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏷️ Preço Original (R$)
                <span className="block text-xs font-normal text-gray-500 mt-1">
                  Preço sem desconto (opcional). Se vazio, usa o preço com desconto
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="Ex: 60.00 (deixe vazio se não tiver desconto)"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              {formData.originalPrice && formData.price && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  💚 Desconto de {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}%
                </p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoria * {!product && <span className="text-xs text-blue-600">(Auto-preenche campos)</span>}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              >
                <option value="IGNITE">Ignite</option>
                <option value="GEEK BAR">Geek Bar</option>
                <option value="LOST MARY">Lost Mary</option>
                <option value="ELF BAR">Elf Bar</option>
                <option value="PODS">Pods</option>
                <option value="ACESSÓRIOS">Acessórios</option>
              </select>
              {!product && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Ao selecionar, preencherá automaticamente: Badge, Avaliação, Puffs e Descrição
                </p>
              )}
            </div>

            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Imagem do Produto
              </label>

              {/* Preview da imagem */}
              {formData.image && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {/* Input de arquivo */}
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg hover:bg-blue-100 transition">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {formData.image ? 'Trocar Imagem' : 'Fazer Upload'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const imageUrl = await imageUploadService.uploadProductImage(file, formData.name || 'produto');
                          setFormData(prev => ({ ...prev, image: imageUrl }));
                        } catch (error) {
                          alert('Erro ao fazer upload da imagem: ' + error.message);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {/* Input manual de URL */}
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="Ou cole a URL da imagem"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 Faça upload de uma imagem ou cole a URL
              </p>
            </div>

            {/* Badge */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Badge (opcional)
              </label>
              <input
                type="text"
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                placeholder="Ex: MAIS VENDIDO"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Cor do Badge */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎨 Cor do Badge
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Cores pré-definidas */}
                {[
                  { value: 'purple', color: '#8B5CF6' },
                  { value: 'red', color: '#EF4444' },
                  { value: 'gold', color: '#F59E0B' },
                  { value: 'green', color: '#10B981' },
                  { value: 'blue', color: '#3B82F6' },
                  { value: 'pink', color: '#EC4899' }
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, badgeColor: c.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.badgeColor === c.value
                        ? 'border-gray-800 scale-110 ring-2 ring-offset-1 ring-gray-400'
                        : 'border-gray-300 hover:scale-105'
                      }`}
                    style={{ backgroundColor: c.color }}
                    title={c.value}
                  />
                ))}

                {/* Cor personalizada */}
                <label className={`relative w-8 h-8 rounded-full border-2 cursor-pointer overflow-hidden transition-all ${!['purple', 'red', 'gold', 'green', 'blue', 'pink'].includes(formData.badgeColor)
                    ? 'border-gray-800 scale-110 ring-2 ring-offset-1 ring-gray-400'
                    : 'border-gray-300 hover:scale-105'
                  }`} title="Cor personalizada">
                  <input
                    type="color"
                    value={!['purple', 'red', 'gold', 'green', 'blue', 'pink'].includes(formData.badgeColor) ? formData.badgeColor : '#8B5CF6'}
                    onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div
                    className="w-full h-full flex items-center justify-center text-xs"
                    style={{
                      background: !['purple', 'red', 'gold', 'green', 'blue', 'pink'].includes(formData.badgeColor)
                        ? formData.badgeColor
                        : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                    }}
                  >
                    {['purple', 'red', 'gold', 'green', 'blue', 'pink'].includes(formData.badgeColor) && '🎨'}
                  </div>
                </label>
              </div>

              {/* Prévia compacta */}
              {formData.badge && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Prévia:</span>
                  <div
                    className="text-white text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: formData.badgeColor === 'purple' ? 'linear-gradient(to right, #8B5CF6, #6366F1)' :
                        formData.badgeColor === 'red' ? 'linear-gradient(to right, #EF4444, #EC4899)' :
                          formData.badgeColor === 'gold' ? 'linear-gradient(to right, #F59E0B, #F97316)' :
                            formData.badgeColor === 'green' ? 'linear-gradient(to right, #10B981, #059669)' :
                              formData.badgeColor === 'blue' ? 'linear-gradient(to right, #3B82F6, #2563EB)' :
                                formData.badgeColor === 'pink' ? 'linear-gradient(to right, #EC4899, #DB2777)' :
                                  formData.badgeColor
                    }}
                  >
                    {formData.badge}
                  </div>
                </div>
              )}
            </div>

            {/* Em Promoção */}
            <div className="col-span-2">
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg cursor-pointer hover:border-yellow-300 transition">
                <input
                  type="checkbox"
                  name="em_promocao"
                  checked={formData.em_promocao}
                  onChange={(e) => setFormData({ ...formData, em_promocao: e.target.checked })}
                  className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800">🎉 Produto em Promoção de Fim de Ano</span>
                  <p className="text-xs text-gray-600 mt-1">Marque para exibir este produto na seção especial de promoções</p>
                </div>
              </label>
            </div>

            {/* Avaliação */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Avaliação (0-5)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Número de avaliações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Avaliações
              </label>
              <input
                type="number"
                name="reviews"
                value={formData.reviews}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Quantidade de Puffs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantidade de Puffs
              </label>
              <select
                name="puff_count"
                value={formData.puff_count}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Selecione...</option>
                <option value="600">600 Puffs</option>
                <option value="800">800 Puffs</option>
                <option value="1500">1.500 Puffs</option>
                <option value="2000">2.000 Puffs</option>
                <option value="2500">2.500 Puffs</option>
                <option value="3000">3.000 Puffs</option>
                <option value="3500">3.500 Puffs</option>
                <option value="4000">4.000 Puffs</option>
                <option value="5000">5.000 Puffs</option>
                <option value="6000">6.000 Puffs</option>
                <option value="7000">7.000 Puffs</option>
                <option value="8000">8.000 Puffs</option>
                <option value="10000">10.000 Puffs</option>
                <option value="12000">12.000 Puffs</option>
                <option value="15000">15.000 Puffs</option>
                <option value="20000">20.000 Puffs</option>
                <option value="25000">25.000 Puffs</option>
                <option value="28000">28.000 Puffs</option>
                <option value="30000">30.000 Puffs</option>
                <option value="35000">35.000 Puffs</option>
                <option value="40000">40.000 Puffs</option>
                <option value="45000">45.000 Puffs</option>
                <option value="50000">50.000 Puffs</option>
              </select>
            </div>

            {/* Estoque */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantidade em Estoque *
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quando menor que {formData.low_stock_threshold}, aparecerá "Últimas unidades"
              </p>
            </div>

            {/* Limite de Estoque Baixo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alerta de Estoque Baixo
              </label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantidade mínima para mostrar alerta (padrão: 5)
              </p>
            </div>
          </div>

          {/* Checkbox: É Produto de Caixa? */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isBoxProduct}
                onChange={(e) => setIsBoxProduct(e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <div>
                <span className="text-lg font-bold text-gray-800">
                  📦 Este é um produto de CAIXA (múltiplas unidades)
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Marque se este produto é uma caixa com várias unidades (ex: Caixa com 10 pods)
                </p>
              </div>
            </label>
          </div>

          {/* Venda por Caixa - Só aparece se checkbox marcado */}
          {isBoxProduct && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📦 Configuração da Caixa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Unidades por Caixa */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidades por Caixa *
                  </label>
                  <input
                    type="number"
                    name="units_per_box"
                    value={formData.units_per_box}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 10 unidades
                  </p>
                </div>

                {/* Desconto da Caixa */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Desconto da Caixa (%)
                  </label>
                  <input
                    type="number"
                    name="box_discount_percent"
                    value={formData.box_discount_percent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Padrão: 15% de desconto
                  </p>
                </div>

                {/* Preço da Caixa (Calculado) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço da Caixa
                  </label>
                  <div className="w-full px-4 py-2 border-2 border-green-300 bg-green-50 rounded-lg font-bold text-green-700 text-lg">
                    R$ {calculatedBoxPrice.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculado automaticamente
                  </p>
                </div>
              </div>

              {/* Resumo do Desconto */}
              {formData.price && formData.units_per_box && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Resumo:</strong> {formData.units_per_box} unidades × R$ {parseFloat(formData.price || 0).toFixed(2)} =
                    <span className="line-through text-gray-500 mx-2">
                      R$ {(parseFloat(formData.price || 0) * parseInt(formData.units_per_box || 10)).toFixed(2)}
                    </span>
                    <span className="text-green-600 font-bold">
                      R$ {calculatedBoxPrice.toFixed(2)}
                    </span>
                    <span className="text-blue-600 ml-2">
                      (Economia: R$ {((parseFloat(formData.price || 0) * parseInt(formData.units_per_box || 10)) - calculatedBoxPrice).toFixed(2)})
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Seleção de Sabores */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sabores Disponíveis
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
              {availableFlavors.map((flavor) => {
                const isActive = flavor.is_active !== false; // Considera ativo se não definido
                const isSelected = selectedFlavors.includes(flavor.id);

                return (
                  <label
                    key={flavor.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition relative ${isSelected
                      ? 'bg-primary text-white'
                      : isActive
                        ? 'bg-white hover:bg-gray-100'
                        : 'bg-gray-200 opacity-60'
                      }`}
                    title={isActive ? flavor.name : `${flavor.name} (Indisponível)`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFlavorToggle(flavor.id)}
                      className="w-4 h-4"
                      disabled={!isActive}
                    />
                    <span className={`text-xs font-medium flex-1 ${!isActive ? 'line-through' : ''}`}>
                      {flavor.name}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        ✗
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {selectedFlavors.length} sabor(es) selecionado(s)
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Disponível
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Indisponível
                </span>
              </div>
            </div>
          </div>

          {/* Campos serves e size removidos - não são necessários */}

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
