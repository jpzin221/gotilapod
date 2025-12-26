import { useState, useEffect } from 'react';
import { MessageSquare, Check, X, Eye, EyeOff, Trash2, Star, Clock, CheckCircle, Edit2, Image as ImageIcon, Upload } from 'lucide-react';
import { testimonialService } from '../../lib/supabase';
import ImageModal from '../ImageModal';

export default function TestimonialManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    depoimento: '',
    avaliacao: 5,
    created_at: '',
    imagens: []
  });
  const [newImages, setNewImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialService.getAll();
      setTestimonials(data || []);
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
      alert('Erro ao carregar depoimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Aprovar este depoimento?')) return;

    try {
      await testimonialService.approve(id);
      alert('✅ Depoimento aprovado!');
      loadTestimonials();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar depoimento');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reprovar este depoimento? Ele será ocultado.')) return;

    try {
      await testimonialService.reject(id);
      alert('❌ Depoimento reprovado');
      loadTestimonials();
    } catch (error) {
      console.error('Erro ao reprovar:', error);
      alert('Erro ao reprovar depoimento');
    }
  };

  const handleToggleVisibility = async (id, currentVisibility) => {
    try {
      await testimonialService.toggleVisibility(id, !currentVisibility);
      loadTestimonials();
    } catch (error) {
      console.error('Erro ao alterar visibilidade:', error);
      alert('Erro ao alterar visibilidade');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('⚠️ DELETAR este depoimento permanentemente?')) return;

    try {
      await testimonialService.delete(id);
      alert('🗑️ Depoimento deletado');
      loadTestimonials();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar depoimento');
    }
  };

  const handleEdit = (testimonial) => {
    setEditingId(testimonial.id);
    // Formatar data para input datetime-local (YYYY-MM-DDTHH:mm)
    const dataFormatada = testimonial.created_at 
      ? new Date(testimonial.created_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);
    
    // Garantir que imagens seja sempre um array
    const imagensArray = Array.isArray(testimonial.imagens) ? testimonial.imagens : [];
    
    setEditForm({
      nome: testimonial.nome,
      depoimento: testimonial.depoimento,
      avaliacao: testimonial.avaliacao,
      created_at: dataFormatada,
      imagens: imagensArray
    });
    setNewImages([]);
    setNewImageFiles([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ nome: '', depoimento: '', avaliacao: 5, created_at: '', imagens: [] });
    setNewImages([]);
    setNewImageFiles([]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const currentTotal = editForm.imagens.length + newImages.length;
    
    if (currentTotal + files.length > 3) {
      alert('Você pode ter no máximo 3 imagens por depoimento');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cada imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages(prev => [...prev, reader.result]);
        setNewImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    const url = prompt('Cole a URL da imagem:');
    if (url && url.trim()) {
      const currentTotal = editForm.imagens.length + newImages.length;
      if (currentTotal >= 3) {
        alert('Você pode ter no máximo 3 imagens por depoimento');
        return;
      }
      setEditForm(prev => ({
        ...prev,
        imagens: [...prev.imagens, url.trim()]
      }));
    }
  };

  const handleRemoveExistingImage = (index) => {
    setEditForm(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editForm.nome || !editForm.depoimento) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      // Upload das novas imagens (apenas se houver arquivos)
      let uploadedImageUrls = [];
      if (newImageFiles.length > 0) {
        try {
          for (const file of newImageFiles) {
            const url = await testimonialService.uploadImage(file);
            uploadedImageUrls.push(url);
          }
        } catch (uploadError) {
          console.error('Erro no upload:', uploadError);
          alert('⚠️ Erro ao fazer upload das imagens. Use o botão URL para adicionar imagens por link direto.');
          return;
        }
      }

      // Combinar imagens existentes com novas
      const allImages = [...editForm.imagens, ...uploadedImageUrls];
      
      // Converter data de volta para ISO string completo
      const dataParaSalvar = {
        ...editForm,
        created_at: new Date(editForm.created_at).toISOString(),
        imagens: allImages.length > 0 ? allImages : null
      };
      
      await testimonialService.update(editingId, dataParaSalvar);
      
      alert('✅ Depoimento atualizado!');
      setEditingId(null);
      setEditForm({ nome: '', depoimento: '', avaliacao: 5, created_at: '', imagens: [] });
      setNewImages([]);
      setNewImageFiles([]);
      loadTestimonials();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar depoimento: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    if (filter === 'pending') return !t.aprovado;
    if (filter === 'approved') return t.aprovado;
    return true;
  });

  const pendingCount = testimonials.filter(t => !t.aprovado).length;
  const approvedCount = testimonials.filter(t => t.aprovado).length;

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-500 mt-4">Carregando depoimentos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" />
            Gerenciar Depoimentos
          </h2>
          <p className="text-gray-600 mt-1">
            Aprove ou reprove depoimentos de clientes
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos ({testimonials.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
            filter === 'pending'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pendentes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
            filter === 'approved'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Aprovados ({approvedCount})
        </button>
      </div>

      {/* Lista de Depoimentos */}
      {filteredTestimonials.length > 0 ? (
        <div className="space-y-4">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
                !testimonial.aprovado
                  ? 'border-orange-300 bg-orange-50/30'
                  : testimonial.visivel
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Nome e Status */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {testimonial.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        {renderStars(testimonial.avaliacao)}
                      </div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="text-sm text-gray-600 space-y-1">
                    {testimonial.telefone && (
                      <p>📱 {testimonial.telefone}</p>
                    )}
                    {testimonial.email && (
                      <p>📧 {testimonial.email}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      📅 {formatDate(testimonial.created_at)}
                    </p>
                  </div>
                </div>

                {/* Badges de Status */}
                <div className="flex flex-col gap-2">
                  {testimonial.aprovado ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Aprovado
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                  {!testimonial.visivel && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Oculto
                    </span>
                  )}
                </div>
              </div>

              {/* Depoimento ou Formulário de Edição */}
              {editingId === testimonial.id ? (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-300 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nome:
                    </label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Depoimento:
                    </label>
                    <textarea
                      value={editForm.depoimento}
                      onChange={(e) => setEditForm({ ...editForm, depoimento: e.target.value })}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Avaliação:
                    </label>
                    <select
                      value={editForm.avaliacao}
                      onChange={(e) => setEditForm({ ...editForm, avaliacao: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
                      <option value="4">⭐⭐⭐⭐ (4 estrelas)</option>
                      <option value="3">⭐⭐⭐ (3 estrelas)</option>
                      <option value="2">⭐⭐ (2 estrelas)</option>
                      <option value="1">⭐ (1 estrela)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      📅 Data do Depoimento:
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.created_at}
                      onChange={(e) => setEditForm({ ...editForm, created_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Altere a data e hora em que o depoimento foi feito
                    </p>
                  </div>

                  {/* Gerenciamento de Imagens */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📸 Imagens do Depoimento:
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Máximo 3 imagens • Até 5MB cada
                    </p>

                    {/* Imagens Existentes */}
                    {editForm.imagens.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Imagens atuais:</p>
                        <div className="flex gap-2 flex-wrap">
                          {editForm.imagens.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`Imagem ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:border-primary transition"
                                onClick={() => setSelectedImage(img)}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Novas Imagens (Preview) */}
                    {newImages.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-green-600 mb-2">Novas imagens (serão adicionadas):</p>
                        <div className="flex gap-2 flex-wrap">
                          {newImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`Nova imagem ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botões de Upload */}
                    {(editForm.imagens.length + newImages.length) < 3 && (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition cursor-pointer">
                          <Upload className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Upload de arquivo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                          <ImageIcon className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-blue-600">
                            URL
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-200">
                    <p className="text-gray-700 leading-relaxed">
                      "{testimonial.depoimento}"
                    </p>
                  </div>

                  {/* Imagens do depoimento */}
                  {testimonial.imagens && testimonial.imagens.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        Imagens do depoimento:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {testimonial.imagens.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Foto ${index + 1} do depoimento`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:border-primary transition"
                            onClick={() => setSelectedImage(img)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Ações */}
              <div className="flex gap-2 flex-wrap">
                {editingId !== testimonial.id && (
                  <>
                    <button
                      onClick={() => handleEdit(testimonial)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>

                    {!testimonial.aprovado && (
                      <button
                        onClick={() => handleApprove(testimonial.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                      >
                        <Check className="w-4 h-4" />
                        Aprovar
                      </button>
                    )}

                    {testimonial.aprovado && (
                      <button
                        onClick={() => handleReject(testimonial.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                      >
                        <X className="w-4 h-4" />
                        Reprovar
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleVisibility(testimonial.id, testimonial.visivel)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                    >
                      {testimonial.visivel ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Mostrar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Nenhum depoimento encontrado
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'pending' && 'Não há depoimentos pendentes de aprovação'}
            {filter === 'approved' && 'Não há depoimentos aprovados'}
            {filter === 'all' && 'Ainda não há depoimentos cadastrados'}
          </p>
        </div>
      )}

      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          imageName="Imagem do depoimento"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
