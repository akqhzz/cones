import { GoogleGenAI } from '@google/genai';
import type { ConeAnalysis } from './claude';

const PROMPT = `Analyze this image carefully. Is this a traffic cone (road cone / construction cone)?

Return ONLY a raw JSON object with no markdown, no explanation, just the JSON.

If it IS a traffic cone:
{
  "is_impostor": false,
  "description": "2-3 words that name this cone's archetype (as if they're real serious human beings, try avoid using words like sentinel, guardian, sentry, stoic etc. think beyond the fact that they're cones and they're used for protection. be creative.). focus on its special charcaterics/interaction with the environment, be a bit creative, no cliche. Use simple and short words. Slighltly sarcastic and slightly academic as if you're writing an anthropology report with simple words. sometimes start with "a/an" if there's only one cone; if not, use two, three, etc. or some. make sure it's aligned with the cone's big five. don't add ay punctuations after the words",
  "about": "2-3 sentences in total. describe this cone as if this cone were a person with a distinct personality and story (mention its special charcaterics/interaction with the environment, be a bit creative), including why it fits its big five personality. If there are multiple cones, focus on the relationship/dynamics between them. Refer it as 'this cone' if therfore's one cone, or 'These cones' if there are multiple. make the language as natural (doesn't sound like AI) as possible. Slighltly sarcastic and slightly academic as if you're writing an anthropology report and philosophy paper with simple words.",
  "big_five": {
    "openness": 75,
    "conscientiousness": 60,
    "extraversion": 45,
    "agreeableness": 80,
    "neuroticism": 30
  },
  "sloan": "RLUEN",
  "core_values": ["Compassion", "Innovation", "Vigilance", "Resilience", "Curiosity", "Order"],
  "song": null
}

Rules:
- Make sure the description is aligned with the cone's big five.
- Try to think beyond the normal functions of a cone, think about its special charcaterics/interaction with the environment, if there are multiple cones, think about the relationship/dynamics between them. be a bit creative, no cliche.
- Big Five: Analyze this cone's personality using Big Five (OCEAN) theory. Make sure it's aligned with its description. If there are multiple cones in the image, make sure it's high in extraversion. If the cone has a lot of interaction with the environment, make it extraverted too. If one or more cone is pretty tortured/bent/fallen, make it high in neuroticism and low in agreeableness. Give it a roughly 50% to be low in openness. Return a value from 0 to 100 for each of: openness, conscientiousness, extraversion, agreeableness, neuroticism.
- SLOAN: Return a 5-letter Big Five summary ("SLOAN") based on those values. Order of letters: Extraversion, Neuroticism, Conscientiousness, Agreeableness, Openness. Use these high/low codes: Extraversion S/R, Neuroticism L/C, Conscientiousness O/U, Agreeableness A/E, Openness I/N. The sloan MUST be exactly one of these 32 possibilities (no other value is valid):
  SCOAI, SCOAN, SCOEI, SCOEN, SCUAI, SCUAN, SCUEI, SCUEN,
  SLOAI, SLOAN, SLOEI, SLOEN, SLUAI, SLUAN, SLUEI, SLUEN,
  RCOAI, RCOAN, RCOEI, RCOEN, RCUAI, RCUAN, RCUEI, RCUEN,
  RLOAI, RLOAN, RLOEI, RLOEN, RLUAI, RLUAN, RLUEI, RLUEN.
  Pick the one that best matches the Big Five values you returned. No spaces, no other strings.
- Core Values: Return 5 to 6 positive core values that fit this cone's personality (e.g. Autonomy, Adventure, Peace, Growth, Generosity).
- Do NOT return a song; leave "song" as null.

If it is NOT a traffic cone:
{
  "is_impostor": true,
  "description": "IMPOSTOR DETECTED",
  "about": "Brief humorousnote about why it's not welcome in the cone archive. make the language as natural (doesn't sound like AI) as possible. ",
  "big_five": null,
  "sloan": null,
  "core_values": [],
  "song": null
}`;

const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const safeMime = (m: string): 'image/jpeg' | 'image/png' | 'image/webp' =>
  validMimeTypes.includes(m as any) ? (m as 'image/jpeg' | 'image/png' | 'image/webp') : 'image/jpeg';

// Default multimodal models we will try in order if no explicit list is provided.
// Ordered by your requested preference:
// 1) gemini-3.1-flash-lite
// 2) gemini-3.0-flash
// 3) gemini-2.5-flash-lite
// 4) gemini-2.5-flash
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.0-flash-preview', // alias; if unavailable this entry will just fail and we fall through
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
] as const;

export async function analyzeConeWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ConeAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env.local to use Gemini for cone analysis.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64 = imageBuffer.toString('base64');
  const mime = safeMime(mimeType);

  // Build ordered model list:
  // - If GEMINI_MODEL is set, try that first.
  // - If GEMINI_MODELS is set, try those in order (after GEMINI_MODEL if present).
  // - Then fall back to DEFAULT_GEMINI_MODELS.
  const envPrimary = process.env.GEMINI_MODEL?.trim();
  const envList =
    process.env.GEMINI_MODELS
      ?.split(',')
      .map((m) => m.trim())
      .filter(Boolean) ?? [];

  const candidateModels: string[] = [];
  if (envPrimary) candidateModels.push(envPrimary);
  for (const m of envList) {
    if (!candidateModels.includes(m)) candidateModels.push(m);
  }
  for (const m of DEFAULT_GEMINI_MODELS) {
    if (!candidateModels.includes(m)) candidateModels.push(m);
  }

  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64,
                  mimeType: mime,
                },
              },
              {
                text: PROMPT,
              },
            ],
          },
        ],
      });

      const raw = (response.text ?? '').trim();
      // Strip markdown code fences if present
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      if (!text) {
        throw new Error(`Gemini (${model}) returned empty response`);
      }
      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error(`Failed to parse Gemini (${model}) response: ` + text.slice(0, 300));
      }
    } catch (err) {
      // Save error and try the next model.
      lastError = err;
      // eslint-disable-next-line no-console
      console.error(`Gemini model "${model}" failed, trying next model if available:`, err);
    }
  }

  // If we get here, all models failed.
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('All Gemini models failed for cone analysis.');
}
