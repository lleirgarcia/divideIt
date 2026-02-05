# Branch Naming Conventions

This document outlines the branch naming conventions for the divideIt project.

## Branch Types

### Main Branches

- `main` - Production-ready code. Protected branch.
- `develop` - Development branch for integrating features. Protected branch.

### Feature Branches

Format: `feature/<description>`

Examples:
- `feature/video-preview`
- `feature/user-authentication`
- `feature/batch-processing`

### Bug Fix Branches

Format: `fix/<description>`

Examples:
- `fix/video-upload-error`
- `fix/segment-download-issue`
- `fix/memory-leak-processing`

### Hotfix Branches

Format: `hotfix/<description>`

Examples:
- `hotfix/security-patch`
- `hotfix/critical-bug`

### Documentation Branches

Format: `docs/<description>`

Examples:
- `docs/api-documentation`
- `docs/setup-guide`
- `docs/contributing-update`

### Refactoring Branches

Format: `refactor/<description>`

Examples:
- `refactor/video-service`
- `refactor/error-handling`

### Testing Branches

Format: `test/<description>`

Examples:
- `test/integration-tests`
- `test/e2e-setup`

### Chore Branches

Format: `chore/<description>`

Examples:
- `chore/dependency-update`
- `chore/ci-configuration`

## Branch Naming Rules

1. Use lowercase letters
2. Use hyphens to separate words
3. Be descriptive but concise
4. Avoid special characters except hyphens
5. Start with the branch type prefix
6. Reference issue numbers when applicable: `feature/123-video-preview`

## Examples

✅ Good:
- `feature/video-preview-component`
- `fix/upload-timeout-error`
- `docs/api-endpoints`
- `refactor/video-processor-service`

❌ Bad:
- `new-feature` (missing prefix)
- `Feature/VideoPreview` (uppercase, no hyphen)
- `fix_bug` (underscore instead of hyphen)
- `feature/` (too vague)

## Branch Workflow

1. Create branch from `develop`: `git checkout -b feature/my-feature develop`
2. Make changes and commit
3. Push branch: `git push origin feature/my-feature`
4. Create Pull Request to `develop`
5. After review and merge, delete the branch

## Protected Branches

- `main` - Requires PR review, status checks must pass
- `develop` - Requires PR review, status checks must pass
