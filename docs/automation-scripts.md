# GitHub Automation Scripts

Automation scripts to facilitate development with GitHub CLI and Copilot coding agent in the xRat Ecosystem project.

## 📋 Available Scripts

| Script                | Description                            | Primary Use                        |
| --------------------- | -------------------------------------- | ---------------------------------- |
| `copilot-workflow.sh` | 🤖 Interactive interface for Copilot   | Invoke Copilot in PRs and issues   |
| `dev-automation.sh`   | 🚀 Development automation              | Complete development workflow      |
| `copilot-helper.sh`   | 🛠️ Copilot utilities                   | Individual commands and helpers    |
| `pr-manager.sh`       | 📋 PR management                       | Analysis of PRs #38, #39, #40      |
| `demo-copilot.sh`     | 📺 Demonstration                       | Shows current status and examples  |

## 🔧 Configured GitHub CLI Aliases

These aliases are automatically configured when you run the setup scripts:

```bash
gh copilot-prs      # List PRs mentioning Copilot
gh copilot-issues   # List issues mentioning Copilot
gh pr-ready [NUM]   # Check PR CI status
gh quick-merge [NUM] # Quick merge with squash
gh pr-conflicts [NUM] # Show modified files
gh ci-logs          # View CI failure logs
gh copilot-assign [NUM] # Mention Copilot in issue
```

## 🚀 How to Use

### 1. Development Automation (Main Interface)

The primary script for daily development workflows:

```bash
./.github/scripts/dev-automation.sh
```

**Features:**
- Monitor development progress
- View PR status dashboard
- Invoke Copilot with templates
- Check CI/CD status
- Manage multiple PRs
- Auto-merge ready PRs

**Menu Options:**
1. Monitor development progress
2. View PR dashboard
3. Invoke Copilot
4. Check CI status
5. Manage PRs
6. Exit

### 2. Copilot Workflow Management

Specific interface for managing Copilot interactions:

```bash
./.github/scripts/copilot-workflow.sh
```

**Features:**
- Interactive Copilot invocation
- Pre-defined task templates
- PR-specific guidance
- Track Copilot responses
- Coordinate parallel development

**Use Cases:**
- Request new features
- Ask for bug fixes
- Request test coverage improvements
- Get code reviews

### 3. PR Manager

Advanced PR analysis and conflict detection:

```bash
./.github/scripts/pr-manager.sh
```

**Features:**
- Analyze file changes across PRs
- Detect potential merge conflicts
- Show overlap between PRs #38, #39, #40
- Recommend merge strategies
- Display detailed PR statistics

**Output Example:**
```
=== PR Conflict Analysis ===

PR #38: WebSocket Implementation
  - Modified files: 15
  - Potential conflicts with: #39

PR #39: Test Coverage
  - Modified files: 23
  - Potential conflicts with: #38

PR #40: Monitor Smoke Test
  - Modified files: 3
  - No conflicts detected
```

### 4. Copilot Helper

Individual utility commands for quick tasks:

```bash
./.github/scripts/copilot-helper.sh
```

**Available Commands:**
- List Copilot PRs
- List Copilot issues
- Check PR readiness
- Quick merge
- View CI logs
- Assign Copilot to issues

### 5. Demo and Status

Quick overview of current status:

```bash
./.github/scripts/demo-copilot.sh
```

**Shows:**
- Current PR status
- Example Copilot invocations
- Quick reference guide
- Recent activity

## 💡 Practical Examples

### Example 1: Starting New Development

```bash
# 1. Check current status
./.github/scripts/demo-copilot.sh

# 2. Open development dashboard
./.github/scripts/dev-automation.sh
# Choose option: Monitor development progress

# 3. Invoke Copilot for specific task
gh pr comment 38 --body "@copilot Implement WebSocket with socket.io"
```

### Example 2: Reviewing PRs

