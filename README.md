# Natural Language OpenAPI Editor

Create and edit OpenAPI specs using plain English. No YAML knowledge required!

## What Can You Do?

- 💬 **Write APIs in plain English** - "Create a REST API for blog posts with CRUD operations"
- 🔍 **Browse GitHub specs** - Find and import OpenAPI specs from any GitHub organization
- ✅ **Validate specs instantly** - Catch errors before deployment
- 🌐 **Use the web UI** - Beautiful interface with live preview
- ⚡ **Use the CLI** - Automate everything from your terminal

## Get Started in 3 Steps

### 1. Install

```bash
git clone <repo-url>
cd ai-open-api-spec
pnpm install
pnpm build
```

### 2. Set Up AI (Choose One)

**Option A: OpenRouter (Free, No Credit Card)**

1. Get a free API key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create `apps/api/.env`:
```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

**Option B: GitHub Copilot (Requires Subscription)**

```bash
gh extension install github/gh-copilot
gh auth login
```

### 3. Start Using

```bash
# Start the web UI
pnpm dev

# Or use the CLI
cd apps/cli
pnpm start browse  # Browse GitHub specs interactively
```

Open `http://localhost:5173` in your browser!

## How to Use

### Web UI

1. **Start the app**: `pnpm dev`
2. **Open browser**: Go to `http://localhost:5173`
3. **Describe your API**: Type in plain English what you want
4. **Get your spec**: Download or copy the generated OpenAPI spec

**Browse GitHub specs:**
1. Click the **Catalog** tab
2. Enter an organization name (e.g., "stripe", "github")
3. Click any spec to load it in the editor

### CLI

**Browse GitHub specs interactively:**
```bash
cd apps/cli
pnpm start browse
```

**List and open specs:**
```bash
pnpm start list stripe        # List all specs
pnpm start open stripe 1      # Open the first spec
```

**Generate from natural language:**
```bash
pnpm start generate "A REST API for blog posts" -o blog.yaml
```

**Validate a spec:**
```bash
pnpm start validate ./api.yaml
```

See [apps/cli/README.md](apps/cli/README.md) for detailed CLI documentation.

## Optional: GitHub Authentication

For browsing GitHub organizations without rate limits:

```bash
gh auth login
```

Or set a token:
```bash
export GITHUB_TOKEN=your_token_here
```

Create tokens at: https://github.com/settings/tokens (need `public_repo` scope)

## Documentation

- [CLI Guide](apps/cli/README.md) - Command-line interface
- [GitHub Discovery](docs/GITHUB_DISCOVERY.md) - Browse organization specs
- [OpenRouter Setup](docs/OPENROUTER_SETUP.md) - Free AI models
- [Copilot Setup](docs/COPILOT_SETUP.md) - GitHub Copilot configuration

## Technology

- **Runtime**: Node.js + pnpm
- **Backend**: Hono, Swagger Parser
- **Frontend**: React 19, Vite, Tailwind
- **AI**: GitHub Copilot or OpenRouter (100+ models)
- **CLI**: Commander.js, Inquirer

## Project Structure

```
ai-open-api-spec/
├── apps/
│   ├── web/              # React frontend
│   ├── cli/              # Command-line tool
│   └── api/              # Hono backend (in packages/backend)
├── packages/
│   ├── backend/          # API server
│   └── shared/           # Shared utilities and cache
└── docs/                 # Documentation
```

## License

MIT

---

**Need help?** Open an issue or check the docs folder for detailed guides!
