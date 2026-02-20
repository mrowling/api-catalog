/**
 * Agentic Generation Service
 * Streaming generation with iteration, quality assessment, and template support
 */

import type { AIMessage } from '@ai-openapi/shared';
import { AIProviderFactory, validationService } from '@ai-openapi/shared';
import { config } from '../config.js';
import { templateDetectionService } from './template-detection.js';
import { generateDiff, generateChangeSummary } from '../utils/diff.js';

export type StreamEventType = 
  | 'status' 
  | 'question' 
  | 'result' 
  | 'diff' 
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  status?: 'analyzing' | 'generating' | 'validating' | 'improving' | 'complete';
  message?: string;
  question?: {
    id: string;
    text: string;
    options: string[];
    default?: string;
  };
  spec?: string;
  diff?: {
    added: string[];
    removed: string[];
    modified: string[];
    preview: string;
  };
  error?: string;
  validationErrors?: Array<{
    message: string;
    line?: number;
    column?: number;
    path?: string[];
  }>;
}

export interface AgenticGenerationRequest {
  description: string;
  mode?: 'create' | 'modify';
  conversationHistory?: AIMessage[];
  currentSpec?: string;
  userPreferences?: {
    includePagination?: boolean;
    includeAuth?: boolean;
    authType?: 'bearer' | 'apiKey' | 'oauth2';
    includeErrorHandling?: boolean;
  };
  templateName?: string; // User can override template
}

const SYSTEM_PROMPT = `You are an expert at creating OpenAPI 3.1 specifications.

Your task is to generate valid, well-structured OpenAPI 3.1 specifications based on the user's description.

Guidelines:
- Always use OpenAPI 3.1.0 format
- Include all required fields: openapi, info (title, version), paths
- Use clear, descriptive titles and descriptions
- Follow REST API best practices
- Include appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Define request bodies and responses with proper schemas
- Use standard HTTP status codes
- Include examples where appropriate
- Use kebab-case for operationIds
- Use camelCase for property names in schemas
- Use PascalCase for schema names
- Always define reusable schemas in components section
- Use $ref to reference schemas

Return ONLY the OpenAPI specification in YAML format. Do not include any explanations or markdown code blocks.`;

const MODIFY_SYSTEM_PROMPT = `You are an expert at modifying OpenAPI 3.1 specifications.

Your task is to update the existing OpenAPI specification based on the user's requested changes.

Guidelines:
- Maintain OpenAPI 3.1.0 format
- Preserve existing structure unless explicitly asked to change it
- Follow REST API best practices
- Ensure all modifications are valid and maintain spec consistency
- Use clear, descriptive titles and descriptions
- Include examples where appropriate
- Use kebab-case for operationIds
- Use camelCase for property names in schemas
- Use PascalCase for schema names

Return ONLY the updated OpenAPI specification in YAML format. Do not include any explanations or markdown code blocks.`;

const FIX_VALIDATION_PROMPT = `You are an expert at fixing OpenAPI 3.1 specification validation errors.

Given an OpenAPI spec and a list of validation errors, fix all the errors while preserving the spec's functionality and structure.

Common fixes:
- Fix YAML syntax errors (indentation, quotes, colons, etc.)
- Add missing required fields (openapi, info.title, info.version, paths)
- Fix invalid property names or values
- Remove unknown/invalid properties
- Ensure proper schema definitions
- Fix reference ($ref) errors

Return ONLY the corrected OpenAPI specification in YAML format. Do not include explanations or markdown code blocks.`;

export class AgenticGenerationService {
  private readonly MAX_VALIDATION_FIX_ATTEMPTS = 3;

