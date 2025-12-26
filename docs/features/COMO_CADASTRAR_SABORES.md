# 🍃 Como Cadastrar Sabores nos Produtos

## ⚠️ IMPORTANTE:

Para o seletor de sabores aparecer, você precisa **cadastrar os sabores** no produto primeiro!

---

## 📋 Passo a Passo:

### **1. Executar SQL de Sabores:**

Se ainda não executou, rode no Supabase:
```sql
-- scripts/create_flavors_and_stock.sql
```

Isso cria:
- ✅ Tabela `flavors` (55+ sabores)
- ✅ Tabela `product_flavors` (relação)
- ✅ Colunas de estoque

---

### **2. Adicionar/Editar Produto no Admin:**

1. **Vá em `/admin`**
2. **Clique em "Novo Produto"** ou **Edite um existente**
3. **Role até "Sabores Disponíveis"**
4. **Marque os sabores** que esse produto tem:
   ```
   ☑ Banana Ice
   ☑ Grape Ice
   ☑ Mango Ice
   ☐ Strawberry Ice
   ☐ Watermelon Ice
   ```
5. **Salve o produto**

---

### **3. Testar no Site:**

1. **Vá para a página principal**
2. **Clique no produto** que você cadastrou
3. **Modal abre**
4. **Deve aparecer:**
   ```
   Escolha o Sabor:
   ┌─────────────────────┐
   │ Banana Ice      ▼  │
   └─────────────────────┘
   ```

---

## 🔍 Verificar se Funcionou:

### **Console do Navegador (F12):**

Ao abrir o modal, deve aparecer:
```
Sabores carregados: [
  {
    flavor: {
      id: 1,
      name: "Banana Ice"
    }
  },
  {
    flavor: {
      id: 2,
      name: "Grape Ice"
    }
  }
]
Sabor selecionado: { id: 1, name: "Banana Ice" }
```

---

## ❌ Se Não Aparecer:

### **Problema 1: Nenhum sabor cadastrado**
```
Console: Sabores carregados: []
```

**Solução:**
1. Vá em `/admin`
2. Edite o produto
3. Marque alguns sabores
4. Salve

---

### **Problema 2: SQL não executado**
```
Console: Erro ao carregar sabores: ...
```

**Solução:**
1. Execute `scripts/create_flavors_and_stock.sql`
2. Verifique se tabelas `flavors` e `product_flavors` existem

---

### **Problema 3: Produto sem ID**
```
Console: (nada aparece)
```

**Solução:**
- Produto precisa estar salvo no banco
- Não funciona com produtos temporários

---

## 📊 Exemplo Completo:

### **Criar Produto com Sabores:**

1. **Admin → Novo Produto**
   ```
   Nome: Ignite V5000 - Banana Ice
   Categoria: Ignite
   Preço: 85.00
   Puffs: 5000
   Estoque: 50
   ```

2. **Sabores Disponíveis:**
   ```
   ☑ Banana Ice
   ☑ Grape Ice
   ☑ Mango Ice
   ```

3. **Salvar**

4. **Testar no Site:**
   - Clica no produto
   - Modal abre
   - Aparece dropdown com 3 sabores
   - Seleciona "Banana Ice"
   - Adiciona ao carrinho
   - No carrinho mostra: "🍃 Banana Ice"

---

## 🎯 Sabores Disponíveis:

Após executar o SQL, você tem **55+ sabores**:

```
Banana Ice, Grape Ice, Mango Ice, Strawberry Ice,
Watermelon Ice, Blue Razz Ice, Lush Ice, Peach Ice,
Cherry Ice, Blueberry Ice, Kiwi Ice, Passion Fruit Ice,
Pineapple Ice, Apple Ice, Lemon Ice, Orange Ice,
Mint Ice, Cotton Candy, Bubblegum, Energy Drink,
Coffee, Vanilla, Chocolate, Caramel, Honey,
... e mais 30 sabores!
```

---

## ✅ Checklist:

- [ ] SQL executado (`create_flavors_and_stock.sql`)
- [ ] Produto criado/editado no admin
- [ ] Sabores marcados no produto
- [ ] Produto salvo
- [ ] Testado no site
- [ ] Dropdown aparece
- [ ] Sabor aparece no carrinho

---

## 💡 Dicas:

1. **Marque apenas sabores que você tem em estoque**
2. **Produtos diferentes podem ter sabores diferentes**
3. **Pode adicionar/remover sabores a qualquer momento**
4. **Cliente só vê sabores que você marcou**

---

## 🐛 Debug:

**Abra o Console (F12) e veja:**

```javascript
// Ao abrir modal
Sabores carregados: [...]  // ← Deve ter array com sabores
Sabor selecionado: {...}   // ← Deve ter objeto do sabor

// Se aparecer vazio:
Sabores carregados: []     // ← Produto sem sabores cadastrados!
```

---

**Cadastre os sabores no admin e teste novamente!** 🍃

O seletor só aparece se o produto tiver sabores! ✅
