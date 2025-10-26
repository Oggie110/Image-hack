export interface GenerationMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  promptTemplate?: string;
  negativePromptTemplate?: string;
  recommendedSizes?: Array<{ width: number; height: number; label: string }>;
  suggestedKeywords?: string[];
  guidanceScale?: number;
  steps?: number;
}

export const GENERATION_MODES: GenerationMode[] = [
  {
    id: 'ui-design',
    name: 'UI/UX Design',
    description: 'Clean, modern interface designs with professional layouts',
    icon: '🎨',
    promptTemplate: 'modern {prompt}, clean UI design, professional interface, high quality, detailed',
    negativePromptTemplate: 'blurry, low quality, text, watermark, signature',
    recommendedSizes: [
      { width: 1920, height: 1080, label: 'Desktop (1920×1080)' },
      { width: 1440, height: 900, label: 'Laptop (1440×900)' },
      { width: 375, height: 812, label: 'Mobile (375×812)' },
    ],
    suggestedKeywords: ['dashboard', 'landing page', 'mobile app', 'web interface', 'component library'],
    guidanceScale: 8,
    steps: 30,
  },
  {
    id: 'advertising',
    name: 'Advertising',
    description: 'Eye-catching visuals for marketing and advertising campaigns',
    icon: '📢',
    promptTemplate: '{prompt}, professional advertising, high impact, commercial photography style, vibrant colors',
    negativePromptTemplate: 'amateur, low quality, blurry, dull colors',
    recommendedSizes: [
      { width: 1200, height: 1200, label: 'Square (1200×1200)' },
      { width: 1200, height: 628, label: 'Landscape (1200×628)' },
      { width: 1080, height: 1920, label: 'Portrait (1080×1920)' },
    ],
    suggestedKeywords: ['product shot', 'lifestyle', 'brand identity', 'promotional banner', 'campaign visual'],
    guidanceScale: 9,
    steps: 35,
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Optimized visuals for Instagram, Twitter, Facebook, and more',
    icon: '📱',
    promptTemplate: '{prompt}, social media post, trendy, engaging visual, professional quality',
    negativePromptTemplate: 'low quality, blurry, boring, generic',
    recommendedSizes: [
      { width: 1080, height: 1080, label: 'Instagram Square' },
      { width: 1080, height: 1350, label: 'Instagram Portrait' },
      { width: 1200, height: 675, label: 'Twitter/Facebook' },
      { width: 1080, height: 1920, label: 'Instagram Story' },
    ],
    suggestedKeywords: ['post', 'story', 'highlight cover', 'profile banner', 'carousel'],
    guidanceScale: 8,
    steps: 30,
  },
  {
    id: 'illustration',
    name: 'Illustration',
    description: 'Artistic illustrations and creative artwork',
    icon: '🖼️',
    promptTemplate: '{prompt}, digital illustration, artistic, detailed artwork, professional illustration style',
    negativePromptTemplate: 'photo, realistic, blurry, low detail',
    recommendedSizes: [
      { width: 1024, height: 1024, label: 'Square (1024×1024)' },
      { width: 1024, height: 1536, label: 'Portrait (1024×1536)' },
      { width: 1536, height: 1024, label: 'Landscape (1536×1024)' },
    ],
    suggestedKeywords: ['character design', 'concept art', 'vector style', 'flat design', 'hand-drawn'],
    guidanceScale: 10,
    steps: 40,
  },
  {
    id: 'product',
    name: 'Product Design',
    description: 'Clean product mockups and professional product photography',
    icon: '📦',
    promptTemplate: '{prompt}, product photography, studio lighting, white background, professional, high quality',
    negativePromptTemplate: 'blurry, low quality, cluttered background, poor lighting',
    recommendedSizes: [
      { width: 1024, height: 1024, label: 'Square (1024×1024)' },
      { width: 1200, height: 1200, label: 'E-commerce (1200×1200)' },
      { width: 2000, height: 2000, label: 'High-res (2000×2000)' },
    ],
    suggestedKeywords: ['mockup', 'packaging', 'lifestyle shot', '3D render', 'hero image'],
    guidanceScale: 9,
    steps: 35,
  },
  {
    id: 'photography',
    name: 'Photography',
    description: 'Realistic photographic images and scenes',
    icon: '📸',
    promptTemplate: '{prompt}, professional photography, DSLR, high resolution, photorealistic',
    negativePromptTemplate: 'cartoon, illustration, drawing, low quality, blurry',
    recommendedSizes: [
      { width: 1024, height: 1024, label: 'Square (1024×1024)' },
      { width: 1920, height: 1080, label: '16:9 (1920×1080)' },
      { width: 1080, height: 1920, label: '9:16 (1080×1920)' },
    ],
    suggestedKeywords: ['portrait', 'landscape', 'street photography', 'architecture', 'nature'],
    guidanceScale: 7,
    steps: 30,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Full control over all generation parameters',
    icon: '⚙️',
    suggestedKeywords: ['your custom prompt here'],
  },
];

export function getModeById(id: string): GenerationMode | undefined {
  return GENERATION_MODES.find((mode) => mode.id === id);
}

export function applyModeToPrompt(mode: GenerationMode, userPrompt: string): string {
  if (!mode.promptTemplate) return userPrompt;
  return mode.promptTemplate.replace('{prompt}', userPrompt);
}

export function getModeNegativePrompt(mode: GenerationMode, userNegativePrompt?: string): string {
  const modeNegative = mode.negativePromptTemplate || '';
  if (!userNegativePrompt) return modeNegative;
  return userNegativePrompt + (modeNegative ? ', ' + modeNegative : '');
}
