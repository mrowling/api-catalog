# OpenAPI CLI

Browse, generate, and manage OpenAPI specs from your terminal.

## Quick Start

```bash
# From project root
pnpm install && pnpm build

# Run the CLI
cd apps/cli
pnpm start browse   # Interactive mode
```

## What Can You Do?

```bash
# Browse GitHub specs interactively
pnpm start browse

# List specs in an organization  
pnpm start list stripe

# Open a specific spec
pnpm start open stripe 1

# Generate from natural language
pnpm start generate "A blog API with posts and comments" -o blog.yaml

# Validate a spec
pnpm start validate ./api.yaml

# View a spec in terminal UI (requires oq)
pnpm start view ./api.yaml
```

## Browse Command (Interactive)

The easiest way to explore GitHub specs:

```bash
pnpm start browse
```

**What it does:**
1. Asks for a GitHub organization name
2. Shows all OpenAPI specs found
3. Lets you pick one
4. Opens it how you want (editor, oq, file, or console)
5. Loops back to menu for more actions

**Opening options:**
- **$EDITOR** - Opens in vi/vim/nano/etc
- **oq** - Beautiful TUI viewer (requires separate installation)
- **Save to file** - Downloads to your computer
- **Print** - Shows in terminal

## List & Open Commands (Scriptable)

Perfect for automation and scripts:

```bash
# List all specs (outputs numbered list)
pnpm start list github

# Open by number
pnpm start open github 3
```

## Generate Command

Create specs from plain English:

```bash
# Print to terminal
pnpm start generate "A weather API with forecasts"

# Save to file
pnpm start generate "An e-commerce API" -o shop.yaml

# Use a specific model
pnpm start generate "A booking API" -m gpt-4o -o booking.yaml
```

## Validate Command

Check if a spec is valid:

```bash
pnpm start validate ./api.yaml
pnpm start validate ./openapi.json
```

## Installing oq (Optional)

For a better viewing experience in the browse command and view command, install [oq](https://github.com/plutov/oq):

```bash
# With Go
go install github.com/plutov/oq@latest

# With Homebrew (macOS/Linux)
brew install plutov/tap/oq

# On Arch Linux (AUR)
yay -S oq-openapi-viewer-git
```

**Features:**
- Interactive TUI for browsing OpenAPI specs
- Supports all OpenAPI 3.x versions (3.0, 3.1, 3.2)
- Both YAML and JSON formats
- Keyboard shortcuts (press `?` for help)

## GitHub Authentication (Optional)

To avoid rate limits (60 requests/hour), authenticate:

```bash
# With GitHub CLI (easiest)
gh auth login

# Or set a token
export GITHUB_TOKEN=your_token_here
```

Get tokens at: https://github.com/settings/tokens (need `public_repo` scope)

## Tips

- **Cache is shared** with the web UI at `~/.ai-openapi-cache/cache.db`
- **Search results cached** for 5 minutes (faster repeat searches)
- **Searches for**: `openapi.yaml`, `openapi.yml`, `swagger.yaml`, `swagger.yml`
- **Use browse** for exploring, **list/open** for scripts and automation

## Global Installation (Optional)

Use the CLI from anywhere:

```bash
cd apps/cli
pnpm link -g

# Now use it globally
nl-openapi browse
nl-openapi list stripe
nl-openapi generate "My API"
```

## Need Help?

- Main docs: [../../README.md](../../README.md)
- Install script: [scripts/README.md](scripts/README.md)
- Issues: Open an issue on GitHub
