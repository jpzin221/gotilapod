import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Package, GripVertical, Search, Filter } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const categoryMap = availableCategories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  const groupedProducts = products.reduce((acc, product) => {
    const categoryId = product.category_id;
    const categoryName = categoryId ? (categoryMap[categoryId] || product.category || 'Sem Categoria') : (product.category || 'Sem Categoria');
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(product);
    return acc;
  }, {});

  Object.keys(groupedProducts).forEach(category => {
    groupedProducts[category].sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999));
  });

  const categories = ['all', ...Object.keys(groupedProducts).sort()];

  useEffect(() => {
    const expanded = {};
    Object.keys(groupedProducts).forEach(cat => { expanded[cat] = true; });
    setExpandedCategories(expanded);
  }, [products, availableCategories]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleEdit = (product) => { setEditingProduct(product); setShowProductForm(true); };
  const handleCreate = () => { setEditingProduct(null); setShowProductForm(true); };

  const handleSaveProduct = async (productData) => {
    const savedProduct = await onSave(productData);
    setShowProductForm(false);
    setEditingProduct(null);
    if (onRefresh) await onRefresh();
    return savedProduct;
  };

  const handleCloseForm = () => { setShowProductForm(false); setEditingProduct(null); };

  const handleDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedProduct(null);
    setDragOverProduct(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDragEnter = (e, product) => { e.preventDefault(); setDragOverProduct(product); };

  const handleDrop = async (e, targetProduct) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedProduct || draggedProduct.id === targetProduct.id) return;
    if (draggedProduct.category !== targetProduct.category) {
      alert('So e possivel reordenar produtos dentro da mesma categoria');
      return;
    }
    const category = draggedProduct.category || 'Sem Categoria';
    const categoryProducts = groupedProducts[category];
    const draggedIndex = categoryProducts.findIndex(p => p.id === draggedProduct.id);
    const targetIndex = categoryProducts.findIndex(p => p.id === targetProduct.id);
    const reordered = [...categoryProducts];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    setIsReordering(true);
    try {
      const savePromises = reordered.map((product, index) => {
        const productData = {
          id: product.id, name: product.name, description: product.description,
          detailed_description: product.detailed_description, price: product.price,
          original_price: product.original_price, image: product.image,
          category: product.category, badge: product.badge, rating: product.rating,
          reviews: product.reviews, puff_count: product.puff_count,
          stock_quantity: product.stock_quantity, low_stock_threshold: product.low_stock_threshold,
          units_per_box: product.units_per_box, box_price: product.box_price,
          box_discount_percent: product.box_discount_percent, display_order: index
        };
        return onSave(productData);
      });
      await Promise.all(savePromises);
      await onRefresh();
    } catch (error) {
      console.error('Erro ao reordenar produtos:', error);
      alert('Erro ao reordenar produtos.');
    } finally {
      setIsReordering(false);
    }
  };

  const filteredCategories = selectedCategory === 'all'
    ? Object.entries(groupedProducts)
    : Object.entries(groupedProducts).filter(([cat]) => cat === selectedCategory);

  // Filtrar por busca
  const searchedCategories = searchTerm
    ? filteredCategories.map(([cat, prods]) => [cat, prods.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )]).filter(([, prods]) => prods.length > 0)
    : filteredCategories;

  return (
    <div className="space-y-5 relative">
      {isReordering && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-lg font-bold text-white">Salvando nova ordem...</p>
            <p className="text-sm text-gray-400">Aguarde um momento</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Produtos
              <span className="text-sm font-normal text-gray-400 ml-2">{products.length} itens</span>
            </h2>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-lg transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Busca + Filtros */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition
                  ${selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
              >
                {cat === 'all' ? 'Todas' : cat}
                {cat !== 'all' && ` (${groupedProducts[cat]?.length || 0})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {searchedCategories.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">{searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
            {!searchTerm && (
              <button onClick={handleCreate} className="mt-3 text-primary hover:text-primary/80 text-sm font-medium">
                Criar primeiro produto
              </button>
            )}
          </div>
        ) : (
          searchedCategories.map(([category, categoryProducts]) => (
            <div key={category} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{category}</h3>
                  <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-0.5 rounded-full">
                    {categoryProducts.length}
                  </span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {expandedCategories[category] && (
                <div className="border-t border-gray-800">
                  {categoryProducts.map((product) => {
                    const isOutOfStock = product.stock_quantity === 0;
                    const isDragging = draggedProduct?.id === product.id;
                    const isDragOver = dragOverProduct?.id === product.id;

                    return (
                      <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, product)}
                        onDrop={(e) => handleDrop(e, product)}
                        className={`px-5 py-3 border-t border-gray-800/50 transition cursor-move
                          ${isOutOfStock ? 'opacity-50' : 'hover:bg-gray-800/30'}
                          ${isDragging ? 'opacity-30' : ''}
                          ${isDragOver ? 'border-t-2 border-primary' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing" />

                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className={`w-14 h-14 object-cover rounded-lg flex-shrink-0 ${isOutOfStock ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-gray-600" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white text-sm truncate">{product.name}</h4>
                              {isOutOfStock && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">SEM ESTOQUE</span>
                              )}
                              {product.badge && (
                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">{product.badge}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-bold text-emerald-400">R$ {(product.price || 0).toFixed(2)}</span>
                              {product.original_price && (
                                <span className="text-xs text-gray-600 line-through">R$ {product.original_price.toFixed(2)}</span>
                              )}
                              {product.rating && (
                                <span className="text-xs text-yellow-500">★ {product.rating}</span>
                              )}
                              <span className="text-xs text-gray-600">Estoque: {product.stock_quantity || 0}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(product.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {showProductForm && (
        <ProductForm product={editingProduct} onSave={handleSaveProduct} onClose={handleCloseForm} />
      )}
    </div>
  );
}
