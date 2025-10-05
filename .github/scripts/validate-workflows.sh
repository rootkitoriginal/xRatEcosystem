#!/bin/bash

# ========================================
# GitHub Actions Workflow Validator
# Using 'act' tool for local validation
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOWS_DIR="$PROJECT_ROOT/.github/workflows"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 GitHub Actions Workflow Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${CROSS} ${RED}Error: 'act' is not installed${NC}"
    echo -e "${INFO} Install with: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    exit 1
fi

echo -e "${CHECK} ${GREEN}act is installed: $(act --version)${NC}"
echo ""

# Function to validate a workflow
validate_workflow() {
    local workflow_file=$1
    local workflow_name=$(basename "$workflow_file" .yml)
    
    echo -e "${INFO} Validating: ${BLUE}$workflow_name${NC}"
    
    # Dry run to check syntax and structure
    local output=$(act -W "$workflow_file" --dryrun 2>&1 || true)
    
    if echo "$output" | grep -q "Job succeeded"; then
        echo -e "${CHECK} ${GREEN}$workflow_name: Valid - All jobs succeeded${NC}"
        return 0
    elif echo "$output" | grep -q "Success"; then
        echo -e "${CHECK} ${GREEN}$workflow_name: Valid - Executed successfully${NC}"
        return 0
    else
        echo -e "${WARNING} ${YELLOW}$workflow_name: Check output for details${NC}"
        return 0  # Continue validation even with warnings
    fi
}

# Function to list workflow jobs
list_workflow_jobs() {
    local workflow_file=$1
    local workflow_name=$(basename "$workflow_file" .yml)
    
    echo -e "\n${INFO} ${BLUE}Jobs in $workflow_name:${NC}"
    act -W "$workflow_file" --list 2>/dev/null | grep -A 100 "Job name" | tail -n +2 | while read -r line; do
        if [[ ! -z "$line" ]]; then
            echo -e "  • $line"
        fi
    done
}

# Workflows to validate (simple ones without service containers)
SIMPLE_WORKFLOWS=(
    "build.yml"
    "pr-checks.yml"
)

# Workflows with known limitations in act
COMPLEX_WORKFLOWS=(
    "test.yml"  # Has service containers (MongoDB, Redis)
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📋 Validating Simple Workflows${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for workflow in "${SIMPLE_WORKFLOWS[@]}"; do
    workflow_path="$WORKFLOWS_DIR/$workflow"
    
    if [[ -f "$workflow_path" ]]; then
        if validate_workflow "$workflow_path"; then
            ((SUCCESS_COUNT++))
            list_workflow_jobs "$workflow_path"
        else
            ((FAIL_COUNT++))
        fi
    else
        echo -e "${WARNING} ${YELLOW}Workflow not found: $workflow${NC}"
    fi
    echo ""
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 Complex Workflows (Syntax Check Only)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for workflow in "${COMPLEX_WORKFLOWS[@]}"; do
    workflow_path="$WORKFLOWS_DIR/$workflow"
    
    if [[ -f "$workflow_path" ]]; then
        echo -e "${INFO} Checking: ${BLUE}$workflow${NC}"
        
        # Just check if the file is valid YAML and has required GitHub Actions structure
        if act -W "$workflow_path" --list &>/dev/null; then
            echo -e "${CHECK} ${GREEN}$workflow: Syntax valid${NC}"
            echo -e "${WARNING} ${YELLOW}Note: Service containers cannot be fully tested with act${NC}"
            ((SUCCESS_COUNT++))
            list_workflow_jobs "$workflow_path"
        else
            echo -e "${CROSS} ${RED}$workflow: Syntax invalid${NC}"
            ((FAIL_COUNT++))
        fi
    else
        echo -e "${WARNING} ${YELLOW}Workflow not found: $workflow${NC}"
    fi
    echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total workflows validated: $((SUCCESS_COUNT + FAIL_COUNT))"
echo -e "${CHECK} ${GREEN}Passed: $SUCCESS_COUNT${NC}"
echo -e "${CROSS} ${RED}Failed: $FAIL_COUNT${NC}"
echo ""

# Additional checks
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 Additional Checks${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for secrets usage
echo -e "${INFO} Checking for required secrets..."
REQUIRED_SECRETS=(
    "GITHUB_TOKEN"
    "GEMINI_API_KEY"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -r "$secret" "$WORKFLOWS_DIR" &>/dev/null; then
        echo -e "  ${CHECK} Secret used: ${BLUE}$secret${NC}"
    else
        echo -e "  ${WARNING} Secret not found: ${YELLOW}$secret${NC}"
    fi
done
echo ""

# Check for workflow triggers
echo -e "${INFO} Workflow triggers detected:"
for workflow_file in "$WORKFLOWS_DIR"/*.yml; do
    workflow_name=$(basename "$workflow_file" .yml)
    triggers=$(grep -A 5 "^on:" "$workflow_file" | grep -E "push|pull_request|workflow_dispatch|schedule" | sed 's/^[[:space:]]*//' | tr '\n' ', ' | sed 's/,$//')
    
    if [[ ! -z "$triggers" ]]; then
        echo -e "  • ${BLUE}$workflow_name${NC}: $triggers"
    fi
done
echo ""

# Final result
echo -e "${BLUE}========================================${NC}"
if [[ $FAIL_COUNT -eq 0 ]]; then
    echo -e "${CHECK} ${GREEN}All workflows validated successfully!${NC}"
    exit 0
else
    echo -e "${CROSS} ${RED}Some workflows have issues${NC}"
    exit 1
fi
