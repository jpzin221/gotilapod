import { createContext, useContext, useState, useEffect } from 'react';
import { storeInfo } from '../data/products';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Carregar carrinho do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Gerar ID único para item (considera sabor)
  const getItemKey = (product) => {
    const baseId = product.id;
    const flavorId = product.selectedFlavor?.id || 'no-flavor';
    return `${baseId}-${flavorId}`;
  };

  // Adicionar item ao carrinho
  const addToCart = (product) => {
    console.log('📥 CartContext recebeu produto:', product);

    setCartItems(prevItems => {
      const itemKey = getItemKey(product);
      const existingItem = prevItems.find(item => getItemKey(item) === itemKey);

      if (existingItem) {
        // Se já existe, incrementa pela quantidade recebida (ou 1)
        const quantityToAdd = product.quantity || 1;
        return prevItems.map(item =>
          getItemKey(item) === itemKey
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }

      // Item novo - usa a quantidade que veio do product ou 1
      const newItem = {
        ...product,
        quantity: product.quantity || 1,
        cartItemKey: itemKey
      };
      console.log('🆕 Novo item no carrinho:', newItem);
      return [...prevItems, newItem];
    });

    // Mostrar toast de confirmação
    const productName = product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name;
    const quantityText = product.quantity > 1 ? ` (${product.quantity}x)` : '';
    setToastMessage(`✓ ${productName}${quantityText} adicionado ao carrinho!`);
    setShowToast(true);

    // 🎯 UTMFY - Disparar evento AddToCart
    try {
      if (window.utmify) {
        window.utmify.track('AddToCart', {
          content_name: product.name,
          content_ids: [product.id],
          value: product.price * (product.quantity || 1),
          currency: 'BRL',
          quantity: product.quantity || 1
        });
        console.log('✅ UTMFY: Evento AddToCart disparado!', product.name);
      }
    } catch (e) {
      console.warn('⚠️ UTMFY AddToCart error:', e);
    }

    // Abrir carrinho automaticamente após 500ms
    setTimeout(() => {
      setIsCartOpen(true);
    }, 500);
  };

  // Remover item do carrinho
  const removeFromCart = (cartItemKey) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemKey !== cartItemKey));
  };

  // Aumentar quantidade (recalcula desconto)
  const increaseQuantity = (cartItemKey) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemKey === cartItemKey) {
          const newQuantity = item.quantity + 1;

          // Calcular desconto baseado na nova quantidade
          let discount = 0;
          if (newQuantity >= 5) discount = 12;
          else if (newQuantity >= 3) discount = 8;
          else if (newQuantity >= 2) discount = 5;

          const newTotalPrice = item.price * newQuantity * (1 - discount / 100);

          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newTotalPrice
          };
        }
        return item;
      })
    );
  };

  // Adicionar sabor a um item existente (aumenta quantidade e adiciona sabor ao array)
  const addFlavorToItem = (cartItemKey, flavorName) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemKey === cartItemKey) {
          const currentFlavors = item.selectedFlavors || [];
          const newQuantity = item.quantity + 1;

          // Calcular desconto baseado na nova quantidade
          // 2 unidades = 5%, 3 = 8%, 5+ = 12%
          let discount = 0;
          if (newQuantity >= 5) discount = 12;
          else if (newQuantity >= 3) discount = 8;
          else if (newQuantity >= 2) discount = 5;

          const newTotalPrice = item.price * newQuantity * (1 - discount / 100);

          return {
            ...item,
            quantity: newQuantity,
            selectedFlavors: [...currentFlavors, flavorName],
            totalPrice: newTotalPrice
          };
        }
        return item;
      })
    );
  };

  // Diminuir quantidade (e remover último sabor do array se houver)
  const decreaseQuantity = (cartItemKey) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemKey === cartItemKey && item.quantity > 1) {
          const currentFlavors = item.selectedFlavors || [];
          const newQuantity = item.quantity - 1;

          // Recalcular desconto baseado na nova quantidade
          let discount = 0;
          if (newQuantity >= 5) discount = 12;
          else if (newQuantity >= 3) discount = 8;
          else if (newQuantity >= 2) discount = 5;

          const newTotalPrice = item.price * newQuantity * (1 - discount / 100);

          // Remove o último sabor do array se houver
          const newFlavors = currentFlavors.length > 0
            ? currentFlavors.slice(0, -1)
            : [];
          return {
            ...item,
            quantity: newQuantity,
            selectedFlavors: newFlavors.length > 0 ? newFlavors : item.selectedFlavors,
            totalPrice: newTotalPrice
          };
        }
        return item;
      })
    );
  };

  // Limpar carrinho
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular total (usa totalPrice com desconto se existir)
  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = item.totalPrice || (item.price * item.quantity);
      return total + itemTotal;
    }, 0);
  };

  // Calcular quantidade total de itens
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Verificar se tem frete grátis (usa valor configurável)
  const FREE_SHIPPING_THRESHOLD = storeInfo.delivery.freeShippingMinimum;
  const DELIVERY_FEE = storeInfo.delivery.fee;

  const hasFreeShipping = () => getTotal() >= FREE_SHIPPING_THRESHOLD;
  const getShippingProgress = () => {
    const total = getTotal();
    if (total >= FREE_SHIPPING_THRESHOLD) return 100;
    return (total / FREE_SHIPPING_THRESHOLD) * 100;
  };
  const getRemainingForFreeShipping = () => {
    const remaining = FREE_SHIPPING_THRESHOLD - getTotal();
    return remaining > 0 ? remaining : 0;
  };
  const getDeliveryFee = () => {
    return hasFreeShipping() ? 0 : DELIVERY_FEE;
  };

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    increaseQuantity,
    addFlavorToItem,
    decreaseQuantity,
    clearCart,
    getTotal,
    getTotalItems,
    hasFreeShipping,
    getShippingProgress,
    getRemainingForFreeShipping,
    getDeliveryFee,
    FREE_SHIPPING_THRESHOLD,
    DELIVERY_FEE,
    showToast,
    setShowToast,
    toastMessage
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
