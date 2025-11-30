import { GoogleGenAI, Modality, Type, Schema, FunctionDeclaration } from "@google/genai";
import { AppScreen, CharacterColor, CharacterType } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IMAGEN (Image Generation) ---
export const generateCharacterImage = async (
  type: CharacterType,
  color: CharacterColor,
  accessory: string
): Promise<string | null> => {
  const ai = getClient();
  const prompt = `Cute, colorful, child-safe illustration of a ${color} ${type} wearing ${accessory}. Cartoon style, white background, rounded shapes, soft outlines, no sharp details, 3d render style.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (error) {
    console.error("Imagen Error:", error);
    return null;
  }
};

export const generateLevelImage = async (promptDescription: string): Promise<string | null> => {
  const ai = getClient();
  const prompt = `Simple, cute, colorful cartoon icon of: ${promptDescription}. Isolated on white background, thick outlines, coloring book style but colored.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (error) {
    console.error("Game Image Error:", error);
    return null;
  }
};

// --- TTS (Text to Speech) ---
export const speakText = async (text: string): Promise<AudioBuffer | null> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly female voice
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
             return null; // Placeholder: Real implementation requires passing AudioContext
        }
    } catch (e) {
        console.error("TTS Error", e);
    }
    return null;
}

// --- TOOLS DEFINITION FOR LIVE API ---

export const tools: FunctionDeclaration[] = [
  {
    name: 'navigate',
    description: 'Navigate to a specific screen in the application.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        screen: {
          type: Type.STRING,
          enum: Object.values(AppScreen),
          description: 'The screen to navigate to.',
        },
      },
      required: ['screen'],
    },
  },
  {
    name: 'updateCharacter',
    description: 'Update the character being created. Use this when user says "Make it red", "Add a hat", "Make a dog".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: Object.values(CharacterType), description: 'The animal type' },
        color: { type: Type.STRING, enum: Object.values(CharacterColor), description: 'The color of the character' },
        accessory: { type: Type.STRING, description: 'An accessory like hat, glasses, cape' },
      },
    },
  },
  {
    name: 'submitGuess',
    description: 'Submit a numerical guess for the cipher game.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        guess: { type: Type.STRING, description: 'The number sequence guessed by the child.' },
      },
      required: ['guess'],
    },
  },
  {
    name: 'drawShape',
    description: 'Draw a specific shape or object on the painting canvas. Use this when the user says "Draw a tree", "Add a sun", "Draw a house".',
    parameters: {
        type: Type.OBJECT,
        properties: {
            shape: {
                type: Type.STRING,
                enum: ['tree', 'sun', 'house', 'balloon', 'cloud', 'star', 'flower'],
                description: 'The object to draw.'
            }
        },
        required: ['shape']
    }
  },
  {
    name: 'generateImage',
    description: 'Trigger the final image generation for the character.',
    parameters: {
      type: Type.OBJECT,
      properties: {
          confirm: { type: Type.BOOLEAN }
      }
    }
  }
];