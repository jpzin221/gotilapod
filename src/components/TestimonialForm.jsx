import { useState } from 'react';
import { X, Star, Send, CheckCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { testimonialService } from '../lib/supabase';

export default function TestimonialForm({ isOpen, onClose, onSubmitted, pedidoId = null }) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    depoimento: '',
    avaliacao: 5
  });
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 3) {
      setError('Você pode adicionar no máximo 3 imagens');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }
    
    if (!formData.depoimento.trim()) {
      setError('Por favor, escreva seu depoimento');
      return;
    }

    if (formData.depoimento.length < 20) {
      setError('O depoimento deve ter pelo menos 20 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload das imagens
      let imageUrls = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const url = await testimonialService.uploadImage(file);
          imageUrls.push(url);
        }
      }

      await testimonialService.create({
        ...formData,
        pedido_id: pedidoId,
        imagens: imageUrls.length > 0 ? imageUrls : null
      });

      setSuccess(true);
      
      // Fechar após 3 segundos
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 3000);

    } catch (err) {
      console.error('Erro ao enviar depoimento:', err);
      setError('Erro ao enviar depoimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, avaliacao: rating });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-modal-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Depoimento Enviado!
          </h3>
          <p className="text-gray-600 mb-4">
            Obrigado por compartilhar sua experiência! 🎉
          </p>
          <p className="text-sm text-gray-500">
            Seu depoimento será analisado e publicado em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative animate-modal-in">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Deixe Seu Depoimento
          </h2>
          <p className="text-gray-600">
            Compartilhe sua experiência de compra conosco
          </p>
          <p className="text-sm text-orange-600 mt-2 font-semibold">
            💡 Seu depoimento será liberado após aprovação do administrador
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avaliação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Avaliação *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= formData.avaliacao
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                ({formData.avaliacao} {formData.avaliacao === 1 ? 'estrela' : 'estrelas'})
              </span>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seu Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          {/* Telefone (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefone (opcional)
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              placeholder="(41) 99999-9999"
            />
          </div>

          {/* Email (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              E-mail (opcional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              placeholder="seu@email.com"
            />
          </div>

          {/* Upload de Imagens */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Adicionar Fotos (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Máximo 3 imagens • Até 5MB cada
            </p>
            
            {/* Preview das imagens */}
            {images.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de upload */}
            {images.length < 3 && (
              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition cursor-pointer">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Clique para adicionar fotos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Depoimento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seu Depoimento *
            </label>
            <textarea
              value={formData.depoimento}
              onChange={(e) => setFormData({ ...formData, depoimento: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
              rows="5"
              placeholder="Conte-nos sobre sua experiência de compra, qualidade do produto, atendimento, entrega..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 20 caracteres ({formData.depoimento.length}/20)
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Depoimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
