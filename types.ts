
export enum AppScreen {
  INTRO = 'INTRO',
  MENU = 'MENU',
  CHARACTER_CREATOR = 'CHARACTER_CREATOR',
  PAINTING = 'PAINTING',
  CIPHER_GAME = 'CIPHER_GAME', // Decode/Password game
  PATTERN_GAME = 'PATTERN_GAME', // Pattern logic
  // NEW GAMES
  TREASURE_HUNT = 'TREASURE_HUNT',
  MEMORY_GAME = 'MEMORY_GAME',
  MISSING_SYMBOL = 'MISSING_SYMBOL',
  NUMBER_HUNTER = 'NUMBER_HUNTER',
  DETECTIVE_GAME = 'DETECTIVE_GAME',
  SHADOW_MATCH = 'SHADOW_MATCH',
  
  AVATAR_CREATOR = 'AVATAR_CREATOR',
}

export enum CharacterType {
  CAT = 'Kedi',
  DOG = 'Köpek',
  BIRD = 'Kuş',
  FISH = 'Balık',
  DINOSAUR = 'Dinozor',
  ELEPHANT = 'Fil',
  TURTLE = 'Kaplumbağa',
  RABBIT = 'Tavşan',
  LION = 'Aslan',
  PANDA = 'Panda',
}

export enum CharacterColor {
  RED = 'Kırmızı',
  BLUE = 'Mavi',
  YELLOW = 'Sarı',
  GREEN = 'Yeşil',
  ORANGE = 'Turuncu',
  PURPLE = 'Mor',
  BROWN = 'Kahverengi',
  PINK = 'Pembe',
  BLACK = 'Siyah',
}

export interface CharacterState {
  type: CharacterType;
  color: CharacterColor;
  accessory: string;
  generatedImageUrl?: string;
}

export interface SavedCharacter {
  id: string;
  imageUrl: string; // Can be a URL or an Emoji fallback
  type: CharacterType;
  color: CharacterColor;
}

export interface CipherLevel {
  id: number;
  word: string;
  code: string;
  imagePrompt: string;
}

export interface GameState {
  currentScreen: AppScreen;
  character: CharacterState;
  characterPool: SavedCharacter[]; // Pool of created characters
  avatarMood: 'happy' | 'sad' | 'neutral';
  gameLevel: number;
  lives: number;
  score: number;
}