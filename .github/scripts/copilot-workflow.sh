#!/bin/bash

# 🤖 Copilot Workflow Manager for xRatEcosystem
# Properly handles Copilot invocation within PRs and issues

set -e

REPO="xLabInternet/xRatEcosystem"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}🤖 Copilot Workflow Manager${NC}"
    echo -e "${PURPLE}============================================${NC}"
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

# Show current PRs and their status
show_pr_status() {
    print_status "Checking current PRs status..."
    echo ""
    
    # List all open PRs
    local prs=$(gh pr list --repo "$REPO" --state open --json number,title,author,isDraft,url)
    
    if [ "$(echo "$prs" | jq length)" -eq 0 ]; then
        print_warning "No open PRs found"
        return
    fi
    
    echo "$prs" | jq -r '.[] | "PR #\(.number): \(.title)\n  Author: \(.author.login)\n  Draft: \(.isDraft)\n  URL: \(.url)\n"'
}

# Invoke Copilot in a specific PR
invoke_copilot_in_pr() {
    local pr_num=$1
    local message=$2
    
    if [ -z "$pr_num" ]; then
        print_error "PR number required"
        return 1
    fi
    
    if [ -z "$message" ]; then
        read -p "Enter message for Copilot: " message
    fi
    
    print_status "Invoking Copilot in PR #$pr_num..."
    
    # Add comment mentioning Copilot
    gh pr comment "$pr_num" --repo "$REPO" --body "@copilot $message"
    
    print_success "Copilot invoked in PR #$pr_num with message: '$message'"
    print_status "Copilot will respond in the PR comments shortly"
}

# Create new issue and invoke Copilot
create_issue_with_copilot() {
    print_status "Creating new issue and invoking Copilot..."
    
    read -p "Issue title: " title
    read -p "Issue description: " description
    read -p "Labels (comma-separated, optional): " labels
    read -p "Message for Copilot: " copilot_message
    
    # Create issue
    local cmd="gh issue create --repo $REPO --title '$title' --body '$description'"
    
    if [ -n "$labels" ]; then
        cmd="$cmd --label '$labels'"
    fi
    
    local issue_url=$(eval "$cmd")
    local issue_num=$(echo "$issue_url" | grep -o '[0-9]*$')
    
    print_success "Issue #$issue_num created: $issue_url"
    
    # Add Copilot comment
    if [ -n "$copilot_message" ]; then
        gh issue comment "$issue_num" --repo "$REPO" --body "@copilot $copilot_message"
        print_success "Copilot invoked in issue #$issue_num"
    fi
}

# Show available Copilot commands and best practices
show_copilot_help() {
    echo ""
    echo -e "${PURPLE}🤖 Copilot Usage Guide${NC}"
    echo "----------------------------------------"
    echo ""
    echo -e "${YELLOW}How to use Copilot:${NC}"
    echo "1. Copilot only responds when mentioned in PR/issue comments"
    echo "2. Use @copilot followed by your request"
    echo "3. Copilot can help with code reviews, suggestions, and implementation"
    echo ""
    echo -e "${YELLOW}Common Copilot commands:${NC}"
    echo "• @copilot review this PR"
    echo "• @copilot implement the changes described in this issue"
    echo "• @copilot help me fix the failing tests"
    echo "• @copilot suggest improvements for this code"
    echo "• @copilot create a plan for implementing [feature]"
    echo ""
    echo -e "${YELLOW}Best practices:${NC}"
    echo "• Be specific in your requests"
    echo "• Provide context about what you're trying to achieve"
    echo "• Mention specific files or functions when relevant"
    echo "• Use Copilot for code reviews and implementation suggestions"
    echo ""
    echo -e "${YELLOW}Current PR Status for Copilot:${NC}"
    show_pr_status
}

