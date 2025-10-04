# 🚀 DevOps Monitor - xRat Ecosystem

Monitor em tempo real para acompanhar Pull Requests abertos no repositório xRat Ecosystem.

## 📋 Características

- ✨ **Monitoramento em Tempo Real**: Atualização automática a cada 10 segundos
- 📊 **Estatísticas Completas**: Visualize métricas agregadas de todos os PRs
- 🎨 **Interface Colorida**: Terminal estilizado com cores e emojis
- 🔄 **Auto-refresh**: Atualização automática sem intervenção manual
- 📈 **Informações Detalhadas**: Status, commits, mudanças, reviews e mais

## 🚀 Como Usar

### Método 1: Usando npm script (Recomendado)

```bash
npm run monitor
```

ou

```bash
npm run monitor:prs
```

### Método 2: Executando diretamente

```bash
node bin/monitorDevOps.js
```

ou

```bash
./bin/monitorDevOps.js
```

## 📊 Informações Exibidas

Para cada Pull Request, o monitor exibe:

- **Número e Título**: Identificação do PR com emoji apropriado
- **Status**: Draft ou Ready para merge
- **Mergeable State**: Se pode ser merged (clean/unstable/dirty/blocked)
- **Author**: Quem criou o PR
- **Branch**: Branch de origem → branch de destino
- **Changes**: Linhas adicionadas/removidas e número de arquivos
- **Commits**: Quantidade de commits no PR
- **Comments**: Número de comentários gerais
- **Reviews**: Número de comentários de revisão
- **Timestamps**: Data de criação e última atualização
- **URL**: Link direto para o PR no GitHub

### Estatísticas Gerais

- Total de PRs abertos
- Quantidade de PRs em Draft
- Quantidade de PRs Prontos
- Total de Commits
- Total de Mudanças (linhas)

## 🎨 Emojis por Tipo de PR

O monitor identifica automaticamente o tipo de PR pelo título:

- ✨ `feat:` - Nova funcionalidade
- 🐛 `fix:` - Correção de bug
- 📚 `docs:` - Documentação
- 🧪 `test:` - Testes
- ♻️ `refactor:` - Refatoração
- ✏️ Outros tipos

## ⚙️ Configuração

### Alterar Intervalo de Atualização

Edite a variável `REFRESH_INTERVAL` no arquivo `bin/monitorDevOps.js`:

```javascript
const REFRESH_INTERVAL = 10000; // 10 segundos (em milissegundos)
```

### Alterar Repositório

Edite as constantes `OWNER` e `REPO`:

```javascript
const OWNER = 'xLabInternet';
const REPO = 'xRatEcosystem';
```

## 🛑 Como Parar

Pressione `Ctrl+C` para encerrar o monitor graciosamente.

## 📦 Dependências

O script usa apenas módulos nativos do Node.js:

- `https` - Para requisições à API do GitHub
- Nenhuma dependência externa necessária!

## 🔧 Requisitos

- Node.js >= 20.0.0
- Conexão com internet para acessar a API do GitHub

## 🌐 API do GitHub

O monitor usa a API REST do GitHub v3:

- **Endpoint**: `https://api.github.com/repos/{owner}/{repo}/pulls`
- **Rate Limit**: 60 requisições/hora sem autenticação
- **Autenticação**: Não requerida para repositórios públicos

### Aumentar Rate Limit (Opcional)

Para aumentar o rate limit para 5000 requisições/hora, adicione autenticação:

1. Crie um Personal Access Token no GitHub
2. Adicione ao header da requisição:

```javascript
headers: {
  'Authorization': `token YOUR_GITHUB_TOKEN`,
  // ... outros headers
}
```

## 📝 Exemplo de Output

```
╔═══════════════════════════════════════════════════════════════╗
║  🚀 xRat Ecosystem - DevOps Monitor                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Atualizado em: 04/10/2025, 08:15:30                        ║
╚═══════════════════════════════════════════════════════════════╝

🔥 4 Pull Request(s) Aberto(s)

┌─ PR #26 (1/4)
│
│ ✨  feat: implement structured logging with Winston
│
│ Status:      🚧 DRAFT
│ Mergeable:   ⚠ Unstable
│ Author:      🤖 Copilot
│ Branch:      copilot/fix-500562f1-93a7-4448-90cf-c4c596669869 → main
│ Changes:     +0 -0 (0 files)
│ Commits:     1
│ Comments:    0 💬
│ Reviews:     0 👀
│
│ Created:     04/10/2025, 08:06:39
│ Updated:     04/10/2025, 08:09:10
│
│ URL:         https://github.com/xLabInternet/xRatEcosystem/pull/26
└───────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════════╗
║  📊 Estatísticas                                             ║
╠═══════════════════════════════════════════════════════════════╣
║  Total de PRs:        4                                      ║
║  PRs em Draft:        4                                      ║
║  PRs Prontos:         0                                      ║
║  Total de Commits:    4                                      ║
║  Total de Mudanças:   0 linhas                              ║
╚═══════════════════════════════════════════════════════════════╝

⏰ Atualizando a cada 10s... (Ctrl+C para sair)
```

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Abra uma issue ou PR no repositório.

## 📄 Licença

MIT - Veja LICENSE para mais detalhes.
