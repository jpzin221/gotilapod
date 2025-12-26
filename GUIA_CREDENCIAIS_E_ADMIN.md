# 🔑 Como Pegar Credenciais e Configurar Admin no Supabase

## 📍 1. Como Pegar as Credenciais do Supabase

### Passo 1: Acessar seu Projeto
1. Entre em [app.supabase.com](https://app.supabase.com)
2. Clique no seu projeto

### Passo 2: Ir em Settings → API
1. No menu lateral esquerdo, clique em **⚙️ Settings** (Configurações)
2. Clique em **API**

### Passo 3: Copiar as Credenciais

Você verá uma página com várias informações. Copie estas 2:

#### 🔗 Project URL
```
Local: Configuration → Project URL
Exemplo: https://xyzabc123.supabase.co
```

**📋 Como copiar:**
- Clique no ícone de **copiar** ao lado da URL
- Ou selecione e copie manualmente

#### 🔑 API Keys → anon public
```
Local: Project API keys → anon public
Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**📋 Como copiar:**
- Clique no ícone de **copiar** ao lado da chave
- Essa é uma chave LONGA, certifique-se de copiar inteira

> [!WARNING]
> **NUNCA compartilhe a `service_role` key publicamente!**
> Use apenas a **`anon public`** key no frontend.

---

## 📝 2. Como Atualizar o .env

Depois de copiar as credenciais:

### Passo 1: Abrir o arquivo .env
```
Localização: raiz do projeto
Arquivo: .env
```

### Passo 2: Atualizar as variáveis

Cole as credenciais assim:

```env
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 3: Salvar o arquivo
- **Salve** o arquivo `.env`
- Reinicie o servidor de desenvolvimento (`npm run dev`)

---

## 👤 3. Como Configurar/Alterar Admin

### Opção 1: Usar a Tabela Authentication (Supabase Auth)

#### A. Criar Admin via SQL

Execute este SQL no **SQL Editor**:

```sql
-- Criar usuário admin no Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@seusite.com',  -- ALTERE AQUI
  crypt('SuaSenhaSegura123', gen_salt('bf')),  -- ALTERE A SENHA AQUI
  NOW(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"name":"Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

**📝 Personalize:**
- Linha 16: Troque `admin@seusite.com` pelo seu email
- Linha 17: Troque `SuaSenhaSegura123` pela sua senha

#### B. Criar Admin pelo Painel (Mais Fácil)

1. Vá em **🔐 Authentication** no menu lateral
2. Clique em **Users**
3. Clique em **Add user** (botão verde)
4. Preencha:
   - **Email**: seu.email@exemplo.com
   - **Password**: SuaSenhaSegura123
   - **Auto Confirm User**: ✅ Marque esta caixa
5. Clique em **Create user**

#### C. Alterar Senha de um Admin Existente

**Via Painel:**
1. **Authentication** → **Users**
2. Clique no email do usuário
3. Clique em **Reset password**
4. Digite a nova senha
5. Clique em **Update user**

**Via SQL:**
```sql
-- Alterar senha do admin
UPDATE auth.users
SET encrypted_password = crypt('NovaSenha123', gen_salt('bf'))
WHERE email = 'admin@seusite.com';
```

---

### Opção 2: Sistema de Admin Customizado (Seu Projeto)

Se você quer criar um admin específico para o painel administrativo do site:

#### A. Criar Tabela de Admins

```sql
-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir admin padrão
INSERT INTO admins (email, senha_hash, nome)
VALUES (
  'admin@seusite.com',
  crypt('admin123', gen_salt('bf')),
  'Administrador'
);
```

#### B. Verificar Login do Admin

```sql
-- Função para verificar login do admin
CREATE OR REPLACE FUNCTION verificar_login_admin(
  p_email TEXT,
  p_senha TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  sucesso BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.nome,
    (a.senha_hash = crypt(p_senha, a.senha_hash)) as sucesso
  FROM admins a
  WHERE a.email = p_email AND a.ativo = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### C. Usar no Frontend

```javascript
// Em src/lib/supabase.js ou similar
export async function loginAdmin(email, senha) {
  const { data, error } = await supabase
    .rpc('verificar_login_admin', { 
      p_email: email, 
      p_senha: senha 
    });
  
  if (error) throw error;
  if (!data || data.length === 0 || !data[0].sucesso) {
    throw new Error('Credenciais inválidas');
  }
  
  return data[0]; // { id, email, nome }
}
```

---

## 🔒 4. Proteger Rotas de Admin

### No Frontend (React)

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem('adminToken'); // ou seu método
  
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
}

// Usar nas rotas
<Route path="/admin/painel" element={
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## 📋 Checklist de Configuração

- [ ] Copiei a **Project URL**
- [ ] Copiei a **anon public key**
- [ ] Atualizei o `.env` com as credenciais
- [ ] Criei usuário admin no Supabase Auth OU tabela customizada
- [ ] Testei login no painel admin
- [ ] Protegi rotas de admin

---

## ❓ Perguntas Frequentes

### Q: Qual senha usar para o banco de dados?
**R:** A senha do banco é apenas para conexões diretas. Você usa as **API Keys** (anon public) no código.

### Q: Onde fica a senha do banco?
**R:** **Settings** → **Database** → **Connection string** (mas não precisa dela no frontend)

### Q: Esqueci a senha do admin, como resetar?
**R:** Execute o SQL de atualização de senha (mostrado acima) ou use o painel **Authentication** → **Users** → **Reset password**

### Q: Posso ter múltiplos admins?
**R:** Sim! Crie múltiplos usuários em **Authentication** → **Users** ou na tabela `admins` customizada.

---

## 🎯 Resumo Rápido

**Para pegar credenciais:**
1. Supabase → Settings → API
2. Copiar **Project URL** e **anon public**
3. Colar no `.env`

**Para criar admin:**
1. Authentication → Users → Add user
2. Email + Senha + Auto Confirm ✅
3. Usar essas credenciais no login

**Pronto!** 🎉
