import { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus } from 'lucide-react';
import { testimonialService } from '../lib/supabase';
import TestimonialForm from './TestimonialForm';
import ImageModal from './ImageModal';

export default function ReviewsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialService.getApproved();
      
      // Garantir que imagens seja sempre um array
      const processedData = data?.map(t => ({
        ...t,
        imagens: Array.isArray(t.imagens) ? t.imagens : (t.imagens ? [t.imagens] : [])
      })) || [];
      
      setTestimonials(processedData);
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialSubmitted = () => {
    setShowForm(false);
    // Opcional: Recarregar depoimentos (mas não vai aparecer até ser aprovado)
  };

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

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-500 mt-2">Carregando depoimentos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold text-sm">
                O que nossos clientes dizem
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              Depoimentos
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Confira a experiência de quem já comprou conosco
            </p>

            {/* Botão para adicionar depoimento */}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Deixar Meu Depoimento
            </button>

            {/* Aviso */}
            <p className="text-xs text-gray-500 mt-3 italic">
              💡 Depoimentos são liberados após aprovação do administrador
            </p>
          </div>

          {/* Grid de Depoimentos */}
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-gray-100 hover:border-primary/20"
                >
                  {/* Estrelas */}
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(testimonial.avaliacao)}
                  </div>

                  {/* Depoimento */}
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-4">
                    "{testimonial.depoimento}"
                  </p>

                  {/* Imagens do depoimento - Design Minimalista */}
                  {testimonial.imagens && testimonial.imagens.length > 0 && (
                    <div className="flex gap-1.5 mb-3">
                      {testimonial.imagens.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img)}
                          className="relative group cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                          title="Clique para ampliar"
                        >
                          <img
                            src={img}
                            alt={`Foto ${index + 1}`}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded border border-gray-200 hover:border-gray-400 transition"
                            onError={(e) => {
                              console.error('❌ Erro ao carregar imagem:', img);
                              e.target.style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Autor */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {testimonial.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cliente verificado
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Ainda não há depoimentos aprovados.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Seja o primeiro a deixar sua opinião!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modal do Formulário */}
      {showForm && (
        <TestimonialForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmitted={handleTestimonialSubmitted}
        />
      )}

      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          imageName="Foto do depoimento"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}
