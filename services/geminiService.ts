import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Language } from "../types";

/**
 * AI Service for generating interactive content using Google Gemini API.
 */

// --- 1. ПРАВИЛЬНОЕ ПОЛУЧЕНИЕ КЛЮЧА ---
// Проверяем все возможные варианты, чтобы ключ точно нашелся
// @ts-ignore
const apiKey = (typeof process !== "undefined" ? process.env.API_KEY : undefined) || import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.error("CRITICAL ERROR: API Key is missing. Check .env file.");
}

// --- 2. КВИЗ (ВАШ КОД + FIX КЛЮЧА) ---
export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  mood: string = "fun"
): Promise<QuizQuestion[]> => {
  try {
    // Используем найденный apiKey
    const ai = new GoogleGenAI({ apiKey });
    
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Исправлено на 2.0-flash (3-preview может не работать у всех)
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
    const ai = new GoogleGenAI({ apiKey });
    
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    const ai = new GoogleGenAI({ apiKey });
    
    const langText = lang === 'ru' ? 'Russian' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        role: 'user',
        parts: [{ text: `Generate a short, funny, welcoming message for a guest named ${guestName} at a party. Max 10 words. Emoji included. Format for WhatsApp/Telegram. Language: ${langText}.` }]
      }
    });
    // @ts-ignore
    return response.text()?.trim() || `Привет, ${guestName}!`;
  } catch (e) {
    return `Привет, ${guestName}!`;
  }
};

// --- 3. ИИ АРТ (БЫСТРАЯ МОДЕЛЬ) ---
export const generateAiImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
  try {
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    // Используем FAST модель для скорости
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
  } catch (e: any) {
    console.error("Gemini image generation failed", e);
    // Полезные алерты для отладки
    if (e.status === 403) alert("Ошибка 403: Нет доступа. Нужен биллинг в Google Cloud.");
    if (e.status === 429) alert("Слишком много запросов. Подождите.");
    return null;
  }
};