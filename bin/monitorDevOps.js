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

// Estado anterior dos PRs para detectar mudanças
let previousPRsState = new Map();

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
 * Calcula quanto tempo se passou desde um timestamp ISO 8601
 * e retorna uma string formatada de forma humanizada (pt-BR).
 * 
 * Função criada com ajuda do Gemini AI 🤖
 *
 * @param {string} isoTimestamp - Timestamp ISO 8601 (ex: "2025-10-04T05:06:39Z")
 * @returns {string} String formatada de forma humanizada (ex: "2 horas atrás")
 */
function getTimeAgo(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "agora mesmo"; // Para tempos muito recentes
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minuto atrás" : `${diffInMinutes} minutos atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hora atrás" : `${diffInHours} horas atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1 dia atrás" : `${diffInDays} dias atrás`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) { // Aproximadamente um mês
    return diffInWeeks === 1 ? "1 semana atrás" : `${diffInWeeks} semanas atrás`;
  }

  const diffInMonths = Math.floor(diffInDays / 30); // Aproximação
  return diffInMonths === 1 ? "1 mês atrás" : `${diffInMonths} meses atrás`;
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
 * Renderiza tabela compacta de PRs
 */
function renderTable(prs) {
  console.log(`${colors.bright}${colors.blue}╔════╦═══════════════════════════════════╦═══════════╦═════════╦═════════╦═══════════════╗${colors.reset}`);
  console.log(`${colors.blue}║${colors.reset} ${colors.bright}#${colors.reset}  ${colors.blue}║${colors.reset} ${colors.bright}Título${colors.reset}                                ${colors.blue}║${colors.reset} ${colors.bright}Status${colors.reset}    ${colors.blue}║${colors.reset} ${colors.bright}Commits${colors.reset} ${colors.blue}║${colors.reset} ${colors.bright}Changes${colors.reset} ${colors.blue}║${colors.reset} ${colors.bright}Tempo Aberto${colors.reset}  ${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}╠════╬═══════════════════════════════════╬═══════════╬═════════╬═════════╬═══════════════╣${colors.reset}`);
  
  prs.forEach((pr, index) => {
    const prEmoji = getEmojiForTitle(pr.title);
    const shortTitle = pr.title.length > 35 
      ? pr.title.substring(0, 32) + '...' 
      : pr.title.padEnd(35);
    
    const status = pr.draft 
      ? `${colors.yellow}🚧 Draft${colors.reset}  `
      : `${colors.green}✅ Ready${colors.reset}  `;
    
    const commits = String(pr.commits || 0).padStart(4);
    const changes = `${colors.green}+${pr.additions || 0}${colors.reset}/${colors.red}-${pr.deletions || 0}${colors.reset}`.padEnd(15);
    
    // Calcular tempo decorrido usando a função do Gemini 🤖
    const timeAgo = getTimeAgo(pr.created_at).padEnd(13);
    
    console.log(`${colors.blue}║${colors.reset} ${colors.cyan}#${pr.number.toString().padEnd(2)}${colors.reset} ${colors.blue}║${colors.reset} ${prEmoji} ${shortTitle} ${colors.blue}║${colors.reset} ${status} ${colors.blue}║${colors.reset}   ${commits} ${colors.blue}║${colors.reset} ${changes} ${colors.blue}║${colors.reset} ${colors.dim}${timeAgo}${colors.reset} ${colors.blue}║${colors.reset}`);
  });
  
  console.log(`${colors.blue}╚════╩═══════════════════════════════════╩═══════════╩═════════╩═════════╩═══════════════╝${colors.reset}`);
  console.log();
}

/**
 * Detecta mudanças nos PRs
 */
function detectChanges(currentPRs) {
  const changes = [];
  
  currentPRs.forEach(pr => {
    const previous = previousPRsState.get(pr.number);
    
    if (!previous) {
      // Novo PR
      changes.push({
        type: 'new',
        pr: pr,
        message: `Novo PR criado: #${pr.number} - ${pr.title}`
      });
    } else {
      // Verificar mudanças de status
      if (previous.draft && !pr.draft) {
        changes.push({
          type: 'ready',
          pr: pr,
          message: `PR #${pr.number} mudou para READY! 🎉`
        });
      }
      
      // Verificar novos commits
      if ((pr.commits || 0) > (previous.commits || 0)) {
        const newCommits = (pr.commits || 0) - (previous.commits || 0);
        changes.push({
          type: 'commits',
          pr: pr,
          message: `PR #${pr.number} recebeu ${newCommits} novo(s) commit(s)`
        });
      }
      
      // Verificar mudanças no código
      const prevChanges = (previous.additions || 0) + (previous.deletions || 0);
      const currChanges = (pr.additions || 0) + (pr.deletions || 0);
      if (currChanges > prevChanges && currChanges > 0) {
        changes.push({
          type: 'code',
          pr: pr,
          message: `PR #${pr.number} teve mudanças no código (+${pr.additions}/-${pr.deletions})`
        });
      }
      
      // Verificar merge state
      if (previous.mergeable_state !== pr.mergeable_state && pr.mergeable_state === 'clean') {
        changes.push({
          type: 'mergeable',
          pr: pr,
          message: `PR #${pr.number} está pronto para merge! ✅`
        });
      }
    }
  });
  
  return changes;
}

