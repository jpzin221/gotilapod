import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X, Image as ImageIcon, Upload } from 'lucide-react';
import { carouselService, imageUploadService } from '../../lib/supabase';

export default function CarouselManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: '',
    image_mobile_url: '',
    image_desktop_url: '',
    display_order: 0,
    is_active: true
  });
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setLoading(true);
      const data = await carouselService.getAll();
      setSlides(data || []);
    } catch (error) {
      console.error('Erro ao carregar slides:', error);
      alert('Erro ao carregar slides do carrossel');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide.id);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      badge: slide.badge || '',
      image_mobile_url: slide.image_mobile_url,
      image_desktop_url: slide.image_desktop_url,
      display_order: slide.display_order,
      is_active: slide.is_active
    });
    setMobilePreview(slide.image_mobile_url);
    setDesktopPreview(slide.image_desktop_url);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      subtitle: '',
      badge: '',
      image_mobile_url: '',
      image_desktop_url: '',
      display_order: slides.length + 1,
      is_active: true
    });
  };

  const handleCancel = () => {
    setEditingSlide(null);
    setIsCreating(false);
    setMobilePreview(null);
    setDesktopPreview(null);
    setFormData({
      title: '',
      subtitle: '',
      badge: '',
      image_mobile_url: '',
      image_desktop_url: '',
      display_order: 0,
      is_active: true
    });
  };

  const handleMobileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingMobile(true);
      const imageUrl = await imageUploadService.uploadCarouselImage(file, 'mobile');
      setFormData({ ...formData, image_mobile_url: imageUrl });
      setMobilePreview(imageUrl);
      alert('Imagem mobile enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem mobile');
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleDesktopImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingDesktop(true);
      const imageUrl = await imageUploadService.uploadCarouselImage(file, 'desktop');
      setFormData({ ...formData, image_desktop_url: imageUrl });
      setDesktopPreview(imageUrl);
      alert('Imagem desktop enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem desktop');
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleRemoveMobileImage = () => {
    setFormData({ ...formData, image_mobile_url: '' });
    setMobilePreview(null);
  };

  const handleRemoveDesktopImage = () => {
    setFormData({ ...formData, image_desktop_url: '' });
    setDesktopPreview(null);
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await carouselService.create(formData);
        alert('Slide criado com sucesso!');
      } else if (editingSlide) {
        await carouselService.update(editingSlide, formData);
        alert('Slide atualizado com sucesso!');
      }
      handleCancel();
      loadSlides();
    } catch (error) {
      console.error('Erro ao salvar slide:', error);
      alert('Erro ao salvar slide');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este slide?')) return;
    
    try {
      await carouselService.delete(id);
      alert('Slide deletado com sucesso!');
      loadSlides();
    } catch (error) {
      console.error('Erro ao deletar slide:', error);
      alert('Erro ao deletar slide');
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      await carouselService.update(slide.id, { is_active: !slide.is_active });
      loadSlides();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do slide');
    }
  };

  // Funções de Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem === null || draggedItem === index) return;

    // Reordenar array temporariamente para preview visual
    const newSlides = [...slides];
    const draggedSlide = newSlides[draggedItem];
    newSlides.splice(draggedItem, 1);
    newSlides.splice(index, 0, draggedSlide);
    
    setSlides(newSlides);
    setDraggedItem(index);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsSavingOrder(true);
    
    try {
      // Atualizar ordem no banco de dados
      const slideIds = slides.map(slide => slide.id);
      await carouselService.reorder(slideIds);
      
      // Recarregar para garantir sincronização
      await loadSlides();
      
      // Mostrar feedback de sucesso
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao reordenar slides:', error);
      alert('Erro ao atualizar ordem dos slides');
      loadSlides(); // Recarregar em caso de erro
    } finally {
      setIsSavingOrder(false);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Carrossel</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Slide
        </button>
      </div>

      {/* Formulário de Criação/Edição */}
      {(isCreating || editingSlide) && (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-primary">
          <h3 className="text-xl font-bold mb-4">
            {isCreating ? 'Criar Novo Slide' : 'Editar Slide'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Promoção Especial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Novidade, Oferta, Destaque"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <textarea
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="2"
                placeholder="Ex: Aproveite descontos de até 50%"
              />
            </div>

            {/* Imagem Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem Mobile * (Proporção 9:16 recomendada)
              </label>
              
              {mobilePreview && (
                <div className="relative mb-3">
                  <img 
                    src={mobilePreview} 
                    alt="Preview Mobile" 
                    className="w-32 h-56 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={handleRemoveMobileImage}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingMobile ? 'Enviando...' : 'Fazer Upload'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageUpload}
                    className="hidden"
                    disabled={uploadingMobile}
                  />
                </label>
                
                <input
                  type="text"
                  value={formData.image_mobile_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_mobile_url: e.target.value });
                    setMobilePreview(e.target.value);
                  }}
                  placeholder="Ou cole a URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Faça upload ou cole a URL da imagem
              </p>
            </div>

            {/* Imagem Desktop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem Desktop * (Proporção 16:9 recomendada)
              </label>
              
              {desktopPreview && (
                <div className="relative mb-3">
                  <img 
                    src={desktopPreview} 
                    alt="Preview Desktop" 
                    className="w-56 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={handleRemoveDesktopImage}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingDesktop ? 'Enviando...' : 'Fazer Upload'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDesktopImageUpload}
                    className="hidden"
                    disabled={uploadingDesktop}
                  />
                </label>
                
                <input
                  type="text"
                  value={formData.image_desktop_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_desktop_url: e.target.value });
                    setDesktopPreview(e.target.value);
                  }}
                  placeholder="Ou cole a URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Faça upload ou cole a URL da imagem
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Slide Ativo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-5 h-5" />
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Slides - Drag & Drop */}
      <div className="space-y-3">
        {/* Notificação de Salvamento */}
        {isSavingOrder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <p className="text-sm text-yellow-800 font-medium">
              Salvando nova ordem...
            </p>
          </div>
        )}
        
        {orderSaved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-sm text-green-800 font-medium">
              Ordem salva com sucesso!
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 font-medium">
            💡 <strong>Dica:</strong> Arraste e solte os slides para reordenar. A ordem será salva automaticamente!
          </p>
        </div>

        {slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 ${
              slide.is_active ? 'border-green-500' : 'border-gray-300'
            } ${draggedItem === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} cursor-move hover:shadow-lg`}
          >
            <div className="flex items-start gap-4 p-4">
              {/* Handle de Arrastar */}
              <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-6 h-6 text-gray-400" />
              </div>

              {/* Preview da Imagem */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <img
                    src={slide.image_desktop_url}
                    alt={slide.title}
                    className="w-32 h-20 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128x80?text=Sem+Imagem';
                    }}
                  />
                  <button
                    onClick={() => setPreviewImage(slide)}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center"
                  >
                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>

              {/* Informações do Slide */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{slide.title}</h3>
                      {slide.badge && (
                        <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {slide.badge}
                        </span>
                      )}
                    </div>
                    {slide.subtitle && (
                      <p className="text-gray-600 text-sm mb-2">{slide.subtitle}</p>
                    )}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="truncate">📱 Mobile: {slide.image_mobile_url}</p>
                      <p className="truncate">💻 Desktop: {slide.image_desktop_url}</p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className={`p-2 rounded-lg transition ${
                        slide.is_active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={slide.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {slide.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(slide)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
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
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">Nenhum slide cadastrado</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-primary hover:underline"
          >
            Criar primeiro slide
          </button>
        </div>
      )}

      {/* Modal de Preview de Imagem */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{previewImage.title}</h3>
                {previewImage.subtitle && (
                  <p className="text-sm text-gray-600">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Imagem Desktop */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  💻 Versão Desktop
                </h4>
                <img
                  src={previewImage.image_desktop_url}
                  alt={`${previewImage.title} - Desktop`}
                  className="w-full rounded-lg shadow-lg border-2 border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x400?text=Imagem+Desktop+Não+Encontrada';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 break-all">
                  {previewImage.image_desktop_url}
                </p>
              </div>

              {/* Imagem Mobile */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  📱 Versão Mobile
                </h4>
                <div className="flex justify-center">
                  <img
                    src={previewImage.image_mobile_url}
                    alt={`${previewImage.title} - Mobile`}
                    className="max-w-sm w-full rounded-lg shadow-lg border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x600?text=Imagem+Mobile+Não+Encontrada';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center break-all">
                  {previewImage.image_mobile_url}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
