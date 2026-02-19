/**
 * Tests for shared utilities
 */

import { describe, it, expect } from 'vitest';
import {
  detectOpenApiVersion,
  isOpenApi31,
  safeJsonParse,
  formatError,
  truncate,
  generateOperationId,
} from '../../utils/index.js';

describe('Utils', () => {
  describe('detectOpenApiVersion', () => {
    it('should detect OpenAPI 3.1.0 version', () => {
      const spec = { openapi: '3.1.0' };
      expect(detectOpenApiVersion(spec)).toBe('3.1.0');
    });

    it('should return null for spec without version', () => {
      const spec = { info: { title: 'Test' } };
      expect(detectOpenApiVersion(spec)).toBeNull();
    });
  });

  describe('isOpenApi31', () => {
    it('should return true for 3.1.x versions', () => {
      expect(isOpenApi31('3.1.0')).toBe(true);
      expect(isOpenApi31('3.1.1')).toBe(true);
    });

    it('should return false for non-3.1.x versions', () => {
      expect(isOpenApi31('3.0.3')).toBe(false);
      expect(isOpenApi31('2.0')).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('should return default value for invalid JSON', () => {
      expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true });
    });

    it('should parse JSON arrays', () => {
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    });
  });

  describe('formatError', () => {
    it('should format Error object', () => {
      const error = new Error('Test error message');
      expect(formatError(error)).toBe('Test error message');
    });

    it('should format string error', () => {
      expect(formatError('String error')).toBe('String error');
    });

    it('should format unknown error', () => {
      expect(formatError(123)).toBe('Unknown error occurred');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('Short', 100)).toBe('Short');
    });

    it('should truncate long strings with ellipsis', () => {
      const longString = 'This is a very long string that needs truncation';
      expect(truncate(longString, 20)).toBe('This is a very lo...');
    });

    it('should handle exact length strings', () => {
      const exact = 'Exactly 10';
      expect(truncate(exact, 10)).toBe('Exactly 10');
    });
  });

  describe('generateOperationId', () => {
    it('should generate operation ID from GET /users', () => {
      expect(generateOperationId('GET', '/users')).toBe('get_users');
    });

    it('should generate operation ID from POST /users/{id}', () => {
      expect(generateOperationId('POST', '/users/{id}')).toBe('post_users_id');
    });

    it('should handle paths with hyphens', () => {
      expect(generateOperationId('GET', '/user-profiles')).toBe('get_user_profiles');
    });

    it('should handle paths with multiple slashes', () => {
      expect(generateOperationId('PUT', '/api/v1/users')).toBe('put_api_v1_users');
    });

    it('should handle root path', () => {
      expect(generateOperationId('GET', '/')).toBe('get_');
    });
  });
});
