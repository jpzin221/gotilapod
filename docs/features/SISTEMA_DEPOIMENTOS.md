# 🌟 SISTEMA COMPLETO DE DEPOIMENTOS

> **Sistema de avaliações e depoimentos de clientes com aprovação administrativa**

---

## 🎯 FUNCIONALIDADES

### **Para o Cliente:**
- ✅ Deixar depoimento com avaliação (1-5 estrelas)
- ✅ Informar nome, telefone e email (opcional)
- ✅ Escrever experiência de compra
- ✅ Ver depoimentos aprovados de outros clientes

### **Para o Admin:**
- ✅ Aprovar ou reprovar depoimentos
- ✅ Ocultar/mostrar depoimentos
- ✅ Deletar depoimentos
- ✅ Filtrar por status (todos, pendentes, aprovados)
- ✅ Ver informações completas do cliente

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### **Tabela: `testimonials`**

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY,
  
  -- Dados do cliente
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(100),
  
  -- Depoimento
  depoimento TEXT NOT NULL,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  
  -- Pedido relacionado (opcional)
  pedido_id BIGINT REFERENCES pedidos(id),
  
  -- Status de aprovação
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP,
  
  -- Visibilidade
  visivel BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Políticas RLS:**

1. **Criação:** Qualquer um pode criar depoimento
2. **Leitura:** Apenas depoimentos aprovados e visíveis são públicos
3. **Admin:** Service role tem acesso total

---

## 🔄 FLUXO COMPLETO

```
1. Cliente clica "Deixar Meu Depoimento"
   ↓
2. Preenche formulário:
   - Nome *
   - Telefone (opcional)
   - Email (opcional)
   - Avaliação (1-5 estrelas) *
   - Depoimento (mínimo 20 caracteres) *
   ↓
3. Sistema salva no banco:
   - aprovado = FALSE
   - visivel = TRUE
   ↓
4. Cliente vê mensagem:
   "Depoimento enviado! Será liberado após aprovação"
   ↓
5. Admin acessa painel:
   - Aba "Depoimentos"
   - Vê depoimentos pendentes
   ↓
6. Admin aprova ou reprova:
   - Aprovar: aprovado = TRUE
   - Reprovar: aprovado = FALSE, visivel = FALSE
   ↓
7. Depoimento aprovado aparece no site
   ↓
8. Clientes veem na seção "Depoimentos"
```

---

## 📁 ARQUIVOS CRIADOS

### **1. Schema SQL**
```
docs/setup/SCHEMA_DEPOIMENTOS.sql
```
- Criação da tabela
- Índices para performance
- Políticas RLS
- Dados iniciais (exemplos)

### **2. Serviço Supabase**
```javascript
// src/lib/supabase.js
export const testimonialService = {
  getApproved(),      // Depoimentos aprovados (site)
  getAll(),           // Todos (admin)
  getPending(),       // Pendentes (admin)
  create(testimonial),// Criar novo
  approve(id),        // Aprovar
  reject(id),         // Reprovar
  toggleVisibility(id, visivel), // Mostrar/ocultar
  delete(id)          // Deletar
}
```

### **3. Componentes Frontend**

#### **ReviewsSection.jsx**
- Exibe depoimentos aprovados
- Botão "Deixar Meu Depoimento"
- Grid responsivo de cards
- Aviso: "Liberado após aprovação"

#### **TestimonialForm.jsx**
- Modal de envio de depoimento
- Formulário completo
- Validações
- Tela de sucesso

### **4. Componente Admin**

#### **TestimonialManager.jsx**
- Lista todos os depoimentos
- Filtros (todos, pendentes, aprovados)
- Ações: Aprovar, Reprovar, Ocultar, Deletar
- Badges de status
- Informações do cliente

---

## 🎨 INTERFACE

### **Site (ReviewsSection)**

```
┌─────────────────────────────────────────┐
│         🌟 Depoimentos                  │
│                                         │
│  [+ Deixar Meu Depoimento]             │
│                                         │
│  💡 Liberado após aprovação do admin   │
│                                         │
│  ┌───────────┬───────────┬───────────┐ │
│  │ ⭐⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐  │ │
│  │ "Ótimo!"  │ "Adorei!" │ "Top!"    │ │
│  │ - Maria   │ - João    │ - Ana     │ │
│  └───────────┴───────────┴───────────┘ │
└─────────────────────────────────────────┘
```

### **Formulário de Envio**

```
┌──────────────────────────────────────┐
│  Deixe Seu Depoimento                │
│                                      │
│  Avaliação: ⭐⭐⭐⭐⭐               │
│                                      │
│  Nome: [________________]            │
│  Telefone: [________________]        │
│  Email: [________________]           │
│                                      │
│  Depoimento:                         │
│  [_____________________________]     │
│  [_____________________________]     │
│  [_____________________________]     │
│                                      │
│  [Cancelar]  [Enviar Depoimento]    │
└──────────────────────────────────────┘
```

### **Painel Admin**

