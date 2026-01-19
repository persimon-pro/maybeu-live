import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Language } from "../types";

/**
 * AI Service for generating interactive content using Google Gemini API.
 * The API key is obtained exclusively from the environment variable process.env.API_KEY.
 */

export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  mood: string = "fun"
): Promise<QuizQuestion[]> => {
  try {
    // Fix: Initializing Gemini AI exclusively with process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: [{ text: `Generate a list of ${count} ${mood} quiz questions on the topic "${topic}" for a live event. For each question, provide 4 options. Language: ${langText}.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER }
            },
            required: ["id", "question", "options", "correctAnswerIndex"]
          }
        }
      }
    });

    if (response.text) {
      // @ts-ignore
      return JSON.parse(response.text());
    }
    return [];
  } catch (e) {
    console.error("Gemini quiz generation failed", e);
    return [];
  }
};

export const generateBelieveNotQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5
): Promise<QuizQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: [{ text: `Generate a list of ${count} "True or False" facts about "${topic}". Language: ${langText}.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER }
            },
            required: ["id", "question", "options", "correctAnswerIndex"]
          }
        }
      }
    });

    if (response.text) {
      // @ts-ignore
      return JSON.parse(response.text());
    }
    return [];
  } catch (e) {
    console.error("Gemini believe/not generation failed", e);
    return [];
  }
};

export const generateGuestGreeting = async (guestName: string, lang: Language): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langText = lang === 'ru' ? 'Russian' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: [{ text: `Generate a short, funny, welcoming message for a guest named ${guestName} at a party. Max 10 words. Emoji included. Format for WhatsApp/Telegram. Language: ${langText}.` }]
      }
    });
    // @ts-ignore
    return response.text()?.trim() || `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  } catch (e) {
    return `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  }
};

// --- ЕДИНСТВЕННОЕ ИЗМЕНЕНИЕ НИЖЕ (ИСПРАВЛЕНА ГЕНЕРАЦИЯ КАРТИНОК) ---

export const generateAiImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
  try {
    // Берем ключ так же, как в остальных функциях, но добавляем страховку для Vite (на случай, если process.env пустой)
    // @ts-ignore
    const key = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!key) {
        console.error("API Key is missing for Image Generation");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: key });

    // Используем правильный метод generateImages (а не generateContent) и быструю модель
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-fast-generate-001', 
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_only_high", 
        personGeneration: "allow_adult"
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imgData = response.generatedImages[0].image.base64;
      return `data:image/jpeg;base64,${imgData}`;
    }
    
    return null;
  } catch (e) {
    console.error("Gemini image generation failed", e);
    return null;
  }
};