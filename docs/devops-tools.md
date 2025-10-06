# DevOps Tools & Monitor

DevOps monitoring and automation tools for the xRat Ecosystem.

## 🚀 DevOps Monitor

Real-time monitor for tracking Pull Requests in the xRat Ecosystem repository.

### Features

- ✨ **Real-time Monitoring**: Auto-refresh every 10 seconds
- 📊 **Compact Table View**: Tabular visualization of all PRs
- 🎯 **Smart Detection**: Automatically identifies important changes
- 🛑 **Auto-pause**: Stops monitoring when critical changes occur
- 📝 **Contextual Instructions**: Shows what to do when a PR is ready
- 📈 **Complete Statistics**: View aggregated metrics for all PRs
- 🎨 **Colorful Interface**: Styled terminal with colors and emojis
- 🔄 **Auto-refresh**: Automatic updates without manual intervention

### Usage

#### Method 1: Using npm script (Recommended)

```bash
npm run monitor
```

or

```bash
npm run monitor:prs
```

#### Method 2: Running directly

```bash
node bin/monitorDevOps.js
```

or

```bash
./bin/monitorDevOps.js
```

### Displayed Information

#### Compact Table

Overview of all PRs in tabular format:

```
╔════╦══════════════════════════════════════════╦═══════════╦══════════╦═════════╗
║ #  ║ Title                                    ║ Status    ║ Commits  ║ Changes ║
╠════╬══════════════════════════════════════════╬═══════════╬══════════╬═════════╣
║ #30 ║ ✨ feat: add real-time monitoring...     ║ ✅ Ready  ║     12   ║ +487/-1 ║
║ #29 ║ 📚 docs: create API documentation...    ║ 🚧 Draft  ║      0   ║ +0/-0   ║
╚════╩══════════════════════════════════════════╩═══════════╩══════════╩═════════╝
```

#### General Statistics

- Total open PRs
- Number of Draft PRs
- Number of Ready PRs
- Total Commits
- Total Changes (lines)

### Change Detection

The monitor automatically detects:

- 🆕 **New PRs**: When a new PR is created
- 🎉 **PR ready**: When a Draft becomes Ready
- 📝 **New commits**: When commits are added
- 💻 **Code changes**: When there are modifications (+/-)
- ✅ **Ready to merge**: When mergeable_state becomes "clean"

#### Auto-pause

When an important PR changes status (Draft → Ready or becomes ready to merge), the monitor:

1. **Automatically stops** execution
2. **Shows detailed instructions** on what to do
3. **Displays ready-to-copy commands**

#### Example Automatic Instructions

When a PR is ready, you'll see:

```
🎉 CHANGES DETECTED!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PR #26 changed to READY! 🎉

Title: feat: implement structured logging with Winston
URL:    https://github.com/xLabInternet/xRatEcosystem/pull/26

📋 NEXT STEPS:
  1. Review PR code:
     gh pr view 26

  2. Checkout the branch:
     gh pr checkout 26

  3. Run tests locally:
     npm test

  4. If all looks good, approve and merge:
     gh pr review 26 --approve
     gh pr merge 26 --squash --delete-branch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monitor paused due to important changes.
Run npm run monitor again to continue.
```

### Detailed Information (Complete Mode)

The script also maintains the `renderPR()` function that can show:

- **Number and Title**: PR identification with appropriate emoji
- **Status**: Draft or Ready to merge
- **Mergeable State**: Whether it can be merged (clean/unstable/dirty/blocked)
- **Author**: Who created the PR
- **Branch**: Source branch → destination branch
- **Changes**: Lines added/removed and number of files
- **Commits**: Number of commits in the PR
- **Comments**: Number of general comments
- **Reviews**: Number of review comments
- **Timestamps**: Creation and last update dates
- **URL**: Direct link to the PR on GitHub

### Emojis by PR Type

The monitor automatically identifies PR type by title:

- ✨ `feat:` - New feature
- 🐛 `fix:` - Bug fix
- 📚 `docs:` - Documentation
- 🧪 `test:` - Tests
- ♻️ `refactor:` - Refactoring
- ✏️ Other types

### Configuration

#### Change Update Interval

