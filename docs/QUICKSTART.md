# 🐀 xRat Ecosystem - Quick Start

## 🚀 Início Rápido

```bash
# Iniciar o ecosystem
./xrat.sh start

# Ver logs em tempo real
./xrat.sh logs

# Ver status dos serviços
./xrat.sh status
```

> ⚠️ **IMPORTANTE**: Sempre use `./xrat.sh` ao invés de comandos Docker diretos. O script garante configuração correta e logs organizados.

## 📍 URLs de Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Status API**: http://localhost:3000/api/status

## 🛠️ Comandos Principais

```bash
./xrat.sh start          # Iniciar
./xrat.sh stop           # Parar
./xrat.sh restart        # Reiniciar
./xrat.sh logs           # Ver logs
./xrat.sh status         # Ver status
./xrat.sh clean          # Limpar tudo (remove dados)
./xrat.sh rebuild        # Reconstruir
```

## 🔒 Segurança

- MongoDB e Redis são **internos** (não expostos)
- Apenas backend (3000) e frontend (5173) são acessíveis
- Rede isolada: `xrat-network`

## 📦 Serviços Incluídos

✅ Backend (Node.js + Express)
✅ Frontend (React + Vite)
✅ MongoDB 7 (database)
✅ Redis 7 (cache)

## 📖 Documentação Completa

Veja `README.md` para documentação detalhada.

---

**Criado com ❤️ para o xRat Ecosystem**