  /**
   * Generate spec with streaming updates
   */
  async *generateStream(request: AgenticGenerationRequest): AsyncGenerator<StreamEvent> {
    try {
      console.log('[AgenticGeneration] Starting stream generation...');
      console.log('[AgenticGeneration] Description:', request.description);
      
      // 1. Analyzing phase
      yield {
        type: 'status',
        status: 'analyzing',
        message: 'Analyzing requirements...'
      };

      // Detect template
      console.log('[AgenticGeneration] Detecting template...');
      const detection = templateDetectionService.detectTemplate(request.description);
      const templateInfo = request.templateName
        ? templateDetectionService.getTemplateByName(request.templateName)
        : detection?.template;

      if (templateInfo) {
        console.log('[AgenticGeneration] Template detected:', templateInfo.name);
        yield {
          type: 'status',
          status: 'analyzing',
          message: `Auto-selected: ${templateInfo.name} template`
        };
      } else {
        console.log('[AgenticGeneration] No template detected');
      }

      // 2. Pattern suggestions (informational questions)
      console.log('[AgenticGeneration] Detecting patterns...');
      const suggestedPatterns = this.detectPatterns(request.description);
      console.log('[AgenticGeneration] Suggested patterns:', suggestedPatterns);
      
      // Determine which patterns to include based on preferences or defaults
      const patterns: string[] = [];
      const patternDecisions: Array<{name: string; included: boolean; reason: string}> = [];
      
      // Pagination
      if (suggestedPatterns.includes('pagination')) {
        const include = request.userPreferences?.includePagination !== false;
        if (include) {
          patterns.push('pagination');
        }
        patternDecisions.push({
          name: 'pagination',
          included: include,
          reason: include ? 'Auto-detected list/search operations' : 'Disabled by user preference'
        });
      }
      
      // Authentication
      if (suggestedPatterns.includes('authentication')) {
        const include = request.userPreferences?.includeAuth === true;
        if (include) {
          patterns.push('authentication');
          patternDecisions.push({
            name: 'authentication',
            included: true,
            reason: `Adding ${request.userPreferences?.authType || 'bearer'} authentication`
          });
        } else {
          patternDecisions.push({
            name: 'authentication',
            included: false,
            reason: 'Optional - not requested'
          });
        }
      }
      
      // Error handling (always recommended)
      if (request.userPreferences?.includeErrorHandling !== false) {
        patterns.push('error-handling');
        patternDecisions.push({
          name: 'error-handling',
          included: true,
          reason: 'RFC 7807 Problem Details format'
        });
      }
      
      // Yield informational question showing what will be included
      if (patternDecisions.length > 0) {
        yield {
          type: 'question',
          question: {
            id: 'patterns-info',
            text: 'Pattern recommendations (auto-applying based on analysis)',
            options: patternDecisions.map(p => 
              `[${p.included ? '✓' : ' '}] ${p.name}: ${p.reason}`
            ),
            default: undefined
          },
          message: 'Applying recommended patterns...'
        };
      }
      
      console.log('[AgenticGeneration] Selected patterns:', patterns);

      // 3. Generation phase
      console.log('[AgenticGeneration] Starting initial spec generation...');
      yield {
        type: 'status',
        status: 'generating',
        message: 'Generating OpenAPI specification...'
      };

      let spec = await this.generateInitialSpec(
        request.description,
        request.mode || 'create',
        request.currentSpec,
        templateInfo,
        patterns,
        request.userPreferences
      );
      console.log('[AgenticGeneration] Spec generated, length:', spec.length);

      // Validate and auto-fix if needed
      yield {
        type: 'status',
        status: 'validating',
        message: 'Validating specification...'
      };

      let validationAttempt = 0;
      while (validationAttempt < this.MAX_VALIDATION_FIX_ATTEMPTS) {
        const validationResult = await validationService.validate(spec);
        
        if (validationResult.valid) {
          console.log('[AgenticGeneration] Validation passed');
          break;
        }

        console.log('[AgenticGeneration] Validation failed with', validationResult.errors.length, 'errors');
        validationAttempt++;

        if (validationAttempt >= this.MAX_VALIDATION_FIX_ATTEMPTS) {
          console.log('[AgenticGeneration] Max validation fix attempts reached');
          // Return spec with validation errors
          const errorMessages = validationResult.errors.map(e => {
            const location = e.line ? ` (line ${e.line})` : '';
            return `${e.message}${location}`;
          }).join('\n- ');
          
          yield {
            type: 'error',
            error: `Validation errors:\n- ${errorMessages}`,
            message: 'Generated spec has validation errors that could not be auto-fixed',
            validationErrors: validationResult.errors.map(e => ({
              message: e.message,
              line: e.line,
              column: e.column,
              path: e.path
            }))
          };
          return;
        }

        // Try to auto-fix
        yield {
          type: 'status',
          status: 'improving',
          message: `Fixing ${validationResult.errors.length} validation error${validationResult.errors.length > 1 ? 's' : ''}... (attempt ${validationAttempt}/${this.MAX_VALIDATION_FIX_ATTEMPTS})`
        };

        spec = await this.fixValidationErrors(spec, validationResult.errors);
        console.log('[AgenticGeneration] Applied fixes, re-validating...');
      }

      // Generate diff if in modify mode
      if (request.mode === 'modify' && request.currentSpec) {
        console.log('[AgenticGeneration] Generating diff for modify mode');
        const diff = generateDiff(request.currentSpec, spec);
        const summary = generateChangeSummary(diff);
        
        yield {
          type: 'diff',
          diff: {
            added: diff.added,
            removed: diff.removed,
            modified: diff.modified,
            preview: diff.preview
          },
          message: summary
        };
      }

      yield {
        type: 'result',
        spec
      };

    } catch (error) {
      console.error('[AgenticGeneration] Error during generation:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to generate specification'
      };
    }
  }

