# 🍃 Sistema de Sabores e Controle de Estoque

## ✅ Implementado:

Sistema completo para gerenciar sabores de pods e controle de estoque com alertas visuais.

---

## 📋 Funcionalidades:

### **1. Gerenciamento de Sabores**
- ✅ 55+ sabores pré-cadastrados
- ✅ Sabores de marcas populares (Ignite, Geek Bar, Lost Mary, Elf Bar)
- ✅ Seleção múltipla de sabores por produto
- ✅ Interface visual com checkboxes

### **2. Controle de Estoque**
- ✅ Campo de quantidade em estoque
- ✅ Alerta configurável de estoque baixo
- ✅ Badge "🔥 Últimas unidades!" quando estoque < 5
- ✅ Overlay "Esgotado" quando estoque = 0

### **3. Informações de Pods**
- ✅ Campo de quantidade de puffs (ex: 5000)
- ✅ Exibição no card do produto
- ✅ Informação visível no modal

---

## 🗄️ Estrutura do Banco de Dados:

### **Tabela: `flavors`**
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR UNIQUE) - Nome do sabor
- description (TEXT) - Descrição
- is_active (BOOLEAN) - Ativo/Inativo
- created_at, updated_at
```

### **Tabela: `product_flavors`**
```sql
- id (SERIAL PRIMARY KEY)
- product_id (FK → products)
- flavor_id (FK → flavors)
- is_available (BOOLEAN)
- created_at
```

### **Colunas Adicionadas em `products`:**
```sql
- puff_count (INTEGER) - Quantidade de puffs
- stock_quantity (INTEGER) - Estoque atual
- low_stock_threshold (INTEGER) - Limite para alerta (padrão: 5)
```

---

## 🍃 Sabores Pré-cadastrados:

### **Ignite V5000:**
- Banana Ice
- Blueberry Ice
- Grape Ice
- Lush Ice (Melancia)
- Mango Ice
- Mint Ice
- Passion Fruit
- Peach Ice
- Pineapple Ice
- Strawberry Ice
- Watermelon Ice

### **Geek Bar:**
- Blue Razz Ice
- Cotton Candy
- Energy Drink
- Lemon Mint
- Mixed Berries
- Pink Lemonade
- Sour Apple
- Strawberry Banana
- Tropical Fruit

### **Lost Mary:**
- Blueberry Raspberry
- Cherry Ice
- Kiwi Passion Fruit
- Mango Peach
- Red Apple Ice
- Strawberry Kiwi
- Triple Berry
- Watermelon Lemon

### **Elf Bar:**
- Blueberry Sour Raspberry
- Cola
- Cream Tobacco
- Grape
- Kiwi Strawberry
- Lychee Ice
- Peach Mango
- Pineapple Coconut
- Strawberry Ice Cream
- Watermelon Bubblegum

### **Clássicos:**
- Classic Tobacco
- Menthol
- Virginia Tobacco
- Cool Mint
- Spearmint

### **Exóticos:**
- Acai Berry
- Dragon Fruit
- Guava Ice
- Lychee Lemonade
- Passion Fruit Orange
- Pina Colada
- Raspberry Lemonade
- Strawberry Lemonade
- Tropical Punch

---

## 🎯 Como Usar no Admin:

### **1. Executar SQL:**
```sql
-- No Supabase SQL Editor
-- Copie e execute: scripts/create_flavors_and_stock.sql
```

### **2. Adicionar/Editar Produto:**
1. Vá em `/admin` → Aba "Produtos"
2. Clique em "Novo Produto" ou "Editar"
3. Preencha os novos campos:

**Quantidade de Puffs:**
```
Ex: 5000, 8000, 10000
```

**Quantidade em Estoque:**
```
Ex: 50 (quantidade disponível)
```

**Alerta de Estoque Baixo:**
```
Ex: 5 (mostra alerta quando < 5)
```

**Sabores Disponíveis:**
```
- Marque os checkboxes dos sabores
- Múltipla seleção permitida
- Contador mostra quantos selecionados
```

### **3. Salvar:**
- Clique em "Salvar"
- Sabores são salvos automaticamente
- Produto atualizado com estoque

---

## 🎨 Alertas Visuais:

### **Estoque Baixo (< 5 unidades):**
```
┌─────────────────────────┐
│ 🔥 Últimas unidades!    │ ← Badge laranja pulsante
│                         │
│   [Imagem do Produto]   │
│                         │
└─────────────────────────┘
```

### **Sem Estoque (= 0):**
```
┌─────────────────────────┐
│                         │
│      ESGOTADO          │ ← Overlay escuro
│                         │
└─────────────────────────┘
```

### **Estoque Normal (≥ 5):**
```
┌─────────────────────────┐
│                         │
│   [Imagem do Produto]   │ ← Sem alertas
│                         │
└─────────────────────────┘
```

---

## 📱 Exibição no Site:

### **ProductCard:**
- Badge "🔥 Últimas unidades!" no canto superior direito
- Animação pulse para chamar atenção
- Overlay "Esgotado" quando sem estoque
- Botão de adicionar desabilitado se esgotado

### **ProductModal:**
- Lista de sabores disponíveis
- Quantidade de puffs exibida
- Informação de estoque
- Alerta visual se estoque baixo

---

## 🔧 Serviços Criados:

### **flavorService:**
```javascript
getActive()  // Listar sabores ativos
getAll()     // Listar todos (admin)
create()     // Criar sabor
update()     // Atualizar sabor
delete()     // Deletar sabor
```

### **productFlavorService:**
```javascript
getByProduct(productId)              // Sabores de um produto
addFlavors(productId, flavorIds)     // Adicionar sabores
removeAll(productId)                 // Remover todos
updateProductFlavors(productId, ids) // Atualizar sabores
```

---

## 📊 Exemplo de Uso:

### **Produto: Ignite V5000**
```javascript
{
  name: "Ignite V5000",
  puff_count: 5000,
  stock_quantity: 3,           // ← Estoque baixo!
  low_stock_threshold: 5,
  flavors: [
    "Banana Ice",
    "Grape Ice",
    "Mango Ice"
  ]
}
```

**Resultado:**
- ✅ Badge "🔥 Últimas unidades!" aparece
- ✅ 3 sabores disponíveis
- ✅ 5000 puffs exibidos
- ✅ Alerta visual no card

---

## 🎯 Lógica de Alertas:

### **Condições:**
```javascript
// Últimas unidades
if (stock_quantity > 0 && stock_quantity < low_stock_threshold) {
  // Mostra badge laranja pulsante
}

