/**
 * Validation service
 * Uses swagger-parser with YAML line tracking for OpenAPI 3.1 validation
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import YAML, { LineCounter } from 'yaml';
import type { ValidationResponse, ValidationError } from '../types/index.js';

interface LineMapEntry {
  path: string;
  line: number;
  column: number;
}

export class ValidationService {
  /**
   * Validate an OpenAPI 3.1 specification
   * @param spec - The spec as string (YAML/JSON) or object
   * @returns Validation result with errors and parsed spec
   */
  async validate(spec: string | object): Promise<ValidationResponse> {
    try {
      // Parse if string with line tracking
      let parsedSpec: object;
      let lineMap: LineMapEntry[] = [];
      
      if (typeof spec === 'string') {
        const parseResult = this.parseSpecWithLineMap(spec);
        parsedSpec = parseResult.parsed;
        lineMap = parseResult.lineMap;
      } else {
        parsedSpec = spec;
      }

      // Detect version
      const version = this.detectVersion(parsedSpec);
      
      // Only support OpenAPI 3.1.x
      let errors: ValidationError[] = [];
      if (!version?.startsWith('3.1')) {
        errors = [{
          message: `Unsupported OpenAPI version: ${version || 'unknown'}. Only OpenAPI 3.1.x is supported.`,
          severity: 'error'
        }];
      } else {
        // Use swagger-parser for proper OpenAPI validation with line number mapping
        try {
          const parser = new SwaggerParser();
          await parser.validate(parsedSpec as any);
        } catch (validationError: any) {
          // Parse swagger-parser errors and add line numbers
          if (validationError.details && Array.isArray(validationError.details)) {
            errors = this.parseSwaggerParserErrors(validationError.details, lineMap);
          } else {
            errors = [{
              message: validationError.message || 'Validation error',
              severity: 'error'
            }];
          }
        }
      }

      return {
        valid: errors.length === 0,
        version,
        errors,
        spec: errors.length === 0 ? (parsedSpec as any) : undefined
      };
    } catch (error) {
      // Parse error with line info
      const errors = this.parseValidationError(error, typeof spec === 'string' ? spec : undefined);
      return {
        valid: false,
        errors,
        spec: undefined
      };
    }
  }

  /**
   * Parse spec and create line number map using YAML CST
   */
  private parseSpecWithLineMap(spec: string): { parsed: object; lineMap: LineMapEntry[] } {
    // Try JSON first
    try {
      return { parsed: JSON.parse(spec), lineMap: this.createJSONLineMap(spec) };
    } catch {
      // Try YAML with CST parsing
      const lineCounter = new LineCounter();
      const doc = YAML.parseDocument(spec, { lineCounter, keepSourceTokens: true });
      
      // Check for parse errors
      if (doc.errors && doc.errors.length > 0) {
        const error = doc.errors[0];
        throw error;
      }
      
      const lineMap = this.createYAMLLineMap(doc, lineCounter);
      return { parsed: doc.toJS(), lineMap };
    }
  }

  /**
   * Create line map from YAML CST
   */
  private createYAMLLineMap(doc: YAML.Document, lineCounter: LineCounter): LineMapEntry[] {
    const lineMap: LineMapEntry[] = [];
    
    const traverse = (node: any, path: string[] = []) => {
      if (!node) return;
      
      if (node instanceof YAML.YAMLMap) {
        for (const pair of node.items) {
          const key = String(pair.key?.value ?? pair.key);
          const newPath = [...path, key];
          
          if (pair.key && pair.key.range) {
            const pos = lineCounter.linePos(pair.key.range[0]);
            lineMap.push({
              path: newPath.join('.'),
              line: pos.line,
              column: pos.col
            });
          }
          
          traverse(pair.value, newPath);
        }
      } else if (node instanceof YAML.YAMLSeq) {
        for (let i = 0; i < node.items.length; i++) {
          const newPath = [...path, String(i)];
          traverse(node.items[i], newPath);
        }
      }
    };
    
    traverse(doc.contents);
    return lineMap;
  }

  /**
   * Create line map from JSON
   */
  private createJSONLineMap(spec: string): LineMapEntry[] {
    const lineMap: LineMapEntry[] = [];
    const lines = spec.split('\n');
    
    const buildPathFromLine = (line: string, currentPath: string[]): string[] => {
      const trimmed = line.trim();
      const match = trimmed.match(/^"([^"]+)"\s*:/);
      if (match) {
        return [...currentPath, match[1]];
      }
      return currentPath;
    };
    
    // Track paths based on indentation
    const pathStack: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      const indent = line.search(/\S/);
      const level = Math.floor(indent / 2);
      
      // Pop stack to current level
      while (pathStack.length > level) {
        pathStack.pop();
      }
      
      const currentPath = pathStack[pathStack.length - 1] || [];
      const newPath = buildPathFromLine(line, currentPath);
      
      if (newPath.length > currentPath.length) {
        lineMap.push({
          path: newPath.join('.'),
          line: i + 1,
          column: indent + 1
        });
        pathStack[level] = newPath;
      }
    }
    
    return lineMap;
  }

  /**
   * Parse swagger-parser validation errors and add line numbers
   */
  private parseSwaggerParserErrors(details: any[], lineMap: LineMapEntry[]): ValidationError[] {
    return details.map((detail: any) => {
      const path = detail.instancePath?.split('/').filter(Boolean) || [];
      const pathStr = path.join('.');
      
      // Find line number
      let line: number | undefined;
      let column: number | undefined;
      
      // Check if error has unevaluatedProperty in params
      if (detail.params && detail.params.unevaluatedProperty) {
        const propName = detail.params.unevaluatedProperty;
        const fullPath = path.length > 0 ? `${pathStr}.${propName}` : propName;
        const propMatch = lineMap.find(entry => entry.path === fullPath);
        if (propMatch) {
          line = propMatch.line;
          column = propMatch.column;
        }
      }
      
      // Try exact path match
      if (!line) {
        const exactMatch = lineMap.find(entry => entry.path === pathStr);
        if (exactMatch) {
          line = exactMatch.line;
          column = exactMatch.column;
        }
      }
      
      // Try parent path
      if (!line && path.length > 0) {
        for (let i = path.length - 1; i >= 0; i--) {
          const parentPath = path.slice(0, i).join('.');
          const parentMatch = lineMap.find(entry => entry.path === parentPath);
          if (parentMatch) {
            line = parentMatch.line;
            column = parentMatch.column;
            break;
          }
        }
      }
      
      return {
        message: detail.message || 'Validation error',
        path,
        severity: 'error',
        ...(line !== undefined && { line }),
        ...(column !== undefined && { column })
      };
    });
  }

  /**
   * Check for unknown top-level properties
   */
  private checkUnknownProperties(spec: object, version: string, lineMap: LineMapEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const s = spec as Record<string, unknown>;
    
    // Define known top-level properties for OpenAPI 3.x
    const knownProps = new Set([
      'openapi', 'swagger', 'info', 'servers', 'paths', 'components', 
      'security', 'tags', 'externalDocs', 'webhooks', 'jsonSchemaDialect'
    ]);
    
    for (const [key, value] of Object.entries(s)) {
      if (!knownProps.has(key) && !key.startsWith('x-')) {
        const propMatch = lineMap.find(entry => entry.path === key);
        errors.push({
          message: `Unknown property '${key}' at root level`,
          path: [],
          severity: 'error',
          ...(propMatch && { line: propMatch.line, column: propMatch.column })
        });
      }
    }
    
    return errors;
  }

  /**
   * Parse validation error with line information
   */
  private parseValidationError(error: unknown, originalSpec?: string): ValidationError[] {
    if (error instanceof Error) {
      // Handle YAML parse errors
      if (error instanceof YAML.YAMLError) {
        const yamlError = error as YAML.YAMLError & { linePos?: Array<{ line: number; col: number }> };
        return [{
          message: error.message,
          severity: 'error',
          line: yamlError.linePos?.[0]?.line,
          column: yamlError.linePos?.[0]?.col
        }];
      }
      
      // Handle JSON parse errors
      if (error.message.includes('JSON')) {
        const lineMatch = error.message.match(/line\s*(\d+)/i);
        return [{
          message: error.message,
          severity: 'error',
          line: lineMatch ? parseInt(lineMatch[1], 10) : undefined
        }];
      }

      return [{
        message: error.message,
        severity: 'error'
      }];
    }

    return [{
      message: 'Unknown validation error',
      severity: 'error'
    }];
  }

  /**
   * Detect OpenAPI version from spec
   */
  private detectVersion(spec: object): string | undefined {
    const s = spec as Record<string, unknown>;
    if ('openapi' in s && typeof s.openapi === 'string') {
      return s.openapi;
    }
    if ('swagger' in s && typeof s.swagger === 'string') {
      return s.swagger;
    }
    return undefined;
  }

  /**
   * Dereference a spec (resolve all $ref pointers)
   */
  async dereference(spec: string | object): Promise<object> {
    let parsedSpec: object;
    if (typeof spec === 'string') {
      parsedSpec = this.parseSpec(spec);
    } else {
      parsedSpec = spec;
    }

    const parser = new SwaggerParser();
    return await parser.dereference(parsedSpec as any);
  }

  /**
   * Bundle a spec (resolve $ref but keep references)
   */
  async bundle(spec: string | object): Promise<object> {
    let parsedSpec: object;
    if (typeof spec === 'string') {
      parsedSpec = this.parseSpec(spec);
    } else {
      parsedSpec = spec;
    }

    const parser = new SwaggerParser();
    return await parser.bundle(parsedSpec as any);
  }

  /**
   * Legacy parse method for dereference/bundle
   */
  private parseSpec(spec: string): object {
    try {
      return JSON.parse(spec);
    } catch {
      return YAML.parse(spec) as object;
    }
  }
}

// Export singleton instance
export const validationService = new ValidationService();
