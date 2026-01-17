// ВАЖНО: Мы используем новую библиотеку @google/generative-ai вместо старой @google/genai
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuizQuestion, Language } from "../types";

const apiKey = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5
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
  count: number = 5
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

export const generateGuestGreeting = async (name: string): Promise<string> => {
  return `Welcome, ${name}!`;
};

export const generateAiImage = async (prompt: string): Promise<string | null> => {
  return null;
};