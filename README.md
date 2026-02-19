# Natural Language OpenAPI Editor

An AI-powered OpenAPI specification editor that allows you to describe APIs in natural language and automatically generate, validate, and modify OpenAPI 3.1 specifications.

## Features

- **Natural Language to OpenAPI**: Describe your API in plain English, get a complete OpenAPI 3.1 spec
- **Interactive Modifications**: Request changes via natural language with interactive diff preview
- **GitHub Organization Discovery**: Automatically search and import OpenAPI specs from GitHub organizations
- **Real-time Validation**: Validate specs using swagger-parser with detailed error messages
- **Version Conversion**: Automatic OpenAPI 3.0 to 3.1 conversion
- **Web UI**: Modern React interface with Swagger UI integration
- **CLI Tool**: Command-line interface for automation and CI/CD
- **Multiple AI Providers**: Powered by GitHub Copilot or OpenRouter.ai (100+ models)
- **Monorepo with Turborepo**: Fast builds with intelligent caching and parallel execution

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [pnpm](https://pnpm.io/) (v8 or later)
- **AI Provider** (choose one):
  - [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) with active subscription, OR
  - [OpenRouter.ai](https://openrouter.ai/) API key (free tier available)
- (Optional) GitHub Personal Access Token for organization spec discovery

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-open-api-spec

# Install all dependencies
pnpm install

# Build all packages
pnpm run build
```

### Configuration

1. **Choose your AI provider**:

   **Option A: GitHub Copilot** (requires subscription)
   ```bash
   # Install standalone Copilot CLI
   brew install github/copilot-cli/copilot  # macOS
   # or
   winget install GitHub.CopilotCLI  # Windows
   
   # Authenticate
   copilot auth login
   ```
   
   See [docs/COPILOT_SETUP.md](docs/COPILOT_SETUP.md) for detailed setup instructions.

   **Option B: OpenRouter** (25+ free models, 300+ total models)
   
   **Start completely free** (no credit card required):
   
   1. Get your API key at https://openrouter.ai/keys
   2. Add to `apps/api/.env`:
   
   ```bash
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_api_key_here
   AI_MODEL=meta-llama/llama-3.3-70b-instruct:free  # Free tier (50 req/day)
   ```
   
   Or use premium models (requires credits):
   ```bash
   AI_MODEL=openai/gpt-4-turbo  # Pay-per-use
   ```
   
   See [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) for detailed setup instructions.

2. **Configure GitHub authentication** (optional, for organization discovery):
   
   **Option A (Recommended):** Use GitHub CLI authentication (no setup needed if already authenticated)
   ```bash
   gh auth login
   ```
   
   **Option B:** Use a personal access token
   
   Create a token at https://github.com/settings/tokens with `public_repo` or `repo` scope.
   
   Add to `apps/api/.env`:
   ```bash
   GITHUB_TOKEN=your_token_here
   GITHUB_ORG=your-default-org
   ```
   
   The API automatically uses GitHub CLI credentials if `GITHUB_TOKEN` is not set.

### Running Locally

Start both frontend and backend simultaneously:

```bash
pnpm run dev
```

Or run them separately:

```bash
# Terminal 1: Backend
bun run dev:backend

# Terminal 2: Frontend
bun run dev:web
```

The web UI will be available at `http://localhost:5173` and the backend API at `http://localhost:3001`.

## Usage

### GitHub Organization Discovery

Automatically discover and import OpenAPI specs from GitHub organizations:

1. Navigate to the **Catalog** tab in the top menu
2. Enter your GitHub organization name
3. Click "Search" to find all OpenAPI specs
4. Click on any discovered spec to automatically load it in the Editor
5. Specs are auto-refreshed every 5 minutes

**Features:**
- Dedicated full-page catalog view
- Pagination support (up to 1000 results per pattern)
- SQLite-based persistent caching shared between API and CLI
- Searches for `openapi.yaml`, `openapi.yml`, `swagger.yaml`, `swagger.yml`
- Smart caching (search: 5 min, content: 1 hour)
- Direct links to view specs on GitHub
- Persistent organization settings

See [docs/GITHUB_DISCOVERY.md](docs/GITHUB_DISCOVERY.md) for detailed setup and configuration.

### AI Provider Setup

#### GitHub Copilot

**Required for AI generation features:**

1. Install GitHub Copilot CLI extension:
```bash
gh extension install github/gh-copilot
```

2. Authenticate with GitHub:
```bash
gh auth login
```

3. Verify installation:
```bash
gh copilot --version
```

See [docs/COPILOT_SETUP.md](docs/COPILOT_SETUP.md) for detailed setup instructions and troubleshooting.

#### OpenRouter

**Alternative AI provider with 100+ models:**

1. Get your API key at [https://openrouter.ai/keys](https://openrouter.ai/keys)

2. Configure in `apps/api/.env`:
```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_api_key_here
AI_MODEL=openai/gpt-4-turbo  # or any model
```

See [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) for model recommendations, pricing, and troubleshooting.

## Project Structure

```
ai-open-api-spec/
├── apps/
│   ├── web/              # React + Vite frontend
│   └── cli/              # Command line tool
├── packages/
│   ├── backend/          # Hono backend API
│   └── shared/           # Shared types and utilities
├── tasks/
│   └── prd-*.md          # Product requirements documents
└── .planning/
    └── roadmap.md        # Project roadmap
```

## API Endpoints

### Validation

```bash
POST /api/validate
Content-Type: application/json

{
  "spec": "openapi: 3.1.0\ninfo:\n  title: My API\n  version: 1.0.0\npaths: {}"
}
```

Response:

```json
{
  "valid": true,
  "version": "3.1.0",
  "errors": [],
  "spec": { ... }
}
```

### Generation

```bash
POST /api/generate
Content-Type: application/json

{
  "description": "A REST API for a blog with posts, comments, and users",
  "mode": "create"
}
```

### Conversion

```bash
POST /api/convert
Content-Type: application/json

{
  "spec": "{ ... OpenAPI 3.0 spec ... }",
  "fromVersion": "3.0.3",
  "toVersion": "3.1.0"
}
```

## CLI Usage

```bash
# Generate spec from natural language
nl-openapi generate "A REST API for managing todos with CRUD operations"

# Validate existing spec
nl-openapi validate ./api.yaml

# Convert spec version
nl-openapi convert ./api.yaml --from 3.0.3 --to 3.1.0

# Interactive mode
nl-openapi interactive
```

## Development

### Scripts

```bash
# Run all checks
bun run lint
bun run typecheck

# Build all packages
bun run build

# Run CLI
bun run cli
```

### Adding Dependencies

```bash
# Add to web app
cd apps/web && bun add <package>

# Add to backend
cd packages/backend && bun add <package>

# Add to shared (be careful - used by all packages)
cd packages/shared && bun add <package>
```

## Roadmap

### Phase 1: Foundation ✅
- [x] Monorepo setup with Bun workspaces
- [x] Backend API with validation endpoint
- [x] OpenAPI 3.0 to 3.1 conversion
- [x] Shared types and utilities

### Phase 2: Web UI Core (In Progress)
- [ ] React components for natural language input
- [ ] Swagger UI integration
- [ ] Spec generation workflow
- [ ] Import/export functionality

### Phase 3: Advanced Features
- [ ] Natural language modification with diff preview
- [ ] Interactive accept/reject workflow
- [ ] Undo/redo functionality

### Phase 4: CLI Tool
- [ ] Generate command
- [ ] Validate command
- [ ] Convert command
- [ ] Interactive mode

### Phase 5: Production Ready
- [ ] Comprehensive documentation
- [ ] Example prompts and workflows
- [ ] Performance optimization
- [ ] Error handling improvements

## Technology Stack

- **Runtime**: Bun
- **Backend**: Hono, @apidevtools/swagger-parser
- **Frontend**: React 19, Vite, Tailwind CSS
- **AI**: GitHub Copilot SDK or OpenRouter.ai (100+ models)
- **CLI**: Commander.js

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run checks: `bun run lint && bun run typecheck`
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`

## License

MIT

## Acknowledgments

- [Swagger Parser](https://apitools.dev/swagger-parser/) for OpenAPI validation
- [Hono](https://hono.dev/) for the fast, lightweight web framework
- [GitHub Copilot](https://github.com/features/copilot) for AI-powered generation
