# Testing GitHub Actions Locally with act

## 🎯 Overview

This project uses [act](https://github.com/nektos/act) to test GitHub Actions workflows locally before pushing to GitHub. This helps catch issues early and speeds up development.

## 📋 Prerequisites

- Docker installed and running
- act installed (version 0.2.82+)

## 🚀 Installation

### Linux/macOS
```bash
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Windows (with Chocolatey)
```bash
choco install act-cli
```

### Verify Installation
```bash
act --version
```

## ⚙️ Configuration

### 1. Create `.secrets` file (not committed)
```bash
# Copy from .env.example or create manually
cp .env.example .secrets

# Edit and add real secrets
nano .secrets
```

### 2. Secrets File Format
```properties
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**⚠️ Important**: The `.secrets` file is already in `.gitignore` and will NEVER be committed.

## 🧪 Running Workflows

### List Available Workflows
```bash
act -l
```

### Run Specific Workflow

#### Test Issue Triage
```bash
act issues -W .github/workflows/gemini-triage.yml --secret-file .secrets
```

#### Test PR Review
```bash
act pull_request -W .github/workflows/gemini-review.yml --secret-file .secrets
```

#### Test Dispatch Workflow
```bash
act issue_comment -W .github/workflows/gemini-dispatch.yml --secret-file .secrets
```

### Dry Run (Don't execute, just show what would run)
```bash
act -n
```

### Run with Specific Event
```bash
# Simulate issue opened
act issues --eventpath .github/workflows/events/issue-opened.json --secret-file .secrets

# Simulate PR opened
act pull_request --eventpath .github/workflows/events/pr-opened.json --secret-file .secrets
```

## 📁 Project Structure

```
xRatEcosystem/
├── .github/
│   └── workflows/
│       ├── gemini-dispatch.yml        # Central dispatcher
│       ├── gemini-invoke.yml          # General assistant
│       ├── gemini-review.yml          # PR reviews
│       ├── gemini-triage.yml          # Issue triage
│       └── gemini-scheduled-triage.yml # Scheduled triage
├── .secrets                           # Local secrets (NEVER commit!)
└── docs/
    └── ACT_TESTING.md                 # This file
```

## 🎛️ Advanced Options

### Use Specific Docker Platform
```bash
act --platform ubuntu-latest=catthehacker/ubuntu:act-latest
```

### Specify Container Architecture
```bash
act --container-architecture linux/amd64
```

### Run Specific Job
```bash
act -j job-name
```

### Pass Environment Variables
```bash
act --env DEBUG=true --env NODE_ENV=test
```

## 🐛 Debugging

### Enable Verbose Output
```bash
act -v
```

### Enable Step Debug
```bash
act --secret-file .secrets --env ACTIONS_STEP_DEBUG=true
```

### View Container Logs
```bash
act --verbose --secret-file .secrets
```

## 🔍 Common Issues

### Issue: Docker Permission Denied
**Solution**: Add your user to docker group
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Workflows Not Found
**Solution**: Make sure you're in the project root directory
```bash
cd /path/to/xRatEcosystem
act -l
```

### Issue: Secrets Not Loading
**Solution**: Verify `.secrets` file exists and has correct format
```bash
cat .secrets
# Should show: KEY=value format
```

## 📚 Workflow Testing Examples

### Test Gemini Dispatch (Recommended First Test)
```bash
# List what would run
act -l -W .github/workflows/gemini-dispatch.yml

# Run the workflow
act issues -W .github/workflows/gemini-dispatch.yml --secret-file .secrets
```

### Test PR Review Workflow
```bash
act pull_request -W .github/workflows/gemini-review.yml \
  --secret-file .secrets \
  --env GITHUB_TOKEN=your_github_token
```

### Test Issue Triage
```bash
act issues -W .github/workflows/gemini-triage.yml \
  --secret-file .secrets \
  --eventpath .github/workflows/events/issue-opened.json
```

## 🎯 Best Practices

1. **Always test locally first** before pushing workflows
2. **Use dry runs** (`-n`) to verify workflow structure
3. **Keep `.secrets` updated** with real values for testing
4. **Never commit `.secrets`** file (already in `.gitignore`)
5. **Test different event types** (issues, PRs, comments)
6. **Use verbose mode** for debugging complex workflows

## 🔗 Resources

- [act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Gemini CLI Documentation](https://github.com/google-github-actions/run-gemini-cli)

## 💡 Tips

- Use `act -l` frequently to see available workflows
- Start with simple workflows before testing complex ones
- Check Docker container logs if workflows fail
- Use `--dryrun` to validate without executing

---

**Ready to test!** 🚀

Run `act -l` to see all available workflows and start testing locally.
