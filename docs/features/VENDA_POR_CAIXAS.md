# 📦 Sistema de Venda por Caixas

## ✅ Implementado:

Sistema completo para vender produtos por caixa com desconto automático e cálculo de preço.

---

## 🎯 Funcionalidades:

### **1. Configuração por Produto:**
- ✅ Unidades por caixa (padrão: 10)
- ✅ Desconto percentual (padrão: 15%)
- ✅ Cálculo automático do preço da caixa
- ✅ Resumo visual da economia

### **2. Cálculo Automático:**
```javascript
Preço Unitário: R$ 85,00
Unidades por Caixa: 10
Desconto: 15%

Cálculo:
10 × R$ 85,00 = R$ 850,00
Desconto de 15% = R$ 127,50
Preço Final da Caixa = R$ 722,50
Economia = R$ 127,50
```

### **3. Flexibilidade:**
- ✅ Pode alterar quantidade por caixa
- ✅ Pode alterar desconto percentual
- ✅ Preço recalcula automaticamente
- ✅ Resumo atualiza em tempo real

---

## 🗄️ Estrutura do Banco:

### **Colunas Adicionadas em `products`:**
```sql
units_per_box INTEGER DEFAULT 10
  - Quantidade de unidades por caixa

box_price DECIMAL(10,2)
  - Preço da caixa (calculado automaticamente)

box_discount_percent DECIMAL(5,2)
  - Desconto percentual (ex: 15.0 = 15%)
```

---

## 📋 Como Usar no Admin:

### **1. Executar SQL:**
```sql
-- No Supabase SQL Editor
-- Executar: scripts/add_box_sales.sql
```

### **2. Adicionar/Editar Produto:**

**Seção "📦 Venda por Caixa":**

```
┌─────────────────────────────────────┐
│ 📦 Venda por Caixa                  │
├─────────────────────────────────────┤
│ Unidades por Caixa: [10]            │
│ Desconto da Caixa (%): [15]         │
│ Preço da Caixa: R$ 722,50 ✅        │
├─────────────────────────────────────┤
│ Resumo: 10 unidades × R$ 85,00 =   │
│ R$ 850,00 → R$ 722,50               │
│ (Economia: R$ 127,50)               │
└─────────────────────────────────────┘
```

---

## 🎨 Visual no Formulário:

### **Seção Destacada:**
- Fundo azul claro
- Título com emoji 📦
- 3 campos em grid
- Preço calculado em destaque verde
- Resumo com valores riscados e economia

### **Campos:**

**1. Unidades por Caixa:**
```
Input numérico
Padrão: 10
Min: 1
```

**2. Desconto da Caixa (%):**
```
Input numérico
Padrão: 15
Min: 0, Max: 100
Step: 0.1 (permite decimais)
```

**3. Preço da Caixa:**
```
Calculado automaticamente
Exibição em destaque verde
Não editável
Atualiza em tempo real
```

---

## 💰 Exemplos de Cálculo:

### **Exemplo 1: Ignite V5000**
```
Preço Unitário: R$ 85,00
Unidades: 10
Desconto: 15%

Sem Desconto: 10 × R$ 85,00 = R$ 850,00
Com Desconto: R$ 850,00 - 15% = R$ 722,50
Economia: R$ 127,50
```

### **Exemplo 2: Geek Bar (Caixa Maior)**
```
Preço Unitário: R$ 95,00
Unidades: 12
Desconto: 20%

Sem Desconto: 12 × R$ 95,00 = R$ 1.140,00
Com Desconto: R$ 1.140,00 - 20% = R$ 912,00
Economia: R$ 228,00
```

### **Exemplo 3: Promoção Especial**
```
Preço Unitário: R$ 75,00
Unidades: 5
Desconto: 10%

Sem Desconto: 5 × R$ 75,00 = R$ 375,00
Com Desconto: R$ 375,00 - 10% = R$ 337,50
Economia: R$ 37,50
```

---

## 🎯 Benefícios para o Cliente:

### **1. Economia Clara:**
- ✅ Vê quanto economiza
- ✅ Comparação lado a lado
- ✅ Incentivo para comprar mais

### **2. Transparência:**
- ✅ Cálculo visível
- ✅ Sem surpresas
- ✅ Confiança na compra

### **3. Flexibilidade:**
- ✅ Pode comprar unitário
- ✅ Pode comprar caixa
- ✅ Escolha do cliente

---

## 📊 Exibição no Site:

