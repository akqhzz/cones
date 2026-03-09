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
  /** 5-letter Big Five summary e.g. "RLUAI" (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) */
  sloan?: string | null;
  core_values: string[];
  song: { title: string; artist: string } | null;
}

const MOCK_DESCRIPTIONS = [
  'The Urban Explorer',
  'The Scarred Survivor',
  'The Gatekeeper',
  'The Commuter',
  'The Retired Artist',
];
/**const MOCK_LOCATIONS = ['Downtown Toronto', 'East Side Brooklyn', 'Midtown Atlanta', 'South Loop Chicago'];*/
const MOCK_VALUES = [
  ['Honor', 'Loyalty', 'Perseverance', 'Vigilance', 'Kindness'],
  ['Belonging', 'Loyalty', 'Courage', 'Patience', 'Stability'],
  ['Self-direction', 'Benevolence', 'Stimulation', 'Hedonism', 'Universalism'],
];

const MOCK_ABOUTS = [
  'A steadfast guardian of the urban thoroughfare, this cone has witnessed countless commuters rush past without so much as a glance. Born of high-density polyethylene and a deep sense of purpose, it stands resolute through rain, exhaust, and the occasional errant shopping cart. Beneath its reflective collar beats the heart of a true civil servant.',
  'This cone carries the quiet dignity of one who has chosen the margins over the spotlight. It does not demand attention; it earns it through consistency. Rain or shine, it holds the line—a modest monument to order in a world of chaos.',
  'Here stands a cone that has seen fender benders, parades, and midnight street sweepers. It speaks no language but presence. To the hurried driver it is obstacle; to the anthropologist it is artifact. Either way, it remains.',
];

const MOCK_SLOANS = [
  'SCOAI', 'SCOAN', 'SCOEI', 'SCOEN', 'SCUAI', 'SCUAN', 'SCUEI', 'SCUEN',
  'SLOAI', 'SLOAN', 'SLOEI', 'SLOEN', 'SLUAI', 'SLUAN', 'SLUEI', 'SLUEN',
  'RCOAI', 'RCOAN', 'RCOEI', 'RCOEN', 'RCUAI', 'RCUAN', 'RCUEI', 'RCUEN',
  'RLOAI', 'RLOAN', 'RLOEI', 'RLOEN', 'RLUAI', 'RLUAN', 'RLUEI', 'RLUEN',
];

export function mockAnalysis(): ConeAnalysis {
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    is_impostor: false,
    description: pick(MOCK_DESCRIPTIONS),
    location: null,
    about: pick(MOCK_ABOUTS),
    big_five: {
      openness: rand(30, 95),
      conscientiousness: rand(30, 95),
      extraversion: rand(20, 80),
      agreeableness: rand(40, 95),
      neuroticism: rand(15, 70),
    },
    sloan: pick(MOCK_SLOANS),
    core_values: pick(MOCK_VALUES),
    song: null,
  };
}

export async function analyzeCone(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ConeAnalysis> {
  // When no Gemini key: use mock only (do not call Claude)
  await new Promise((r) => setTimeout(r, 1500)); // simulate latency
  return mockAnalysis();
}
