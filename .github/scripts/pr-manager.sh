#!/bin/bash

# 🚀 PR Management Script for xRatEcosystem
# Manages PRs #38, #39, #40 with GitHub CLI automation

set -e

REPO="xLabInternet/xRatEcosystem"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}🤖 xRatEcosystem PR Manager${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

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

# Function to check PR status
check_pr_status() {
    local pr_num=$1
    local pr_title=$2
    
    echo ""
    echo -e "${YELLOW}📋 PR #$pr_num - $pr_title${NC}"
    echo "----------------------------------------"
    
    # Get PR basic info
    local pr_info=$(gh pr view "$pr_num" --repo "$REPO" --json isDraft,mergeable,statusCheckRollup,files,author)
    
    local is_draft=$(echo "$pr_info" | jq -r '.isDraft')
    local mergeable=$(echo "$pr_info" | jq -r '.mergeable')
    local author=$(echo "$pr_info" | jq -r '.author.login')
    local files_count=$(echo "$pr_info" | jq -r '.files | length')
    
    echo "👤 Author: $author"
    echo "📝 Draft: $is_draft"
    echo "🔀 Mergeable: $mergeable"
    echo "📁 Files changed: $files_count"
    
    # Check CI status
    local checks_output=$(gh pr checks "$pr_num" --repo "$REPO" 2>/dev/null || echo "No checks")
    if [ "$checks_output" != "No checks" ]; then
        echo "🔍 CI Checks:"
        echo "$checks_output" | head -5
    else
        echo "🔍 CI Checks: No active checks"
    fi
    
    # Show file changes if any
    if [ "$files_count" != "0" ] && [ "$files_count" != "null" ]; then
        echo "📄 Changed files:"
        echo "$pr_info" | jq -r '.files[].path' | head -5
        if [ "$files_count" -gt 5 ]; then
            echo "   ... and $((files_count - 5)) more files"
        fi
    else
        print_warning "No file changes detected (empty PR)"
    fi
}

# Function to analyze conflicts between PRs
analyze_conflicts() {
    print_status "Analyzing potential conflicts between PRs..."
    
    echo ""
    echo "🔍 Conflict Analysis:"
    
    # Get file changes for each PR
    local pr38_files=$(gh pr view 38 --repo "$REPO" --json files | jq -r '.files[].path' 2>/dev/null || echo "")
    local pr39_files=$(gh pr view 39 --repo "$REPO" --json files | jq -r '.files[].path' 2>/dev/null || echo "")
    local pr40_files=$(gh pr view 40 --repo "$REPO" --json files | jq -r '.files[].path' 2>/dev/null || echo "")
    
    # Check for overlapping files
    if [ -n "$pr38_files" ] && [ -n "$pr39_files" ]; then
        local conflicts_38_39=$(comm -12 <(echo "$pr38_files" | sort) <(echo "$pr39_files" | sort))
        if [ -n "$conflicts_38_39" ]; then
            print_warning "Conflict detected between PR #38 and #39:"
            echo "$conflicts_38_39"
        else
            print_success "No conflicts between PR #38 and #39"
        fi
    fi
    
    if [ -n "$pr38_files" ] && [ -n "$pr40_files" ]; then
        local conflicts_38_40=$(comm -12 <(echo "$pr38_files" | sort) <(echo "$pr40_files" | sort))
        if [ -n "$conflicts_38_40" ]; then
            print_warning "Conflict detected between PR #38 and #40:"
            echo "$conflicts_38_40"
        else
            print_success "No conflicts between PR #38 and #40"
        fi
    fi
    
    if [ -n "$pr39_files" ] && [ -n "$pr40_files" ]; then
        local conflicts_39_40=$(comm -12 <(echo "$pr39_files" | sort) <(echo "$pr40_files" | sort))
        if [ -n "$conflicts_39_40" ]; then
            print_warning "Conflict detected between PR #39 and #40:"
            echo "$conflicts_39_40"
        else
            print_success "No conflicts between PR #39 and #40"
        fi
    fi
}

# Function to show merge recommendations
merge_recommendations() {
    echo ""
    echo -e "${BLUE}📊 Merge Recommendations:${NC}"
    echo "----------------------------------------"
    
    # Check which PRs are ready
    local ready_prs=()
    
    for pr in 38 39 40; do
        local pr_info=$(gh pr view "$pr" --repo "$REPO" --json isDraft,mergeable,statusCheckRollup 2>/dev/null)
        local is_draft=$(echo "$pr_info" | jq -r '.isDraft // true')
        local mergeable=$(echo "$pr_info" | jq -r '.mergeable // "UNKNOWN"')
        
        if [ "$is_draft" = "false" ] && [ "$mergeable" = "MERGEABLE" ]; then
            ready_prs+=($pr)
        fi
    done
    
    if [ ${#ready_prs[@]} -gt 0 ]; then
        print_success "PRs ready for merge: ${ready_prs[*]}"
        
        echo ""
        echo "🚀 Recommended merge order:"
        echo "1. PR #40 (Monitor Smoke Test) - Low risk, independent"
        echo "2. PR #39 (Test Coverage) - Medium risk, may conflict with #38"
        echo "3. PR #38 (WebSocket) - High complexity, foundational"
    else
        print_warning "No PRs are ready for merge yet (all in draft or have issues)"
    fi
    
    echo ""
    echo "💡 Development Tips:"
    echo "• PR #40 can be merged independently anytime"
    echo "• Coordinate PR #39 and #38 to avoid test file conflicts"
    echo "• Monitor CI checks after each merge"
}

# Function to show Copilot assignment status
copilot_status() {
    echo ""
    echo -e "${BLUE}🤖 Copilot Assignment Status:${NC}"
    echo "----------------------------------------"
    
    # Check Copilot's issues
    print_status "Checking Copilot assigned issues..."
    gh issue list --repo "$REPO" --assignee "copilot" --state open
    
    echo ""
    print_status "Checking Copilot authored PRs..."
    gh pr list --repo "$REPO" --author "copilot" --state open
}

# Function to execute quick actions
quick_actions() {
    echo ""
    echo -e "${BLUE}⚡ Quick Actions:${NC}"
    echo "----------------------------------------"
    echo "1. Setup GitHub CLI aliases"
    echo "2. Assign issue to Copilot"
    echo "3. Check specific PR details"
    echo "4. Merge ready PR"
    echo "5. View CI logs"
    echo "0. Exit"
    
    read -p "Choose action (0-5): " choice
    
    case $choice in
        1)
            ./.github/scripts/copilot-helper.sh setup-aliases
            ;;
        2)
            read -p "Issue number: " issue_num
            gh issue edit "$issue_num" --repo "$REPO" --add-assignee "copilot"
            print_success "Issue #$issue_num assigned to Copilot"
            ;;
        3)
            read -p "PR number: " pr_num
            gh pr view "$pr_num" --repo "$REPO"
            ;;
        4)
            read -p "PR number to merge: " pr_num
            gh pr merge "$pr_num" --repo "$REPO" --squash --delete-branch
            ;;
        5)
            read -p "PR number for CI logs: " pr_num
            gh pr checks "$pr_num" --repo "$REPO"
            ;;
        0)
            echo "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Main execution
main() {
    print_header
    
    # Check all PRs
    check_pr_status 38 "WebSocket Implementation"
    check_pr_status 39 "Backend Test Coverage"
    check_pr_status 40 "Monitor Smoke Test"
    
    # Analyze conflicts
    analyze_conflicts
    
    # Show recommendations
    merge_recommendations
    
    # Show Copilot status
    copilot_status
    
    # Quick actions menu
    while true; do
        quick_actions
        echo ""
        read -p "Continue with quick actions? (y/n): " continue_choice
        if [ "$continue_choice" != "y" ]; then
            break
        fi
    done
    
    print_success "PR management session completed!"
}

# Run main function
main "$@"