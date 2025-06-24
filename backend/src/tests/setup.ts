// Jest setup file for backend tests
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MINDSDB_HOST = 'localhost';
process.env.MINDSDB_PORT = '47334';
process.env.MINDSDB_USER = 'mindsdb';
process.env.MINDSDB_PASSWORD = '';
process.env.OPENAI_API_KEY = 'test-key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
