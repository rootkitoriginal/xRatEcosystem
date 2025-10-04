#!/bin/bash

# 🚀 Current PRs Status and Copilot Management
# For PRs #38, #39, #40 in xRatEcosystem

REPO="xLabInternet/xRatEcosystem"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEMO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[IMPORTANT]${NC} $1"
}

echo -e "${BLUE}🤖 Demonstração: Como usar Copilot com GitHub CLI${NC}"
echo "================================================="
echo ""

print_status "Verificando status dos PRs atuais..."

# Check our specific PRs
for pr_num in 38 39 40; do
    echo ""
    echo -e "${YELLOW}📋 PR #$pr_num Status:${NC}"
    
    pr_info=$(gh pr view "$pr_num" --repo "$REPO" --json title,isDraft,author,url,body 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        title=$(echo "$pr_info" | jq -r '.title')
        is_draft=$(echo "$pr_info" | jq -r '.isDraft')
        author=$(echo "$pr_info" | jq -r '.author.login')
        url=$(echo "$pr_info" | jq -r '.url')
        
        echo "  📝 Título: $title"
        echo "  👤 Autor: $author"
        echo "  🚧 Draft: $is_draft"
        echo "  🔗 URL: $url"
        
        # Check for Copilot mentions in comments
        comments=$(gh pr view "$pr_num" --repo "$REPO" --comments 2>/dev/null | grep -i copilot || echo "")
        if [ -n "$comments" ]; then
            echo "  🤖 Copilot já mencionado: Sim"
        else
            echo "  🤖 Copilot já mencionado: Não"
        fi
    else
        echo "  ❌ PR não encontrado ou erro de acesso"
    fi
done

echo ""
echo -e "${YELLOW}💡 Como invocar Copilot nos PRs:${NC}"
echo "----------------------------------------"
echo ""

echo "Para PR #38 (WebSocket Implementation):"
echo "gh pr comment 38 --repo $REPO --body '@copilot Please help implement WebSocket functionality. Focus on socket.io integration with JWT authentication and room-based messaging.'"
echo ""

echo "Para PR #39 (Backend Test Coverage):"
echo "gh pr comment 39 --repo $REPO --body '@copilot Please increase backend test coverage to 80%. Focus on models/Data.js, models/User.js, and middleware/rateLimiter.js.'"
echo ""

echo "Para PR #40 (Monitor Smoke Test):"
echo "gh pr comment 40 --repo $REPO --body '@copilot Please create smoke test for bin/monitorDevOps.js and CI job. Use dry-run mode to avoid calling real APIs.'"
echo ""

print_warning "IMPORTANTE: Copilot só responde quando mencionado (@copilot) em comentários de PR ou issue!"

echo ""
echo -e "${BLUE}🔧 Comandos úteis para gerenciar os PRs:${NC}"
echo "----------------------------------------"
echo ""

echo "• Verificar status de CI:"
for pr in 38 39 40; do
    echo "  gh pr checks $pr --repo $REPO"
done

echo ""
echo "• Ver detalhes completos:"
for pr in 38 39 40; do
    echo "  gh pr view $pr --repo $REPO"
done

echo ""
echo "• Acompanhar comentários:"
for pr in 38 39 40; do
    echo "  gh pr view $pr --repo $REPO --comments"
done

echo ""
print_success "Scripts de automação criados em .github/scripts/"
echo "• copilot-workflow.sh - Interface interativa para Copilot"
echo "• copilot-helper.sh - Utilitários gerais"
echo "• pr-manager.sh - Gerenciamento de PRs"

echo ""
print_warning "Próximos passos recomendados:"
echo "1. Execute: ./.github/scripts/copilot-workflow.sh"
echo "2. Escolha um PR para trabalhar"
echo "3. Invoque Copilot com mensagem específica"
echo "4. Monitore as respostas do Copilot nos comentários do PR"