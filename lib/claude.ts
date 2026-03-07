import Anthropic from '@anthropic-ai/sdk';

export interface ConeAnalysis {
  is_impostor: boolean;
  description: string | null;
  location: string | null;
  about: string | null;
  big_five: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  } | null;
  core_values: string[];
  song: { title: string; artist: string } | null;
}

const MOCK_DESCRIPTIONS = [
  'Stalwart Orange Sentinel',
  'Vigilant Asphalt Guardian',
  'Solitary Meridian Watcher',
  'Weathered Urban Beacon',
  'Stoic Roadside Prophet',
];
const MOCK_LOCATIONS = ['Downtown Toronto', 'East Side Brooklyn', 'Midtown Atlanta', 'South Loop Chicago'];
const MOCK_SONGS = [
  { title: 'Road to Nowhere', artist: 'Talking Heads' },
  { title: 'Orange Sky', artist: 'Alexi Murdoch' },
  { title: 'Standing Outside a Broken Phone Booth', artist: 'Primitive Radio Gods' },
  { title: 'Waiting', artist: 'Tom Petty' },
];
const MOCK_VALUES = [
  ['Safety', 'Duty', 'Perseverance', 'Vigilance', 'Resilience'],
  ['Order', 'Loyalty', 'Courage', 'Tradition', 'Stability'],
  ['Self-direction', 'Benevolence', 'Stimulation', 'Hedonism', 'Universalism'],
];

function mockAnalysis(): ConeAnalysis {
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    is_impostor: false,
    description: pick(MOCK_DESCRIPTIONS),
    location: pick(MOCK_LOCATIONS),
    about:
      'A steadfast guardian of the urban thoroughfare, this cone has witnessed countless commuters rush past without so much as a glance. Born of high-density polyethylene and a deep sense of purpose, it stands resolute through rain, exhaust, and the occasional errant shopping cart. Beneath its reflective collar beats the heart of a true civil servant.',
    big_five: {
      openness: rand(30, 95),
      conscientiousness: rand(30, 95),
      extraversion: rand(20, 80),
      agreeableness: rand(40, 95),
      neuroticism: rand(15, 70),
    },
    core_values: pick(MOCK_VALUES),
    song: pick(MOCK_SONGS),
  };
}

export async function analyzeCone(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ConeAnalysis> {
  // Use mock data when no API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 1500)); // simulate latency
    return mockAnalysis();
  }

  const client = new Anthropic();
  const base64 = imageBuffer.toString('base64');

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const safeMimeType = validMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: safeMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Analyze this image carefully. Is this a traffic cone (road cone / construction cone)?

Return ONLY a raw JSON object with no markdown, no explanation, just the JSON:

If it IS a traffic cone:
{
  "is_impostor": false,
  "description": "3 evocative words that name this cone (e.g. 'Lonely Midnight Sentinel')",
  "location": "Guessed city or context (e.g. 'Downtown Toronto' or 'Highway Interchange')",
  "about": "2-3 sentences written as if this cone were a person with a distinct personality and story",
  "big_five": {
    "openness": 75,
    "conscientiousness": 60,
    "extraversion": 45,
    "agreeableness": 80,
    "neuroticism": 30
  },
  "core_values": ["Safety", "Duty", "Vigilance", "Resilience", "Perseverance"],
  "song": {
    "title": "exact song title that matches this cone's vibe",
    "artist": "exact artist name"
  }
}

If it is NOT a traffic cone:
{
  "is_impostor": true,
  "description": "IMPOSTOR DETECTED",
  "location": null,
  "about": "Brief humorous note about what this actually is and why it's not welcome in the cone archive",
  "big_five": null,
  "core_values": [],
  "song": null
}`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse Claude response: ' + text.slice(0, 200));
  }
}
