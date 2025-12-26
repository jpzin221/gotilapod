import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { storeInfo } from '../data/products';
import { ArrowLeft, Phone, Instagram, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function Contato() {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${storeInfo.whatsapp}`, '_blank');
  };

  const handleInstagramClick = () => {
    window.open(storeInfo.instagram, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header storeInfo={storeInfo} />

      <main className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:text-secondary transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Voltar para a loja</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Entre em Contato
          </h1>
          <p className="text-lg text-gray-600">
            Estamos aqui para ajudar você!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-6 transition transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <MessageCircle className="w-12 h-12" />
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1">WhatsApp</h3>
                <p className="text-green-100">{storeInfo.phone}</p>
                <p className="text-sm text-green-100 mt-2">Clique para conversar</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleInstagramClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg p-6 transition transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <Instagram className="w-12 h-12" />
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1">Instagram</h3>
                <p className="text-purple-100">{storeInfo.instagramHandle}</p>
                <p className="text-sm text-purple-100 mt-2">Siga-nos</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-800">Localização</h3>
            </div>
            <p className="text-gray-700">{storeInfo.address}</p>
            <p className="text-sm text-gray-500 mt-2">
              Atendemos em um raio de 5 km através de lojas parceiras
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-800">Horário</h3>
            </div>
            <p className="text-gray-700">Segunda a Sábado</p>
            <p className="text-gray-700">9h às 22h</p>
            <p className="text-sm text-gray-500 mt-2">
              Respondemos rapidamente pelo WhatsApp
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-sm p-8 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Dúvidas Frequentes?
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Como faço um pedido?</h3>
              <p className="text-sm text-white/90">
                Navegue pelos produtos, adicione ao carrinho e finalize pelo WhatsApp ou PIX.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Qual o prazo de entrega?</h3>
              <p className="text-sm text-white/90">
                Entregamos rapidamente através de lojas parceiras. O prazo varia conforme sua região.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Posso trocar ou devolver?</h3>
              <p className="text-sm text-white/90">
                Entre em contato pelo WhatsApp para tratar casos específicos.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-dark via-gray-900 to-dark text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {storeInfo.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
