import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { PhoneAuthProvider } from './context/PhoneAuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';

// Loading Spinner para Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p className="text-gray-500 mt-4">Carregando...</p>
    </div>
  </div>
);

// Lazy Loading - Páginas são carregadas apenas quando acessadas
const Login = lazy(() => import('./pages/Login.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const PedidoConfirmado = lazy(() => import('./pages/PedidoConfirmado.jsx'));
const Rastreamento = lazy(() => import('./pages/Rastreamento.jsx'));
const MeusPedidos = lazy(() => import('./pages/MeusPedidos.jsx'));
const SobreNos = lazy(() => import('./pages/SobreNos.jsx'));
const Termos = lazy(() => import('./pages/Termos.jsx'));
const Privacidade = lazy(() => import('./pages/Privacidade.jsx'));
const Contato = lazy(() => import('./pages/Contato.jsx'));
const BoladorPage = lazy(() => import('./pages/BoladorPage.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <PhoneAuthProvider>
        <SiteConfigProvider>
          <CartProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/pedido-confirmado" element={<OrderSuccess />} />
                <Route path="/pedido" element={<PedidoConfirmado />} />
                <Route path="/pedidos" element={<PedidoConfirmado />} />
                <Route path="/rastreamento" element={<Rastreamento />} />
                <Route path="/meus-pedidos" element={<MeusPedidos />} />
                <Route path="/sobre" element={<SobreNos />} />
                <Route path="/termos" element={<Termos />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/produto/gorila-bolador" element={<BoladorPage />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </SiteConfigProvider>
      </PhoneAuthProvider>
    </AuthProvider>
  </BrowserRouter>,
);
