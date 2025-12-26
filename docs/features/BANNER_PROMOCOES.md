# Banner de Promoções - Sistema Editável

## 📋 Visão Geral

Sistema completo para gerenciar o banner de promoções de fim de ano que aparece na página inicial do site. Permite editar todos os textos do banner através do painel administrativo.

## ✨ Funcionalidades

### 1. **Banner Editável**
- ✅ Título principal (ex: "🎄 Promoções de Fim de Ano 🎅")
- ✅ Subtítulo (ex: "Celebre as festas com os melhores preços!")
- ✅ Texto do badge nos produtos (ex: "🎁 OFERTA NATAL")
- ✅ Texto do rodapé (ex: "🎉 Aproveite as festas!")
- ✅ Ativar/desativar banner

### 2. **Filtros Inteligentes**
- Quando "TODOS" está selecionado: banner aparece com todos os produtos em promoção
- Quando uma categoria específica é selecionada (ex: "IGNITE"): banner desaparece
- Produtos em promoção continuam aparecendo normalmente nas suas seções de categoria
- Badge de promoção aparece em TODOS os produtos marcados (dentro e fora do banner)
- Não há duplicação de produtos ou badges

### 3. **Hierarquia de Badges (Padronização)**
- **Prioridade 1:** Badge de Promoção (🎁 OFERTA NATAL) - quando `em_promocao = true`
- **Prioridade 2:** Badge Principal (FREE, DESTAQUE, etc.) - quando NÃO está em promoção
- **Sempre visível:** Alerta de estoque baixo (🔥 Últimas unidades) - canto direito
- **Regra:** Badge de promoção SUBSTITUI o badge principal (nunca aparecem juntos)

### 4. **Preview em Tempo Real**
- Visualização do banner no admin antes de salvar
- Feedback visual de sucesso/erro ao salvar

## 🗄️ Estrutura do Banco de Dados

### Tabela: `promotion_banner_settings`

```sql
CREATE TABLE promotion_banner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  badge_text TEXT NOT NULL,
  footer_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**
- `title`: Título principal do banner
- `subtitle`: Subtítulo do banner
- `badge_text`: Texto que aparece no badge de cada produto
- `footer_text`: Texto do rodapé da seção
- `is_active`: Se o banner está ativo ou não

## 🚀 Como Usar

### 1. **Configurar o Banco de Dados**

Execute o script SQL:
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f docs/sql/promotion_banner_settings.sql
```

Ou execute manualmente no Supabase SQL Editor:
- Acesse: Supabase Dashboard → SQL Editor
- Cole o conteúdo de `docs/sql/promotion_banner_settings.sql`
- Execute

### 2. **Acessar o Painel Admin**

1. Faça login no admin: `/admin`
2. Clique na aba **"Banner Promoções"** (ícone de Tag)
3. Edite os campos desejados
4. Veja o preview em tempo real
5. Clique em **"Salvar Configurações"**

### 3. **Marcar Produtos em Promoção**

1. No admin, vá para a aba **"Produtos"**
2. Edite o produto desejado
3. Marque o checkbox **"🎉 Produto em Promoção de Fim de Ano"**
4. Salve o produto
5. O produto aparecerá automaticamente na seção de promoções

## 📱 Comportamento no Site

### Quando "TODOS" está selecionado:
```
┌─────────────────────────────────┐
│  🎄 Promoções de Fim de Ano 🎅  │
│  Celebre as festas...           │
│  [3 Produtos]                   │
├─────────────────────────────────┤
│  [POD IGNITE] [POD GEEK] [ELF]  │ ← Todos os produtos em promoção
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  IGNITE                         │
│  [Produtos IGNITE normais]      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  GEEK BAR                       │
│  [Produtos GEEK BAR normais]    │
└─────────────────────────────────┘
```

### Quando "IGNITE" está selecionado:
```
❌ Banner de promoções NÃO aparece

┌─────────────────────────────────┐
│  IGNITE                         │
│  🎁 [POD IGNITE em promoção]    │ ← Badge "🎁 OFERTA NATAL" aparece
│  [POD IGNITE normal]            │
│  [POD IGNITE normal]            │
└─────────────────────────────────┘
```

