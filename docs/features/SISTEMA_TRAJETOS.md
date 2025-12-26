# Sistema de Gerenciamento de Trajetos de Pedidos

## 📋 Visão Geral

Sistema completo para gerenciar o fluxo de status dos pedidos com:
- ✅ Validação de horário de funcionamento
- ✅ Trajeto padrão (global) para todos os pedidos
- ✅ Trajetos personalizados para pedidos específicos
- ✅ Conversão automática de tempo (minutos → horas → dias)
- ✅ Interface intuitiva de arrastar e soltar

---

## 🎯 Funcionalidades Principais

### 1. **Validação de Horário**
- Status de pedidos **NÃO podem ser atualizados** fora do horário de funcionamento
- Verificação automática em tempo real
- Indicador visual no admin (Loja Aberta/Fechada)

### 2. **Trajeto Padrão (Global)**
- Define o fluxo padrão para **todos os novos pedidos**
- Configurável pelo admin
- Etapas personalizáveis com tempo de espera

### 3. **Trajeto Individual**
- Personalize o trajeto de **um pedido específico**
- Sobrescreve o trajeto padrão apenas para aquele pedido
- Útil para pedidos urgentes ou especiais

### 4. **Conversão de Tempo**
- Entrada: `30 min`, `2h`, `1 dia`, `1 dia e 12h`
- Armazenamento: minutos (no banco de dados)
- Exibição: formato legível automático

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `pedido_trajeto_personalizado`

```sql
CREATE TABLE pedido_trajeto_personalizado (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_atual VARCHAR(50) NOT NULL,
  proximo_status VARCHAR(50) NOT NULL,
  minutos_espera INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Atualização: `config_status_tempo`

```sql
ALTER TABLE config_status_tempo 
ADD COLUMN display_order INTEGER DEFAULT 1;

ALTER TABLE config_status_tempo 
ADD COLUMN descricao TEXT;
```

---

## 🚀 Como Usar

### No Admin

1. **Acessar**: `/admin` → Aba "Trajetos"

2. **Trajeto Padrão (Global)**:
   - Clique na aba "Trajeto Padrão"
   - Configure as etapas:
     - Status Atual → Próximo Status
     - Tempo de Espera (ex: `30 min`, `2h`)
     - Descrição opcional
   - Clique em "Salvar Trajeto Padrão"

3. **Trajeto Individual**:
   - Clique na aba "Trajeto Individual"
   - Selecione o pedido
   - Configure as etapas personalizadas
   - Clique em "Salvar Trajeto Individual"

4. **Resetar para Padrão**:
   - Na aba "Trajeto Individual"
   - Clique em "Resetar para Padrão"
   - Confirme a ação

---

## 📝 Exemplos de Uso

### Exemplo 1: Trajeto Padrão

```
Etapa 1: Confirmado → Preparando (30 min)
Etapa 2: Preparando → Guardando (1h)
Etapa 3: Guardando → Motoboy a Caminho (15 min)
Etapa 4: Motoboy a Caminho → Em Rota (30 min)
Etapa 5: Em Rota → Entregue (1h)
```

### Exemplo 2: Pedido Urgente (Individual)

```
Etapa 1: Confirmado → Preparando (5 min) - "Pedido urgente"
Etapa 2: Preparando → Em Rota (10 min) - "Pular guardagem"
Etapa 3: Em Rota → Entregue (15 min) - "Entrega expressa"
```

### Exemplo 3: Pedido com Atraso (Individual)

```
Etapa 1: Confirmado → Preparando (2h) - "Aguardando estoque"
Etapa 2: Preparando → Guardando (1 dia) - "Produto em separação"
Etapa 3: Guardando → Em Rota (30 min)
Etapa 4: Em Rota → Entregue (1h)
```

---

## ⏰ Conversão de Tempo

### Formatos Aceitos

| Entrada | Minutos | Exibição |
|---------|---------|----------|
| `30 min` | 30 | 30 min |
| `1h` | 60 | 1h |
| `2h 30min` | 150 | 2h 30min |
| `1 dia` | 1440 | 1 dia |
| `2 dias` | 2880 | 2 dias |
| `1 dia e 12h` | 2160 | 1 dia e 12h |

### Funções Utilitárias

```javascript
// Converter minutos para formato legível
formatarTempo(30)        // "30 min"
formatarTempo(120)       // "2h"
formatarTempo(1440)      // "1 dia"
formatarTempo(2160)      // "1 dia e 12h"

