import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Language } from "../types";

/**
 * AI Service for generating interactive content using Google Gemini API.
 * Uses process.env.API_KEY as requested.
 */

// Получаем ключ из process.env (как у вас) или import.meta.env (стандарт Vite)
const apiKey = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey });

export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  mood: string = "fun"
): Promise<QuizQuestion[]> => {
  try {
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Используем быструю и стабильную версию
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
    const langText = lang === 'ru' ? 'Russian' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        role: 'user',
        parts: [{ text: `Generate a short, funny, welcoming message for a guest named ${guestName} at a party. Max 10 words. Emoji included. Format for WhatsApp/Telegram. Language: ${langText}.` }]
      }
    });
    return response.text()?.trim() || `Привет, ${guestName}! Рады видеть тебя!`;
  } catch (e) {
    return `Привет, ${guestName}! Рады видеть тебя!`;
  }
};

/**
 * ГЕНЕРАЦИЯ КАРТИНОК
 * Внедрены изменения: используется быстрая модель imagen-3.0-fast-generate-001
 */
export const generateAiImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
  try {
    // Используем правильный метод generateImages для модели Imagen
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-fast-generate-001', // БЫСТРАЯ МОДЕЛЬ
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_only_high", // Ослабленный фильтр
        personGeneration: "allow_adult"
      }
    });

    // Получаем base64 из массива generatedImages
    if (response.generatedImages && response.generatedImages.length > 0) {
      const imgData = response.generatedImages[0].image.base64;
      // Добавляем префикс, если его нет (обычно API возвращает чистый base64)
      return `data:image/jpeg;base64,${imgData}`;
    }
    
    return null;
  } catch (e: any) {
    console.error("Gemini image generation failed", e);
    
    // Обработка ошибок для понимания причин
    if (e.status === 403) {
      alert("Ошибка доступа (403). Проверьте, включен ли биллинг в Google Cloud.");
    } else if (e.status === 429) {
      alert("Слишком много запросов. Подождите минуту.");
    }
    
    return null;
  }
};