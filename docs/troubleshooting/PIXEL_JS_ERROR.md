# Erro do pixel.js (Facebook Pixel)

## ⚠️ Erro no Console

```
POST http://localhost:3001/tracking/v1/events 404 (Not Found)
```

## 📝 O que é?

Este erro aparece no console do navegador e está relacionado ao **Facebook Pixel** (Meta Pixel), que é um código de rastreamento do Facebook/Instagram para anúncios.

## 🔍 Causa

O Facebook Pixel está tentando enviar eventos de rastreamento para um endpoint que não existe no seu backend local:
- URL tentada: `http://localhost:3001/tracking/v1/events`
- Resposta: 404 (Not Found)

## ✅ É Crítico?

**NÃO!** Este erro é completamente inofensivo e não afeta:
- ❌ Funcionamento do site
- ❌ Funcionalidades do admin
- ❌ Sistema de pedidos
- ❌ Pagamentos PIX
- ❌ Nenhuma funcionalidade importante

## 🎯 Quando Importa?

O Facebook Pixel só é importante se você:
1. Tem campanhas de anúncios no Facebook/Instagram
2. Quer rastrear conversões
3. Quer criar públicos personalizados
4. Precisa de analytics do Facebook

## 🛠️ Como Resolver?

### Opção 1: Ignorar (Recomendado para Desenvolvimento)
- Simplesmente ignore o erro
- Não afeta nada no desenvolvimento local
- O pixel funcionará automaticamente em produção

### Opção 2: Remover o Facebook Pixel
Se você não usa anúncios do Facebook, pode remover o código:

1. **Encontrar o código do pixel** (geralmente no `index.html`):
```html
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<!-- End Facebook Pixel Code -->
```

2. **Remover ou comentar** o código

### Opção 3: Configurar Corretamente (Para Produção)

Se você usa Facebook Ads, configure corretamente:

1. **Obter Pixel ID**:
   - Acesse: https://business.facebook.com/
   - Vá em: Gerenciador de Eventos
   - Copie seu Pixel ID

2. **Atualizar o código**:
```html
<script>
  fbq('init', 'SEU_PIXEL_ID_AQUI'); // ← Substitua
  fbq('track', 'PageView');
</script>
```

3. **Eventos Personalizados** (opcional):
```javascript
// Quando usuário adiciona ao carrinho
fbq('track', 'AddToCart', {
  content_name: 'POD GEEK',
  content_ids: ['123'],
  content_type: 'product',
  value: 85.00,
  currency: 'BRL'
});

// Quando usuário finaliza compra
fbq('track', 'Purchase', {
  value: 85.00,
  currency: 'BRL'
});
```

## 🚀 Em Produção

Quando você fizer deploy:
- O erro desaparecerá automaticamente
- O pixel funcionará normalmente
- Eventos serão rastreados corretamente

## 📊 Verificar se Pixel Está Funcionando

1. Instale a extensão: [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Acesse seu site
3. Clique no ícone da extensão
4. Veja se o pixel está ativo e enviando eventos

## 🔧 Outros Erros Relacionados

### `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

Este erro também é do Facebook Pixel tentando parsear uma resposta HTML (404) como JSON. Ignore também.

## ✅ Conclusão

**Para desenvolvimento local**: Ignore completamente este erro.

**Para produção com Facebook Ads**: Configure o Pixel ID corretamente.

**Se não usa Facebook Ads**: Remova o código do pixel.

---

**Prioridade**: 🟢 Baixa (não afeta funcionalidades)

**Impacto**: ⚪ Nenhum (apenas logs no console)

**Ação Recomendada**: Ignorar durante desenvolvimento
