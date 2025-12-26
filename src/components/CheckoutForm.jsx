import { useState, useEffect } from 'react';
import { User, Phone, CreditCard, MapPin, X } from 'lucide-react';
import { usePhoneAuth } from '../context/PhoneAuthContext';

export default function CheckoutForm({ isOpen, onClose, onSubmit, total, cepData }) {
  const { user, isAuthenticated } = usePhoneAuth();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'PR'
  });

  // Preencher com dados do usuário autenticado
  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      console.log('✅ Preenchendo formulário com dados do usuário:', user);
      setFormData(prev => ({
        ...prev,
        nome: user.nome || prev.nome,
        telefone: user.telefone || prev.telefone,
        cpf: user.cpf || prev.cpf,
      }));
    }
  }, [isAuthenticated, user, isOpen]);

  // Preencher dados do CEP automaticamente
  useEffect(() => {
    if (cepData && isOpen) {
      setFormData(prev => ({
        ...prev,
        cep: cepData.cep || '',
        endereco: cepData.logradouro || '',
        bairro: cepData.bairro || '',
        cidade: cepData.localidade || '',
        estado: cepData.uf || 'PR'
      }));
    }
  }, [cepData, isOpen]);

  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    // Verificar se há dados preenchidos
    const hasData = Object.values(formData).some(value => value.trim() !== '' && value !== 'PR');

    if (hasData) {
      const confirmClose = window.confirm(
        'Você tem dados preenchidos. Deseja realmente sair e perder essas informações?'
      );
      if (!confirmClose) return;
    }

    onClose();
  };

  if (!isOpen) return null;

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'telefone') formattedValue = formatPhone(value);
    if (name === 'cep') formattedValue = formatCEP(value);

    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Compacto */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Finalizar Pedido</h2>
              <p className="text-[10px] opacity-90">Total: {formatPrice(total)}</p>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-2.5 overflow-y-auto max-h-[calc(90vh-7rem)] space-y-2">
            {/* Dados Pessoais - Card */}
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <h3 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary" />
                Dados Pessoais
              </h3>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-0.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    placeholder="João Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega - Card */}
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <h3 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Endereço de Entrega
                {cepData && <span className="text-[9px] text-green-600 font-normal ml-auto">✓ Auto</span>}
              </h3>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-0.5">
                    CEP *
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    required
                    readOnly={!!cepData}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition ${cepData ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
                      }`}
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-0.5">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition ${cepData && formData.endereco ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
                      }`}
                    placeholder="Rua, Avenida..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      required
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      required
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition ${cepData && formData.bairro ? 'border-green-300' : 'border-gray-300'
                        }`}
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      required
                      readOnly={!!cepData}
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition ${cepData ? 'bg-green-50 border-green-300' : 'border-gray-300'
                        }`}
                      placeholder="Curitiba"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                    disabled={!!cepData}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition ${cepData ? 'bg-green-50 border-green-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Info PIX - Compacto */}
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg p-1.5">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs">💳</span>
              </div>
              <p className="text-[10px] text-gray-700">
                <span className="font-bold">Pagamento PIX</span> · QR Code após confirmação
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-xs bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-white rounded-lg transition font-bold disabled:opacity-50 shadow-md"
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Confirmar e Pagar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
