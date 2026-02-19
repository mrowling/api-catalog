/**
 * API Request/Response Types
 * Types for backend API communication
 */

import type { OpenApiSpec } from './openapi.js';

// Validation
export interface ValidationRequest {
  spec: string | object;
  format?: 'yaml' | 'json';
}

export interface ValidationError {
  message: string;
  path?: string[];
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export interface ValidationResponse {
  valid: boolean;
  version?: string;
  errors: ValidationError[];
  spec?: OpenApiSpec;
}

// Generation
export interface GenerationRequest {
  description: string;
  existingSpec?: string;
  mode?: 'create' | 'modify';
}

export interface GenerationResponse {
  spec: string;
  format: 'yaml';
  version: string;
  message?: string;
}

// Conversion
export interface ConversionRequest {
  spec: string;
  fromVersion: string;
  toVersion: string;
}

export interface ConversionResponse {
  spec: string;
  version: string;
  warnings?: string[];
}

// Diff
export interface DiffRequest {
  originalSpec: string;
  modifiedSpec: string;
}

export interface DiffResponse {
  hasChanges: boolean;
  additions: number;
  deletions: number;
  modifications: number;
  diff: string;
}

// Health Check
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  services: {
    copilot: 'connected' | 'disconnected';
    validation: 'ok' | 'error';
  };
}
