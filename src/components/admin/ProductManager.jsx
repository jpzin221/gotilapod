import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Package, GripVertical } from 'lucide-react';
import ProductForm from './ProductForm';
import { categoryService } from '../../lib/supabase';

export default function ProductManager({ products, onSave, onDelete, onRefresh }) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [dragOverProduct, setDragOverProduct] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Carregar categorias do banco
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await categoryService.getAll();
        setAvailableCategories(categories || []);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    loadCategories();
  }, []);

  // Criar mapa de category_id para nome da categoria
  const categoryMap = availableCategories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  // Agrupar produtos por category_id (mais confiável)
  const groupedProducts = products.reduce((acc, product) => {
    // Usar category_id para agrupamento, com fallback para category string
    const categoryId = product.category_id;
    const categoryName = categoryId ? (categoryMap[categoryId] || product.category || 'Sem Categoria') : (product.category || 'Sem Categoria');

    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});

  // Ordenar produtos dentro de cada categoria por display_order
  Object.keys(groupedProducts).forEach(category => {
    groupedProducts[category].sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });
  });

  // Obter lista de categorias únicas
  const categories = ['all', ...Object.keys(groupedProducts).sort()];

  // Expandir todas as categorias por padrão
  useEffect(() => {
    const expanded = {};
    Object.keys(groupedProducts).forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);
  }, [products, availableCategories]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (productData) => {
    const savedProduct = await onSave(productData);
    setShowProductForm(false);
    setEditingProduct(null);
    // Atualizar lista de produtos após salvar
    if (onRefresh) {
      await onRefresh();
    }
    return savedProduct; // Retornar produto salvo para o ProductForm poder salvar os sabores
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Funções de Drag and Drop
  const handleDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedProduct(null);
    setDragOverProduct(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, product) => {
    e.preventDefault();
    setDragOverProduct(product);
  };

  const handleDrop = async (e, targetProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      return;
    }

    // Só permite reordenar dentro da mesma categoria
    if (draggedProduct.category !== targetProduct.category) {
      alert('Só é possível reordenar produtos dentro da mesma categoria');
      return;
    }

    const category = draggedProduct.category || 'Sem Categoria';
    const categoryProducts = groupedProducts[category];

    // Encontrar índices
    const draggedIndex = categoryProducts.findIndex(p => p.id === draggedProduct.id);
    const targetIndex = categoryProducts.findIndex(p => p.id === targetProduct.id);

    // Reordenar array
    const reordered = [...categoryProducts];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Atualizar display_order de todos os produtos da categoria
    setIsReordering(true);

    try {
      // Salvar todos os produtos em paralelo para ser mais rápido
      const savePromises = reordered.map((product, index) => {
        // Enviar apenas os campos que existem na tabela products
        const productData = {
          id: product.id,
          name: product.name,
          description: product.description,
          detailed_description: product.detailed_description,
          price: product.price,
          original_price: product.original_price,
          image: product.image,
          category: product.category,
          badge: product.badge,
          rating: product.rating,
          reviews: product.reviews,
          puff_count: product.puff_count,
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold,
          units_per_box: product.units_per_box,
          box_price: product.box_price,
          box_discount_percent: product.box_discount_percent,
          display_order: index // Nova ordem
        };

        return onSave(productData);
      });

      // Aguardar todas as atualizações
      await Promise.all(savePromises);

      // Atualizar lista apenas UMA vez no final
      await onRefresh();
    } catch (error) {
      console.error('Erro ao reordenar produtos:', error);
      alert('Erro ao reordenar produtos. Tente novamente.');
    } finally {
      setIsReordering(false);
    }
  };

  // Filtrar produtos por categoria selecionada
  const filteredCategories = selectedCategory === 'all'
    ? Object.entries(groupedProducts)
    : Object.entries(groupedProducts).filter(([cat]) => cat === selectedCategory);

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay durante reordenação */}
      {isReordering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            <p className="text-xl font-bold text-gray-800">Salvando nova ordem...</p>
            <p className="text-sm text-gray-600">Aguarde um momento</p>
          </div>
        </div>
      )}
      {/* Header com filtros e botão adicionar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Gerenciar Produtos ({products.length})
            </h2>
            <p className="text-sm text-gray-600">
              Organize seus produtos por categoria
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>

        {/* Filtro por Categoria */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {cat === 'all' ? '📦 Todas' : cat}
              {cat !== 'all' && ` (${groupedProducts[cat]?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos por Categoria */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum produto cadastrado</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-primary hover:underline font-medium"
            >
              Criar primeiro produto
            </button>
          </div>
        ) : (
          filteredCategories.map(([category, categoryProducts]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header da Categoria */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                  <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">
                    {categoryProducts.length} {categoryProducts.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {/* Lista de Produtos da Categoria */}
              {expandedCategories[category] && (
                <div className="divide-y divide-gray-200">
                  {categoryProducts.map((product) => {
                    const isOutOfStock = product.stock_quantity === 0;
                    const isDragging = draggedProduct?.id === product.id;
                    const isDragOver = dragOverProduct?.id === product.id;

                    return (
                      <div
                        key={product.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, product)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, product)}
                        onDrop={(e) => handleDrop(e, product)}
                        className={`p-4 transition relative cursor-move ${isOutOfStock
                          ? 'bg-gray-100 opacity-60'
                          : 'hover:bg-gray-50'
                          } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-t-4 border-primary' : ''}`}
                      >
                        {/* Badge de Esgotado */}
                        {isOutOfStock && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                            ESGOTADO
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Ícone de Arrastar */}
                          <div className="flex items-center justify-center pt-2">
                            <GripVertical className="w-6 h-6 text-gray-400 hover:text-primary transition cursor-grab active:cursor-grabbing" />
                          </div>

                          {/* Imagem do Produto */}
                          {product.image && (
                            <div className="relative">
                              <img
                                src={product.image}
                                alt={product.name}
                                className={`w-20 h-20 object-cover rounded-lg shadow-sm ${isOutOfStock ? 'grayscale' : ''
                                  }`}
                              />
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">SEM ESTOQUE</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Informações do Produto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  {product.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="font-bold text-primary text-lg">
                                    R$ {product.price.toFixed(2)}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-gray-500 line-through">
                                      R$ {product.originalPrice.toFixed(2)}
                                    </span>
                                  )}
                                  {product.badge && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                      {product.badge}
                                    </span>
                                  )}
                                  {product.rating && (
                                    <span className="text-yellow-500">
                                      ⭐ {product.rating}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                  title="Editar"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => onDelete(product.id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                  title="Deletar"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Formulário */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
