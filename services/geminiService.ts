import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuizQuestion, Language } from "../types";

// Ключ будет браться из настроек Vercel, но пока пустой, чтобы не ломать сборку
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const generateQuizQuestions = async (topic: string, lang: Language, count: number = 5): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Generate ${count} quiz questions about "${topic}". Language: ${lang}. Return ONLY valid JSON array: [{ "id": "1", "question": "...", "options": ["A","B","C","D"], "correctAnswerIndex": 0 }]`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Error:", e);
    // Возвращаем пустой массив, чтобы программа не зависла
    return [];
  }
};

export const generateBelieveNotQuestions = async (topic: string, lang: Language, count: number = 5): Promise<QuizQuestion[]> => {
  return []; // Временная заглушка
};

export const generateGuestGreeting = async (name: string, occasion: string, type: string, lang: Language): Promise<string> => {
  return `Welcome ${name}!`;
};

export const generateAiImage = async (prompt: string): Promise<string | null> => {
  return null;
};