import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuizQuestion, Language } from "../types";

const apiKey = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ...args: any[] в конце позволяет вызывать функцию с любым количеством лишних параметров
export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  ...args: any[]
): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Generate ${count} quiz questions about "${topic}". Language: ${lang}. 
    Return strictly JSON array: [{ "id": "1", "question": "...", "options": ["A","B","C","D"], "correctAnswerIndex": 0 }]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Error:", e);
    return [];
  }
};

export const generateBelieveNotQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  ...args: any[]
): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Generate ${count} True/False facts about "${topic}". Language: ${lang}.
    Return strictly JSON array: [{ "id": "1", "question": "...", "correctAnswerIndex": 0, "options": ["True", "False"] }]`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
};

export const generateGuestGreeting = async (...args: any[]): Promise<string> => {
  // Берем первый строковый аргумент как имя
  const name = args.find(a => typeof a === 'string') || 'Guest';
  return `Welcome, ${name}!`;
};

export const generateAiImage = async (...args: any[]): Promise<string | null> => {
  return null;
};