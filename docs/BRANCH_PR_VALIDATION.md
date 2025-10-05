# Branch Name and PR Title Validation Implementation

## Overview

This document describes the implementation of automated branch name and PR title validation to resolve naming issues when GitHub Copilot is invoked and to ensure consistent naming conventions across the project.

## Problem Statement

GitHub Copilot generates branches with patterns like `copilot/fix-e538b55c-0fd7-4d72-b3da-563805acd31c` which were not properly handled by the previous basic regex validation. This caused PR failures when Copilot tried to create pull requests.

## Solution

Implemented two GitHub Actions:

### 1. Branch Name Validation (`deepakputhraya/action-branch-name`)

- **Location**: `.github/workflows/pr-checks.yml`
- **Validates**: Branch names on all pull requests
- **Rules**:
  - Must start with approved prefixes: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, `copilot/`, `dependabot/`
  - Length: 5-100 characters
  - Ignores: `main`, `develop`, `master`

### 2. PR Title Validation (`deepakputhraya/action-pr-title`)

- **Location**: `.github/workflows/pr-checks.yml`
- **Validates**: PR titles using Conventional Commits format
- **Rules**:
  - Format: `type(scope): description` or `type: description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
  - Length: 10-100 characters
  - Case sensitive types (lowercase required)

## Benefits

1. **Copilot Compatibility**: Automatically accepts Copilot-generated branch names
2. **Consistency**: Enforces consistent naming across all contributors
3. **Automation**: Reduces manual review overhead
4. **Clear Feedback**: Provides specific error messages for invalid names
5. **Flexibility**: Supports both manual and automated branch creation

## Updated Documentation

- Enhanced `docs/CONTRIBUTING.md` with detailed branch naming and PR title guidelines
- Added validation rules explanation
- Provided examples of valid and invalid formats
- Documented Copilot-specific patterns

## Implementation Details

### Workflow Configuration

```yaml
# Branch Name Validation
- name: Validate branch name
  uses: deepakputhraya/action-branch-name@master
  with:
    regex: '^(feature|fix|docs|refactor|test|chore|copilot|dependabot)\/.+'
    allowed_prefixes: 'feature,fix,docs,refactor,test,chore,copilot,dependabot'
    ignore: 'main,develop,master'
    min_length: 5
    max_length: 100

# PR Title Validation
- name: Validate PR title format
  uses: deepakputhraya/action-pr-title@master
  with:
    regex: '^(feat|fix|docs|style|refactor|test|chore|perf|ci)(\(.+\))?:\s.+'
    allowed_prefixes: 'feat,fix,docs,style,refactor,test,chore,perf,ci'
    prefix_case_sensitive: true
    min_length: 10
    max_length: 100
```

## Testing

The validation rules will be automatically tested on all future pull requests. The implementation ensures:

- Existing Copilot PRs (#38, #39, #40) will pass validation
- Manual branches following conventions will pass
- Invalid names will be rejected with clear error messages

## Migration Notes

- Existing branches are not affected (validation only on new PRs)
- Contributors should update their local development practices
- Copilot-generated branches will work seamlessly
- Documentation updated to reflect new requirements
