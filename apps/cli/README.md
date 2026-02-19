# Natural Language OpenAPI CLI

Command-line tool for generating and managing OpenAPI 3.1 specifications using natural language.

## Installation

```bash
# From the project root
bun install

# Build the CLI
cd apps/cli
bun run build
```

## Usage

### Generate OpenAPI Specification

Generate an OpenAPI spec from a natural language description:

```bash
bun dist/index.js generate "A REST API for managing blog posts with CRUD operations"

# Save to file
bun dist/index.js generate "A todo list API" -o todo-api.yaml

# Use a specific AI model
bun dist/index.js generate "A user management API" -m gpt-5-mini
```

### Validate OpenAPI Specification

Validate an existing OpenAPI specification file:

```bash
bun dist/index.js validate ./api.yaml
```

## Requirements

- **GitHub Copilot CLI** must be installed and authenticated
  - Install: `gh extension install github/gh-copilot`
  - Authenticate: `gh auth login`

## Configuration

The CLI uses the same AI provider as the API server (GitHub Copilot with gpt-5-mini by default).

You can override the model with the `-m` or `--model` option:

```bash
bun dist/index.js generate "My API description" -m gpt-4o
```

## Commands

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
bun dist/index.js generate "A weather API with current conditions and forecasts"

# Save to file
bun dist/index.js generate "An e-commerce API" -o ecommerce.yaml

# Use different model
bun dist/index.js generate "A booking system API" -m gpt-4o -o booking.yaml
```

### `validate <file>`

Validate an OpenAPI specification file.

**Arguments:**
- `file` - Path to OpenAPI specification file (YAML or JSON)

**Examples:**

```bash
bun dist/index.js validate ./api.yaml
bun dist/index.js validate ./openapi.json
```

## Development

```bash
# Run in development mode (with watch)
bun run dev

# Build
bun run build

# Type check
bun run typecheck
```

## Global Installation (Optional)

To use the CLI globally:

```bash
cd apps/cli
bun link

# Now you can use it anywhere
nl-openapi generate "My API description"
```
