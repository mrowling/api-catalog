# Using OpenRouter Free Tier

## How to use `openrouter/free`

OpenRouter doesn't use `openrouter/free` as a model name. Instead, you append `:free` to specific model names to access them for free.

## Quick Setup (No Credit Card Required)

### 1. Get Your Free API Key

1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign in with GitHub, Google, or email
3. Click "Create Key"
4. Copy your API key (starts with `sk-or-v1-...`)

### 2. Configure Your App

Create or edit `apps/api/.env`:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

### 3. Start Using It

```bash
# From project root
pnpm run dev

# Or just the backend
cd apps/api
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and start generating OpenAPI specs!

## Available Free Models

To use free models, add `:free` to the model name. Here are the best ones for OpenAPI generation:

### Recommended Free Models:

1. **`meta-llama/llama-3.3-70b-instruct:free`** ⭐ RECOMMENDED
   - Excellent quality for code and structured output
   - 70 billion parameters
   - Fast responses

2. **`meta-llama/llama-3.1-405b-instruct:free`**
   - Highest quality free model
   - 405 billion parameters
   - Best for complex tasks

3. **`google/gemini-2.0-flash-exp:free`**
   - Very fast
   - Good for quick iterations
   - Latest Google model

4. **`qwen/qvq-72b-preview:free`**
   - Good for structured output
   - Reliable for API specs

5. **`google/gemini-flash-1.5:free`**
   - Fast and stable
   - Good general purpose

## Free Tier Limits

- **50 requests per day** on free models
- **20 requests per minute** rate limit
- No credit card required
- No expiration

## How to Find More Free Models

1. Visit [https://openrouter.ai/models](https://openrouter.ai/models)
2. Filter by "Free" in the pricing section
3. Copy the model ID and add `:free` suffix
4. Update your `AI_MODEL` environment variable

## Upgrading to Premium (Optional)

If you need more requests or want access to premium models like GPT-4:

1. Add credits at [https://openrouter.ai/credits](https://openrouter.ai/credits)
2. Change your model to any premium model:
   ```bash
   AI_MODEL=openai/gpt-4-turbo
   ```
3. With $10+ in credits, you get:
   - Unlimited requests on paid models
   - 1000 requests/day on free models (instead of 50)
   - No rate limits

## Example Usage

### Test from Command Line:

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create a REST API for a blog with posts, authors, and comments",
    "mode": "create"
  }'
```

### Using the Web UI:

1. Open http://localhost:5173
2. Click "Editor" tab
3. Type your API description in natural language
4. Click "Generate from Description"
5. Watch as the AI creates your OpenAPI spec!

## Troubleshooting

### "OpenRouter API key is required"
- Make sure `OPENROUTER_API_KEY` is set in `apps/api/.env`
- Make sure `AI_PROVIDER=openrouter` is set
- Restart the server after changing `.env`

### "Rate limit exceeded"
- You've hit the 50 requests/day limit
- Wait until tomorrow for the limit to reset
- Or add $10 credits to get 1000 requests/day on free models

### "Model not found"
- Make sure you include the `:free` suffix
- Example: `meta-llama/llama-3.3-70b-instruct:free` (not just `meta-llama/llama-3.3-70b-instruct`)
- Check [https://openrouter.ai/models](https://openrouter.ai/models) for current free models

## Summary

**To use OpenRouter free tier:**

1. Get API key: https://openrouter.ai/keys (no credit card)
2. Set in `.env`: 
   - `AI_PROVIDER=openrouter`
   - `OPENROUTER_API_KEY=your_key`
   - `AI_MODEL=meta-llama/llama-3.3-70b-instruct:free`
3. Run: `pnpm run dev`
4. Generate 50 OpenAPI specs per day for free!

That's it! 🎉