### Quando "GEEK BAR" está selecionado:
```
❌ Banner de promoções NÃO aparece

┌─────────────────────────────────┐
│  GEEK BAR                       │
│  🎁 [POD GEEK em promoção]      │ ← Badge "🎁 OFERTA NATAL" aparece
│  [POD GEEK normal]              │
│  [POD GEEK normal]              │
└─────────────────────────────────┘
```

**IMPORTANTE:** 
- Banner só aparece quando "TODOS" está selecionado
- Quando uma categoria específica é selecionada, o banner desaparece
- Produtos em promoção continuam aparecendo normalmente nas suas seções de categoria
- Badge de promoção (ex: "🎁 OFERTA NATAL") aparece em TODOS os produtos marcados como promoção
- Badge usa o texto configurado no admin (editável)

## 🎨 Hierarquia Visual de Badges

### Estrutura do Card de Produto:

```
┌─────────────────────────────┐
│ 🎁 OFERTA NATAL  🔥 Últimas │ ← Topo: Badge principal (esq) + Estoque (dir)
│                             │
│                             │
│       [Imagem]              │
│                             │
│                             │
├─────────────────────────────┤
│ Nome do Produto             │
│ Descrição...                │
│ R$ 85,00                    │
└─────────────────────────────┘
```

### Regras de Exibição:

**Canto Superior Esquerdo (apenas 1 badge):**
- ✅ Se `em_promocao = true`: Mostra badge de promoção (🎁 OFERTA NATAL)
- ✅ Se `em_promocao = false` E tem `badge`: Mostra badge principal (FREE, DESTAQUE, etc.)
- ❌ NUNCA mostra ambos ao mesmo tempo

**Canto Superior Direito:**
- ✅ Sempre mostra alerta de estoque baixo quando `stock_quantity < 5`
- ✅ Independente de ter badge de promoção ou não

### Exemplos Práticos:

**Produto em Promoção COM badge principal:**
```
Antes (ERRADO - duplicado):
🎁 OFERTA NATAL
FREE

Agora (CORRETO - apenas promoção):
🎁 OFERTA NATAL
```

**Produto em Promoção SEM badge principal:**
```
🎁 OFERTA NATAL
```

**Produto Normal COM badge principal:**
```
FREE
```

**Produto Normal SEM badge principal:**
```
(sem badge)
```

**Produto em Promoção + Estoque Baixo:**
```
🎁 OFERTA NATAL          🔥 Últimas unidades!
```

## 🎨 Personalização

### Exemplos de Textos

**Natal:**
- Título: "🎄 Promoções de Natal 🎅"
- Subtítulo: "Presenteie-se com os melhores preços!"
- Badge: "🎁 OFERTA NATAL"
- Rodapé: "🎉 Aproveite! Ofertas válidas até 25/12"

**Ano Novo:**
- Título: "🎆 Ofertas de Ano Novo 🥳"
- Subtítulo: "Comece 2025 com economia!"
- Badge: "🎊 ANO NOVO"
- Rodapé: "✨ Promoções especiais de fim de ano"

**Black Friday:**
- Título: "🔥 Black Friday 🛍️"
- Subtítulo: "Os maiores descontos do ano!"
- Badge: "💥 BLACK FRIDAY"
- Rodapé: "⚡ Aproveite! Ofertas por tempo limitado"

**Genérico:**
- Título: "⭐ Promoções Especiais ⭐"
- Subtítulo: "Aproveite os melhores preços!"
- Badge: "🔥 PROMOÇÃO"
- Rodapé: "💰 Economize agora! Estoque limitado"

## 🔧 Arquivos Modificados

### Backend/Database:
- `docs/sql/promotion_banner_settings.sql` - Schema da tabela

### Services:
- `src/lib/supabase.js` - Service `promotionBannerService`

### Componentes:
- `src/components/PromotionsSection.jsx` - Busca configurações do banner e renderiza seção
- `src/components/ProductCard.jsx` - Gerencia badge de promoção em todos os produtos
- `src/components/admin/PromotionBannerManager.jsx` - Interface de edição

### Páginas:
- `src/pages/Admin.jsx` - Nova aba "Banner Promoções"
- `src/App.jsx` - Lógica de filtros inteligentes

## 📊 Fluxo de Dados

