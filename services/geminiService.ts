import { GoogleGenAI } from "@google/genai";

// Инициализация клиента
// ВАЖНО: Убедитесь, что ваш API ключ активен и не имеет ограничений (Billing)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "ВАШ_КЛЮЧ_ЗДЕСЬ"; 

const client = new GoogleGenAI({ apiKey });

/**
 * Генерация вопросов для квиза
 * Используем gemini-1.5-flash — самую быструю стабильную модель
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
      
      Strictly return ONLY valid JSON. No markdown code blocks.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash', // Возвращаем стабильную версию
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text();
    if (!text) return [];
    
    // Очистка от маркдауна на всякий случай
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating quiz:", error);
    alert("Ошибка генерации квиза. Проверьте API ключ или попробуйте позже.");
    return [];
  }
};

/**
 * Генерация вопросов "Верю / Не верю"
 * Также используем gemini-1.5-flash
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
      
      Strictly return ONLY valid JSON. No markdown code blocks.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text();
    if (!text) return [];

    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating believe/not:", error);
    return [];
  }
};

/**
 * Генерация изображения по описанию (ИИ Арт)
 * Используем стандартную модель imagen-3.0-generate-001
 */
export const generateAiImage = async (prompt: string): Promise<string | null> => {
  try {
    // Используем стабильную модель для картинок
    const response = await client.models.generateImages({
      model: 'imagen-3.0-generate-001', 
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        // Фильтр безопасности: block_only_high (блокировать только явный треш)
        // Это позволяет генерировать больше веселых картинок без ложных блокировок
        safetyFilterLevel: 'block_only_high', 
        personGeneration: 'allow_adult' 
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imgData = response.generatedImages[0].image.base64;
      return `data:image/jpeg;base64,${imgData}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    // Частая ошибка - Safety Filter. Можно вывести алерт пользователю.
    return null;
  }
};