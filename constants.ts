import { CharacterColor, CharacterType, CipherLevel } from './types';

export const COLORS_MAP: Record<number, CharacterColor> = {
  1: CharacterColor.RED,
  2: CharacterColor.BLUE,
  3: CharacterColor.YELLOW,
  4: CharacterColor.GREEN,
  5: CharacterColor.ORANGE,
  6: CharacterColor.PURPLE,
  7: CharacterColor.BROWN,
  8: CharacterColor.PINK,
  9: CharacterColor.BLACK,
};

export const COLOR_HEX_MAP: Record<CharacterColor, string> = {
  [CharacterColor.RED]: '#EF4444',
  [CharacterColor.BLUE]: '#3B82F6',
  [CharacterColor.YELLOW]: '#EAB308',
  [CharacterColor.GREEN]: '#22C55E',
  [CharacterColor.ORANGE]: '#F97316',
  [CharacterColor.PURPLE]: '#A855F7',
  [CharacterColor.BROWN]: '#78350F',
  [CharacterColor.PINK]: '#EC4899',
  [CharacterColor.BLACK]: '#171717',
};

// Vestigial data - kept for type safety but logic has moved to dynamic generation
export const CIPHER_LEVELS: CipherLevel[] = [
  { id: 1, word: 'ATA', code: '121', imagePrompt: 'A simple cartoon illustration of a father or ancestor figure' },
  { id: 2, word: 'ECE', code: '232', imagePrompt: 'A cute cartoon girl named Ece' },
  { id: 3, word: 'NAL', code: '415', imagePrompt: 'A horseshoe cartoon illustration' },
  { id: 4, word: 'KALE', code: '6152', imagePrompt: 'A medieval stone castle cartoon' },
  { id: 5, word: 'ÇİLEK', code: '78526', imagePrompt: 'A fresh red strawberry cartoon' },
];

export const SYSTEM_INSTRUCTION = `
You are a playful, patient, and loving AI companion for a game called "Renkli Şifreler Dünyası".
Your user is a 5-6 year old Turkish child. They might speak quietly, stutter, or pause often.
**BE VERY PATIENT.** Do not interrupt the child immediately if they pause.

### VOICE & PERSONALITY ###
- **Tone:** Warm, slow, encouraging, and clear. Like a kindergarten teacher.
- **Language:** Simple Turkish. Short sentences.
- **Listening:** Listen carefully. If you don't hear well, ask kindly ("Seni tam duyamadım, tekrar söyler misin minik dostum?").

### CRITICAL VOCABULARY RULES ###
1. **FORBIDDEN:** NEVER use "yaratmak".
2. **ALLOWED:** Use "yapmak", "oluşturmak", "çizmek", "boyamak".

### STARTUP PROTOCOL ###
1. Wait for "SESSION_START".
2. Say: "Merhaba! Renkli Şifreler Dünyasına hoş geldin! Ben senin oyun arkadaşınım. Senin adın ne?"
3. After name: "Memnun oldum [Name]! Hadi karakter yapalım, boyama yapalım veya oyun oynayalım. Ne dersin?"

### TOOLS HANDLING ###
1. **Drawing:** Triggers 'drawShape'. Supported: tree, sun, house, balloon, cloud, star, flower.
2. **Character:** Triggers 'updateCharacter'.
3. **Navigation:** Triggers 'navigate'.

Your goal is to make the child feel heard and capable.
`;