```
┌──────────────────────────────────────────┐
│  🌟 Gerenciar Depoimentos                │
│                                          │
│  [Todos (10)] [Pendentes (3)] [Aprovados (7)] │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 👤 Maria Silva      ⏰ Pendente    │ │
│  │ ⭐⭐⭐⭐⭐                           │ │
│  │ 📱 (41) 99999-9999                 │ │
│  │ 📧 maria@email.com                 │ │
│  │                                    │ │
│  │ "Produto excelente! Chegou..."     │ │
│  │                                    │ │
│  │ [✓ Aprovar] [✗ Reprovar] [🗑️ Deletar] │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 💡 MENSAGENS IMPORTANTES

### **Aviso no Site:**
```
💡 Depoimentos são liberados após aprovação do administrador
```

### **Após Envio:**
```
✅ Depoimento Enviado!

Obrigado por compartilhar sua experiência! 🎉

Seu depoimento será analisado e publicado em breve.
```

---

## 🔒 VALIDAÇÕES

### **Frontend:**
- ✅ Nome obrigatório
- ✅ Depoimento obrigatório (mínimo 20 caracteres)
- ✅ Avaliação obrigatória (1-5 estrelas)
- ✅ Telefone e email opcionais

### **Backend (RLS):**
- ✅ Apenas depoimentos aprovados são públicos
- ✅ Admin tem acesso total
- ✅ Clientes não podem editar/deletar

---

## 🎯 STATUS DE DEPOIMENTO

### **Pendente:**
- `aprovado = FALSE`
- Aparece no admin com badge laranja
- Não aparece no site

### **Aprovado:**
- `aprovado = TRUE`
- `aprovado_em = timestamp`
- Aparece no site
- Badge verde no admin

### **Oculto:**
- `visivel = FALSE`
- Não aparece no site
- Ainda visível no admin

---

## 🔧 AÇÕES DO ADMIN

### **1. Aprovar**
```javascript
await testimonialService.approve(id);
// aprovado = TRUE
// aprovado_em = NOW()
```

### **2. Reprovar**
```javascript
await testimonialService.reject(id);
// aprovado = FALSE
// visivel = FALSE
```

### **3. Ocultar/Mostrar**
```javascript
await testimonialService.toggleVisibility(id, false);
// visivel = FALSE (oculta)
// ou
await testimonialService.toggleVisibility(id, true);
// visivel = TRUE (mostra)
```

### **4. Deletar**
```javascript
await testimonialService.delete(id);
// Remove permanentemente
```

---

## 📊 DADOS INICIAIS

O SQL inclui 5 depoimentos de exemplo já aprovados:

1. **Maria Silva** - 5 estrelas
2. **João Santos** - 5 estrelas
3. **Ana Costa** - 5 estrelas
4. **Pedro Oliveira** - 5 estrelas
5. **Carla Mendes** - 5 estrelas

---

## 🚀 COMO USAR

### **1. Executar SQL no Supabase:**
```sql
-- Copiar e executar:
docs/setup/SCHEMA_DEPOIMENTOS.sql
```

### **2. Testar no Site:**
1. Acesse a seção "Depoimentos"
2. Clique "Deixar Meu Depoimento"
3. Preencha o formulário
4. Envie

### **3. Aprovar no Admin:**
1. Acesse `/admin`
2. Clique na aba "Depoimentos"
3. Veja depoimentos pendentes
4. Clique "Aprovar"

### **4. Ver no Site:**
1. Volte para a home
2. Role até "Depoimentos"
3. Veja o depoimento aprovado

---

## 🎨 CUSTOMIZAÇÕES

### **Alterar Mínimo de Caracteres:**
```javascript
// TestimonialForm.jsx
if (formData.depoimento.length < 20) {
  // Altere 20 para o valor desejado
}
```

### **Alterar Número de Estrelas:**
```javascript
// TestimonialForm.jsx
{[1, 2, 3, 4, 5].map((rating) => (
  // Altere o array para mais/menos estrelas
))}
```

### **Campos Obrigatórios:**
```javascript
// Tornar telefone obrigatório:
<input
  type="tel"
  required  // Adicione required
  ...
/>
```

---

## 📱 RESPONSIVIDADE

- ✅ **Mobile:** Grid 1 coluna
- ✅ **Tablet:** Grid 2 colunas
- ✅ **Desktop:** Grid 3 colunas
- ✅ **Admin:** Responsivo em todas as telas

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar tabela no banco de dados
- [x] Configurar políticas RLS
- [x] Criar serviço no Supabase
- [x] Criar ReviewsSection (site)
- [x] Criar TestimonialForm (modal)
- [x] Criar TestimonialManager (admin)
- [x] Integrar no painel admin
- [x] Adicionar dados iniciais
- [x] Testar fluxo completo
- [x] Documentar sistema

---

## 🎉 RESULTADO FINAL

**Sistema completo de depoimentos com:**
- ✅ Formulário de envio no site
- ✅ Aprovação administrativa
- ✅ Exibição de depoimentos aprovados
- ✅ Gerenciamento completo no admin
- ✅ Validações e segurança
- ✅ Interface responsiva
- ✅ Mensagens claras ao usuário

---

**Implementado em:** 03/11/2025  
**Arquivos:** 7 arquivos criados/modificados  
**Status:** ✅ **COMPLETO E FUNCIONANDO**