### **ProductCard (Futuro):**
```
┌─────────────────────────┐
│ Ignite V5000            │
│ R$ 85,00 (unidade)      │
│                         │
│ 📦 Caixa c/ 10 unidades │
│ R$ 722,50               │
│ Economize R$ 127,50!    │
└─────────────────────────┘
```

### **ProductModal (Futuro):**
```
┌─────────────────────────────────┐
│ Quantidade:                     │
│ ○ Unidade - R$ 85,00            │
│ ● Caixa (10 un) - R$ 722,50    │
│   💰 Economize R$ 127,50!       │
│                                 │
│ [ Adicionar ao Carrinho ]       │
└─────────────────────────────────┘
```

---

## 🔧 Implementação Técnica:

### **Cálculo Automático:**
```javascript
useEffect(() => {
  if (formData.price && formData.units_per_box && formData.box_discount_percent) {
    const unitPrice = parseFloat(formData.price) || 0;
    const unitsPerBox = parseInt(formData.units_per_box) || 10;
    const discount = parseFloat(formData.box_discount_percent) || 0;
    
    const totalWithoutDiscount = unitPrice * unitsPerBox;
    const discountAmount = totalWithoutDiscount * (discount / 100);
    const finalPrice = totalWithoutDiscount - discountAmount;
    
    setCalculatedBoxPrice(finalPrice);
  }
}, [formData.price, formData.units_per_box, formData.box_discount_percent]);
```

### **Salvamento:**
```javascript
const productData = {
  // ... outros campos
  units_per_box: parseInt(formData.units_per_box) || 10,
  box_price: calculatedBoxPrice,
  box_discount_percent: parseFloat(formData.box_discount_percent) || 15,
};
```

---

## 📈 Estratégias de Preço:

### **1. Desconto Padrão (15%):**
- Bom para produtos populares
- Incentiva compra em volume
- Margem ainda saudável

### **2. Desconto Agressivo (20-25%):**
- Para produtos com estoque alto
- Promoções especiais
- Liquidação

### **3. Desconto Baixo (10%):**
- Produtos premium
- Lançamentos
- Edições limitadas

### **4. Sem Desconto (0%):**
- Produtos exclusivos
- Já com preço promocional
- Margens apertadas

---

## 🎯 Casos de Uso:

### **1. Revendedores:**
```
Compram caixas fechadas
Desconto atrativo
Revenda com margem
```

### **2. Consumidores Finais:**
```
Estoque pessoal
Economia no longo prazo
Compartilha com amigos
```

### **3. Presentes:**
```
Caixa para presentear
Variedade de sabores
Embalagem especial
```

---

## 💡 Dicas de Configuração:

### **Produtos Populares:**
```
Unidades: 10
Desconto: 15%
Motivo: Volume alto, margem boa
```

### **Produtos Premium:**
```
Unidades: 5
Desconto: 10%
Motivo: Menor volume, maior margem
```

### **Promoção:**
```
Unidades: 12
Desconto: 20%
Motivo: Liquidação de estoque
```

### **Lançamento:**
```
Unidades: 6
Desconto: 5%
Motivo: Testar mercado
```

---

## 🔄 Próximos Passos:

### **Frontend (Site):**
- [ ] Adicionar opção de caixa no ProductCard
- [ ] Toggle unidade/caixa no ProductModal
- [ ] Badge "Economize X%" visível
- [ ] Adicionar caixa ao carrinho
- [ ] Calcular total com desconto

### **Backend:**
- [x] Colunas no banco criadas
- [x] Cálculo automático implementado
- [x] Admin configurável
- [ ] API para buscar preços
- [ ] Validação de estoque por caixa

---

## ✅ Checklist:

- [x] SQL executado
- [x] Colunas adicionadas
- [x] Formulário atualizado
- [x] Cálculo automático
- [x] Resumo visual
- [x] Valores padrão definidos
- [ ] Frontend do site atualizado
- [ ] Carrinho com suporte a caixas
- [ ] Checkout com caixas

---

## 🎉 Resultado:

**Agora você pode:**
- ✅ Configurar venda por caixa
- ✅ Definir desconto personalizado
- ✅ Ver cálculo em tempo real
- ✅ Economizar tempo do cliente
- ✅ Aumentar ticket médio

**Próximo passo:**
Implementar no frontend para clientes poderem comprar caixas! 📦

---

**Sistema de caixas configurado no admin!** 🎉

Execute o SQL e configure seus produtos com desconto por caixa! 💰
