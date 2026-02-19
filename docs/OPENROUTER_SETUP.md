# OpenRouter Setup Guide

OpenRouter is a unified API for accessing multiple AI models from different providers. This guide will help you set up OpenRouter as your AI provider.

## TL;DR - Quick Start (Completely Free)

```bash
# 1. Get API key at https://openrouter.ai/keys (no credit card needed)

# 2. Create apps/api/.env:
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free

# 3. Start server:
cd apps/api && pnpm run dev

# 4. Open http://localhost:5173 and start generating!
# You get 50 free requests per day with high-quality AI models.
```

## What is OpenRouter?

[OpenRouter](https://openrouter.ai/) provides:
- Access to 300+ AI models through a single API
- Models from OpenAI, Anthropic, Google, Meta, and more
- **25+ free models** with no cost (50 requests/day limit on free plan)
- Pay-per-use pricing with no subscriptions for premium models
- Automatic fallback to alternative models
- No credit card required to start

## Getting Started

### 1. Get Your API Key

1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Sign in with your GitHub, Google, or email account
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key - you'll need it for configuration

### 2. Configure Environment Variables

Add these variables to your `apps/api/.env` file:

**For Free Models (Recommended to Start):**

```bash
# Set OpenRouter as your AI provider
AI_PROVIDER=openrouter

# Your OpenRouter API key (required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Use a free model (no cost, 50 requests/day limit)
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Optional: Site information for rankings on OpenRouter
OPENROUTER_SITE_URL=https://yoursite.com
OPENROUTER_SITE_NAME=Your App Name
```

**For Premium Models (Requires Credits):**

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
AI_MODEL=openai/gpt-4-turbo  # or any paid model
```

### 3. Choose a Model

OpenRouter supports 300+ models. Here are recommendations for OpenAPI generation:

**Free Models (No Cost, 50 requests/day):**

To use free models, append `:free` to the model name:

- `meta-llama/llama-3.3-70b-instruct:free` - **Recommended for free tier**, excellent quality
- `google/gemini-2.0-flash-exp:free` - Very fast, good quality
- `meta-llama/llama-3.1-405b-instruct:free` - Highest quality free model
- `qwen/qvq-72b-preview:free` - Good for structured output
- `google/gemini-flash-1.5:free` - Fast and reliable

**Premium Models (Pay-per-use):**

- `openai/gpt-4-turbo` - Best quality, higher cost (~$10/1M tokens)
- `anthropic/claude-3-5-sonnet` - Excellent for structured output (~$3/1M tokens)
- `openai/gpt-3.5-turbo` - Good balance, lower cost (~$0.50/1M tokens)
- `google/gemini-pro-1.5` - Fast, competitive quality (~$1.25/1M tokens)

**Rate Limits:**
- **Free plan**: 50 requests/day, 20 requests/minute on free models
- **Pay-as-you-go** (with $10+ credits): No limits on paid models, 1000 requests/day on free models
- Check current pricing at [https://openrouter.ai/models](https://openrouter.ai/models)

### 4. Quick Start with Free Models

**To use OpenRouter completely free:**

1. Get your API key at [https://openrouter.ai/keys](https://openrouter.ai/keys) (no credit card required)

2. Create `apps/api/.env` file:
```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-... # your actual key
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

3. Start the server:
```bash
cd apps/api
pnpm run dev
```

4. Open the web UI at [http://localhost:5173](http://localhost:5173)

You now have access to a high-quality AI model with **50 free requests per day**!

### 5. Test Your Configuration

Start the API server:

```bash
cd apps/api
npm run dev
```

Test with a simple generation:

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create an API for a simple todo list with CRUD operations",
    "mode": "create"
  }'
```

## Available Models

To see all available models, you can use the OpenRouter API:

```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Or programmatically in your code:

```typescript
import { OpenRouterProvider } from '@ai-openapi/shared';

const provider = new OpenRouterProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const models = await provider.listModels();
console.log('Available models:', models);
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `github-copilot` | Set to `openrouter` to use OpenRouter |
| `OPENROUTER_API_KEY` | Yes* | - | Your OpenRouter API key (*required when using OpenRouter) |
| `AI_MODEL` | No | `openai/gpt-3.5-turbo` | Model to use for generation |
| `OPENROUTER_SITE_URL` | No | - | Your site URL (for rankings on OpenRouter) |
| `OPENROUTER_SITE_NAME` | No | - | Your app name (for rankings on OpenRouter) |

### Programmatic Configuration

You can also configure OpenRouter programmatically:

```typescript
import { AIProviderFactory } from '@ai-openapi/shared';

const provider = AIProviderFactory.getProvider({
  provider: 'openrouter',
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  defaultModel: 'anthropic/claude-3-opus',
  openRouterSiteUrl: 'https://myapp.com',
  openRouterSiteName: 'My OpenAPI Generator',
});
```

## Troubleshooting

### "OpenRouter API key is required" Error

Make sure you've:
1. Set `AI_PROVIDER=openrouter` in your `.env` file
2. Set `OPENROUTER_API_KEY` with a valid API key
3. Restarted the API server after changing environment variables

### Rate Limit Errors

OpenRouter has rate limits based on your tier:
- Free tier: Lower rate limits
- Paid tier: Higher rate limits based on credits

Solution:
- Add credits to your OpenRouter account at [https://openrouter.ai/credits](https://openrouter.ai/credits)
- Use a model with higher rate limits
- Implement retry logic with exponential backoff

### Model Not Found Errors

If you get a "model not found" error:
1. Check the model ID is correct at [https://openrouter.ai/models](https://openrouter.ai/models)
2. Ensure the model is currently available
3. Verify your account has access to that model

### Connection Errors

If you're getting connection errors:
- Check your internet connection
- Verify OpenRouter API is operational at [https://status.openrouter.ai/](https://status.openrouter.ai/)
- Check for firewall or proxy issues

## Comparing Providers

### OpenRouter vs GitHub Copilot

**OpenRouter Advantages:**
- Access to 100+ models from multiple providers
- Pay-per-use pricing (no subscription needed)
- Supports open-source models
- Free tier available
- No special CLI tool required

**GitHub Copilot Advantages:**
- Integrated with GitHub ecosystem
- May already have access through GitHub subscription
- Optimized for code generation tasks
- Lower latency for GitHub users

### When to Use OpenRouter

Use OpenRouter when you:
- Want access to multiple AI models
- Need specific models (Claude, Gemini, Llama, etc.)
- Prefer pay-per-use over subscriptions
- Want to experiment with different models
- Don't have GitHub Copilot access

### When to Use GitHub Copilot

Use GitHub Copilot when you:
- Already have a GitHub Copilot subscription
- Prefer GitHub's integrated experience
- Need lowest latency
- Want GPT-4 level models included in subscription

## Best Practices

1. **Start with Free Tier**: Test with the free tier before committing to paid usage
2. **Monitor Costs**: Check your usage at [https://openrouter.ai/activity](https://openrouter.ai/activity)
3. **Choose Appropriate Models**: Use GPT-3.5-turbo for development, GPT-4 for production
4. **Set Rate Limits**: Configure rate limits to avoid unexpected costs
5. **Handle Errors**: Implement proper error handling and retries
6. **Cache Results**: Cache generated specs to reduce API calls

## Additional Resources

- OpenRouter Documentation: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- Model Comparison: [https://openrouter.ai/models](https://openrouter.ai/models)
- API Reference: [https://openrouter.ai/docs/api-reference](https://openrouter.ai/docs/api-reference)
- Pricing: [https://openrouter.ai/docs/pricing](https://openrouter.ai/docs/pricing)
- Support: [Discord](https://discord.gg/openrouter) or [GitHub Issues](https://github.com/OpenRouterTeam/openrouter-runner)
