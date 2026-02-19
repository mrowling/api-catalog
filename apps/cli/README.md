# Natural Language OpenAPI CLI

Command-line tool for discovering, generating, and managing OpenAPI 3.1 specifications.

## Features

- 🔍 **Discover** OpenAPI specs in GitHub organizations
- 🤖 **Generate** specs from natural language descriptions
- ✅ **Validate** existing OpenAPI specifications
- 📝 **Open** specs in your editor or openapi-tui
- 💻 **Interactive** and scriptable workflows

## Installation

```bash
# From the project root
pnpm install

# Build the CLI
cd apps/cli
pnpm build
```

## Authentication

The CLI uses GitHub's API to search for OpenAPI specs. To avoid rate limits, authenticate using one of these methods:

1. **GitHub CLI** (recommended):
   ```bash
   gh auth login
   ```

2. **Environment variable**:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

Without authentication, you're limited to 60 requests/hour.

## Usage

### Interactive Browse

The easiest way to discover and open specs:

```bash
pnpm start browse
# OR
node dist/index.js browse
```

This will:
1. Prompt you for a GitHub organization name
2. Search for all OpenAPI specs in that org
3. Let you select a spec interactively
4. Ask how you want to open it (editor, openapi-tui, save to file, or print)

### List Specs

List all OpenAPI specs in an organization:

```bash
pnpm start list <org>
```

Example:
```bash
pnpm start list stripe
```

### Open a Spec

Open a specific spec by its index from the list:

```bash
pnpm start open <org> <index>
```

Example:
```bash
pnpm start list stripe  # Shows numbered list
pnpm start open stripe 1  # Opens the first spec
```

### Generate from Natural Language

Generate an OpenAPI spec from a natural language description:

```bash
pnpm start generate "A REST API for managing blog posts with CRUD operations"

# Save to file
pnpm start generate "A todo list API" -o todo-api.yaml

# Use a specific AI model
pnpm start generate "A user management API" -m gpt-5-mini
```

### Validate OpenAPI Specification

Validate an existing OpenAPI specification file:

```bash
pnpm start validate ./api.yaml
```

## Opening Methods

When you select a spec with `browse` or `open`, you can:

1. **Open in $EDITOR** - Opens the spec in your default editor (vi, vim, nano, etc.)
2. **Open in openapi-tui** - Opens in [openapi-tui](https://github.com/zaghaghi/openapi-tui) (if installed)
3. **Save to file** - Downloads and saves the spec to a local file
4. **Print to console** - Displays the spec content in your terminal

### Installing openapi-tui

The CLI will prompt you to install openapi-tui if it's not found. You can also install it manually:

**Quick install (recommended):**
```bash
bash apps/cli/scripts/install-openapi-tui.sh
```

**With Cargo:**
```bash
cargo install openapi-tui
```

**With Homebrew (macOS):**
```bash
brew install openapi-tui
```

See [scripts/README.md](scripts/README.md) for more installation options.

## Examples

### Interactive workflow
```bash
# Browse and explore specs interactively
pnpm start browse
> Enter GitHub organization name: stripe
> Select an OpenAPI spec: stripe-api - openapi/spec3.yaml
> How would you like to open this spec? Open in $EDITOR
```

### Scripted workflow
```bash
# List all specs in an org
pnpm start list github

# Open the 3rd spec from the list
pnpm start open github 3
```

## Configuration

The CLI uses the same AI provider as the API server (GitHub Copilot with gpt-5-mini by default).

You can override the model with the `-m` or `--model` option:

```bash
pnpm start generate "My API description" -m gpt-4o
```

## Commands Reference

### `browse`

Interactively discover and open OpenAPI specs in GitHub organizations.

```bash
pnpm start browse
```

### `list <org>`

List all OpenAPI specs in a GitHub organization.

**Arguments:**
- `org` - GitHub organization name

**Examples:**
```bash
pnpm start list stripe
pnpm start list github
```

### `open <org> <index>`

Open a specific OpenAPI spec from a GitHub organization.

**Arguments:**
- `org` - GitHub organization name
- `index` - Spec index from list command (1-based)

**Examples:**
```bash
pnpm start open stripe 1
pnpm start open github 5
```

### `generate <description> [options]`

Generate an OpenAPI 3.1 specification from natural language.

**Arguments:**
- `description` - Natural language description of your API

**Options:**
- `-o, --output <file>` - Output file (defaults to stdout)
- `-m, --model <model>` - AI model to use (default: gpt-5-mini)

**Examples:**

```bash
# Generate and print to stdout
pnpm start generate "A weather API with current conditions and forecasts"

# Save to file
pnpm start generate "An e-commerce API" -o ecommerce.yaml

# Use different model
pnpm start generate "A booking system API" -m gpt-4o -o booking.yaml
```

### `validate <file>`

Validate an OpenAPI specification file.

**Arguments:**
- `file` - Path to OpenAPI specification file (YAML or JSON)

**Examples:**

```bash
pnpm start validate ./api.yaml
pnpm start validate ./openapi.json
```

## Tips

- The CLI searches for files named: `openapi.yaml`, `openapi.yml`, `swagger.yaml`, `swagger.yml`
- **Shared cache**: Results are cached in `~/.ai-openapi-cache/cache.db` and shared with the API server
- Cache TTL is 5 minutes - subsequent searches use cached data for faster results
- Use `browse` for exploration, `list`/`open` for scripting and automation
- Install [openapi-tui](https://github.com/zaghaghi/openapi-tui) for a better viewing experience

## Development

```bash
# Run in development mode (with watch)
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck
```

## Global Installation (Optional)

To use the CLI globally:

```bash
cd apps/cli
pnpm link -g

# Now you can use it anywhere
nl-openapi browse
nl-openapi list stripe
nl-openapi generate "My API description"
```
