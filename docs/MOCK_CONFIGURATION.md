# Mock Configuration Guide

## 📝 Visão Geral

O xRat Ecosystem suporta configuração de mocks tanto no frontend quanto no backend através de variáveis de ambiente. Isso permite alternar facilmente entre serviços mock (para desenvolvimento) e APIs reais.

## 🎛️ Variáveis de Ambiente

### Frontend Mocks (Vite)

Configure no arquivo `.env` na raiz do projeto:

```bash
# Mock de Autenticação
VITE_USE_MOCK_AUTH=true      # true = usa mock, false = usa API real

# Mock de Dados  
VITE_USE_MOCK_DATA=true      # true = usa mock, false = usa API real

# Mock de WebSocket
VITE_USE_MOCK_WEBSOCKET=true # true = usa mock, false = usa API real
```

### Backend Mocks

```bash
# Mock geral do backend (para testes e desenvolvimento)
USE_BACKEND_MOCKS=true       # true = ativa mocks, false = desativa mocks
```

## 🔧 Como Usar

### Para Desenvolvimento com Mocks (Padrão)

```bash
# No arquivo .env
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_DATA=true
VITE_USE_MOCK_WEBSOCKET=true
USE_BACKEND_MOCKS=true
```

**Características:**
- ✅ Funciona sem backend rodando
- ✅ Dados simulados em memória
- ✅ Resposta rápida
- ✅ Ideal para desenvolvimento de UI

### Para Desenvolvimento com API Real

```bash
# No arquivo .env
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_DATA=false
VITE_USE_MOCK_WEBSOCKET=false
USE_BACKEND_MOCKS=false
```

**Características:**
- ✅ Testa integração real
- ✅ Dados persistentes no MongoDB
- ✅ WebSocket real com Socket.IO
- ⚠️ Requer backend rodando

## 🎭 Indicador Visual de Status

O frontend mostra um indicador visual no canto superior direito que exibe:

- 🔴 **MOCK** - Serviço está usando dados simulados
- 🟢 **REAL** - Serviço está usando API real

### Como Interpretar

```
🎭 Mock Status
Auth: 🔴 MOCK     ← Autenticação simulada
Data: 🟢 REAL     ← Dados vêm da API real
WebSocket: 🔴 MOCK ← WebSocket simulado
```

## 📊 Logs no Console

Quando a aplicação carrega, você verá logs indicando o modo de cada serviço:

```javascript
🔐 Auth Service: Using MOCK mode
📊 Data Service: Using REAL API mode
🎭 Mock Status
│ Authentication: 🔴 MOCK
│ Data Service: 🟢 REAL API
│ WebSocket: 🔴 MOCK
│ API URL: http://localhost:3000
└─ ⚠️ Some services are running in MOCK mode. Check .env file to disable mocks.
```

## 🚀 Cenários Comuns

### 1. Desenvolvimento Offline (Tudo Mock)

```bash
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_DATA=true
VITE_USE_MOCK_WEBSOCKET=true
```

**Quando usar:** Desenvolvendo UI sem backend disponível

### 2. Teste de Integração (Tudo Real)

```bash
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_DATA=false
VITE_USE_MOCK_WEBSOCKET=false
```

**Quando usar:** Testando integração completa frontend + backend

### 3. Desenvolvimento Híbrido

```bash
VITE_USE_MOCK_AUTH=true      # Auth mock (mais rápido)
VITE_USE_MOCK_DATA=false     # Dados reais (testa persistência)
VITE_USE_MOCK_WEBSOCKET=true # WebSocket mock (menos complexo)
```

**Quando usar:** Testando funcionalidades específicas

## 🔍 Troubleshooting

### Problema: Frontend diz que está usando mock mas deveria ser real

**Solução:**
1. Verifique o arquivo `.env` na raiz do projeto
2. Certifique-se que as variáveis estão com `false`
3. Reinicie o servidor de desenvolvimento (`npm run dev`)
4. Verifique os logs no console do browser

### Problema: Erro de conexão mesmo com mocks desabilitados

**Possíveis causas:**
1. Backend não está rodando (`docker-compose up` ou `npm run dev` no backend)
2. URL da API incorreta - verifique `VITE_API_URL` no `.env`
3. Variáveis de ambiente não carregaram - reinicie o frontend

### Problema: Mocks não desabilitam nos testes

**Solução:**
1. Verifique `USE_BACKEND_MOCKS` no `.env`
2. Nos testes, use configuração específica:
   ```javascript
   process.env.USE_BACKEND_MOCKS = 'false';
   ```

## 📁 Estrutura dos Serviços

```
frontend/src/services/
├── authService.js      ← Alterna entre mock/real baseado em VITE_USE_MOCK_AUTH
├── dataService.js      ← Alterna entre mock/real baseado em VITE_USE_MOCK_DATA
├── mockAuth.js         ← Implementação mock da autenticação
└── mockDataService.js  ← Implementação mock dos dados
```

## 🛠️ Configurações Avançadas

### Logs Detalhados

Para ver logs detalhados dos serviços:

```bash
# No browser console
localStorage.setItem('debug', 'auth:*,data:*');
```

### Mock Condicional por Ambiente

```javascript
// Exemplo: sempre usar mocks em development, real em production
const USE_MOCK = import.meta.env.DEV ? true : false;
```

### Configuração per Feature

Você pode criar configurações específicas por funcionalidade editando os arquivos de serviço.

## 🔄 Aplicando Mudanças

Após alterar variáveis no `.env`:

1. **Frontend:** Reinicie com `npm run dev`
2. **Backend:** Reinicie com `npm run dev` ou `docker-compose restart`
3. **Docker:** Use `docker-compose down && docker-compose up`

As mudanças devem aparecer imediatamente no indicador visual e nos logs do console.