/**
 * Exibe instruções quando houver mudanças importantes
 */
function showInstructions(changes) {
  const importantChanges = changes.filter(c => c.type === 'ready' || c.type === 'mergeable');
  
  if (importantChanges.length === 0) return false;
  
  console.log(`\n${colors.bright}${colors.bgGreen}${colors.white} 🎉 MUDANÇAS DETECTADAS! ${colors.reset}\n`);
  
  importantChanges.forEach(change => {
    const pr = change.pr;
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${emoji.check} ${change.message}${colors.reset}\n`);
    console.log(`${colors.cyan}Título:${colors.reset} ${pr.title}`);
    console.log(`${colors.cyan}URL:${colors.reset}    ${pr.html_url}\n`);
    
    if (change.type === 'ready') {
      console.log(`${colors.bright}${colors.yellow}📋 PRÓXIMOS PASSOS:${colors.reset}`);
      console.log(`  ${colors.green}1.${colors.reset} Revisar o código do PR:`);
      console.log(`     ${colors.dim}gh pr view ${pr.number}${colors.reset}`);
      console.log();
      console.log(`  ${colors.green}2.${colors.reset} Fazer checkout do branch:`);
      console.log(`     ${colors.dim}gh pr checkout ${pr.number}${colors.reset}`);
      console.log();
      console.log(`  ${colors.green}3.${colors.reset} Rodar os testes localmente:`);
      console.log(`     ${colors.dim}npm test${colors.reset}`);
      console.log();
      console.log(`  ${colors.green}4.${colors.reset} Se tudo estiver OK, aprovar e fazer merge:`);
      console.log(`     ${colors.dim}gh pr review ${pr.number} --approve${colors.reset}`);
      console.log(`     ${colors.dim}gh pr merge ${pr.number} --squash --delete-branch${colors.reset}`);
      console.log();
    }
    
    if (change.type === 'mergeable') {
      console.log(`${colors.bright}${colors.yellow}📋 AÇÃO RECOMENDADA:${colors.reset}`);
      console.log(`  ${colors.green}→${colors.reset} Este PR está pronto para merge!`);
      console.log();
      console.log(`  ${colors.dim}Comando rápido:${colors.reset}`);
      console.log(`     ${colors.dim}gh pr merge ${pr.number} --squash --delete-branch${colors.reset}`);
      console.log();
    }
  });
  
  console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  return true; // Indica que deve parar o monitor
}

/**
 * Atualiza o estado anterior dos PRs
 */
function updatePRsState(prs) {
  previousPRsState.clear();
  prs.forEach(pr => {
    previousPRsState.set(pr.number, {
      draft: pr.draft,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      mergeable_state: pr.mergeable_state,
    });
  });
}

/**
 * Função principal de monitoramento
 */
async function monitor() {
  clearScreen();
  renderHeader();

  console.log(`${emoji.fire} Buscando Pull Requests abertos...\n`);

  const prs = await fetchOpenPRs();

  // Detectar mudanças
  const changes = detectChanges(prs);
  
  clearScreen();
  renderHeader();

  if (prs.length === 0) {
    console.log(`${colors.yellow}${emoji.warning} Nenhum Pull Request aberto no momento.${colors.reset}\n`);
  } else {
    console.log(`${colors.bright}${emoji.fire} ${prs.length} Pull Request(s) Aberto(s)${colors.reset}\n`);
    
    // Renderizar tabela compacta
    renderTable(prs);
    
    // Renderizar estatísticas
    renderStats(prs);
    
    // Exibir mudanças se houver
    if (changes.length > 0) {
      console.log(`${colors.bright}${colors.yellow}📢 Mudanças detectadas:${colors.reset}`);
      changes.forEach(change => {
        const icon = change.type === 'ready' ? '🎉' : 
                    change.type === 'commits' ? '📝' :
                    change.type === 'code' ? '💻' :
                    change.type === 'mergeable' ? '✅' : '🆕';
        console.log(`  ${icon} ${colors.dim}${change.message}${colors.reset}`);
      });
      console.log();
      
      // Se houver mudanças importantes, mostrar instruções e parar
      const shouldStop = showInstructions(changes);
      if (shouldStop) {
        console.log(`${colors.bright}${colors.cyan}Monitor pausado devido a mudanças importantes.${colors.reset}`);
        console.log(`${colors.dim}Execute ${colors.bright}npm run monitor${colors.reset}${colors.dim} novamente para continuar.${colors.reset}\n`);
        process.exit(0);
      }
    }
    
    // Atualizar estado para próxima iteração
    updatePRsState(prs);
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