  /**
   * Detect which patterns should be suggested
   */
  private detectPatterns(description: string): string[] {
    const patterns: string[] = [];
    const lower = description.toLowerCase();

    // Pagination indicators
    if (lower.includes('list') || lower.includes('search') || lower.includes('many')) {
      patterns.push('pagination');
    }

    // Auth indicators
    if (lower.includes('auth') || lower.includes('login') || lower.includes('user') || 
        lower.includes('protected') || lower.includes('secure')) {
      patterns.push('authentication');
    }

    // Always suggest error handling
    patterns.push('error-handling');

    return patterns;
  }

  /**
   * Generate initial spec
   */
  private async generateInitialSpec(
    description: string,
    mode: 'create' | 'modify',
    currentSpec: string | undefined,
    templateInfo: any,
    patterns: string[],
    preferences?: any
  ): Promise<string> {
    console.log('[AgenticGeneration] generateInitialSpec called');
    console.log('[AgenticGeneration] Mode:', mode);
    console.log('[AgenticGeneration] Template info:', templateInfo?.name);
    console.log('[AgenticGeneration] Patterns:', patterns);
    
    const provider = AIProviderFactory.getProvider({
      provider: config.aiProvider as any,
      defaultModel: config.aiModel,
      openRouterApiKey: config.openRouterApiKey,
      openRouterSiteUrl: config.openRouterSiteUrl,
      openRouterSiteName: config.openRouterSiteName,
    } as any);

    if (!provider.isConfigured()) {
      throw new Error('AI provider is not configured');
    }
    console.log('[AgenticGeneration] Provider configured');

    // Build enhanced prompt with template context
    let enhancedDescription = description;
    
    if (templateInfo) {
      enhancedDescription += `\n\nUse the ${templateInfo.domain} pattern as a foundation.`;
    }

    if (patterns.length > 0) {
      enhancedDescription += `\n\nInclude these patterns: ${patterns.join(', ')}.`;
    }

    if (preferences?.includeAuth) {
      enhancedDescription += `\n\nInclude ${preferences.authType || 'bearer token'} authentication.`;
    }

    console.log('[AgenticGeneration] Enhanced description:', enhancedDescription);

    const messages: AIMessage[] = [];
    
    if (mode === 'modify') {
      // Modify mode - include existing spec
      if (!currentSpec) {
        throw new Error('currentSpec is required for modify mode');
      }
      
      messages.push({
        role: 'system',
        content: MODIFY_SYSTEM_PROMPT
      });
      messages.push({
        role: 'user',
        content: `Here is the existing OpenAPI specification:\n\n\`\`\`yaml\n${currentSpec}\n\`\`\`\n\nPlease make the following changes:\n\n${enhancedDescription}`
      });
    } else {
      // Create mode - fresh generation
      messages.push({
        role: 'system',
        content: SYSTEM_PROMPT
      });
      messages.push({
        role: 'user',
        content: enhancedDescription
      });
    }

    console.log('[AgenticGeneration] Calling AI provider complete()...');
    const startTime = Date.now();
    const result = await provider.complete(messages, {
      temperature: 0.7,
      maxTokens: 4000,
    });
    const duration = Date.now() - startTime;
    console.log('[AgenticGeneration] AI provider complete() returned after', duration, 'ms');
    console.log('[AgenticGeneration] Response length:', result.content.length);

    // Clean up response
    let spec = result.content.trim();
    spec = spec.replace(/^```ya?ml\n/i, '');
    spec = spec.replace(/\n```$/, '');
    spec = spec.trim();

    if (!spec.startsWith('openapi:')) {
      console.error('[AgenticGeneration] Invalid spec generated, does not start with openapi:');
      console.error('[AgenticGeneration] First 200 chars:', spec.substring(0, 200));
      throw new Error('Generated content does not appear to be a valid OpenAPI spec');
    }

    console.log('[AgenticGeneration] Spec validated and cleaned');
    return spec;
  }

