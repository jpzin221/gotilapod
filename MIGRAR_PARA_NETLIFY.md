# 🔄 Guia de Migração: Backend Local → Netlify Functions

## 📋 O que vai mudar?

### ANTES (Backend Local):
```
Frontend (React) → Backend Express (localhost:3001) → EFI API
                                                     → Supabase
```

### DEPOIS (Netlify Functions):
```
Frontend (React) → Netlify Functions → EFI API
                                     → Supabase
```

---

## 🎯 Mudanças Necessárias

### 1. Atualizar `PixPayment.jsx`

**Localização**: `src/components/PixPayment.jsx`

#### Linha ~6: Adicionar import
```javascript
// ADICIONAR:
import { createPixCharge, checkPixStatus } from '../lib/netlifyService';
```

#### Linha ~326-368: Substituir `createPixCharge`
```javascript
// ANTES:
const createPixCharge = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/pix/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valorTotal: pedido.valorTotal,
        nomeCliente: pedido.nomeCliente,
        cpfCliente: pedido.cpfCliente,
        itens: pedido.itens,
        pedidoId: pedido.id
      })
    });

    const data = await response.json();
    
    if (data.success) {
      setPixData(data);
    } else {
      throw new Error(data.error || 'Erro ao criar cobrança');
    }
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    setError(error.message || 'Erro ao gerar PIX. Tente novamente.');
    setPaymentStatus('error');
  } finally {
    setLoading(false);
  }
};

// DEPOIS:
const createPixCharge = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Usar função serverless do Netlify
    const data = await createPixCharge({
      valorTotal: pedido.valorTotal,
      nomeCliente: pedido.nomeCliente,
      cpfCliente: pedido.cpfCliente,
      itens: pedido.itens,
      id: pedido.id
    });
    
    setPixData(data);
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    setError(error.message || 'Erro ao gerar PIX. Tente novamente.');
    setPaymentStatus('error');
  } finally {
    setLoading(false);
  }
};
```

#### Linha ~116-131: Substituir verificação de status
```javascript
// ANTES:
const checkInterval = setInterval(async () => {
  try {
    const response = await fetch(`${backendUrl}/api/pix/status/${pixData.txid}`);
    const data = await response.json();
    
    if (data.success && data.status === 'CONCLUIDA') {
      setPaymentStatus('paid');
      clearInterval(checkInterval);
      await handlePaymentConfirmed();
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
}, 3000);

// DEPOIS:
const checkInterval = setInterval(async () => {
  try {
    const data = await checkPixStatus(pixData.txid);
    
    if (data.success && data.status === 'CONCLUIDA') {
      setPaymentStatus('paid');
      clearInterval(checkInterval);
      await handlePaymentConfirmed();
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
}, 3000);
```

---

### 2. (Opcional) Atualizar Carregamento de Produtos

Se quiser usar a função serverless para produtos também:

**Localização**: `src/lib/supabase.js`

```javascript
// ADICIONAR no início:
import { getProducts as getProductsServerless } from './netlifyService';

// MODIFICAR productService.getAll():
export const productService = {
  async getAll() {
    try {
      // Tentar usar função serverless primeiro
      return await getProductsServerless();
    } catch (error) {
      console.warn('⚠️ Fallback para Supabase direto');
      
      // Fallback: usar Supabase direto
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select(`
          *,
          flavors:product_flavors(
            flavor:flavors(*)
          )
        `)
        .order('display_order', { ascending: true });
      
      if (supabaseError) throw supabaseError;
      return data;
    }
  },
  // ... resto do código
};
```

---

### 3. Remover Variável `VITE_BACKEND_URL`

**Localização**: Arquivo `.env` (se existir)

```bash
# REMOVER esta linha:
VITE_BACKEND_URL=http://localhost:3001
```

Não é mais necessária! As funções serverless usam URLs relativas.

---

## 📦 Instalar Dependências

### 1. Dependências das Funções Serverless

```bash
cd netlify/functions
npm install
cd ../..
```

### 2. Netlify CLI (para testes locais)

```bash
npm install -g netlify-cli
```

---

## 🧪 Testar Localmente

### 1. Rodar com Netlify Dev

```bash
netlify dev
```

Isso vai:
- ✅ Rodar o frontend em `http://localhost:8888`
- ✅ Rodar as funções em `http://localhost:8888/.netlify/functions/`
- ✅ Simular ambiente de produção

### 2. Testar Fluxo Completo

1. Abra `http://localhost:8888`
2. Adicione produtos ao carrinho
3. Vá para checkout
4. Preencha dados e clique em "Gerar PIX"
5. ✅ QR Code deve aparecer (modo DEMO se não tiver certificado)
6. ✅ Verificar logs no terminal

---

## 🚀 Deploy no Netlify

### 1. Commit e Push

```bash
git add .
git commit -m "feat: migrar para Netlify Functions"
git push origin main
```

### 2. Configurar Variáveis de Ambiente

No painel do Netlify (**Site settings → Environment variables**):

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Para PIX real (opcional):
EFI_CLIENT_ID=seu-client-id
EFI_CLIENT_SECRET=seu-client-secret
EFI_PIX_KEY=sua-chave-pix@email.com
EFI_SANDBOX=true
EFI_CERTIFICATE_BASE64=base64-do-certificado
```

### 3. Deploy Automático

O Netlify vai detectar o push e fazer deploy automaticamente! 🎉

---

## ✅ Checklist de Migração

- [ ] Funções serverless criadas em `netlify/functions/`
- [ ] `netlifyService.js` criado em `src/lib/`
- [ ] `PixPayment.jsx` atualizado para usar `netlifyService`
- [ ] Dependências instaladas em `netlify/functions/`
- [ ] Netlify CLI instalado (`npm install -g netlify-cli`)
- [ ] Testado localmente com `netlify dev`
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Código commitado e pushed para o repositório
- [ ] Deploy feito com sucesso no Netlify
- [ ] Testado em produção

---

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode voltar para o backend local:

1. Reverter commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Ou simplesmente não fazer o deploy e continuar usando o backend local

O código antigo continua funcionando! A migração é **não-destrutiva**.

---

## 📊 Comparação

| Aspecto | Backend Local | Netlify Functions |
|---------|---------------|-------------------|
| **Custo** | Servidor 24/7 | Grátis (125k req/mês) |
| **Escalabilidade** | Manual | Automática |
| **Manutenção** | Alta | Baixa |
| **Segurança** | Boa | Excelente |
| **Deploy** | Manual | Automático (Git) |
| **Logs** | Terminal | Painel Netlify |

---

## 🎯 Próximos Passos

1. ✅ **Ler este guia completo**
2. ✅ **Fazer as mudanças no código**
3. ✅ **Testar localmente**
4. ✅ **Configurar variáveis no Netlify**
5. ✅ **Fazer deploy**
6. ✅ **Testar em produção**
7. ✅ **Desligar backend local** (se tudo funcionar)

---

## 🆘 Problemas Comuns

### "Function not found"
- Verifique se `netlify.toml` está configurado
- Verifique se as funções estão em `netlify/functions/`
- Redeploy: `netlify deploy --prod`

### "CORS Error"
- Já está configurado! Todas as funções retornam headers CORS
- Se persistir, verifique se está usando a URL correta

### "EFI Error"
- Modo DEMO está ativo (normal sem certificado)
- Para PIX real, configure `EFI_CERTIFICATE_BASE64`

---

**✨ Boa migração! Qualquer dúvida, consulte o `GUIA_NETLIFY_SERVERLESS.md`** 🚀
