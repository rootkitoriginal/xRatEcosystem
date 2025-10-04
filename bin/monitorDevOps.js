#!/usr/bin/env node

/**
 * 🚀 xRat Ecosystem - DevOps Monitor
 * 
 * Script de monitoramento em tempo real dos Pull Requests abertos
 * 
 * Uso:
 *   node bin/monitorDevOps.js
 *   npm run monitor
 */

const https = require('https');

// Configurações
const OWNER = 'xLabInternet';
const REPO = 'xRatEcosystem';
const REFRESH_INTERVAL = 10000; // 10 segundos
const API_BASE = 'api.github.com';

// Cores ANSI para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Cores de texto
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Cores de fundo
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Emojis para status
const emoji = {
  rocket: '🚀',
  check: '✅',
  warning: '⚠️',
  error: '❌',
  clock: '⏰',
  fire: '🔥',
  construction: '🚧',
  pencil: '✏️',
  robot: '🤖',
  chart: '📊',
  bug: '🐛',
  feature: '✨',
  docs: '📚',
  test: '🧪',
  refactor: '♻️',
};

/**
 * Faz requisição HTTP para a API do GitHub
 */
function fetchGitHub(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'xRat-DevOps-Monitor',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Busca todos os PRs abertos
 */
async function fetchOpenPRs() {
  try {
    const prs = await fetchGitHub(`/repos/${OWNER}/${REPO}/pulls?state=open`);
    return prs;
  } catch (error) {
    console.error(`${emoji.error} Erro ao buscar PRs:`, error.message);
    return [];
  }
}

/**
 * Busca status dos checks de um PR
 */
async function fetchPRStatus(prNumber, sha) {
  try {
    const checks = await fetchGitHub(
      `/repos/${OWNER}/${REPO}/commits/${sha}/check-runs`
    );
    return checks;
  } catch (error) {
    return null;
  }
}

/**
 * Determina o emoji baseado no título do PR
 */
function getEmojiForTitle(title) {
  const lower = title.toLowerCase();
  if (lower.includes('feat')) return emoji.feature;
  if (lower.includes('fix')) return emoji.bug;
  if (lower.includes('docs')) return emoji.docs;
  if (lower.includes('test')) return emoji.test;
  if (lower.includes('refactor')) return emoji.refactor;
  return emoji.pencil;
}

/**
 * Formata o status de merge
 */
function formatMergeableState(state) {
  switch (state) {
    case 'clean':
      return `${colors.green}✓ Clean${colors.reset}`;
    case 'unstable':
      return `${colors.yellow}⚠ Unstable${colors.reset}`;
    case 'dirty':
      return `${colors.red}✗ Conflicts${colors.reset}`;
    case 'blocked':
      return `${colors.red}🚫 Blocked${colors.reset}`;
    default:
      return `${colors.dim}? Unknown${colors.reset}`;
  }
}

/**
 * Formata o status do PR (draft/ready)
 */
function formatDraftStatus(isDraft) {
  if (isDraft) {
    return `${colors.yellow}${emoji.construction} DRAFT${colors.reset}`;
  }
  return `${colors.green}${emoji.check} READY${colors.reset}`;
}

/**
 * Limpa o terminal
 */
function clearScreen() {
  console.clear();
  process.stdout.write('\x1b[3J'); // Limpa também o scrollback
}

/**
 * Renderiza o header
 */
function renderHeader() {
  const now = new Date().toLocaleString('pt-BR');
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  ${emoji.rocket} ${colors.bright}xRat Ecosystem - DevOps Monitor${colors.reset}                    ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╠═══════════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  ${colors.dim}Atualizado em: ${now}${colors.reset}                ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

/**
 * Renderiza informações de um PR
 */
function renderPR(pr, index, total) {
  const prEmoji = getEmojiForTitle(pr.title);
  const statusColor = pr.draft ? colors.yellow : colors.green;
  
  console.log(`${colors.bright}${colors.blue}┌─ PR #${pr.number}${colors.reset} ${colors.dim}(${index + 1}/${total})${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${prEmoji}  ${colors.bright}${pr.title}${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Status:${colors.reset}      ${formatDraftStatus(pr.draft)}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Mergeable:${colors.reset}   ${formatMergeableState(pr.mergeable_state)}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Author:${colors.reset}      ${emoji.robot} ${pr.user.login}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Branch:${colors.reset}      ${colors.cyan}${pr.head.ref}${colors.reset} → ${colors.green}${pr.base.ref}${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Changes:${colors.reset}     ${colors.green}+${pr.additions || 0}${colors.reset} ${colors.red}-${pr.deletions || 0}${colors.reset} ${colors.dim}(${pr.changed_files || 0} files)${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Commits:${colors.reset}     ${pr.commits || 0}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Comments:${colors.reset}    ${pr.comments || 0} 💬`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Reviews:${colors.reset}     ${pr.review_comments || 0} 👀`);
  console.log(`${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Created:${colors.reset}     ${new Date(pr.created_at).toLocaleString('pt-BR')}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}Updated:${colors.reset}     ${new Date(pr.updated_at).toLocaleString('pt-BR')}`);
  console.log(`${colors.blue}│${colors.reset}`);
  console.log(`${colors.blue}│${colors.reset} ${colors.dim}URL:${colors.reset}         ${colors.cyan}${pr.html_url}${colors.reset}`);
  console.log(`${colors.blue}└${'─'.repeat(63)}${colors.reset}`);
  console.log();
}

/**
 * Renderiza estatísticas gerais
 */
function renderStats(prs) {
  const draftCount = prs.filter(pr => pr.draft).length;
  const readyCount = prs.filter(pr => !pr.draft).length;
  const totalChanges = prs.reduce((sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0), 0);
  const totalCommits = prs.reduce((sum, pr) => sum + (pr.commits || 0), 0);

  console.log(`${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${emoji.chart} ${colors.bright}Estatísticas${colors.reset}                                          ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}╠═══════════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${colors.dim}Total de PRs:${colors.reset}        ${colors.bright}${prs.length}${colors.reset}                                    ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${colors.dim}PRs em Draft:${colors.reset}        ${colors.yellow}${draftCount}${colors.reset}                                    ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${colors.dim}PRs Prontos:${colors.reset}         ${colors.green}${readyCount}${colors.reset}                                    ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${colors.dim}Total de Commits:${colors.reset}    ${colors.bright}${totalCommits}${colors.reset}                                   ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}║${colors.reset}  ${colors.dim}Total de Mudanças:${colors.reset}   ${colors.bright}${totalChanges}${colors.reset} linhas                           ${colors.magenta}║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

/**
 * Renderiza footer com instruções
 */
function renderFooter() {
  console.log(`${colors.dim}${emoji.clock} Atualizando a cada ${REFRESH_INTERVAL / 1000}s... (Ctrl+C para sair)${colors.reset}`);
}

/**
 * Função principal de monitoramento
 */
async function monitor() {
  clearScreen();
  renderHeader();

  console.log(`${emoji.fire} Buscando Pull Requests abertos...\n`);

  const prs = await fetchOpenPRs();

  clearScreen();
  renderHeader();

  if (prs.length === 0) {
    console.log(`${colors.yellow}${emoji.warning} Nenhum Pull Request aberto no momento.${colors.reset}\n`);
  } else {
    console.log(`${colors.bright}${emoji.fire} ${prs.length} Pull Request(s) Aberto(s)${colors.reset}\n`);
    
    prs.forEach((pr, index) => {
      renderPR(pr, index, prs.length);
    });

    renderStats(prs);
  }

  renderFooter();
}

/**
 * Inicia o monitoramento com refresh automático
 */
async function start() {
  console.log(`${colors.bright}${colors.cyan}${emoji.rocket} Iniciando DevOps Monitor...${colors.reset}\n`);
  
  // Primeira execução
  await monitor();

  // Refresh periódico
  setInterval(monitor, REFRESH_INTERVAL);

  // Captura Ctrl+C para sair graciosamente
  process.on('SIGINT', () => {
    console.log(`\n\n${colors.green}${emoji.check} Monitor encerrado. Até logo!${colors.reset}\n`);
    process.exit(0);
  });
}

// Verifica se está sendo executado diretamente
if (require.main === module) {
  start().catch((error) => {
    console.error(`${colors.red}${emoji.error} Erro fatal:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { monitor, fetchOpenPRs };
