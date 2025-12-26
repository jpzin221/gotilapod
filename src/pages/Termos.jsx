import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { storeInfo } from '../data/products';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';

export default function Termos() {
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
              Termos de Uso
            </h1>
          </div>
          <p className="text-gray-600">
            Última atualização: Novembro de 2024
          </p>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
          {/* Introdução */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao acessar e usar o site da <strong>{storeInfo.name}</strong>, você concorda em 
              cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não 
              concordar com qualquer parte destes termos, não deve usar nosso site.
            </p>
          </section>

          {/* Restrição de Idade */}
          <section className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-red-800 mb-3">
                  2. Restrição de Idade - IMPORTANTE
                </h2>
                <div className="space-y-2 text-red-900">
                  <p className="font-semibold">
                    Este site e seus produtos são destinados EXCLUSIVAMENTE para maiores de 18 anos.
                  </p>
                  <p className="text-sm">
                    Nossos produtos contêm nicotina, substância que causa dependência química. 
                    A venda, distribuição ou fornecimento de produtos de tabaco ou nicotina para 
                    menores de 18 anos é PROIBIDA por lei.
                  </p>
                  <p className="text-sm">
                    Ao usar este site e realizar compras, você declara e garante que tem pelo 
                    menos 18 anos de idade.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Uso do Site */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Uso do Site</h2>
            <div className="space-y-3 text-gray-700">
              <p>Você concorda em usar o site apenas para fins legais e de maneira que não:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Viole qualquer lei ou regulamento aplicável</li>
                <li>Infrinja os direitos de terceiros</li>
                <li>Seja fraudulenta, falsa ou enganosa</li>
                <li>Transmita vírus ou códigos maliciosos</li>
                <li>Interfira no funcionamento adequado do site</li>
              </ul>
            </div>
          </section>

          {/* Produtos e Preços */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Produtos e Preços</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Fazemos todos os esforços para garantir que as descrições e preços dos produtos 
                sejam precisos. No entanto:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>As imagens são meramente ilustrativas</li>
                <li>Os preços estão sujeitos a alteração sem aviso prévio</li>
                <li>Reservamo-nos o direito de limitar quantidades</li>
                <li>A disponibilidade dos produtos pode variar</li>
                <li>Erros de preço serão corrigidos e você será notificado</li>
              </ul>
            </div>
          </section>

          {/* Pedidos e Pagamentos */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Pedidos e Pagamentos</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Ao fazer um pedido, você concorda que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Todas as informações fornecidas são verdadeiras e precisas</li>
                <li>Você está autorizado a usar o método de pagamento fornecido</li>
                <li>Aceitamos pagamentos via PIX</li>
                <li>O pedido só será processado após confirmação do pagamento</li>
                <li>Reservamo-nos o direito de recusar ou cancelar pedidos</li>
              </ul>
            </div>
          </section>

          {/* Entrega */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Entrega</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Realizamos entregas através de nossa rede de lojas parceiras em todo o Paraná:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Os prazos de entrega são estimativas e podem variar</li>
                <li>Você será responsável por fornecer um endereço de entrega válido</li>
                <li>É necessário apresentar documento de identificação no recebimento</li>
                <li>Não nos responsabilizamos por atrasos causados por terceiros</li>
              </ul>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Propriedade Intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              Todo o conteúdo deste site, incluindo textos, gráficos, logos, imagens e software, 
              é propriedade da {storeInfo.name} ou de seus fornecedores e é protegido por leis 
              de direitos autorais. Você não pode reproduzir, distribuir ou usar qualquer conteúdo 
              sem autorização prévia por escrito.
            </p>
          </section>

          {/* Limitação de Responsabilidade */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Limitação de Responsabilidade</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                A {storeInfo.name} não será responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Danos indiretos, incidentais ou consequenciais</li>
                <li>Perda de lucros ou dados</li>
                <li>Interrupções no serviço ou erros no site</li>
                <li>Uso inadequado dos produtos adquiridos</li>
              </ul>
            </div>
          </section>

          {/* Modificações */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Modificações dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
              entrarão em vigor imediatamente após a publicação no site. É sua responsabilidade 
              revisar periodicamente estes termos.
            </p>
          </section>

          {/* Lei Aplicável */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">10. Lei Aplicável</h2>
            <p className="text-gray-700 leading-relaxed">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer 
              disputa será resolvida nos tribunais competentes do Estado do Paraná.
            </p>
          </section>

          {/* Contato */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">11. Contato</h2>
            <p className="text-gray-700 mb-3">
              Se você tiver dúvidas sobre estes termos, entre em contato conosco:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>WhatsApp:</strong> {storeInfo.phone}</p>
              <p><strong>Instagram:</strong> {storeInfo.instagramHandle}</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
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
