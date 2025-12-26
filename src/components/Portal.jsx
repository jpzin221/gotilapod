import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Bloqueia o scroll do body quando o modal está aberto
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calcula a largura da scrollbar para evitar "jump" no layout
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      // Restaura o scroll quando o modal fecha
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      setMounted(false);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    children,
    document.body
  );
}
