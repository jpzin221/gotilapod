# 📱 Guia de Configuracao - WhatsApp Infobip

## Visao Geral

O sistema Gotilapod usa a **Infobip API** para enviar mensagens de WhatsApp automaticamente para recuperar carrinhos abandonados.

---

## 1. Criar Conta na Infobip

1. Acesse [infobip.com](https://www.infobip.com)
2. Crie uma conta (tem nivel gratuito)
3. Verifique seu email

---

## 2. Configurar WhatsApp Sender

1. No painel da Infobip, va em **Channels > WhatsApp**
2. Clique em **Create WhatsApp Sender**
3. Siga os passos para conectar seu numero
4. Aguarde a aprovacao (pode levar alguns minutos)

---

## 3. Gerar API Key

1. No painel, va em **Settings > API Keys**
2. Clique em **Create API Key**
3. De um nome (ex: "Gorilapod WhatsApp")
4. Copie a chave gerada

---

## 4. Encontrar sua URL da API

1. No painel, va em **Settings > API Keys**
2. Copie o **API Base URL** (formato: `abc123.api.infobip.com`)
3. Remova o `https://` no inicio

---

## 5. Configurar no Supabase

### Opcao A: Usar o Script (Recomendado)

1. Execute o script de configuracao:

```bash
node scripts/configurar-infobip.js
```

2. Siga as instrucoes no terminal

### Opcao B: Configurar Manualmente

1. Acesse o painel Admin do Gotilapod
2. Va em **Carrinhos > Config**
3. Preencha:
   - **URL da API**: `abc123.api.infobip.com` (sem https://)
   - **API Key**: Sua chave da Infobip
   - **Telefone Conectado**: Numero com DDD (ex: `5544999887766`)
4. Clique em **Salvar**

---

## 6. Testar a Conexao

1. Na aba **Config**, va em **Testar Conexao**
2. Digite seu numero de telefone
3. Digite uma mensagem de teste
4. Clique em **Testar**
5. Voce deve receber a mensagem no WhatsApp

---

## 7. Ativar o Sistema

1. Marque a checkbox **Ativar Sistema**
2. Configure:
   - **Delay**: Tempo apos abandono para enviar (minimo 5 min)
   - **Maximo de Tentativas**: Quantas vezes tentar enviar
3. Clique em **Salvar Configuracao**

---

## Variaveis para Mensagens

Use essas variaveis nas mensagens:

| Variavel | Descricao |
|----------|-----------|
| `{nome}` | Nome do cliente |
| `{itens}` | Quantidade de itens no carrinho |
| `{total}` | Valor total do carrinho |
| `{link}` | Link da loja |

---

## Exemplo de Mensagem

```
Ola {nome}! 

Vi que voce deixou {itens} no carrinho na GorilaPod (R$ {total}).

Ainda da tempo de garantir! 😍

{link}
```

---

## Solucao de Problemas

### "WhatsApp nao configurado"
- Verifique se preencheu URL e API Key
- Confirme que o numero esta correto

### "Erro ao enviar"
- Verifique se a API Key esta correta
- Confirme que o WhatsApp Sender esta ativo
- Teste a conexao no painel

### Mensagens nao chegam
- Verifique se o numero esta correto (com DDD)
- Aguarde alguns minutos (pode haver delay)
- Confirme que o sistema esta ativo

---

## URLs Importantes

- **Painel Infobip**: [portal.infobip.com](https://portal.infobip.com)
- **Documentacao API**: [infobip.com/docs/api](https://www.infobip.com/docs/api)
- **WhatsApp API**: [infobip.com/docs/api/channels/whatsapp](https://www.infobip.com/docs/api/channels/whatsapp)

---

## Limites do Plano Gratuito

- **100 mensagens/mes** no plano gratuito
- **100 mensagens/dia** no trial
- Apos isso, precisa contratar plano pago

---

## Suporte

Em caso de problemas:
1. Verifique os logs no console do navegador
2. Teste a conexao no painel Admin
3. Consulte a documentacao da Infobip
4. Abra um issue no GitHub do projeto