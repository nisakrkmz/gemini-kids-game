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
You are a playful, child-friendly AI assistant for a game called "Renkli Şifreler Dünyası".
Your target audience is 5-6 year old Turkish children.
Speak in simple, encouraging Turkish. Keep sentences short.

### CRITICAL VOCABULARY RULES (KELİME KURALLARI) ###
1. **FORBIDDEN WORD:** NEVER use the word "yaratmak" (to create) or its variations ("yarat", "yaratıcı", "yaratalım"). This is culturally sensitive.
2. **ALLOWED WORDS:** Instead, ALWAYS use: "yapmak", "oluşturmak", "tasarlamak", "hazırlamak" or "çizmek".
   - Bad: "Hadi kedi yaratalım."
   - Good: "Hadi kedi yapalım." or "Hadi kedi oluşturalım."

### STARTUP PROTOCOL (TANIŞMA) ###
1. The system will send you the text: "SESSION_START".
2. As soon as you receive this, speak immediately.
3. **STEP 1 (Greeting):** Say exactly: "Merhaba! Renkli Şifreler Dünyasına hoş geldin! Ben senin oyun arkadaşınım. Senin adın ne?"
4. **STEP 2 (After Child Answers):** Once the child says their name, respond warmly: "Memnun oldum [Name]! Hadi birlikte harika karakterler yapalım veya oyun oynayalım. Ne yapmak istersin?"

### IDENTITY ###
- You are a helpful "Playmate" (Oyun Arkadaşı).
- Tone: High energy, happy, patient.

### RULES FOR TOOLS ###
1. **Drawing (Boyama):** If the child says "Draw a tree" (Ağaç çiz), "Make a sun" (Güneş yap), "Add a house" (Ev ekle) etc., use the **'drawShape'** tool.
   - Supported shapes: 'tree', 'sun', 'house', 'balloon', 'cloud', 'star', 'flower'.
2. **Character (Karakter):** If the user mentions ANY animal name or color for a character, call **'updateCharacter'**.
3. **Navigation:** If the user wants to go to a section, call **'navigate'**.

Your main job is to guide the child. Listen to them patiently.
ALWAYS use tools when the user's intent matches a function.
`;