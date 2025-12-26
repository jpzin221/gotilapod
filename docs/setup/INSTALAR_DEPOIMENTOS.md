# 🚀 INSTALAÇÃO RÁPIDA - SISTEMA DE DEPOIMENTOS

> **Guia passo a passo para ativar o sistema de depoimentos**

---

## ⚡ INSTALAÇÃO EM 3 PASSOS

### **1️⃣ Executar SQL no Supabase**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/fkstktohbnwsnzbarujc)
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo de:
   ```
   docs/setup/SCHEMA_DEPOIMENTOS.sql
   ```
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso ✅

**O que foi criado:**
- ✅ Tabela `testimonials`
- ✅ Índices para performance
- ✅ Políticas RLS (segurança)
- ✅ 5 depoimentos de exemplo

---

### **2️⃣ Verificar Componentes**

Os componentes já foram criados automaticamente:

```
✅ src/lib/supabase.js (testimonialService)
✅ src/components/ReviewsSection.jsx
✅ src/components/TestimonialForm.jsx
✅ src/components/admin/TestimonialManager.jsx
✅ src/pages/Admin.jsx (integração)
```

**Nada mais a fazer!** Tudo já está configurado.

---

### **3️⃣ Testar o Sistema**

#### **No Site:**
1. Acesse `http://localhost:3000`
2. Role até a seção "Depoimentos"
3. Veja os 5 depoimentos de exemplo
4. Clique em **"Deixar Meu Depoimento"**
5. Preencha e envie

#### **No Admin:**
1. Acesse `http://localhost:3000/admin`
2. Faça login
3. Clique na aba **"Depoimentos"**
4. Veja o depoimento pendente
5. Clique em **"Aprovar"**
6. Volte ao site e veja o depoimento aprovado

---

## ✅ VERIFICAÇÃO

### **Banco de Dados:**
```sql
-- Verificar se a tabela foi criada:
SELECT * FROM testimonials;

-- Deve retornar 5 depoimentos de exemplo
```

### **Site:**
- [ ] Seção "Depoimentos" aparece
- [ ] 5 depoimentos de exemplo visíveis
- [ ] Botão "Deixar Meu Depoimento" funciona
- [ ] Modal abre ao clicar

### **Admin:**
- [ ] Aba "Depoimentos" aparece
- [ ] Lista de depoimentos carrega
- [ ] Filtros funcionam (Todos, Pendentes, Aprovados)
- [ ] Botões de ação funcionam

---

## 🔧 TROUBLESHOOTING

### **Erro ao executar SQL:**
```
ERROR: relation "pedidos" does not exist
```

**Solução:** Execute primeiro o schema principal:
```
docs/setup/DATABASE_SCHEMA_CORRIGIDO.sql
```

### **Depoimentos não aparecem no site:**

1. Verificar se há depoimentos aprovados:
```sql
SELECT * FROM testimonials WHERE aprovado = true AND visivel = true;
```

2. Verificar políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'testimonials';
```

### **Erro ao criar depoimento:**
```
Error: permission denied for table testimonials
```

**Solução:** Verificar se as políticas RLS foram criadas corretamente.

---

## 📊 DADOS DE TESTE

Se quiser adicionar mais depoimentos de teste:

```sql
INSERT INTO testimonials (nome, depoimento, avaliacao, aprovado, aprovado_em, visivel)
VALUES 
  (
    'Seu Nome',
    'Seu depoimento aqui (mínimo 20 caracteres)',
    5,
    true,
    NOW(),
    true
  );
```

---

## 🎯 PRÓXIMOS PASSOS

Após instalar:

1. **Personalizar mensagens:**
   - Edite `ReviewsSection.jsx` para alterar textos
   - Edite `TestimonialForm.jsx` para alterar validações

2. **Ajustar design:**
   - Cores em `ReviewsSection.jsx`
   - Layout dos cards
   - Tamanho das estrelas

3. **Configurar notificações:**
   - Email ao admin quando novo depoimento
   - Email ao cliente quando aprovado

---

## 📝 RESUMO

**Tempo de instalação:** ~5 minutos

**Passos:**
1. ✅ Executar SQL (2 min)
2. ✅ Verificar componentes (1 min)
3. ✅ Testar sistema (2 min)

**Resultado:**
- ✅ Sistema completo funcionando
- ✅ 5 depoimentos de exemplo
- ✅ Formulário de envio ativo
- ✅ Painel admin configurado

---

**Pronto! Sistema de depoimentos instalado e funcionando!** 🎉
