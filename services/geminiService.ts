import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuizQuestion, Language } from "../types";

// Ваш ключ
const GEMINI_API_KEY = "AIzaSyAQZATgXza-XjMt274XQ7eHJEFSNFY2gPI"; 

export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  mood: string = "fun"
): Promise<QuizQuestion[]> => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // ИСПРАВЛЕНИЕ: Используем 100% рабочую классическую модель gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const langText = lang === 'ru' ? 'русский' : 'английский';
    
    const prompt = `Generate a list of ${count} ${mood} quiz questions on the topic "${topic}" for a live event. For each question, provide 4 options. Language: ${langText}.
    Return STRICTLY a valid JSON array of objects. Do not use markdown blocks like \`\`\`json. Just return the raw array.
    Each object MUST have this exact structure:
    {"id": "unique_string", "question": "question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswerIndex": 0}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    if (!text) throw new Error("Пустой ответ от сервера Google");
    
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e: any) {
    console.error("AI Quiz error", e);
    alert("ОШИБКА НЕЙРОСЕТИ (КВИЗ):\n\n" + (e.message || "Неизвестная ошибка"));
    return getFallbackQuiz(topic, count);
  }
};

const getFallbackQuiz = (topic: string, count: number): QuizQuestion[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `fallback-${i}`,
    question: `Запасной вопрос ${i + 1} по теме ${topic}?`,
    options: ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
    correctAnswerIndex: 0
  }));
};

export const generateBelieveNotQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5
): Promise<QuizQuestion[]> => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // ИСПРАВЛЕНИЕ: Используем 100% рабочую классическую модель gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const langText = lang === 'ru' ? 'русском' : 'English';
    const options = lang === 'ru' ? ["Верю", "Не верю"] : ["Believe", "Don't Believe"];
    
    const prompt = `Generate a list of ${count} interesting facts on the topic "${topic}" for a "Believe or Not" game. Some should be true, some should be false. 
    Return STRICTLY a JSON array of objects. Do not use markdown blocks.
    Format: [{"id": "bn1", "question": "Fact text?", "correctAnswerIndex": 0}] (0 for True, 1 for False). Language: ${langText}.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    if (!text) throw new Error("Пустой ответ от сервера Google");
    
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const raw = JSON.parse(cleanText);
    return raw.map((item: any, idx: number) => ({
      id: item.id || `bn-${idx}`,
      question: item.question,
      options: options,
      correctAnswerIndex: item.correctAnswerIndex
    }));
  } catch (e: any) {
    console.error("AI Believe Not error", e);
    alert("ОШИБКА НЕЙРОСЕТИ (ВЕРЮ/НЕ ВЕРЮ):\n\n" + (e.message || "Неизвестная ошибка"));
    return getFallbackBelieveNot(lang);
  }
};

const getFallbackBelieveNot = (lang: Language): QuizQuestion[] => {
  const options = lang === 'ru' ? ["Верю", "Не верю"] : ["Believe", "Don't Believe"];
  return [{
    id: 'fallback-bn',
    question: lang === 'ru' ? 'Первый в мире программист был женщиной?' : 'The world\'s first programmer was a woman?',
    options: options,
    correctAnswerIndex: 0
  }];
};

export const generateGuestGreeting = async (guestName: string, occasion: string, eventType: string, lang: Language): Promise<string> => {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // ИСПРАВЛЕНИЕ: Используем 100% рабочую классическую модель gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const langText = lang === 'ru' ? 'русский' : 'English';
    const prompt = `Write a warm, professional yet festive personalized message for a guest named ${guestName} for the occasion of ${occasion}. Mention our previous collaboration at a "${eventType}" event. Keep it short for WhatsApp/Telegram. Language: ${langText}.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() || `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  } catch (e) {
    return `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  }
};

export const generateAiImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
  try {
    const width = 1024;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${width}&seed=${Math.floor(Math.random() * 1000000)}&nologo=true&model=flux`;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};
