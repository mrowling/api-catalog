/**
 * Quality Assessment Service
 * Evaluates OpenAPI spec quality based on completeness, structure, and best practices
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3_1 } from 'openapi-types';

export interface QualityScore {
  total: number;
  completeness: number;
  structure: number;
  standards: number;
  bestPractices: number;
}

export interface QualityIssue {
  category: 'completeness' | 'structure' | 'standards' | 'bestPractices';
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

export interface QualityReport {
  score: QualityScore;
  issues: QualityIssue[];
  suggestions: string[];
  passed: boolean; // true if score >= 85
}

export class QualityAssessmentService {
  private readonly PASSING_SCORE = 85;

  /**
   * Assess the quality of an OpenAPI spec
   */
  async assess(specYaml: string): Promise<QualityReport> {
    try {
      // Parse the spec
      const spec = await SwaggerParser.parse(specYaml) as OpenAPIV3_1.Document;

      const issues: QualityIssue[] = [];
      const suggestions: string[] = [];

      // Assess each category
      const completeness = this.assessCompleteness(spec, issues, suggestions);
      const structure = this.assessStructure(spec, issues, suggestions);
      const standards = this.assessStandards(spec, issues, suggestions);
      const bestPractices = this.assessBestPractices(spec, issues, suggestions);

      const total = Math.round(completeness + structure + standards + bestPractices);

      return {
        score: {
          total,
          completeness,
          structure,
          standards,
          bestPractices
        },
        issues,
        suggestions,
        passed: total >= this.PASSING_SCORE
      };
    } catch (error) {
      // If parsing fails, return a failing report
      return {
        score: {
          total: 0,
          completeness: 0,
          structure: 0,
          standards: 0,
          bestPractices: 0
        },
        issues: [{
          category: 'standards',
          severity: 'error',
          message: `Failed to parse spec: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        suggestions: ['Fix syntax errors in the OpenAPI specification'],
        passed: false
      };
    }
  }

  /**
   * Assess completeness (40 points)
   * - Operations have descriptions and summaries
   * - Error responses defined
   * - Examples provided
   */
  private assessCompleteness(
    spec: OpenAPIV3_1.Document,
    issues: QualityIssue[],
    suggestions: string[]
  ): number {
    let score = 40;
    let missingDescriptions = 0;
    let missingSummaries = 0;
    let missingErrorResponses = 0;
    let missingExamples = 0;

    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!pathItem) continue;

        for (const [method, operation] of Object.entries(pathItem)) {
          if (method.startsWith('x-') || method === 'parameters' || method === 'servers') continue;
          const op = operation as OpenAPIV3_1.OperationObject;

          // Check for description
          if (!op.description || op.description.trim().length === 0) {
            missingDescriptions++;
            score -= 2.5;
            issues.push({
              category: 'completeness',
              severity: 'warning',
              message: `Missing description`,
              path: `${method.toUpperCase()} ${path}`
            });
          }

          // Check for summary
          if (!op.summary || op.summary.trim().length === 0) {
            missingSummaries++;
            score -= 1.25;
          }

          // Check for error responses (400, 500 at minimum)
          const responses = op.responses || {};
          const hasErrorResponse = Object.keys(responses).some(code => 
            code.startsWith('4') || code.startsWith('5')
          );
          if (!hasErrorResponse) {
            missingErrorResponses++;
            score -= 2.5;
            issues.push({
              category: 'completeness',
              severity: 'warning',
              message: `No error responses defined`,
              path: `${method.toUpperCase()} ${path}`
            });
          }

          // Check for examples (in request body or responses)
          const hasExamples = this.hasExamples(op);
          if (!hasExamples) {
            missingExamples++;
            score -= 3.75;
          }
        }
      }
    }

    // Add suggestions
    if (missingDescriptions > 0) {
      suggestions.push(`Add descriptions to ${missingDescriptions} operations`);
    }
    if (missingSummaries > 0) {
      suggestions.push(`Add summaries to ${missingSummaries} operations`);
    }
    if (missingErrorResponses > 0) {
      suggestions.push(`Add error responses (400, 500) to ${missingErrorResponses} operations`);
    }
    if (missingExamples > 0) {
      suggestions.push(`Add request/response examples to ${missingExamples} operations`);
    }

    return Math.max(0, score);
  }

  /**
   * Assess structure (30 points)
   * - Proper use of components section
   * - $ref usage for reusable schemas
   */
  private assessStructure(
    spec: OpenAPIV3_1.Document,
    issues: QualityIssue[],
    suggestions: string[]
  ): number {
    let score = 30;

    // Check if components section exists
    if (!spec.components || Object.keys(spec.components).length === 0) {
      score -= 15;
      issues.push({
        category: 'structure',
        severity: 'warning',
        message: 'No components section defined - consider extracting reusable schemas'
      });
      suggestions.push('Extract common schemas to components section');
    } else {
      // Check for schemas in components
      if (!spec.components.schemas || Object.keys(spec.components.schemas).length === 0) {
        score -= 10;
        suggestions.push('Define reusable schemas in components/schemas');
      }
    }

    // Check for $ref usage (good practice)
    const refCount = this.countRefs(spec);
    if (refCount === 0 && spec.components?.schemas && Object.keys(spec.components.schemas).length > 0) {
      score -= 15;
      issues.push({
        category: 'structure',
        severity: 'info',
        message: 'Schemas defined but not referenced - consider using $ref'
      });
      suggestions.push('Use $ref to reference reusable schemas');
    }

    return Math.max(0, score);
  }

  /**
   * Assess standards compliance (20 points)
   * - Valid OpenAPI 3.1.x
   * - Consistent naming conventions
   */
  private assessStandards(
    spec: OpenAPIV3_1.Document,
    issues: QualityIssue[],
    suggestions: string[]
  ): number {
    let score = 20;

    // Check OpenAPI version
    if (!spec.openapi || !spec.openapi.startsWith('3.1')) {
      score -= 10;
      issues.push({
        category: 'standards',
        severity: 'error',
        message: `OpenAPI version should be 3.1.x, got ${spec.openapi}`
      });
      suggestions.push('Update to OpenAPI 3.1.x');
    }

    // Check naming conventions
    const namingIssues = this.checkNamingConventions(spec);
    if (namingIssues.length > 0) {
      score -= Math.min(10, namingIssues.length * 2);
      namingIssues.forEach(issue => issues.push(issue));
      suggestions.push('Follow naming conventions: PascalCase for schemas, camelCase for properties, kebab-case for operationIds');
    }

    return Math.max(0, score);
  }

  /**
   * Assess best practices (10 points)
   * - Security schemes defined if needed
   * - API versioning
   */
  private assessBestPractices(
    spec: OpenAPIV3_1.Document,
    issues: QualityIssue[],
    suggestions: string[]
  ): number {
    let score = 10;

    // Check for security schemes (if there are protected endpoints)
    const hasProtectedEndpoints = this.hasProtectedEndpoints(spec);
    if (hasProtectedEndpoints && (!spec.components?.securitySchemes || Object.keys(spec.components.securitySchemes).length === 0)) {
      score -= 5;
      issues.push({
        category: 'bestPractices',
        severity: 'info',
        message: 'Consider adding security schemes for protected endpoints'
      });
      suggestions.push('Define security schemes in components/securitySchemes');
    }

    // Check for versioning (in URL or header)
    const hasVersioning = this.hasVersioning(spec);
    if (!hasVersioning) {
      score -= 5;
      issues.push({
        category: 'bestPractices',
        severity: 'info',
        message: 'Consider adding API versioning (e.g., /v1/...)'
      });
      suggestions.push('Add API version to server URLs or paths');
    }

    return Math.max(0, score);
  }

  /**
   * Check if operation has examples
   */
  private hasExamples(operation: OpenAPIV3_1.OperationObject): boolean {
    // Check request body
    if (operation.requestBody && !('$ref' in operation.requestBody)) {
      const content = operation.requestBody.content;
      if (content) {
        for (const mediaType of Object.values(content)) {
          if (mediaType.example || mediaType.examples) {
            return true;
          }
        }
      }
    }

    // Check responses
    if (operation.responses) {
      for (const response of Object.values(operation.responses)) {
        if (response && !('$ref' in response)) {
          const content = response.content;
          if (content) {
            for (const mediaType of Object.values(content)) {
              if (mediaType.example || mediaType.examples) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Count $ref usage in spec
   */
  private countRefs(obj: any): number {
    let count = 0;
    if (typeof obj === 'object' && obj !== null) {
      if (obj.$ref) {
        count++;
      }
      for (const value of Object.values(obj)) {
        count += this.countRefs(value);
      }
    }
    return count;
  }

  /**
   * Check naming conventions
   */
  private checkNamingConventions(spec: OpenAPIV3_1.Document): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check schema names (should be PascalCase)
    if (spec.components?.schemas) {
      for (const schemaName of Object.keys(spec.components.schemas)) {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(schemaName)) {
          issues.push({
            category: 'standards',
            severity: 'info',
            message: `Schema name should be PascalCase: ${schemaName}`,
            path: `components.schemas.${schemaName}`
          });
        }
      }
    }

    // Check operationIds (should be kebab-case)
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!pathItem) continue;
        for (const [method, operation] of Object.entries(pathItem)) {
          if (method.startsWith('x-') || method === 'parameters' || method === 'servers') continue;
          const op = operation as OpenAPIV3_1.OperationObject;
          if (op.operationId && !/^[a-z][a-z0-9-]*$/.test(op.operationId)) {
            issues.push({
              category: 'standards',
              severity: 'info',
              message: `operationId should be kebab-case: ${op.operationId}`,
              path: `${method} ${path}`
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check if spec has protected endpoints
   */
  private hasProtectedEndpoints(spec: OpenAPIV3_1.Document): boolean {
    // Simple heuristic: if there are POST/PUT/DELETE operations, likely need auth
    if (spec.paths) {
      for (const pathItem of Object.values(spec.paths)) {
        if (!pathItem) continue;
        if (pathItem.post || pathItem.put || pathItem.delete || pathItem.patch) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if spec has versioning
   */
  private hasVersioning(spec: OpenAPIV3_1.Document): boolean {
    // Check server URLs
    if (spec.servers) {
      for (const server of spec.servers) {
        if (server.url && /\/v\d+/.test(server.url)) {
          return true;
        }
      }
    }

    // Check if paths start with version
    if (spec.paths) {
      for (const path of Object.keys(spec.paths)) {
        if (/^\/v\d+/.test(path)) {
          return true;
        }
      }
    }

    return false;
  }
}

export const qualityAssessmentService = new QualityAssessmentService();
