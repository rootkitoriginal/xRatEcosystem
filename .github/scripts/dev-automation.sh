#!/bin/bash

# 🚀 Development Automation Script for xRatEcosystem
# Common development tasks using GitHub CLI

set -e

REPO="xLabInternet/xRatEcosystem"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}🚀 xRatEcosystem Development Automation${NC}"
    echo -e "${PURPLE}=====================================	===${NC}"
}

print_status() {
    echo -e "${BLUE}[AUTO]${NC} $1"
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

# Automated CI status check for all open PRs
check_all_ci() {
    print_status "Checking CI status for all open PRs..."
    
    local prs=$(gh pr list --repo "$REPO" --state open --json number,title)
    
    if [ "$(echo "$prs" | jq length)" -eq 0 ]; then
        print_warning "No open PRs found"
        return
    fi
    
    echo "$prs" | jq -r '.[] | .number' | while read pr_num; do
        echo ""
        echo -e "${YELLOW}🔍 PR #$pr_num CI Status:${NC}"
        gh pr checks "$pr_num" --repo "$REPO" || print_warning "No CI checks found for PR #$pr_num"
    done
}

# Auto-merge ready PRs (with confirmation)
auto_merge_ready() {
    print_status "Checking for PRs ready to merge..."
    
    local ready_prs=()
    local prs=$(gh pr list --repo "$REPO" --state open --json number,title,mergeable,isDraft)
    
    echo "$prs" | jq -r '.[] | select(.isDraft == false and .mergeable == "MERGEABLE") | .number' | while read pr_num; do
        if [ -n "$pr_num" ]; then
            # Double-check CI status
            local ci_status=$(gh pr checks "$pr_num" --repo "$REPO" --json state 2>/dev/null | jq -r '.[] | select(.state == "SUCCESS") | .state' | head -1)
            
            if [ "$ci_status" = "SUCCESS" ]; then
                echo -e "${GREEN}✅ PR #$pr_num is ready for merge${NC}"
                
                read -p "Merge PR #$pr_num? (y/n): " confirm
                if [ "$confirm" = "y" ]; then
                    gh pr merge "$pr_num" --repo "$REPO" --squash --delete-branch
                    print_success "PR #$pr_num merged successfully!"
                fi
            fi
        fi
    done
}

# Create branch for new feature
create_feature_branch() {
    read -p "Feature name (e.g., user-authentication): " feature_name
    
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        return 1
    fi
    
    local branch_name="feature/$feature_name"
    
    print_status "Creating feature branch: $branch_name"
    
    git checkout main
    git pull origin main
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    
    print_success "Feature branch '$branch_name' created and pushed"
    
    # Ask if user wants to create a PR
    read -p "Create draft PR for this feature? (y/n): " create_pr
    if [ "$create_pr" = "y" ]; then
        read -p "PR title: " pr_title
        read -p "PR description: " pr_description
        
        gh pr create --repo "$REPO" --title "$pr_title" --body "$pr_description" --draft --base main --head "$branch_name"
        print_success "Draft PR created for feature branch"
    fi
}

# Monitor development progress
monitor_progress() {
    print_status "Development Progress Dashboard"
    echo ""
    
    # Open issues
    echo -e "${YELLOW}📋 Open Issues:${NC}"
    gh issue list --repo "$REPO" --state open --limit 10
    
    echo ""
    
    # Open PRs
    echo -e "${YELLOW}📋 Open PRs:${NC}"
    gh pr list --repo "$REPO" --state open
    
    echo ""
    
    # Recent activity
    echo -e "${YELLOW}📋 Recent Commits:${NC}"
    gh repo view "$REPO" --json pushedAt,defaultBranchRef | jq -r '"Last push: " + .pushedAt + " to " + .defaultBranchRef.name'
    
    # Check workflow runs
    echo ""
    echo -e "${YELLOW}🔄 Recent Workflow Runs:${NC}"
    gh run list --repo "$REPO" --limit 5
}

# Bulk operations on PRs
bulk_pr_operations() {
    echo ""
    echo -e "${BLUE}📦 Bulk PR Operations${NC}"
    echo "----------------------------------------"
    echo "1. Check CI status for all PRs"
    echo "2. Request reviews for all draft PRs"
    echo "3. Close stale PRs (interactive)"
    echo "4. Update all PR branches"
    echo "0. Back to main menu"
    
    read -p "Choose operation (0-4): " choice
    
    case $choice in
        1)
            check_all_ci
            ;;
        2)
            print_status "Requesting reviews for draft PRs..."
            gh pr list --repo "$REPO" --state open --json number,isDraft | jq -r '.[] | select(.isDraft == true) | .number' | while read pr_num; do
                read -p "Mark PR #$pr_num as ready for review? (y/n): " ready
                if [ "$ready" = "y" ]; then
                    gh pr ready "$pr_num" --repo "$REPO"
                    print_success "PR #$pr_num marked as ready for review"
                fi
            done
            ;;
        3)
            print_status "Finding potentially stale PRs..."
            gh pr list --repo "$REPO" --state open --json number,title,updatedAt | jq -r '.[] | select(.updatedAt < (now - 604800)) | "PR #" + (.number | tostring) + ": " + .title + " (Updated: " + .updatedAt + ")"'
            ;;
        4)
            print_status "Updating PR branches..."
            gh pr list --repo "$REPO" --state open --json number | jq -r '.[].number' | while read pr_num; do
                print_status "Updating PR #$pr_num..."
                gh pr comment "$pr_num" --repo "$REPO" --body "🔄 Updating branch with latest main changes"
                # Note: Actual branch update would require more complex git operations
            done
            ;;
        0)
            return
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Development workflow shortcuts
dev_shortcuts() {
    echo ""
    echo -e "${BLUE}⚡ Development Shortcuts${NC}"
    echo "----------------------------------------"
    echo "1. Quick status check (issues + PRs + CI)"
    echo "2. Create new feature branch and PR"
    echo "3. Invoke Copilot in specific PR"
    echo "4. Check merge conflicts"
    echo "5. View project metrics"
    echo "0. Back to main menu"
    
    read -p "Choose shortcut (0-5): " choice
    
    case $choice in
        1)
            monitor_progress
            check_all_ci
            ;;
        2)
            create_feature_branch
            ;;
        3)
            read -p "PR number: " pr_num
            read -p "Message for Copilot: " message
            gh pr comment "$pr_num" --repo "$REPO" --body "@copilot $message"
            print_success "Copilot invoked in PR #$pr_num"
            ;;
        4)
            gh pr list --repo "$REPO" --state open --json number | jq -r '.[].number' | while read pr_num; do
                echo -e "${YELLOW}PR #$pr_num conflicts:${NC}"
                gh pr diff "$pr_num" --repo "$REPO" --name-only | head -5
            done
            ;;
        5)
            echo -e "${YELLOW}📊 Project Metrics:${NC}"
            echo "Repository: $(gh repo view "$REPO" --json nameWithOwner | jq -r '.nameWithOwner')"
            echo "Stars: $(gh repo view "$REPO" --json stargazerCount | jq -r '.stargazerCount')"
            echo "Issues: $(gh issue list --repo "$REPO" --state open | wc -l) open"
            echo "PRs: $(gh pr list --repo "$REPO" --state open | wc -l) open"
            ;;
        0)
            return
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Main menu
main_menu() {
    while true; do
        echo ""
        echo -e "${BLUE}🛠️ What would you like to do?${NC}"
        echo "----------------------------------------"
        echo "1. Monitor development progress"
        echo "2. Check CI status for all PRs"
        echo "3. Auto-merge ready PRs"
        echo "4. Create new feature branch"
        echo "5. Bulk PR operations"
        echo "6. Development shortcuts"
        echo "7. Launch Copilot workflow manager"
        echo "0. Exit"
        echo ""
        
        read -p "Choose option (0-7): " choice
        
        case $choice in
            1)
                monitor_progress
                ;;
            2)
                check_all_ci
                ;;
            3)
                auto_merge_ready
                ;;
            4)
                create_feature_branch
                ;;
            5)
                bulk_pr_operations
                ;;
            6)
                dev_shortcuts
                ;;
            7)
                ./.github/scripts/copilot-workflow.sh
                ;;
            0)
                print_success "Happy coding! 🚀"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Main execution
main() {
    print_header
    
    print_status "Welcome to xRatEcosystem Development Automation!"
    print_status "This tool helps streamline your development workflow with GitHub CLI."
    
    main_menu
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi