/**
 * Natural Language Processing Types
 * Types for Copilot SDK integration
 */

export interface CopilotGenerationPrompt {
  description: string;
  context?: string;
  existingSpec?: string;
  mode: 'create' | 'modify';
  instructions?: string;
}

export interface CopilotResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

// Pre-built prompt templates for different API styles
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: 'restful',
    description: 'RESTful API design with standard HTTP methods',
    template: `Generate a complete OpenAPI 3.1.0 specification for the following API:

{description}

Requirements:
- Use RESTful conventions (GET for retrieval, POST for creation, PUT/PATCH for updates, DELETE for removal)
- Include proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Define request and response schemas with detailed fields
- Include example values for all fields
- Add security schemes if authentication is mentioned
- Use tags to group related operations
- Include summary and description for each operation

Output the specification in YAML format.`,
    variables: ['description']
  },
  {
    name: 'modify',
    description: 'Modify an existing OpenAPI specification',
    template: `Modify the following OpenAPI 3.1.0 specification based on the requested changes:

REQUESTED CHANGES:
{description}

EXISTING SPECIFICATION:
{existingSpec}

Instructions:
1. Apply only the requested changes
2. Maintain the existing structure and style
3. Preserve all existing endpoints not mentioned in changes
4. Update version number if significant changes are made
5. Ensure the result is valid OpenAPI 3.1.0

Output the complete modified specification in YAML format.`,
    variables: ['description', 'existingSpec']
  },
  {
    name: 'enhance',
    description: 'Enhance an existing specification with additional details',
    template: `Enhance the following OpenAPI 3.1.0 specification by adding missing details:

{description}

EXISTING SPECIFICATION:
{existingSpec}

Enhancement tasks:
1. Add detailed descriptions to all schemas and fields
2. Include example values where missing
3. Add appropriate validation constraints (minLength, maxLength, pattern, etc.)
4. Expand operation descriptions with business context
5. Add error response schemas for all endpoints
6. Include pagination parameters for list endpoints

Output the enhanced specification in YAML format.`,
    variables: ['description', 'existingSpec']
  }
];
