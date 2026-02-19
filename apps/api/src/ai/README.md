# AI Generation Module

This module provides AI-powered OpenAPI specification generation using GitHub Copilot.

## Architecture

### Provider Abstraction

The `AIProvider` interface (`packages/shared/src/ai/types.ts`) defines the contract for AI providers:

```typescript
interface AIProvider {
  readonly name: string;
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
  isConfigured(): boolean;
}
```

### GitHub Copilot Provider

The production provider (`apps/api/src/ai/copilot-provider.ts`) uses the official `@github/copilot-sdk` package to integrate with GitHub Copilot CLI.

**Requirements:**
- GitHub Copilot CLI must be installed: `gh extension install github/gh-copilot`
- Must be authenticated: `gh auth login`

**Features:**
- Session-based API with event handling
- 60-second timeout protection
- Automatic cleanup of sessions
- Support for system messages
- Configurable model selection (defaults to `gpt-5-mini`)

### Mock Provider

For testing purposes, a mock provider (`apps/api/src/ai/mock-provider.ts`) generates simple OpenAPI specifications without requiring external services.

**Usage in tests:**
```typescript
import { AIProviderFactory } from '../ai/provider-factory';

const provider = AIProviderFactory.getMockProvider();
const result = await provider.complete(messages);
```

## Configuration

Set the AI model via environment variable (optional):

```bash
AI_MODEL=gpt-5-mini  # defaults to gpt-5-mini if not specified
```

## Generation Service

The `GenerationService` (`apps/api/src/services/generation.ts`) provides high-level OpenAPI generation:

- **Create mode**: Generate new OpenAPI specifications from scratch
- **Modify mode**: Update existing specifications based on change requests

The service includes:
- Specialized system prompts for each mode
- Markdown code block cleanup
- Basic validation of generated specs
- Returns YAML-formatted OpenAPI 3.1 specifications

## API Endpoint

**POST /api/generate**

```json
{
  "description": "A REST API for managing users",
  "mode": "create",
  "existingSpec": "..." // only for modify mode
}
```

Response:
```json
{
  "spec": "openapi: 3.1.0\n...",
  "format": "yaml",
  "version": "3.1.0",
  "message": "OpenAPI spec generated successfully"
}
```

## Testing

Unit tests use the mock provider to avoid external dependencies:

```bash
bun test  # runs all tests including generation tests
```

Manual testing with mock provider:
```bash
cd apps/api
bun run scripts/test-generation.ts
```
