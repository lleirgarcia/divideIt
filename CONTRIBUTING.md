# Contributing to divideIt

Thank you for your interest in contributing to divideIt! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:
- A clear title
- A detailed description of the enhancement
- Use cases and examples
- Possible implementation details

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when creating a new feature request.

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- FFmpeg installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/divideIt.git
   cd divideIt
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cp .env.example .env
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set Up Environment Variables**
   
   Backend (`.env`):
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   LOG_LEVEL=info
   ```
   
   Frontend (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Run the Development Server**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This starts:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

## Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow ESLint rules (run `npm run lint` before committing)
- **Formatting**: Use consistent indentation (2 spaces)
- **Naming**: Use descriptive names for variables, functions, and files
- **Comments**: Add comments for complex logic, but prefer self-documenting code

### Project Structure

```
divideIt/
├── backend/          # Express API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── __tests__/        # Backend tests
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   └── store/         # State management
│   └── __tests__/        # Frontend tests
└── .github/          # GitHub templates and workflows
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Changes to build process or auxiliary tools

Examples:
```
feat: add video preview before splitting
fix: resolve memory leak in video processing
docs: update API documentation
refactor: improve error handling in video service
```

### Branch Naming

See [BRANCH_NAMING.md](.github/BRANCH_NAMING.md) for detailed conventions.

Quick reference:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring
- `test/description` - Tests

### Testing

- **Write Tests**: All new features should include tests
- **Test Coverage**: Maintain or improve test coverage
- **Run Tests**: Always run tests before committing
  ```bash
  npm test
  ```
- **Test Types**:
  - Unit tests for individual functions/components
  - Integration tests for API endpoints
  - E2E tests for critical user flows

### Pull Request Guidelines

1. **Keep PRs Focused**: One feature or fix per PR
2. **Update Documentation**: Update README.md and relevant docs
3. **Add Tests**: Include tests for new features
4. **Pass CI**: Ensure all CI checks pass
5. **Request Review**: Request review from maintainers
6. **Use Template**: Fill out the PR template completely

### Code Review Process

1. All PRs require at least one approval
2. Address review comments promptly
3. Keep discussions constructive and respectful
4. Update PR based on feedback

## Development Workflow

1. **Create Issue**: Discuss major changes in an issue first
2. **Create Branch**: Create a feature branch from `develop`
3. **Make Changes**: Implement your changes with tests
4. **Test Locally**: Ensure all tests pass
5. **Commit**: Write clear commit messages
6. **Push**: Push to your fork
7. **Create PR**: Open a PR to `develop` branch
8. **Review**: Address review feedback
9. **Merge**: After approval, maintainers will merge

## Questions?

- Open an issue for bugs or feature requests
- Check existing documentation
- Review closed issues for similar questions

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes (for significant contributions)
- GitHub contributors page

Thank you for contributing to divideIt! 🎉