```
Admin edita banner
      ↓
Salva no Supabase (promotion_banner_settings)
      ↓
┌─────────────────────────────────────┐
│ PromotionsSection                   │
│ - Busca configurações do banner     │
│ - Exibe header/footer personalizado │
│ - Renderiza ProductCards            │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ ProductCard                         │
│ - Busca badge_text do banco         │
│ - Exibe badge se em_promocao=true   │
│ - Aplica hierarquia de badges       │
└─────────────────────────────────────┘
      ↓
Badge aparece em TODOS os produtos marcados
(dentro e fora da seção de promoções)
```

## 🎯 Casos de Uso

### Caso 1: Campanha de Natal
1. Admin acessa "Banner Promoções"
2. Altera título para "🎄 Promoções de Natal 🎅"
3. Marca 5 produtos como "em promoção"
4. Salva
5. Site exibe banner de Natal com 5 produtos

### Caso 2: Desativar Promoções
1. Admin acessa "Banner Promoções"
2. Desmarca "Banner Ativo"
3. Salva
4. Banner desaparece do site (produtos continuam marcados)

### Caso 3: Filtrar por Categoria
1. Cliente acessa o site
2. Clica em "IGNITE"
3. Banner de promoções desaparece
4. Vê seção IGNITE com produtos normais + produtos em promoção misturados
5. Produtos em promoção têm badge "🎁 OFERTA NATAL" visível
6. Não vê produtos de outras categorias

## ⚠️ Observações Importantes

1. **Apenas 1 configuração**: A tabela permite apenas 1 registro (id = 1)
2. **Valores padrão**: Se houver erro ao buscar, usa valores hardcoded
3. **Banner inativo**: Quando `is_active = false`, a seção não aparece
4. **Sem produtos**: Se não houver produtos em promoção, seção não aparece
5. **Filtros aplicados**: Banner respeita filtros de busca, sabor e puffs
6. **Banner só em "TODOS"**: Banner só aparece quando nenhuma categoria específica está selecionada
7. **Sem duplicação**: Produtos em promoção não aparecem duplicados nas seções de categoria
8. **Badge sempre visível**: Badge de promoção aparece em todos os produtos marcados, dentro e fora do banner
9. **Badge sincronizado**: Texto do badge é o mesmo configurado no admin para todos os produtos
10. **Hierarquia de badges**: Badge de promoção tem prioridade sobre badge principal (evita duplicação)
11. **Visual limpo**: Apenas 1 badge principal por produto (promoção OU categoria, nunca ambos)

## 🐛 Troubleshooting

### Banner não aparece no site:
- ✅ Verificar se `is_active = true`
- ✅ Verificar se há produtos com `em_promocao = true`
- ✅ Verificar se "TODOS" está selecionado (banner não aparece em categorias específicas)
- ✅ Verificar se produtos correspondem aos filtros ativos

### Erro ao salvar no admin:
- ✅ Verificar se tabela existe no banco
- ✅ Verificar políticas RLS do Supabase
- ✅ Verificar se usuário está autenticado

### Textos não atualizam:
- ✅ Limpar cache do navegador (Ctrl + F5)
- ✅ Verificar se salvou corretamente no admin
- ✅ Verificar console do navegador por erros
- ✅ Voltar para a aba do site (recarregamento automático)

### Preços ou dados de produtos não atualizam:
- ✅ Voltar para a aba do site após editar (recarregamento automático)
- ✅ Aguardar 1-2 segundos para o recarregamento
- ✅ Fazer Hard Refresh (Ctrl + F5)
- ✅ Ver documentação completa: `docs/troubleshooting/CACHE_PRODUTOS.md`

## 📝 Exemplo de Configuração Completa

```javascript
{
  "title": "🎄 Promoções de Fim de Ano 🎅",
  "subtitle": "Celebre as festas com os melhores preços!",
  "badge_text": "🎁 OFERTA NATAL",
  "footer_text": "🎉 Aproveite as festas! Ofertas especiais de fim de ano",
  "is_active": true
}
```

## 🎉 Resultado Final

✅ Banner totalmente editável pelo admin
✅ Produtos em promoção aparecem sempre
✅ Filtros por categoria funcionam corretamente
✅ Visual mantido (estética não alterada)
✅ Preview em tempo real
✅ Fácil de usar e manter
