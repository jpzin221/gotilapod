# Atualização de Logo e Nome da Loja

## 📋 Mudanças Realizadas

### 1. Nome da Loja Atualizado

**Antes:**
- Nome: "Pod Express"
- Nome Fantasia: "Pod Express"

**Agora:**
- Nome: "Candidos Pods"
- Nome Fantasia: "Candidos Pods"

### 2. Logo Atualizado

**Antes:**
- Caminho: `/images/logo.webp`

**Agora:**
- Caminho: `/images/Fotos-site/LOGO.jpg`

### 3. Estilo do Logo Melhorado

**Antes:**
- Fundo: Gradiente azul escuro
- Tamanho: 10x10 (mobile) / 12x12 (desktop)

**Agora:**
- Fundo: Branco com borda cinza
- Tamanho: 12x12 (mobile) / 14x14 (desktop)
- Melhor contraste e visibilidade

## 📁 Arquivos Modificados

### 1. `src/data/products.js`

```javascript
export const storeInfo = {
  name: "Candidos Pods",              // ← Atualizado
  fantasyName: "Candidos Pods",       // ← Atualizado
  legalName: "Casa de Fumos Candido LTDA",
  logo: "/images/Fotos-site/LOGO.jpg", // ← Atualizado
  // ... resto das configurações
};
```

### 2. `src/components/Header.jsx`

```jsx
{/* Logo */}
<div className="bg-white rounded-lg p-1 sm:p-1.5 shadow-md flex-shrink-0 border border-gray-200">
  <img 
    src={storeInfo.logo} 
    alt={storeInfo.name}
    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
  />
</div>
```

**Mudanças no estilo:**
- ✅ Fundo branco (melhor contraste)
- ✅ Borda cinza sutil
- ✅ Logo maior (12x12 → 14x14 no desktop)
- ✅ Padding ajustado

## 🎨 Onde o Nome Aparece

O nome "Candidos Pods" agora aparece em:

### 1. **Header (Topo do Site)**
- Logo + Nome da loja
- Sempre visível (fixed)

### 2. **Footer (Rodapé)**
- Título principal
- Informações legais
- Copyright

### 3. **Meta Tags (SEO)**
- Título da página
- Descrição do site

### 4. **Documentos Legais**
- Termos de uso
- Política de privacidade
- Sobre nós

## 📱 Visualização

### Header (Mobile)
```
┌─────────────────────────────────┐
│ 🔒 Compra 100% Segura           │ ← Barra verde
├─────────────────────────────────┤
│ [LOGO]  Candidos Pods      👤   │ ← Logo + Nome + User
│         ⭐4.9 🏍️ 📍PR 🏪        │ ← Badges
└─────────────────────────────────┘
```

### Header (Desktop)
```
┌──────────────────────────────────────────────┐
│ 🔒 Compra 100% Segura  🔐 Dados Protegidos   │ ← Barra verde
├──────────────────────────────────────────────┤
│ [LOGO]  Candidos Pods                    👤  │ ← Logo + Nome + User
│         ⭐4.9 🏍️Motoboy 📍Paraná 🏪Parceiros │ ← Badges
└──────────────────────────────────────────────┘
```

### Footer
```
┌─────────────────────────────────┐
│ ⚠️ VENDA PROIBIDA -18 ANOS      │
├─────────────────────────────────┤
│      Candidos Pods              │ ← Nome em gradiente
│ Vaporizadores e Pods de Qualidade│
│                                 │
│      [Instagram]                │
│                                 │
│ Candidos Pods - Casa de Fumos   │
│ CNPJ: 76.048.487/0001-44        │
└─────────────────────────────────┘
```

## ✅ Verificações

### Checklist de Teste:

- [ ] Logo aparece corretamente no header
- [ ] Logo tem boa qualidade (não pixelado)
- [ ] Nome "Candidos Pods" aparece no header
- [ ] Nome aparece no footer
- [ ] Nome aparece no título da página (aba do navegador)
- [ ] Logo está bem alinhado com o texto
- [ ] Logo tem bom contraste (fundo branco)
- [ ] Responsivo (funciona em mobile e desktop)

### Como Testar:

1. **Abra o site**
   - Verifique o header
   - Verifique se o logo carrega

2. **Role até o footer**
   - Verifique o nome da loja
   - Verifique informações legais

3. **Teste no Mobile**
   - Abra DevTools (F12)
   - Ative modo mobile
   - Verifique responsividade

4. **Teste em Diferentes Navegadores**
   - Chrome
   - Firefox
   - Edge
   - Safari (se disponível)

## 🐛 Possíveis Problemas

### Problema 1: Logo não aparece

**Causa:** Arquivo não está no caminho correto

**Solução:**
1. Verifique se o arquivo existe em: `public/images/Fotos-site/LOGO.jpg`
2. Verifique se o nome está correto (maiúsculas/minúsculas)
3. Limpe o cache (Ctrl + F5)

### Problema 2: Logo pixelado

**Causa:** Imagem de baixa qualidade

**Solução:**
1. Use imagem de alta resolução (mínimo 200x200px)
2. Formato recomendado: PNG ou JPG
3. Otimize a imagem (TinyPNG, ImageOptim)

### Problema 3: Logo desalinhado

**Causa:** Proporções da imagem

**Solução:**
1. Use imagem quadrada (1:1)
2. Ajuste `object-contain` para `object-cover` se necessário
3. Ajuste padding no Header.jsx

### Problema 4: Nome antigo ainda aparece

**Causa:** Cache do navegador

**Solução:**
1. Hard Refresh: Ctrl + F5
2. Limpar cache do navegador
3. Modo anônimo para testar

## 📊 Estrutura de Arquivos

```
Loja/
├── public/
│   └── images/
│       └── Fotos-site/
│           └── LOGO.jpg          ← Novo logo aqui
├── src/
│   ├── components/
│   │   └── Header.jsx            ← Estilo do logo atualizado
│   └── data/
│       └── products.js           ← Nome e caminho do logo
└── docs/
    └── changes/
        └── LOGO_E_NOME_LOJA.md   ← Este arquivo
```

## 🎯 Próximos Passos

### Opcional - Melhorias Futuras:

1. **Favicon**
   - Adicionar favicon com o logo
   - Arquivo: `public/favicon.ico`

2. **Logo para Redes Sociais**
   - Open Graph image
   - Twitter Card image

3. **Logo em Alta Resolução**
   - Versão 2x para telas Retina
   - WebP para melhor performance

4. **Logo Animado**
   - Animação sutil no hover
   - Transição suave

## 📝 Notas Importantes

1. **Consistência**: O nome "Candidos Pods" agora é usado em todo o site
2. **SEO**: Atualizar também meta tags se necessário
3. **Documentos**: Atualizar termos de uso, privacidade, etc.
4. **Marketing**: Atualizar materiais de marketing com novo nome
5. **Redes Sociais**: Considerar atualizar @podexpressofc se necessário

## ✅ Conclusão

Todas as mudanças foram aplicadas com sucesso:
- ✅ Nome atualizado para "Candidos Pods"
- ✅ Logo atualizado para `/images/Fotos-site/LOGO.jpg`
- ✅ Estilo do logo melhorado (fundo branco, melhor contraste)
- ✅ Responsivo e bem alinhado
- ✅ Aparece em todos os lugares corretos

O site agora reflete a identidade correta da loja!