Edit the `REFRESH_INTERVAL` variable in `bin/monitorDevOps.js`:

```javascript
const REFRESH_INTERVAL = 10000; // 10 seconds (in milliseconds)
```

#### Change Repository

Edit the `OWNER` and `REPO` constants:

```javascript
const OWNER = 'xLabInternet';
const REPO = 'xRatEcosystem';
```

### How to Stop

Press `Ctrl+C` to gracefully terminate the monitor.

### Dependencies

The script uses only native Node.js modules:

- `https` - For GitHub API requests
- No external dependencies required!

### Requirements

- Node.js >= 20.0.0
- Internet connection to access GitHub API

### GitHub API

The monitor uses GitHub's REST API v3:

- **Endpoint**: `https://api.github.com/repos/{owner}/{repo}/pulls`
- **Rate Limit**: 60 requests/hour without authentication
- **Authentication**: Not required for public repositories

#### Increase Rate Limit (Optional)

To increase the rate limit to 5000 requests/hour, add authentication:

1. Create a Personal Access Token on GitHub
2. Add to request header:

```javascript
headers: {
  'Authorization': `token YOUR_GITHUB_TOKEN`,
  // ... other headers
}
```

## 🤖 GitHub CLI + Copilot Automation Scripts

This directory contains automation scripts to facilitate development with GitHub CLI and Copilot coding agent in the xRat Ecosystem project.

### Available Scripts

| Script                | Description                          | Primary Use                       |
| --------------------- | ------------------------------------ | --------------------------------- |
| `copilot-workflow.sh` | 🤖 Interactive interface for Copilot | Invoke Copilot in PRs and issues  |
| `dev-automation.sh`   | 🚀 Development automation            | Complete development workflow     |
| `copilot-helper.sh`   | 🛠️ Copilot utilities                 | Individual commands and helpers   |
| `pr-manager.sh`       | 📋 PR management                     | Analysis of PRs #38, #39, #40     |
| `demo-copilot.sh`     | 📺 Demonstration                     | Shows current status and examples |

### Configured GitHub CLI Aliases

```bash
# Aliases automatically configured:
gh copilot-prs      # List PRs mentioning Copilot
gh copilot-issues   # List issues mentioning Copilot
gh pr-ready         # Check PR CI status
gh quick-merge      # Quick merge with squash
gh pr-conflicts     # Show modified files
gh ci-logs          # View CI failure logs
gh copilot-assign   # Mention Copilot in issue
```

### How to Use

#### 1. Main Interface (Recommended)

```bash
# Start complete interactive interface
./.github/scripts/dev-automation.sh
```

#### 2. Copilot Management

```bash
# Specific interface for Copilot
./.github/scripts/copilot-workflow.sh
```

#### 3. Quick Status

```bash
# Show current PR status and examples
./.github/scripts/demo-copilot.sh
```

### Practical Examples

#### How to Invoke Copilot in Current PRs

**PR #38 - WebSocket Implementation:**

```bash
gh pr comment 38 --body "@copilot Please help implement WebSocket functionality. Focus on socket.io integration with JWT authentication and room-based messaging."
```

**PR #39 - Test Coverage:**

```bash
gh pr comment 39 --body "@copilot Please increase backend test coverage to 80%. Focus on models/Data.js, models/User.js, and middleware/rateLimiter.js."
```

**PR #40 - Monitor Smoke Test:**

```bash
gh pr comment 40 --body "@copilot Please create smoke test for bin/monitorDevOps.js and CI job. Use dry-run mode to avoid calling real APIs."
```

### Useful Development Commands

```bash
# Check CI for all PRs
gh pr-ready 38 && gh pr-ready 39 && gh pr-ready 40

# View PR comments (including Copilot responses)
gh pr view 38 --comments
gh pr view 39 --comments
gh pr view 40 --comments

# Quick merge when ready
gh quick-merge 40  # Simplest PR first
```

## 📄 License

MIT License - See LICENSE for more details.

---

**Related Documentation:**

- [Automation Scripts](./automation-scripts.md)
- [Copilot ChatModes](./copilot-chatmodes.md)
- [Smoke Testing](./smoke-testing.md)