// Converter texto para minutos
parseTempoParaMinutos("30 min")      // 30
parseTempoParaMinutos("2h")          // 120
parseTempoParaMinutos("1 dia e 12h") // 2160
```

---

## 🔒 Validação de Horário

### Como Funciona

1. **Verificação Automática**:
   - Ao tentar atualizar status
   - Sistema verifica `store_settings.business_hours`
   - Compara horário atual com horário de funcionamento

2. **Bloqueio Fora do Horário**:
   - Retorna erro 403 (Forbidden)
   - Mensagem: "Não é possível atualizar o status fora do horário de funcionamento"
   - Admin vê alerta visual

3. **Force Update** (Opcional):
   - Parâmetro `forceUpdate: true` no request
   - Permite atualização mesmo fora do horário
   - Usar apenas em casos excepcionais

### Exemplo de Request

```javascript
// Atualização normal (valida horário)
await orderTrajectoryService.updateOrderStatus(
  pedidoId,
  'preparando',
  'Pedido em preparação'
);

// Atualização forçada (ignora horário)
await fetch(`${backendUrl}/api/pedidos/${pedidoId}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'preparando',
    observacao: 'Atualização manual',
    forceUpdate: true // ← Ignora validação de horário
  })
});
```

---

## 📊 Status Disponíveis

```javascript
const STATUS_PEDIDO = {
  confirmado: 'Pedido Confirmado',
  preparando: 'Preparando Pedido',
  guardando: 'Guardando Pedido',
  motoboy_caminho: 'Motoboy a Caminho',
  coleta: 'Aguardando Coleta',
  em_rota: 'Em Rota de Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};
```

### Fluxo Padrão

```
confirmado → preparando → guardando → motoboy_caminho → coleta → em_rota → entregue
                                                                              ↓
                                                                          cancelado
```

---

## 🛠️ API Endpoints

### Backend

#### 1. Atualizar Status (com validação)
```http
PUT /api/pedidos/:id/status
Content-Type: application/json

{
  "status": "preparando",
  "observacao": "Pedido em preparação",
  "forceUpdate": false
}
```

**Resposta (Sucesso)**:
```json
{
  "success": true,
  "pedido": { ... },
  "message": "Status atualizado com sucesso"
}
```

**Resposta (Fora do Horário)**:
```json
{
  "success": false,
  "error": "Não é possível atualizar o status fora do horário de funcionamento",
  "message": "A loja está fechada..."
}
```

---

## 🎨 Interface do Admin

### Indicadores Visuais

#### Loja Aberta
```
┌─────────────────────────┐
│ ✓ Loja Aberta          │ ← Verde
└─────────────────────────┘
```

#### Loja Fechada
```
┌─────────────────────────┐
│ ✗ Loja Fechada         │ ← Vermelho
└─────────────────────────┘

⚠️ Atualizações de status bloqueadas
Os status dos pedidos não podem ser
atualizados fora do horário de funcionamento.
```

### Etapas do Trajeto

```
┌─────────────────────────────────────┐
│ Etapa 1                        [X]  │
├─────────────────────────────────────┤
│ Status Atual:    [Confirmado    ▼] │
│ Próximo Status:  [Preparando    ▼] │
│ Tempo de Espera: [30 min       ] (30 min) │
│ Descrição:       [Pedido normal    ] │
│                                     │
│ Confirmado → Preparando em 30 min  │
└─────────────────────────────────────┘
```

---

## 🔄 Fluxo Completo

### 1. Pedido Criado
```
Cliente faz pedido → Status: confirmado
                  ↓
Sistema busca trajeto do pedido
                  ↓
Existe trajeto personalizado?
  ├─ SIM: Usa trajeto personalizado
  └─ NÃO: Usa trajeto padrão
```

### 2. Mudança de Status
```
Admin tenta atualizar status
                  ↓
Sistema verifica horário de funcionamento
                  ↓
Loja está aberta?
  ├─ SIM: Permite atualização
  └─ NÃO: Bloqueia com erro 403
```

### 3. Mudança Automática
```
Pedido atinge tempo de espera
                  ↓
Sistema busca próximo status no trajeto
                  ↓
Atualiza status automaticamente
                  ↓
Registra no histórico (automatico: true)
                  ↓
Agenda próxima mudança
```

---

## 📁 Arquivos Criados

### Frontend
- `src/lib/orderTrajectoryService.js` - Service principal
- `src/components/admin/TrajectoryManager.jsx` - Interface admin

### Backend
- `backend/routes/pedidos.js` - Atualizado com validação de horário

### Banco de Dados
- `docs/setup/TRAJETO_PERSONALIZADO.sql` - Schema e funções

### Documentação
- `docs/features/SISTEMA_TRAJETOS.md` - Este arquivo

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Executar `TRAJETO_PERSONALIZADO.sql` no Supabase
- [ ] Verificar tabela `pedido_trajeto_personalizado` criada
- [ ] Verificar colunas adicionadas em `config_status_tempo`
- [ ] Testar função `get_pedido_trajeto()`

### Backend
- [ ] Validação de horário funcionando
- [ ] Endpoint PUT `/api/pedidos/:id/status` atualizado
- [ ] Testar bloqueio fora do horário
- [ ] Testar `forceUpdate: true`

### Frontend
- [ ] TrajectoryManager aparecendo no admin
- [ ] Aba "Trajetos" visível
- [ ] Indicador de loja aberta/fechada funcionando
- [ ] Trajeto padrão salvando corretamente
- [ ] Trajeto individual salvando corretamente
- [ ] Conversão de tempo funcionando

### Testes
- [ ] Criar trajeto padrão
- [ ] Criar trajeto individual para pedido
- [ ] Resetar trajeto individual
- [ ] Tentar atualizar status fora do horário (deve bloquear)
- [ ] Atualizar status dentro do horário (deve funcionar)
- [ ] Verificar conversão: `30 min`, `2h`, `1 dia`

---

## 🐛 Troubleshooting

### Problema: Status não atualiza
**Causa**: Loja fechada
**Solução**: Aguardar horário de funcionamento ou usar `forceUpdate: true`

### Problema: Trajeto individual não salva
**Causa**: Pedido não selecionado
**Solução**: Selecionar pedido no dropdown antes de salvar

### Problema: Tempo não converte corretamente
**Causa**: Formato inválido
**Solução**: Usar formatos: `30 min`, `2h`, `1 dia`, `1 dia e 12h`

### Problema: Tabela não existe
**Causa**: SQL não executado
**Solução**: Executar `TRAJETO_PERSONALIZADO.sql` no Supabase

---

## 🎓 Exemplos Práticos

### Cenário 1: Loja com Entrega Rápida

```javascript
// Trajeto Padrão
[
  { status_atual: 'confirmado', proximo_status: 'preparando', minutos_espera: 15 },
  { status_atual: 'preparando', proximo_status: 'em_rota', minutos_espera: 20 },
  { status_atual: 'em_rota', proximo_status: 'entregue', minutos_espera: 30 }
]
// Total: 65 minutos (1h 5min)
```

### Cenário 2: Loja com Preparação Lenta

```javascript
// Trajeto Padrão
[
  { status_atual: 'confirmado', proximo_status: 'preparando', minutos_espera: 120 }, // 2h
  { status_atual: 'preparando', proximo_status: 'guardando', minutos_espera: 60 },   // 1h
  { status_atual: 'guardando', proximo_status: 'em_rota', minutos_espera: 30 },
  { status_atual: 'em_rota', proximo_status: 'entregue', minutos_espera: 60 }
]
// Total: 270 minutos (4h 30min)
```

### Cenário 3: Pedido VIP (Individual)

```javascript
// Trajeto Individual para pedido #12345
[
  { 
    status_atual: 'confirmado', 
    proximo_status: 'preparando', 
    minutos_espera: 5,
    descricao: 'Cliente VIP - prioridade máxima'
  },
  { 
    status_atual: 'preparando', 
    proximo_status: 'em_rota', 
    minutos_espera: 10,
    descricao: 'Pular etapa de guardagem'
  },
  { 
    status_atual: 'em_rota', 
    proximo_status: 'entregue', 
    minutos_espera: 15,
    descricao: 'Entrega expressa'
  }
]
// Total: 30 minutos
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar este documento
2. Verificar logs do backend
3. Verificar console do navegador
4. Verificar tabelas no Supabase

---

## 🎉 Conclusão

Sistema completo implementado com:
- ✅ Validação de horário
- ✅ Trajetos globais e individuais
- ✅ Conversão automática de tempo
- ✅ Interface intuitiva
- ✅ Documentação completa

**Próximos passos**: Executar SQL e testar no admin!