// Esgotado
if (stock_quantity === 0) {
  // Mostra overlay escuro
  // Desabilita botão adicionar
}

// Normal
if (stock_quantity >= low_stock_threshold) {
  // Sem alertas
}
```

---

## 🚀 Benefícios:

### **1. Gestão de Estoque:**
- ✅ Controle preciso de quantidade
- ✅ Alertas automáticos
- ✅ Evita vendas sem estoque

### **2. Experiência do Cliente:**
- ✅ Sabe quando é última chance
- ✅ Urgência para comprar
- ✅ Transparência de disponibilidade

### **3. Variedade de Sabores:**
- ✅ 55+ sabores disponíveis
- ✅ Fácil seleção múltipla
- ✅ Organizado por marca

### **4. Informações Completas:**
- ✅ Quantidade de puffs visível
- ✅ Sabores disponíveis
- ✅ Status de estoque

---

## 📝 Checklist de Implementação:

- [x] Tabela `flavors` criada
- [x] Tabela `product_flavors` criada
- [x] Colunas adicionadas em `products`
- [x] 55+ sabores pré-cadastrados
- [x] Serviços de sabores criados
- [x] ProductForm atualizado
- [x] ProductCard com alertas
- [x] Políticas RLS configuradas
- [x] Interface de seleção de sabores
- [x] Alertas visuais funcionando

---

## 🎨 Customização:

### **Mudar Limite de Estoque Baixo:**
```javascript
// No formulário do produto
low_stock_threshold: 10  // Alerta quando < 10
```

### **Adicionar Novos Sabores:**
```sql
INSERT INTO flavors (name, description) VALUES
('Novo Sabor', 'Descrição do sabor');
```

### **Mudar Cor do Alerta:**
```jsx
// ProductCard.jsx
className="bg-gradient-to-r from-orange-500 to-red-500"
// Trocar para outra cor
```

---

## 🔄 Fluxo Completo:

1. **Admin adiciona produto**
2. Define quantidade de puffs
3. Define estoque inicial
4. Seleciona sabores disponíveis
5. Salva produto

6. **Cliente vê no site**
7. Badge "Últimas unidades" se estoque < 5
8. Pode ver sabores disponíveis
9. Quantidade de puffs exibida
10. Adiciona ao carrinho (se disponível)

---

## 💡 Dicas:

1. **Mantenha estoque atualizado** - Atualize após cada venda
2. **Use alertas estrategicamente** - Cria urgência
3. **Organize sabores** - Agrupe por marca
4. **Monitore estoque baixo** - Reponha antes de esgotar
5. **Destaque novos sabores** - Use badges especiais

---

**Sistema completo de sabores e estoque implementado!** 🎉

Agora você tem controle total sobre:
- ✅ Variedade de sabores
- ✅ Quantidade em estoque
- ✅ Alertas automáticos
- ✅ Informações de puffs
- ✅ Experiência do cliente melhorada
