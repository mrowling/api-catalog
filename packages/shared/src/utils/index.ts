/**
 * Shared utilities
 */

import type { OpenApiSpec } from '../types/openapi.js';

/**
 * Detect OpenAPI version from spec
 */
export function detectOpenApiVersion(spec: OpenApiSpec | object): string | null {
  if ('openapi' in spec && typeof spec.openapi === 'string') {
    return spec.openapi;
  }
  return null;
}

/**
 * Check if version is OpenAPI 3.1.x
 */
export function isOpenApi31(version: string): boolean {
  return version.startsWith('3.1');
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Format error message for display
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate unique operation ID
 */
export function generateOperationId(method: string, path: string): string {
  const cleanPath = path
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${method.toLowerCase()}_${cleanPath}`;
}
