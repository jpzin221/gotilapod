import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { storeInfo } from '../data/products';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';

export default function Privacidade() {
  const navigate = useNavigate();

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

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-gray-600">Última atualização: Novembro de 2024</p>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <Lock className="w-8 h-8 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold mb-2">Nosso Compromisso</h2>
              <p className="text-green-50">
                A {storeInfo.name} protege sua privacidade e dados pessoais.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-gray-800">1. Informações Coletadas</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Fornecidas por Você:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome, telefone, CPF</li>
                  <li>Endereço de entrega</li>
                  <li>Informações de pagamento</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-gray-800">2. Como Usamos</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Processar e entregar pedidos</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Melhorar nossos serviços</li>
              <li>Prevenir fraudes</li>
            </ul>
          </section>

          <section className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-3">3. Segurança</h2>
            <p className="text-green-900">
              Usamos criptografia SSL/TLS e armazenamento seguro para proteger seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Seus Direitos (LGPD)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Acessar seus dados</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar exclusão</li>
              <li>Revogar consentimento</li>
            </ul>
            <p className="mt-4 text-gray-700">
              Contato: {storeInfo.phone}
            </p>
          </section>

          <section className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-3">5. Menores de Idade</h2>
            <p className="text-red-900">
              Nosso site é exclusivo para maiores de 18 anos.
            </p>
          </section>
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
