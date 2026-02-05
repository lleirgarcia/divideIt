# GitHub Repository Settings Recommendations

This document provides recommendations for configuring your GitHub repository settings for optimal collaboration and security.

## General Settings

### Repository Name
- **Current**: `divideIt`
- **Recommended**: Keep as is or use `divide-it` (kebab-case)

### Description
```
A web application for splitting videos into random segments for Reels, TikTok, and YouTube Shorts
```

### Topics/Tags
Add the following topics:
- `video-processing`
- `video-splitter`
- `social-media`
- `reels`
- `tiktok`
- `youtube-shorts`
- `nextjs`
- `express`
- `typescript`
- `ffmpeg`
- `docker`

### Website
If you have a deployed version:
- Add production URL

## Branch Protection Rules

### Main Branch (`main`)

Enable the following:
- ✅ Require a pull request before merging
  - Required approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `backend-test`
    - `frontend-test`
    - `docker-build`
  - Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Include administrators
- ✅ Restrict who can push to matching branches: No one (except admins)

### Develop Branch (`develop`)

Enable the following:
- ✅ Require a pull request before merging
  - Required approvals: 1
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `backend-test`
    - `frontend-test`
- ✅ Require conversation resolution before merging
- ✅ Include administrators

## Security Settings

### Secret Scanning
- ✅ Enable secret scanning alerts
- ✅ Enable push protection

### Dependency Graph
- ✅ Enable dependency graph
- ✅ Enable Dependabot alerts
- ✅ Enable Dependabot security updates

### Code Scanning
Consider enabling:
- CodeQL analysis (if using GitHub Advanced Security)
- Third-party code scanning tools

## Collaborator Settings

### Access Permissions
- **Read**: For contributors
- **Write**: For maintainers
- **Admin**: For project owners only

### Pull Request Settings
- ✅ Allow merge commits
- ✅ Allow squash merging (recommended)
- ✅ Allow rebase merging
- ✅ Automatically delete head branches after merge

## Issue and Pull Request Templates

### Issue Templates
Create templates for:
- Bug reports
- Feature requests
- Documentation improvements
- Questions/Support

### Pull Request Template
- Include checklist for contributors
- Link to CONTRIBUTING.md
- Require description of changes

## Webhooks and Integrations

### Recommended Integrations
- **Codecov**: For test coverage reporting
- **Dependabot**: For dependency updates
- **Stale Bot**: For managing stale issues/PRs (optional)

## Actions Settings

### Actions Permissions
- ✅ Allow all actions and reusable workflows
- ✅ Allow actions created by GitHub
- ✅ Allow actions by Marketplace verified creators
- ✅ Allow specified actions and reusable workflows

### Workflow Permissions
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

## Pages Settings (if applicable)

If hosting documentation:
- Source: `gh-pages` branch or `docs/` folder
- Theme: Choose appropriate Jekyll theme

## Archive Settings

- ✅ Warn when archiving repository
- Archive when project is deprecated

## Notification Settings

### Watch Settings
- ✅ Notifications: Participating and @mentions
- ✅ Email notifications: Enabled

## Additional Recommendations

1. **Add CODEOWNERS file** to automatically request reviews from specific teams
2. **Enable Discussions** for community Q&A
3. **Set up Project boards** for issue tracking
4. **Configure Release notes** template
5. **Add Security Policy** (SECURITY.md)

## Quick Setup Checklist

- [ ] Set repository description and topics
- [ ] Configure branch protection for `main` and `develop`
- [ ] Enable secret scanning
- [ ] Enable Dependabot alerts and updates
- [ ] Configure pull request settings
- [ ] Set up issue and PR templates
- [ ] Configure Actions permissions
- [ ] Add CODEOWNERS file
- [ ] Create SECURITY.md
- [ ] Set up webhooks (if needed)
