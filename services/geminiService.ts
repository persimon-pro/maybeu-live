import { GoogleGenAI } from "@google/genai";

// Инициализация клиента с использованием API ключа из переменных окружения
// или жестко заданного ключа (для простоты в этом проекте)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "ВАШ_КЛЮЧ_ЗДЕСЬ"; 

const client = new GoogleGenAI({ apiKey });

/**
 * Генерация вопросов для квиза
 */
export const generateQuizQuestions = async (topic: string, lang: 'ru' | 'en', count: number = 5, mood: string = 'fun'): Promise<any[]> => {
  try {
    const prompt = `
      Create ${count} quiz questions about "${topic}". 
      Language: ${lang}. 
      Mood: ${mood}.
      Format: JSON array of objects with keys: 
      - question (string)
      - options (array of 4 strings)
      - correctAnswerIndex (number 0-3)
      
      Example:
      [
        {
          "question": "Which planet is known as the Red Planet?",
          "options": ["Earth", "Mars", "Venus", "Jupiter"],
          "correctAnswerIndex": 1
        }
      ]
      
      Strictly return ONLY valid JSON.
    `;

    // Используем быструю модель Flash для текстовой генерации
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text();
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

/**
 * Генерация вопросов "Верю / Не верю"
 */
export const generateBelieveNotQuestions = async (topic: string, lang: 'ru' | 'en', count: number = 5): Promise<any[]> => {
  try {
    const prompt = `
      Create ${count} "True or False" facts about "${topic}".
      Language: ${lang}.
      Format: JSON array of objects:
      - question (string - the fact statement)
      - options (array ["True", "False"] or localized equivalent)
      - correctAnswerIndex (0 for True, 1 for False)
      
      Strictly return ONLY valid JSON.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text();
    if (!text) return [];

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating believe/not:", error);
    return [];
  }
};

/**
 * Генерация изображения по описанию (ИИ Арт)
 * Оптимизировано для скорости!
 */
export const generateAiImage = async (prompt: string): Promise<string | null> => {
  try {
    // ВАЖНО: Используем модель 'imagen-3.0-fast-generate-001'
    // Она работает в 3-4 раза быстрее обычной версии.
    const response = await client.models.generateImages({
      model: 'imagen-3.0-fast-generate-001', 
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        // Отключаем строгий фильтр безопасности для ускорения и меньшего числа ложных блокировок
        safetyFilterLevel: 'block_low_and_above', 
        personGeneration: 'allow_adult' 
      }
    });

    // Получаем base64 первого изображения
    if (response.generatedImages && response.generatedImages.length > 0) {
      const imgData = response.generatedImages[0].image.base64;
      return `data:image/jpeg;base64,${imgData}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};