// Test setup file for backend tests
import { jest } from '@jest/globals';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock logger to avoid console noise during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
