# Project Context for AI Agents

## What This Project Does

Natural language to OpenAPI 3.1 specification generator with:
- **Generation**: Describe APIs in plain English, get valid OpenAPI specs
- **Validation**: Instant validation of OpenAPI 3.1 specs
- **Chat Interface**: Interactive chat-driven spec creation and modification
- **Browsing**: Discover and import OpenAPI specs from GitHub organizations

## Current Architecture

### Monorepo Structure
- **Runtime**: Node.js with pnpm workspaces + Turbo
- **Backend**: Hono API server (`apps/api` / `packages/backend`)
- **Frontend**: React 19 + Vite (`apps/web`)
- **CLI**: Commander.js tool (`apps/cli`)
- **Shared**: Common utilities and cache (`packages/shared`)

### AI Providers
- **GitHub Copilot**: Primary AI provider (requires subscription)
- **OpenRouter**: Alternative provider with free tier (100+ models)
- Mock provider for testing

## Key Components

### Backend Services
- **`apps/api/src/services/generation.ts`** - AI generation logic
- **`apps/api/src/ai/provider-factory.ts`** - AI provider abstraction
- **`apps/api/src/ai/copilot-provider.ts`** - GitHub Copilot integration
- **`apps/api/src/routes/validation.ts`** - Validation endpoint
- **`apps/api/src/routes/generation.ts`** - Generation endpoint

### Frontend Components
- **`apps/web/src/`** - React application
- Uses generated API client from OpenAPI spec

### CLI Commands
- **browse** - Interactive GitHub spec browsing
- **list** - List specs from GitHub org
- **open** - Open specific spec
- **generate** - Generate spec from description
- **validate** - Validate OpenAPI spec

## Common Workflows

### 1. Generate Spec
User describes API → AI generates spec → Validate → Iterate if needed → Return result

### 2. Modify Spec
User requests changes → AI modifies current spec → Show diff → User approves → Update editor

### 3. Browse GitHub Specs
User enters org name → Fetch specs from GitHub → Display list → User selects → Import to editor

## Template System

### Location
`.openapi-templates/` - Template library for agents

### Structure
- **base/** - Minimal and standard starting points
- **domains/** - Domain-specific templates (e-commerce, SaaS, REST CRUD)
- **patterns/** - Reusable patterns (pagination, auth, errors)

### Usage
- Auto-detect domain from user description
- Reference templates for structure and patterns
- Generate AI-first, validate, iterate

## Quality Requirements

Specs must achieve 85/100 quality score before presentation to users:
- **Completeness** (40pts): descriptions, examples, error responses
- **Structure** (30pts): proper components, $ref usage
- **Standards** (20pts): naming conventions, OpenAPI 3.1
- **Best Practices** (10pts): security, versioning

## Development Commands

```bash
# Development
pnpm dev          # Start web UI and API
pnpm build        # Build all packages
pnpm typecheck    # Type checking
pnpm lint         # Linting
pnpm test         # Run tests

# CLI
cd apps/cli
pnpm start browse        # Interactive browsing
pnpm start generate      # Generate spec
pnpm start validate      # Validate spec
```

## Key Files to Read

When working on specific areas, read these files first:

### Chat Features
- `.ai/CHAT_PROTOCOL.md` - Chat agent behavior
- `apps/api/src/services/generation.ts` - Generation logic

### Templates
- `.openapi-templates/README.md` - Template system
- `.openapi-templates/domains/*/GUIDE.md` - Domain guides

### API Changes
- `apps/api/src/index.ts` - API server
- `packages/backend/` - Backend implementation

### CLI Changes
- `apps/cli/README.md` - CLI documentation
- `apps/cli/src/index.ts` - CLI entry point

## Technology Stack

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 10+
- **Build**: Turbo (monorepo orchestration)
- **Backend**: Hono (lightweight web framework)
- **Frontend**: React 19, Vite, Tailwind CSS
- **AI**: GitHub Copilot SDK, OpenRouter
- **Validation**: swagger-parser
- **CLI**: Commander.js, Inquirer.js

## Environment Variables

### Required
- `AI_PROVIDER` - `copilot` or `openrouter`

### For Copilot
- Requires: `gh extension install github/gh-copilot`
- Auth: `gh auth login`

### For OpenRouter
- `OPENROUTER_API_KEY` - API key from openrouter.ai
- `AI_MODEL` - Model to use (e.g., `meta-llama/llama-3.3-70b-instruct:free`)

### Optional
- `GITHUB_TOKEN` - For browsing GitHub without rate limits

## Testing

- **Unit tests**: `pnpm test`
- **Watch mode**: `pnpm test:watch`
- **Coverage**: `pnpm test:coverage`

Skip tests if only updating specs or documentation.

## Important Notes

- **Never commit** unless user explicitly asks
- **Always validate** OpenAPI specs before and after modifications
- **Use specific git adds**: Never `git add .` or `git add -A`
- **Preserve formatting**: Maintain existing YAML/JSON structure
- **Quality first**: Don't present specs below 85/100 quality score
