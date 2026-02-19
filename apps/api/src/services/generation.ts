/**
 * OpenAPI Generation Service
 * Uses AI providers to generate OpenAPI specifications from natural language
 */

import type { AIMessage } from '@ai-openapi/shared';
import { AIProviderFactory } from '@ai-openapi/shared';
import { config } from '../config.js';

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
- Use kebab-case for paths
- Use camelCase for property names in schemas

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

Return ONLY the updated OpenAPI specification in YAML format. Do not include any explanations or markdown code blocks.`;

export interface GenerateOptions {
  description: string;
  mode: 'create' | 'modify';
  existingSpec?: string;
}

export interface GenerateResult {
  spec: string;
  format: 'yaml';
  version: string;
  model?: string;
}

export class GenerationService {
  /**
   * Generate an OpenAPI spec from natural language
   */
  async generate(options: GenerateOptions): Promise<string> {
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

    // Build messages based on mode
    const messages: AIMessage[] = [];

    if (options.mode === 'create') {
      messages.push({
        role: 'system',
        content: SYSTEM_PROMPT,
      });
      messages.push({
        role: 'user',
        content: options.description,
      });
    } else {
      // Modify mode
      if (!options.existingSpec) {
        throw new Error('Existing spec is required for modify mode');
      }

      messages.push({
        role: 'system',
        content: MODIFY_SYSTEM_PROMPT,
      });
      messages.push({
        role: 'user',
        content: `Here is the existing OpenAPI specification:\n\n\`\`\`yaml\n${options.existingSpec}\n\`\`\`\n\nPlease make the following changes:\n\n${options.description}`,
      });
    }

    // Get completion from AI
    const result = await provider.complete(messages, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Clean up the response (remove markdown code blocks if present)
    let spec = result.content.trim();
    
    // Remove markdown code blocks
    spec = spec.replace(/^```ya?ml\n/i, '');
    spec = spec.replace(/\n```$/,  '');
    spec = spec.trim();

    // Validate it starts with openapi
    if (!spec.startsWith('openapi:')) {
      throw new Error('Generated content does not appear to be a valid OpenAPI spec');
    }

    return spec;
  }
}

// Export singleton instance
export const generationService = new GenerationService();
