#!/bin/bash

# 🤖 Copilot Development Helper Script
# Facilitates GitHub CLI operations for Copilot coding agent workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository information
REPO="xLabInternet/xRatEcosystem"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "🤖 Copilot Development Helper"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  pr-status           Show status of all open PRs"
    echo "  pr-details [NUM]    Show detailed info for specific PR"
    echo "  pr-ready [NUM]      Check if PR is ready for merge"
    echo "  assign-copilot [NUM] Assign issue to Copilot coding agent"
    echo "  create-copilot-issue Create new issue and assign to Copilot"
    echo "  ci-status [NUM]     Show CI status for PR"
    echo "  merge-ready         List PRs ready for merge"
    echo "  parallel-dev        Show parallel development opportunities"
    echo "  setup-aliases       Setup GitHub CLI aliases"
    echo ""
    echo "Examples:"
    echo "  $0 pr-status"
    echo "  $0 pr-details 38"
    echo "  $0 assign-copilot 35"
    echo "  $0 ci-status 38"
}

# Function to show PR status
pr_status() {
    print_status "Fetching open PRs..."
    gh pr list --repo "$REPO" --state open --json number,title,author,isDraft,mergeable,statusCheckRollup
}

# Function to show detailed PR info
pr_details() {
    local pr_num=$1
    if [ -z "$pr_num" ]; then
        print_error "PR number required"
        return 1
    fi
    
    print_status "Fetching details for PR #$pr_num..."
    gh pr view "$pr_num" --repo "$REPO" --json number,title,body,state,isDraft,mergeable,statusCheckRollup,files,reviews
}

# Function to check if PR is ready for merge
pr_ready() {
    local pr_num=$1
    if [ -z "$pr_num" ]; then
        print_error "PR number required"
        return 1
    fi
    
    print_status "Checking if PR #$pr_num is ready for merge..."
    
    # Get PR status
    local pr_data=$(gh pr view "$pr_num" --repo "$REPO" --json isDraft,mergeable,statusCheckRollup)
    local is_draft=$(echo "$pr_data" | jq -r '.isDraft')
    local mergeable=$(echo "$pr_data" | jq -r '.mergeable')
    local checks=$(echo "$pr_data" | jq -r '.statusCheckRollup[0].state // "PENDING"')
    
    echo "📊 PR #$pr_num Status:"
    echo "  Draft: $is_draft"
    echo "  Mergeable: $mergeable"
    echo "  Checks: $checks"
    
    if [ "$is_draft" = "false" ] && [ "$mergeable" = "MERGEABLE" ] && [ "$checks" = "SUCCESS" ]; then
        print_success "PR #$pr_num is ready for merge! 🚀"
        return 0
    else
        print_warning "PR #$pr_num is not ready for merge yet"
        return 1
    fi
}

# Function to assign issue to Copilot
assign_copilot() {
    local issue_num=$1
    if [ -z "$issue_num" ]; then
        print_error "Issue number required"
        return 1
    fi
    
    print_status "Assigning issue #$issue_num to Copilot..."
    gh issue edit "$issue_num" --repo "$REPO" --add-assignee "copilot"
    print_success "Issue #$issue_num assigned to Copilot coding agent"
}

# Function to create new issue and assign to Copilot
create_copilot_issue() {
    print_status "Creating new issue for Copilot..."
    
    # Interactive issue creation
    read -p "Issue title: " title
    read -p "Issue body (optional): " body
    read -p "Labels (comma-separated, optional): " labels
    
    local cmd="gh issue create --repo $REPO --title \"$title\""
    
    if [ -n "$body" ]; then
        cmd="$cmd --body \"$body\""
    fi
    
    if [ -n "$labels" ]; then
        cmd="$cmd --label \"$labels\""
    fi
    
    cmd="$cmd --assignee copilot"
    
    eval "$cmd"
    print_success "Issue created and assigned to Copilot!"
}

# Function to show CI status
ci_status() {
    local pr_num=$1
    if [ -z "$pr_num" ]; then
        print_error "PR number required"
        return 1
    fi
    
    print_status "Fetching CI status for PR #$pr_num..."
    gh pr checks "$pr_num" --repo "$REPO"
}

# Function to list PRs ready for merge
merge_ready() {
    print_status "Checking which PRs are ready for merge..."
    
    local prs=$(gh pr list --repo "$REPO" --state open --json number)
    
    for pr_num in $(echo "$prs" | jq -r '.[].number'); do
        if pr_ready "$pr_num" &>/dev/null; then
            echo "✅ PR #$pr_num is ready for merge"
        fi
    done
}

# Function to show parallel development opportunities
parallel_dev() {
    print_status "Analyzing parallel development opportunities..."
    
    echo "📋 Current open PRs:"
    gh pr list --repo "$REPO" --state open
    
    echo ""
    echo "🔗 Related Issues Analysis:"
    gh issue list --repo "$REPO" --state open --label "copilot"
    
    echo ""
    echo "💡 Recommendations:"
    echo "  - PRs with no file conflicts can be developed in parallel"
    echo "  - Issues assigned to Copilot are ready for automated development"
    echo "  - Check file changes with: gh pr diff [PR_NUMBER]"
}

# Function to setup GitHub CLI aliases
setup_aliases() {
    print_status "Setting up GitHub CLI aliases for Copilot workflows..."
    
    # Core aliases
    gh alias set copilot-prs "pr list --state open --author copilot"
    gh alias set copilot-issues "issue list --state open --assignee copilot"
    gh alias set pr-ready "pr checks"
    gh alias set quick-merge "pr merge --squash --delete-branch"
    
    # Advanced aliases
    gh alias set pr-conflicts 'pr diff --name-only'
    gh alias set ci-logs 'run view --log-failed'
    gh alias set copilot-assign 'issue edit --add-assignee copilot'
    
    print_success "GitHub CLI aliases configured!"
    echo ""
    echo "📚 Available aliases:"
    echo "  gh copilot-prs     - List Copilot's PRs"
    echo "  gh copilot-issues  - List Copilot's issues"
    echo "  gh pr-ready        - Check PR CI status"
    echo "  gh quick-merge     - Squash merge and delete branch"
    echo "  gh pr-conflicts    - Show PR file changes"
    echo "  gh ci-logs         - View failed CI logs"
    echo "  gh copilot-assign  - Assign issue to Copilot"
}

# Main command handler
case "${1:-help}" in
    "pr-status")
        pr_status
        ;;
    "pr-details")
        pr_details "$2"
        ;;
    "pr-ready")
        pr_ready "$2"
        ;;
    "assign-copilot")
        assign_copilot "$2"
        ;;
    "create-copilot-issue")
        create_copilot_issue
        ;;
    "ci-status")
        ci_status "$2"
        ;;
    "merge-ready")
        merge_ready
        ;;
    "parallel-dev")
        parallel_dev
        ;;
    "setup-aliases")
        setup_aliases
        ;;
    "help"|*)
        show_help
        ;;
esac