import { GoogleGenAI } from "@google/genai";
import { QuizQuestion, Language } from "../types";

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
    
    // Мы убрали responseSchema, так как она часто вызывает ошибку 400 Bad Request
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Generate a list of ${count} ${mood} quiz questions on the topic "${topic}" for a live event. For each question, provide 4 options. Language: ${langText}.
      Return STRICTLY a valid JSON array of objects. Do not use markdown blocks like \`\`\`json. Just return the raw array.
      Each object MUST have this exact structure:
      {"id": "unique_string", "question": "question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswerIndex": 0}`,
    });
    
    let text = response.text;
    if (text) {
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    }
    throw new Error("Нейросеть вернула пустой ответ");
  } catch (e: any) {
    console.error("AI Quiz error", e);
    // ВОТ ЭТО ОКНО ПОКАЖЕТ НАМ НАСТОЯЩУЮ ПРИЧИНУ ПОЛОМКИ
    alert("Ошибка нейросети (Квиз): " + (e.message || "Неизвестная ошибка"));
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
      model: 'gemini-1.5-flash',
      contents: `Generate a list of ${count} interesting facts on the topic "${topic}" for a "Believe or Not" game. Some should be true, some should be surprisingly false. 
      Return STRICTLY a valid JSON array of objects. Do not use markdown blocks like \`\`\`json. Just return the raw array.
      Each object MUST have: "id" (string), "question" (the fact string), "correctAnswerIndex" (0 for True/Believe, 1 for False/Not Believe). Language: ${langText}.`,
    });
    
    let text = response.text;
    if (text) {
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const raw = JSON.parse(text);
      return raw.map((item: any, idx: number) => ({
        id: item.id || `bn-${idx}`,
        question: item.question,
        options: options,
        correctAnswerIndex: item.correctAnswerIndex
      }));
    }
    throw new Error("Нейросеть вернула пустой ответ");
  } catch (e: any) {
    console.error("AI Believe Not error", e);
    alert("Ошибка нейросети (Верю/Не Верю): " + (e.message || "Неизвестная ошибка"));
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
      model: 'gemini-1.5-flash',
      contents: `Write a warm, professional yet festive personalized message for a guest named ${guestName} for the occasion of ${occasion}. Mention our previous collaboration at a "${eventType}" event. Keep it short for WhatsApp/Telegram. Language: ${langText}.`,
    });
    return response.text?.trim() || `Привет, ${guestName}! Рады видеть тебя на нашем событии!`;
  } catch (e: any) {
    console.error("Greeting error", e);
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
