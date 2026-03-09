import { GoogleGenAI } from '@google/genai';
import type { ConeAnalysis } from './claude';

const PROMPT = `Analyze this image carefully. Is this a traffic cone (road cone / construction cone)?

Return ONLY a raw JSON object with no markdown, no explanation, just the JSON.

If it IS a traffic cone:
{
  "is_impostor": false,
  "description": "2-3 words that name this cone's archetype",
  "about": "4-5 sentences to describe this cone as if this cone were a person with a distinct personality and story, including why it fits its big five personality.
   Refer it as 'this cone' if there's one cone, or 'These cones' if there are multiple. ",
  "big_five": {
    "openness": 75,
    "conscientiousness": 60,
    "extraversion": 45,
    "agreeableness": 80,
    "neuroticism": 30
  },
  "sloan": "RLUAI",
  "core_values": ["Safety", "Duty", "Vigilance", "Resilience", "Perseverance", "Order"],
  "song": null
}

Rules:
- Big Five: Analyze this cone's personality using Big Five (OCEAN) theory. Return a value from 0 to 100 for each of: openness, conscientiousness, extraversion, agreeableness, neuroticism.
- SLOAN: Return a 5-letter Big Five summary ("SLOAN") based on those values. Order of letters: Extraversion, Neuroticism, Conscientiousness, Agreeableness, Openness. Use standard high/low codes: Extraversion S/R, Neuroticism L/C, Conscientiousness O/U,  Agreeableness A/E, Openness I/N. Example: "RLUAI" means Reserved on openness, Limbic on Neuroticism, etc.
- Core Values: Return 5 to 6 core values that fit this cone's personality (e.g. Safety, Duty, Vigilance, Resilience, Perseverance).
- Do NOT return a song; leave "song" as null.

If it is NOT a traffic cone:
{
  "is_impostor": true,
  "description": "IMPOSTOR DETECTED",
  "about": "Brief humorous note about what this actually is and why it's not welcome in the cone archive",
  "big_five": null,
  "sloan": null,
  "core_values": [],
  "song": null
}`;

const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const safeMime = (m: string): 'image/jpeg' | 'image/png' | 'image/webp' =>
  validMimeTypes.includes(m as any) ? (m as 'image/jpeg' | 'image/png' | 'image/webp') : 'image/jpeg';

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

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
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

  const text = (response.text ?? '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse Gemini response: ' + text.slice(0, 200));
  }
}
