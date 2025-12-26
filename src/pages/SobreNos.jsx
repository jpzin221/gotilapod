import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { storeInfo } from '../data/products';
import { ArrowLeft, Store, Award, Shield, Heart, Truck, Users } from 'lucide-react';

export default function SobreNos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header storeInfo={storeInfo} />

      <main className="max-w-4xl mx-auto px-4 pt-24 sm:pt-28 pb-8">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:text-secondary transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Voltar para a loja</span>
        </button>

        {/* Título */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Sobre a {storeInfo.name}
          </h1>
          <p className="text-lg text-gray-600">
            Sua loja de confiança para vaporizadores e pods de qualidade
          </p>
        </div>

        {/* Nossa História */}
        <section className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Nossa História</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              A <strong>{storeInfo.name}</strong> nasceu da paixão por oferecer produtos de qualidade 
              e um atendimento excepcional para os amantes de vaporizadores em todo o Paraná.
            </p>
            <p>
              Começamos como uma pequena loja local e, graças à confiança de nossos clientes, 
              expandimos nosso atendimento para todo o estado, mantendo sempre o compromisso 
              com a excelência e a satisfação do cliente.
            </p>
            <p>
              Hoje, somos referência em vaporizadores, pods e acessórios, oferecendo as melhores 
              marcas do mercado com entrega rápida e segura através de nossa rede de lojas parceiras.
            </p>
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Nossos Valores</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Qualidade */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Qualidade Garantida</h3>
                <p className="text-gray-600 text-sm">
                  Trabalhamos apenas com produtos originais das melhores marcas do mercado.
                </p>
              </div>
            </div>

            {/* Segurança */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Compra Segura</h3>
                <p className="text-gray-600 text-sm">
                  Seus dados estão protegidos e suas compras são 100% seguras.
                </p>
              </div>
            </div>

            {/* Entrega Rápida */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Entrega Expressa</h3>
                <p className="text-gray-600 text-sm">
                  Entregamos rapidamente através de nossa rede de lojas parceiras.
                </p>
              </div>
            </div>

            {/* Atendimento */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Atendimento Personalizado</h3>
                <p className="text-gray-600 text-sm">
                  Nossa equipe está sempre pronta para ajudar você a escolher o melhor produto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nossa Missão */}
        <section className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Nossa Missão</h2>
          <p className="text-lg leading-relaxed">
            Proporcionar a melhor experiência de compra de vaporizadores e pods, 
            oferecendo produtos de qualidade, preços justos e um atendimento que 
            supera as expectativas dos nossos clientes em todo o Paraná.
          </p>
        </section>

        {/* Compromisso com a Responsabilidade */}
        <section className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 md:p-6 lg:p-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-red-800 mb-2 sm:mb-3">
            ⚠️ Compromisso com a Responsabilidade
          </h2>
          <div className="space-y-2 sm:space-y-3 text-red-900">
            <p className="text-sm sm:text-base font-semibold">
              Venda Proibida para Menores de 18 Anos
            </p>
            <p className="text-xs sm:text-sm leading-tight">
              Nossos produtos contêm nicotina, substância que causa dependência química. 
              Seguimos rigorosamente todas as normas e regulamentações vigentes, 
              garantindo que a venda seja destinada exclusivamente para maiores de 18 anos.
            </p>
            <p className="text-xs sm:text-sm leading-tight">
              Acreditamos na importância do consumo consciente e responsável.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-dark via-gray-900 to-dark text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Dados da Empresa */}
          <div className="border-t border-gray-700 pt-6 mt-6">
            <p className="text-xs text-gray-500 mb-2">Informações Legais</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-500">{storeInfo.fantasyName}</span> - {storeInfo.legalName}</p>
              <p>CNPJ: {storeInfo.cnpj} | IE: {storeInfo.stateRegistration}</p>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            © 2024 {storeInfo.legalName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
