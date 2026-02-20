import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Language } from "../types";

// ВСТАВЬТЕ СЮДА ВАШ НАСТОЯЩИЙ КЛЮЧ GEMINI (Совет: после релиза лучше сгенерировать новый ключ, так как этот мы "засветили")
const GEMINI_API_KEY = "AIzaSyArOLbY23EpDcvCJsUkaH9MOUnu7KosVF4"; 

export const generateQuizQuestions = async (
  topic: string, 
  lang: Language, 
  count: number = 5,
  mood: string = "fun"
): Promise<QuizQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const langText = lang === 'ru' ? 'русский' : 'английский';
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // ИСПРАВЛЕНО НА РЕАЛЬНУЮ МОДЕЛЬ
      contents: `Generate a list of ${count} ${mood} quiz questions on the topic "${topic}" for a live event. For each question, provide 4 options. Language: ${langText}.`,
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
    
    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    }
    return getFallbackQuiz(topic, count);
  } catch (e) {
    console.error("AI Quiz error, using fallback", e);
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
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const langText = lang === 'ru' ? 'русском' : 'English';
    const options = lang === 'ru' ? ["Верю", "Не верю"] : ["Believe", "Don't Believe"];
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // ИСПРАВЛЕНО НА РЕАЛЬНУЮ МОДЕЛЬ
      contents: `Generate a list of ${count} interesting facts on the topic "${topic}" for a "Believe or Not" game. Some should be true, some should be surprisingly false. Return a JSON array of objects. Each object must have: "question" (the fact), "correctAnswerIndex" (0 for True/Believe, 1 for False/Not Believe). Language: ${langText}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              correctAnswerIndex: { type: Type.INTEGER }
            },
            required: ["id", "question", "correctAnswerIndex"]
          }
        }
      }
    });
    
    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const raw = JSON.parse(cleanText);
      return raw.map((item: any, idx: number) => ({
        id: item.id || `bn-${idx}`,
        question: item.question,
        options: options,
        correctAnswerIndex: item.correctAnswerIndex
      }));
    }
    return getFallbackBelieveNot(lang);
  } catch (e) {
    console.error("AI Believe Not error, using fallback", e);
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
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const langText = lang === 'ru' ? 'русский' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // ИСПРАВЛЕНО НА РЕАЛЬНУЮ МОДЕЛЬ
      contents: `Write a warm, professional yet festive personalized message for a guest named ${guestName} for the occasion of ${occasion}. Mention our previous collaboration at a "${eventType}" event. Keep it short for WhatsApp/Telegram. Language: ${langText}.`,
    });
    return response.text?.trim() || `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  } catch (e) {
    return `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  }
};

export const generateAiImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
  try {
    // Временно оставляем генерацию через Pollinations как запасной вариант, так как gemini-image может требовать другие настройки
    const width = 1024;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${width}&seed=${Math.floor(Math.random() * 1000000)}&nologo=true&model=flux`;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};
