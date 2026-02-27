import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../models/Product.model';
import { AppError } from '../utils/AppError';

// ─── Initialize Gemini ───────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models to try in order (fallback chain)
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // start with 2s, doubles each retry

// ─── System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are "Organica Assistant", a friendly and knowledgeable AI chatbot for the Organica organic food e-commerce website.

YOUR ROLE:
- Help customers find organic products available on the Organica website
- Answer questions about organic food, healthy eating, and healthy lifestyle
- Provide product recommendations based on health needs
- Assist with order and delivery related questions

STRICT RULES:
1. You can ONLY answer questions related to:
   - Organic food and organic farming
   - Healthy lifestyle, nutrition, and wellness
   - Products available on the Organica website (listed below)
   - Orders, delivery, payment, and shopping on Organica

2. If a user asks about anything unrelated (politics, coding, math, entertainment, etc.), reply EXACTLY:
   "I can only answer questions related to Organica organic products."

3. When recommending products:
   - ONLY suggest products from the product list below
   - Always mention the product name and price
   - Give a short health explanation of why the product is beneficial
   - Format prices in Vietnamese Dong (₫)

4. Be concise, helpful, and friendly
5. Reply in the same language the user uses (Vietnamese or English)

PRODUCT CATALOG:
{{PRODUCTS}}
`;

// ─── Build product context from database ─────────────────────────────
async function getProductContext(): Promise<string> {
  const products = await Product.find({ isActive: true })
    .select('name category price unit description tags origin')
    .sort({ soldCount: -1 })
    .limit(100)
    .lean();

  if (products.length === 0) {
    return 'No products currently available.';
  }

  return products
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} — ${p.price.toLocaleString('vi-VN')}₫/${p.unit} [${p.category}]${p.origin ? ` | Origin: ${p.origin}` : ''}${p.description ? `\n   ${p.description.slice(0, 120)}` : ''}`
    )
    .join('\n');
}

// ─── Helper: sleep ───────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Helper: try generating with retry + model fallback ──────────────
async function generateWithRetry(systemPrompt: string, userMessage: string): Promise<string> {
  let lastError: any;

  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Chat] Trying ${modelName} (attempt ${attempt}/${MAX_RETRIES})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userMessage);
        const reply = result.response.text();
        console.log(`[Chat] Success with ${modelName}`);
        return reply;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        const isModelNotFound = msg.includes('404') || msg.includes('not found') || msg.includes('is not supported');

        if (isModelNotFound) {
          console.log(`[Chat] Model ${modelName} not available, trying next model...`);
          break; // skip retries, go to next model
        }

        if (isRateLimit && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`[Chat] Rate limited on ${modelName}, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        console.log(`[Chat] Error on ${modelName}: ${msg.slice(0, 120)}`);
        break; // try next model
      }
    }
  }

  throw lastError;
}

// ─── Chat Controller ─────────────────────────────────────────────────
export class ChatController {
  /**
   * POST /api/chat
   * Body: { message: string }
   * Response: { reply: string }
   */
  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message } = req.body;

      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new AppError('Message is required', 400);
      }

      if (message.length > 1000) {
        throw new AppError('Message is too long. Maximum 1000 characters.', 400);
      }

      // Check API key
      if (!process.env.GEMINI_API_KEY) {
        throw new AppError('AI service is not configured', 500);
      }

      // Fetch product data and build system prompt
      const productContext = await getProductContext();
      const systemPrompt = SYSTEM_PROMPT.replace('{{PRODUCTS}}', productContext);

      // Generate response with retry + model fallback
      const reply = await generateWithRetry(systemPrompt, message.trim());

      res.status(200).json({ reply });
    } catch (error: any) {
      // Handle Gemini-specific errors gracefully
      if (error?.message?.includes('API key')) {
        return next(new AppError('AI service authentication failed', 500));
      }
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        res.status(200).json({
          reply: 'The AI service is currently busy. Please try again in a moment.',
        });
        return;
      }
      if (error?.message?.includes('SAFETY')) {
        res.status(200).json({
          reply: 'I apologize, but I cannot respond to that question. Please ask me about organic food or Organica products!',
        });
        return;
      }
      next(error);
    }
  };
}
