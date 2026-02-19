# GitHub Copilot CLI Setup

The AI generation feature requires the **GitHub Copilot CLI** to be installed and authenticated.

## Installation

### 1. Install Copilot CLI

Follow the [official Copilot CLI installation guide](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli):

**macOS:**
```bash
brew install github/copilot-cli/copilot
```

**Windows:**
```powershell
winget install GitHub.CopilotCLI
```

**Linux:**
Download from the [releases page](https://github.com/github/copilot-cli/releases) or use your package manager if available.

### 2. Authenticate

```bash
copilot auth login
```

Follow the prompts to authenticate with your GitHub account.

### 3. Verify Installation

```bash
copilot --version
```

You should see the Copilot CLI version number.

### 4. Test Copilot

```bash
copilot "write a hello world function in JavaScript"
```

If this works, you're all set!

## Requirements

- GitHub account with active **Copilot subscription** (Individual, Business, or Enterprise)
  - See [GitHub Copilot pricing](https://github.com/features/copilot#pricing) for subscription options
- Internet connection for API calls

## Troubleshooting

### "Connection is closed" Error

This error occurs when:
1. Copilot CLI is not installed
2. You're not authenticated with GitHub
3. Your Copilot subscription is not active
4. The CLI server failed to start

**Solution:**
1. Install the CLI: Follow installation steps above
2. Authenticate: `copilot auth login`
3. Verify subscription: Check your [Copilot settings](https://github.com/settings/copilot)
4. Test the CLI: `copilot "hello world"`

### CLI Not Found

If `copilot: command not found`:

```bash
# Check if it's in your PATH
which copilot

# On macOS with Homebrew
brew install github/copilot-cli/copilot

# On Windows
winget install GitHub.CopilotCLI
```

### Authentication Issues

```bash
# Check authentication status
copilot auth status

# Re-authenticate if needed
copilot auth login
```

### Subscription Issues

Ensure you have an active Copilot subscription:
- Visit https://github.com/settings/copilot
- Verify your subscription is active
- If using Copilot Business/Enterprise, ensure you're added to the subscription

## Alternative: Mock Provider for Development

If you want to test the application without GitHub Copilot, use the mock provider in tests:

```typescript
import { AIProviderFactory } from '@ai-openapi/shared';

const provider = AIProviderFactory.getMockProvider();
const result = await provider.complete(messages);
```

**Note:** The mock provider generates simple placeholder OpenAPI specs and should only be used for testing.

## Deprecated: gh copilot Extension

The `gh copilot` extension has been deprecated. If you previously used it:

```bash
# Uninstall the old extension
gh extension remove github/gh-copilot

# Install the new standalone CLI
brew install github/copilot-cli/copilot  # macOS
# or
winget install GitHub.CopilotCLI  # Windows
```
