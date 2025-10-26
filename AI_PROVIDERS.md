# AI Image Generation Providers

Image Hack supports multiple AI image generation providers with easy switching.

## Current Providers

### 1. Pollinations.ai (FREE) ⭐ DEFAULT
- **Cost**: Completely free
- **API Key**: Not required
- **Speed**: 5-15 seconds
- **Quality**: Good for prototyping
- **Models**: FLUX, Turbo
- **Best for**: MVP, development, demos

**Setup**: Already works out of the box! No configuration needed.

### 2. Together.ai (PAID - Recommended for Production)
- **Cost**: $25 free credits, then ~$0.02-0.08 per image
- **API Key**: Required (get free credits at https://together.ai)
- **Speed**: 2-4 seconds (VERY FAST)
- **Quality**: Excellent
- **Models**: FLUX.1 Schnell, FLUX.1 Dev, Stable Diffusion XL
- **Best for**: Production, scalable apps

**Setup**:
1. Sign up at https://together.ai (get $25 free credits)
2. Get your API key from dashboard
3. Create `.env` file: `VITE_TOGETHER_API_KEY=your_key_here`
4. Set provider: `VITE_AI_PROVIDER=together`

### 3. Hugging Face (FREE with limits)
- **Cost**: Free tier with rate limits
- **API Key**: Optional (better with API key)
- **Speed**: 10-30 seconds (slower)
- **Quality**: Good
- **Models**: Stable Diffusion XL, SD 1.5
- **Best for**: Testing different models

**Setup**:
1. Optional: Get API key at https://huggingface.co/settings/tokens
2. Create `.env` file: `VITE_HUGGINGFACE_API_KEY=your_key_here`
3. Set provider: `VITE_AI_PROVIDER=huggingface`

## Future Providers (Coming Soon)

### OpenAI DALL-E
- High-quality image generation
- $0.04-0.08 per image
- Excellent prompt following

### Replicate
- Access to 100+ models
- Pay-per-use pricing
- Great for variety

### Stability AI
- Official Stable Diffusion API
- Professional quality

## Switching Providers

### Option 1: Environment Variable
```env
# .env
VITE_AI_PROVIDER=pollinations  # or together, huggingface
```

### Option 2: Runtime (Future Feature)
Switch providers in Settings UI without restarting app.

## Provider Comparison

| Feature | Pollinations | Together.ai | Hugging Face |
|---------|-------------|-------------|--------------|
| Cost | FREE | $25 free/$0.02+ | FREE (limited) |
| API Key | ❌ No | ✅ Yes | ⚠️ Optional |
| Speed | Medium | Fast | Slow |
| Quality | Good | Excellent | Good |
| Rate Limits | Reasonable | High | Low (free) |
| Best For | MVP | Production | Testing |

## Cost Estimates

**100 Images:**
- Pollinations: $0
- Together.ai: $2-8
- Hugging Face: $0 (with limits)

**1000 Images:**
- Pollinations: $0
- Together.ai: $20-80
- Hugging Face: $0-50 (depending on tier)

## Recommendations

### For Development/MVP
**Use Pollinations.ai**
- No setup required
- Zero cost
- Good enough for demos

### For Production
**Use Together.ai**
- Fast generation
- Affordable pricing
- Reliable infrastructure
- Start with $25 free credits

### For Experimentation
**Use Hugging Face**
- Try different models
- Free tier available
- Open source models

## Architecture

The AI service uses a provider abstraction layer that makes switching providers seamless:

```typescript
// src/services/ai/AIService.ts
import { aiService } from '@/services/ai/AIService';

// Generate image (uses current provider)
const result = await aiService.generateImage({
  prompt: "A beautiful sunset",
  width: 1024,
  height: 1024,
});

// Switch provider
aiService.setProvider('together');
```

All providers implement the same interface, so switching is just one line of code!
