# 🔍 Debug: QR Code Não Aparece

## 🧪 Teste 1: Verificar Backend

### 1. Reinicie o backend:
```bash
# Ctrl+C para parar
cd backend
npm run dev
```

### 2. Teste a geração de QR Code:
```bash
node test-qrcode.js
```

**Resultado esperado:**
```
✅ QR Code gerado com sucesso!
📏 Tamanho do base64: 2732
🔤 Primeiros 100 caracteres: iVBORw0KGgoAAAA...
```

---

## 🧪 Teste 2: Verificar Resposta da API

### 1. Abra o navegador (F12 → Console)

### 2. Faça uma compra de teste

### 3. Procure no console por:
```
📦 Resposta do backend PIX: {...}
✅ QR Code recebido: {...}
```

### 4. Verifique se tem:
```javascript
{
  success: true,
  txid: "DEMO...",
  imagemQrcode: "iVBORw0KGgoAAAA..." // ← Deve ter conteúdo!
}
```

---

## 🧪 Teste 3: Verificar Frontend

### No Console do Navegador, procure por:

#### Se QR Code carregou:
```
✅ QR Code carregado com sucesso!
```

#### Se deu erro:
```
❌ Erro ao carregar QR Code
Base64 length: 2732
Base64 start: iVBORw0KGgoAAAA...
```

#### Se não tem imagem:
```
⚠️ pixData: { ... }
```

---

## 🔧 Possíveis Problemas e Soluções:

### Problema 1: Backend não reiniciou
**Sintoma:** QR Code antigo (pixel 1x1)
**Solução:**
```bash
# Mate todos os processos node
taskkill /F /IM node.exe

# Inicie novamente
cd backend
npm run dev
```

### Problema 2: Biblioteca qrcode não instalada
**Sintoma:** Erro no backend
**Solução:**
```bash
cd backend
npm install qrcode
npm run dev
```

### Problema 3: CORS bloqueando
**Sintoma:** Erro de CORS no console
**Solução:** Verifique `backend/.env`:
```env
FRONTEND_URL=http://localhost:3000
```

### Problema 4: Base64 corrompido
**Sintoma:** Imagem não carrega
**Solução:** Verifique se o base64 não tem espaços ou quebras de linha

### Problema 5: Cache do navegador
**Sintoma:** Código antigo sendo usado
**Solução:**
```
Ctrl + Shift + R (hard reload)
ou
Ctrl + Shift + Delete (limpar cache)
```

---

## 📋 Checklist Completo:

- [ ] Backend rodando na porta 3001
- [ ] Biblioteca `qrcode` instalada
- [ ] Arquivo `test-qrcode.js` funciona
- [ ] Frontend rodando na porta 3000
- [ ] Console do navegador aberto (F12)
- [ ] Sem erros de CORS
- [ ] `VITE_BACKEND_URL` configurado no `.env`

---

## 🎯 Teste Manual Completo:

### 1. Pare tudo:
```bash
# Ctrl+C em todos os terminais
```

### 2. Limpe node_modules do backend:
```bash
cd backend
rm -rf node_modules
npm install
```

### 3. Teste o QR Code:
```bash
node test-qrcode.js
```

### 4. Inicie o backend:
```bash
npm run dev
```

### 5. Em outro terminal, inicie o frontend:
```bash
cd ..
npm run dev
```

### 6. Abra o navegador:
```
http://localhost:3000
```

### 7. Abra o Console (F12)

### 8. Faça uma compra:
```
1. Adicione produto
2. Digite CEP
3. Finalizar Pedido
4. Preencha formulário
5. Confirmar e Pagar
```

### 9. Veja os logs no console:
```
📦 Resposta do backend PIX: {...}
✅ QR Code recebido: {temImagem: true, tamanhoImagem: 2732}
✅ QR Code carregado com sucesso!
```

---

## 🚨 Se AINDA não funcionar:

### Teste direto no navegador:

1. Copie o base64 do console
2. Cole no navegador:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA...
```
3. Se a imagem aparecer, o problema é no React
4. Se não aparecer, o problema é no base64

---

## 📸 Screenshot do Console Esperado:

```
Console:
├─ 📦 Resposta do backend PIX: Object
│  ├─ success: true
│  ├─ txid: "DEMO1730591234567"
│  ├─ qrcode: "00020126580014br.gov.bcb.pix..."
│  ├─ imagemQrcode: "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA..." (2732 chars)
│  └─ pixCopiaECola: "00020126580014br.gov.bcb.pix..."
│
├─ ✅ QR Code recebido: Object
│  ├─ txid: "DEMO1730591234567"
│  ├─ temImagem: true
│  └─ tamanhoImagem: 2732
│
└─ ✅ QR Code carregado com sucesso!
```

---

## 💡 Dica Final:

Se você ver **"QR Code não disponível"** na tela, significa que `pixData.imagemQrcode` está **undefined** ou **vazio**.

Verifique no console:
```javascript
console.log('pixData:', pixData);
console.log('imagemQrcode:', pixData.imagemQrcode);
console.log('tipo:', typeof pixData.imagemQrcode);
console.log('length:', pixData.imagemQrcode?.length);
```

---

**Siga esses passos e me diga o que aparece no console!** 🔍