```bash
# 1. Analyze conflicts
./.github/scripts/pr-manager.sh

# 2. Check CI status
gh pr-ready 38
gh pr-ready 39
gh pr-ready 40

# 3. View PR details
gh pr view 38 --comments
```

### Example 3: Merging Ready PRs

```bash
# 1. Verify PR is ready
gh pr-ready 40

# 2. Review one final time
gh pr view 40

# 3. Quick merge
gh quick-merge 40
```

## 📝 Copilot Invocation Templates

### WebSocket Implementation (PR #38)

```bash
gh pr comment 38 --body "@copilot Please help implement WebSocket functionality with the following requirements:
- Use socket.io for real-time communication
- Implement JWT authentication for connections
- Add room-based messaging support
- Include comprehensive error handling
- Add unit tests with >80% coverage"
```

### Test Coverage Improvement (PR #39)

```bash
gh pr comment 39 --body "@copilot Please increase backend test coverage to 80%:
- Focus on models/Data.js and models/User.js
- Add tests for middleware/rateLimiter.js
- Include edge cases and error scenarios
- Ensure all critical paths are tested"
```

### Smoke Test Creation (PR #40)

```bash
gh pr comment 40 --body "@copilot Please create smoke test for bin/monitorDevOps.js:
- Use Jest for testing framework
- Mock GitHub API calls (no real API requests)
- Test basic functionality in dry-run mode
- Add CI job to run smoke tests automatically
- Document test purpose and usage"
```

## 🎯 Recommended Workflow

### Daily Standup Workflow

```bash
# 1. Check overnight progress
./.github/scripts/demo-copilot.sh

# 2. Review all PR statuses
./.github/scripts/pr-manager.sh

# 3. Open interactive dashboard
./.github/scripts/dev-automation.sh
```

### PR Review Workflow

```bash
# 1. Check if PR is ready
gh pr-ready <PR_NUMBER>

# 2. Review changes and comments
gh pr view <PR_NUMBER> --comments

# 3. Check for conflicts
./.github/scripts/pr-manager.sh

# 4. If ready, merge
gh quick-merge <PR_NUMBER>
```

### Copilot Development Workflow

```bash
# 1. Start interactive Copilot interface
./.github/scripts/copilot-workflow.sh

# 2. Select task and PR

# 3. Monitor response in PR comments
gh pr view <PR_NUMBER> --comments

# 4. Continue iteration as needed
```

## ⚠️ Important Notes

### How Copilot Works

- ✅ **Correct**: Mention `@copilot` in PR/issue comments
- ❌ **Incorrect**: Try to "assign" Copilot as a person
- 🔄 **Response**: Copilot responds in comments of the same PR/issue

### PR Strategy

- **PR #40** (Monitor): Independent, can merge first
- **PR #39** (Tests): Coordinate with #38 to avoid conflicts
- **PR #38** (WebSocket): Base for other features, medium priority

### CI/CD

- All workflows accept `copilot/` branches
- `npx jest --coverage` works correctly
- Branch protection active on `main`

## 🔗 Related Documentation

- [DevOps Tools](./devops-tools.md)
- [Copilot ChatModes](./copilot-chatmodes.md)
- [CI Validation](./ci-validation.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📊 Script Locations

All scripts are located in `.github/scripts/`:

```
.github/scripts/
├── copilot-workflow.sh    # Interactive Copilot management
├── dev-automation.sh      # Main development automation
├── copilot-helper.sh      # Individual utilities
├── pr-manager.sh          # PR analysis and conflict detection
└── demo-copilot.sh        # Status and examples
```

## 🤝 Contributing

When adding new automation scripts:

1. Place in `.github/scripts/` directory
2. Make executable: `chmod +x script-name.sh`
3. Document in this file
4. Add examples of usage
5. Update GitHub CLI aliases if needed

---

_Scripts created to optimize development with GitHub CLI and Copilot coding agent_ 🚀