  /**
   * Fix validation errors in a spec
   */
  private async fixValidationErrors(spec: string, errors: any[]): Promise<string> {
    console.log('[AgenticGeneration] fixValidationErrors called');
    console.log('[AgenticGeneration] Number of errors to fix:', errors.length);
    
    const provider = AIProviderFactory.getProvider({
      provider: config.aiProvider as any,
      defaultModel: config.aiModel,
      openRouterApiKey: config.openRouterApiKey,
      openRouterSiteUrl: config.openRouterSiteUrl,
      openRouterSiteName: config.openRouterSiteName,
    } as any);

    if (!provider.isConfigured()) {
      throw new Error('AI provider is not configured');
    }

    // Format errors for the AI
    const errorList = errors.map((e, i) => {
      const location = e.line ? ` (line ${e.line}${e.column ? `, col ${e.column}` : ''})` : '';
      const path = e.path && e.path.length > 0 ? ` at ${e.path.join('.')}` : '';
      return `${i + 1}. ${e.message}${path}${location}`;
    }).join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: FIX_VALIDATION_PROMPT
      },
      {
        role: 'user',
        content: `Here is the OpenAPI specification with validation errors:\n\n\`\`\`yaml\n${spec}\n\`\`\`\n\nValidation errors to fix:\n${errorList}\n\nPlease fix all these errors and return the corrected specification.`
      }
    ];

    console.log('[AgenticGeneration] Calling AI provider to fix validation errors...');
    const startTime = Date.now();
    const result = await provider.complete(messages, {
      temperature: 0.3, // Lower temperature for more precise fixes
      maxTokens: 4000,
    });
    const duration = Date.now() - startTime;
    console.log('[AgenticGeneration] AI provider returned fixed spec after', duration, 'ms');

    let fixed = result.content.trim();
    fixed = fixed.replace(/^```ya?ml\n/i, '');
    fixed = fixed.replace(/\n```$/, '');
    fixed = fixed.trim();

    console.log('[AgenticGeneration] Fixed spec ready, length:', fixed.length);
    return fixed;
  }
}

export const agenticGenerationService = new AgenticGenerationService();
