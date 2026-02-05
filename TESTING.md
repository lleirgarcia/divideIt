# Testing Guide

This document provides comprehensive information about testing in the divideIt project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

The divideIt project uses a comprehensive testing strategy with multiple testing frameworks:

- **Jest** - Unit and integration tests for both frontend and backend
- **Playwright** - End-to-end (E2E) testing and visual regression testing
- **Testing Library** - React component testing utilities

## Test Structure

```
divideIt/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts                    # Test setup configuration
│   │   │   ├── helpers/
│   │   │   │   └── testHelpers.ts          # Test utility functions
│   │   │   ├── fixtures/
│   │   │   │   └── videoFixtures.ts        # Mock data and fixtures
│   │   │   ├── integration/
│   │   │   │   └── videoRoutes.integration.test.ts
│   │   │   ├── routes.test.ts
│   │   │   ├── videoProcessor.test.ts
│   │   │   └── videoService.test.ts
│   │   └── ...
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── helpers/
│   │   │   │   └── testHelpers.tsx
│   │   │   └── fixtures/
│   │   │       └── videoFixtures.ts
│   │   ├── components/
│   │   │   └── __tests__/
│   │   │       ├── VideoUploader.test.tsx
│   │   │       ├── VideoPlayer.test.tsx
│   │   │       └── SegmentsList.test.tsx
│   │   └── ...
│   └── jest.config.js
├── e2e/
│   ├── helpers/
│   │   └── testHelpers.ts
│   ├── video-upload.spec.ts
│   ├── visual-regression.spec.ts
│   └── performance.spec.ts
└── playwright.config.ts
```

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Show E2E test report
npm run test:e2e:report
```

### Run All Tests

```bash
# From root directory
npm test              # Unit tests only
npm run test:all      # Unit + E2E tests
npm run test:coverage # All tests with coverage
```

## Test Types

### Unit Tests

Unit tests focus on testing individual functions, methods, or components in isolation.

**Backend Example:**
```typescript
import { generateRandomSegments } from '../utils/videoProcessor';

describe('generateRandomSegments', () => {
  it('should generate segments within video duration', () => {
    const duration = 100;
    const segments = generateRandomSegments(duration, 5, 5, 20);
    
    expect(segments.length).toBeLessThanOrEqual(5);
    segments.forEach(segment => {
      expect(segment.startTime).toBeGreaterThanOrEqual(0);
      expect(segment.endTime).toBeLessThanOrEqual(duration);
    });
  });
});
```

**Frontend Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { VideoUploader } from '../VideoUploader';

describe('VideoUploader', () => {
  it('renders upload area', () => {
    render(<VideoUploader />);
    expect(screen.getByText(/drag & drop a video file/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Example:**
```typescript
import request from 'supertest';
import app from '../../index';

describe('Video Routes Integration', () => {
  it('should upload and split a video', async () => {
    const response = await request(app)
      .post('/api/videos/split')
      .attach('video', testVideoPath)
      .field('segmentCount', '3');
    
    expect(response.status).toBe(200);
    expect(response.body.data.segments).toHaveLength(3);
  });
});
```

### End-to-End Tests

E2E tests simulate real user interactions across the entire application.

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('should upload and split video', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'test-video.mp4');
  await page.fill('input[name="segmentCount"]', '5');
  await page.click('button:has-text("Split Video")');
  
  await expect(page.locator('text=Segment 1')).toBeVisible();
});
```

### Visual Regression Tests

Visual regression tests capture screenshots and compare them to baseline images.

```typescript
test('homepage should match baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Performance Tests

Performance tests measure and validate application performance metrics.

```typescript
test('page load should be fast', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000);
});
```

## Writing Tests

### Test Helpers

Use test helpers to reduce code duplication and improve maintainability.

**Backend:**
```typescript
import { createMockRequest, createMockResponse } from '../helpers/testHelpers';

const req = createMockRequest({ body: { segmentCount: 5 } });
const res = createMockResponse();
```

**Frontend:**
```typescript
import { createMockVideoFile, resetVideoStore } from '../../__tests__/helpers/testHelpers';

beforeEach(() => {
  resetVideoStore();
});
```

### Test Fixtures

Use fixtures for consistent test data.

```typescript
import { mockVideoSegments } from '../fixtures/videoFixtures';

const segments = mockVideoSegments.fiveSegments;
```

### Mocking

Mock external dependencies and APIs.

```typescript
// Mock API calls
jest.mock('@/services/api', () => ({
  splitVideo: jest.fn().mockResolvedValue({ data: { segments: [] } }),
}));

// Mock file system
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));
```

## Test Coverage

### Coverage Thresholds

The project maintains minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage

```bash
# Backend coverage
cd backend && npm run test:coverage
# Open backend/coverage/index.html

# Frontend coverage
cd frontend && npm run test:coverage
# Open frontend/coverage/index.html
```

### Coverage Reports

Coverage reports are automatically generated and uploaded to:
- **Codecov** - Online coverage tracking
- **GitHub Actions Artifacts** - Downloadable coverage reports

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// Good
it('should return 400 when video file is missing', () => {});

// Bad
it('should work', () => {});
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should split video into segments', async () => {
  // Arrange
  const videoFile = createMockVideoFile();
  const segmentCount = 5;
  
  // Act
  const result = await splitVideo(videoFile, segmentCount);
  
  // Assert
  expect(result.segments).toHaveLength(5);
});
```

### 3. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  // Reset state before each test
  resetVideoStore();
  jest.clearAllMocks();
});
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
it('should handle empty file', () => {});
it('should handle invalid file type', () => {});
it('should handle network errors', () => {});
```

### 5. Keep Tests Fast

Avoid slow operations in unit tests:

```typescript
// Use mocks instead of real API calls
jest.mock('../services/api');
```

### 6. Test User Behavior

Focus on testing what users see and do:

```typescript
// Good - tests user-visible behavior
expect(screen.getByText('Video uploaded')).toBeInTheDocument();

// Less ideal - tests implementation details
expect(component.state.isUploaded).toBe(true);
```

## CI/CD Integration

Tests run automatically on:

- **Push to main/develop branches**
- **Pull requests**

The CI pipeline includes:

1. **Backend Tests** - Unit and integration tests
2. **Frontend Tests** - Component and unit tests
3. **E2E Tests** - Full application testing
4. **Coverage Reports** - Uploaded to Codecov
5. **Docker Builds** - Verify container builds

### CI Test Results

- Test results are visible in GitHub Actions
- Coverage reports are uploaded as artifacts
- E2E test reports are available for download
- Failed tests block merges (if configured)

## Troubleshooting

### Tests Failing Locally

1. **Clear cache**: `npm test -- --clearCache`
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check environment variables**: Ensure `.env` files are configured

### E2E Tests Failing

1. **Install Playwright browsers**: `npx playwright install`
2. **Check server is running**: Backend and frontend must be running
3. **Increase timeout**: Some tests may need more time

### Coverage Issues

1. **Check thresholds**: Ensure code meets minimum coverage
2. **Exclude files**: Update `collectCoverageFrom` in jest.config.js
3. **Review coverage report**: Identify untested code paths

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Contributing

When adding new features:

1. Write tests alongside code
2. Maintain or improve coverage thresholds
3. Add E2E tests for user-facing features
4. Update this documentation if needed

---

For questions or issues, please open an issue on GitHub.
