import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import PedidoConfirmado from './pages/PedidoConfirmado.jsx'
import Rastreamento from './pages/Rastreamento.jsx'
import MeusPedidos from './pages/MeusPedidos.jsx'
import SobreNos from './pages/SobreNos.jsx'
import Termos from './pages/Termos.jsx'
import Privacidade from './pages/Privacidade.jsx'
import Contato from './pages/Contato.jsx'
import BoladorPage from './pages/BoladorPage.jsx'
import './index.css'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { PhoneAuthProvider } from './context/PhoneAuthContext'
import { SiteConfigProvider } from './context/SiteConfigContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <PhoneAuthProvider>
        <SiteConfigProvider>
          <CartProvider>
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
          </CartProvider>
        </SiteConfigProvider>
      </PhoneAuthProvider>
    </AuthProvider>
  </BrowserRouter>,
)