# Quick actions for current PRs
quick_pr_actions() {
    echo ""
    echo -e "${BLUE}⚡ Quick Actions for Current PRs${NC}"
    echo "----------------------------------------"
    
    # Get current PRs
    local prs=$(gh pr list --repo "$REPO" --state open --json number,title,isDraft)
    
    if [ "$(echo "$prs" | jq length)" -eq 0 ]; then
        print_warning "No open PRs found. Create a PR first to invoke Copilot."
        return
    fi
    
    echo "Select a PR to work with:"
    echo "$prs" | jq -r '.[] | "  \(.number). \(.title) (Draft: \(.isDraft))"'
    echo "  0. Create new issue with Copilot"
    echo ""
    
    read -p "Choose PR number (or 0 for new issue): " choice
    
    if [ "$choice" = "0" ]; then
        create_issue_with_copilot
    elif echo "$prs" | jq -e --arg num "$choice" '.[] | select(.number == ($num | tonumber))' > /dev/null; then
        echo ""
        echo "Actions for PR #$choice:"
        echo "1. Invoke Copilot for code review"
        echo "2. Ask Copilot to implement changes"
        echo "3. Ask Copilot to fix failing tests"
        echo "4. Custom Copilot message"
        echo "5. Check PR status"
        echo ""
        
        read -p "Choose action (1-5): " action
        
        case $action in
            1)
                invoke_copilot_in_pr "$choice" "Please review this PR and provide feedback on code quality, potential issues, and suggestions for improvement."
                ;;
            2)
                invoke_copilot_in_pr "$choice" "Please implement the changes described in this PR. Focus on following best practices and maintaining code consistency."
                ;;
            3)
                invoke_copilot_in_pr "$choice" "Please help fix the failing tests and CI checks. Analyze the failures and provide solutions."
                ;;
            4)
                read -p "Enter custom message for Copilot: " custom_msg
                invoke_copilot_in_pr "$choice" "$custom_msg"
                ;;
            5)
                gh pr view "$choice" --repo "$REPO"
                ;;
            *)
                print_error "Invalid action"
                ;;
        esac
    else
        print_error "Invalid PR number"
    fi
}

# Monitor Copilot responses
monitor_copilot() {
    print_status "Monitoring recent Copilot activity..."
    echo ""
    
    # Check recent comments in open PRs
    local prs=$(gh pr list --repo "$REPO" --state open --json number)
    
    if [ "$(echo "$prs" | jq length)" -eq 0 ]; then
        print_warning "No open PRs to monitor"
        return
    fi
    
    echo "$prs" | jq -r '.[].number' | while read pr_num; do
        echo -e "${YELLOW}PR #$pr_num Comments:${NC}"
        gh pr view "$pr_num" --repo "$REPO" --comments | grep -A 5 -B 1 "@copilot\|Copilot\|copilot" || echo "  No Copilot mentions found"
        echo ""
    done
}

# Main menu
main_menu() {
    while true; do
        echo ""
        echo -e "${BLUE}🤖 What would you like to do?${NC}"
        echo "----------------------------------------"
        echo "1. Show current PRs status"
        echo "2. Work with existing PRs (invoke Copilot)"
        echo "3. Create new issue with Copilot"
        echo "4. Monitor Copilot responses"
        echo "5. Show Copilot usage guide"
        echo "6. Quick PR management"
        echo "0. Exit"
        echo ""
        
        read -p "Choose option (0-6): " choice
        
        case $choice in
            1)
                show_pr_status
                ;;
            2)
                quick_pr_actions
                ;;
            3)
                create_issue_with_copilot
                ;;
            4)
                monitor_copilot
                ;;
            5)
                show_copilot_help
                ;;
            6)
                # Quick PR management
                echo ""
                echo "Quick commands:"
                echo "• Check CI status: gh pr-ready [PR_NUM]"
                echo "• View PR details: gh pr view [PR_NUM]"
                echo "• Merge PR: gh quick-merge [PR_NUM]"
                echo "• Check conflicts: gh pr-conflicts [PR_NUM]"
                ;;
            0)
                print_success "Goodbye! 👋"
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
    
    print_status "Welcome to the Copilot Workflow Manager!"
    print_status "This tool helps you work with GitHub Copilot in PRs and issues."
    
    main_menu
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi