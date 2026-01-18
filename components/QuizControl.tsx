import { FirebaseService } from '../services/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, QuizQuestion, Language } from '../types';
import { Zap, Play, RotateCcw, Award, Plus, Trash2, Cpu, PlayCircle, ImageIcon, Users, Settings2, MousePointer2, HelpCircle, Clock, PlusCircle, List, CheckCircle2, XCircle, Rocket, Layers, MonitorOff, Edit2, Save, X, Check } from 'lucide-react';
import { generateQuizQuestions, generateBelieveNotQuestions } from '../services/geminiService';

interface Props {
  activeEvent: LiveEvent;
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    panel: 'Панель управления Live',
    event: 'Событие',
    quiz: 'Квиз',
    believe: 'Верю / Не верю',
    shake: 'Тряси!',
    push: 'Жми!',
    art: 'ИИ Арт',
    quest: 'Квест',
    start: 'НАЧАТЬ ИГРУ',
    questions: 'Список вопросов',
    aiGen: 'Сгенерировать через ИИ',
    manualTitle: 'Свой вопрос',
    addToList: 'Добавить в список',
    clearAll: 'Очистить всё',
    thinking: 'Генерация...',
    noQs: 'Вопросов пока нет. Создайте вручную или используйте ИИ!',
    status: 'Текущий статус',
    lobby: 'Ожидание',
    startQ: 'ЗАПУСТИТЬ ПЕРВЫЙ ВОПРОС',
    onAir: 'В эфире',
    next: 'Далее',
    back: 'Назад',
    reset: 'Сброс в ожидание',
    leaders: 'Лидеры',
    shakeTitle: 'ИСПЫТАНИЕ ТРЯСКИ',
    shakeDesc: 'Зрители должны трясти свои телефоны как можно сильнее.',
    shakeStart: 'СТАРТ 10 СЕКУНД!',
    pushTitle: 'ГОНКА КЛИКОВ: ЖМИ!',
    pushDesc: 'Кто быстрее нажмет на кнопку 50 раз? Участники соревнуются в скорости на экране.',
    pushStart: 'ЗАПУСТИТЬ ОТСЧЕТ 10 СЕК',
    gameEnd: 'Завершить игру и итоги',
    artTitle: 'ИИ Арт-Битва',
    artDesc: 'Гости создают шедевры с помощью ИИ.',
    artTheme: 'Тема конкурса',
    artAccess: 'НАЧАТЬ ИГРУ',
    activity: 'Работы гостей',
    noActivity: 'Ждем первых шедевров...',
    aiSettings: 'Параметры ИИ',
    aiTopic: 'Тема квиза',
    aiCount: 'Количество',
    aiMood: 'Характер',
    moodFun: 'Веселый',
    moodPro: 'Серьезный',
    moodHard: 'Сложный',
    qPlaceholder: 'Введите текст вопроса...',
    optPlaceholder: 'Вариант',
    correctLabel: 'Верный ответ',
    trueBtn: 'ВЕРЮ (True)',
    falseBtn: 'НЕ ВЕРЮ (False)',
    questTitle: 'МЕГА-КВЕСТ: 4 ЭТАПА',
    questDesc: 'Серия испытаний на логику, скорость и внимательность.',
    questStage: 'Этап',
    questFinal: 'ПОДВЕСТИ ИТОГИ (ФИНАЛ)',
    clearScreen: 'ОЧИСТИТЬ ЭКРАН',
    edit: 'Редактировать',
    save: 'Сохранить'
  },
  en: {
    panel: 'Live Control Center',
    event: 'Event',
    quiz: 'Quiz',
    believe: 'Believe / Not',
    shake: 'Shake It!',
    push: 'Push It!',
    art: 'AI Art',
    quest: 'Quest',
    start: 'START GAME',
    questions: 'Question List',
    aiGen: 'AI Generate',
    manualTitle: 'Custom Question',
    addToList: 'Add to List',
    clearAll: 'Clear All',
    thinking: 'Generating...',
    noQs: 'No questions yet. Create manually or use AI!',
    status: 'Current Status',
    lobby: 'Waiting',
    startQ: 'START FIRST QUESTION',
    onAir: 'On Air',
    next: 'Next',
    back: 'Back',
    reset: 'Reset to Waiting',
    leaders: 'Leaderboard',
    shakeTitle: 'SHAKE CHALLENGE',
    shakeDesc: 'Audience must shake their phones as hard as they can.',
    shakeStart: 'START 10 SECONDS!',
    pushTitle: 'CLICK RACE: PUSH IT!',
    pushDesc: 'Who can tap 50 times faster? Participants race on the screen.',
    pushStart: 'START 10 SEC COUNTDOWN',
    gameEnd: 'Finish and Show Results',
    artTitle: 'AI Art Battle',
    artDesc: 'Guests create AI masterpieces.',
    artTheme: 'Competition Theme',
    artAccess: 'START GAME',
    activity: 'Guest Artwork',
    noActivity: 'Waiting for masterpieces...',
    aiSettings: 'AI Settings',
    aiTopic: 'Quiz Topic',
    aiCount: 'Count',
    aiMood: 'Character',
    moodFun: 'Funny',
    moodPro: 'Professional',
    moodHard: 'Hardcore',
    qPlaceholder: 'Enter question text...',
    optPlaceholder: 'Option',
    correctLabel: 'Correct answer',
    trueBtn: 'BELIEVE (True)',
    falseBtn: 'DON\'T (False)',
    questTitle: 'MEGA QUEST: 4 STAGES',
    questDesc: 'Series of logic, speed, and attention challenges.',
    questStage: 'Stage',
    questFinal: 'SHOW FINAL RESULTS',
    clearScreen: 'CLEAR SCREEN',
    edit: 'Edit',
    save: 'Save'
  }
};

const QuizControl: React.FC<Props> = ({ activeEvent, lang }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1); 
  const [gameMode, setGameMode] = useState<GameType>(GameType.QUIZ);
  const [questStage, setQuestStage] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownInterval = useRef<any>(null);

  // Editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);

  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiMood, setAiMood] = useState('fun');
  
  const [manualQ, setManualQ] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState(0);

  const [artTheme, setArtTheme] = useState(lang === 'ru' ? 'Киберпанк вечеринка' : 'Cyberpunk Party');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('game_state', JSON.stringify({
      gameType: gameMode,
      currentIdx,
      questStage,
      isActive: currentIdx >= 0 || countdown !== null,
      isCountdown: countdown !== null,
      countdownValue: countdown,
      questions,
      artTheme,
      timestamp: Date.now()
    }));

FirebaseService.syncGameState({
      gameType: gameMode,
      currentIdx,
      questStage,
      isActive: currentIdx >= 0 || countdown !== null,
      isCountdown: countdown !== null,
      countdownValue: countdown,
      questions,
      artTheme,
      timestamp: Date.now()
    });

  }, [gameMode, currentIdx, questStage, questions, artTheme, countdown]);

  const handleClearScreen = () => {
    setCurrentIdx(-1);
    setCountdown(null);
    setQuestStage(1);
    localStorage.removeItem('game_state');
    localStorage.removeItem('guest_images');
    localStorage.removeItem('race_progress');
    
    // --- ВАЖНО: СБРОС СЕССИИ В FIREBASE ---
    FirebaseService.resetGameData(activeEvent.code);
    // --------------------------------------
    
    const channel = new BroadcastChannel('maybeu_sync');
    channel.postMessage({ type: 'FORCE_RESET' });
    channel.close();
  };

  const handleStartGame = () => {
    if (gameMode === GameType.PUSH_IT) {
      startPushCountdown();
      return;
    }

    if (currentIdx === -1) {
      setCurrentIdx(0);
      localStorage.setItem(`quiz_answers_${activeEvent.code}`, JSON.stringify({}));
      if (gameMode === GameType.IMAGE_GEN) {
        localStorage.setItem('guest_images', JSON.stringify([]));
      }
      if (gameMode === GameType.QUEST) {
        localStorage.setItem(`quest_responses_${activeEvent.code}`, JSON.stringify({}));
      }
    }
  };

  const startPushCountdown = () => {
    // Сбрасываем прогресс перед началом новой гонки
    localStorage.removeItem('race_progress');
    setCountdown(10);
    
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval.current);
          setCurrentIdx(0); // Начинаем саму гонку
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCurrentIdx(questions.length);
    }
  };

  const handleFinishGame = () => {
    if (isQuizType || gameMode === GameType.QUEST) {
      setCurrentIdx(questions.length + 10); 
    } else {
      setCurrentIdx(-1);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    const theme = aiTopic || (activeEvent.type === 'WEDDING' ? (lang === 'ru' ? 'Свадьба' : 'Wedding') : (lang === 'ru' ? 'Вечеринка' : 'Party'));
    let qs: QuizQuestion[] = [];
    if (gameMode === GameType.QUIZ) {
      qs = await generateQuizQuestions(theme, lang, aiCount, aiMood);
    } else if (gameMode === GameType.BELIEVE_NOT) {
      qs = await generateBelieveNotQuestions(theme, lang, aiCount);
    }
    setQuestions(prev => [...prev, ...qs]);
    setIsGenerating(false);
  };

  const handleStartEdit = (idx: number) => {
    const q = questions[idx];
    setEditingIdx(idx);
    setEditQuestionText(q.question);
    setEditOptions([...q.options]);
    setEditCorrectIdx(q.correctAnswerIndex);
  };

  const handleSaveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...questions];
    updated[editingIdx] = {
      ...updated[editingIdx],
      question: editQuestionText,
      options: editOptions,
      correctAnswerIndex: editCorrectIdx
    };
    setQuestions(updated);
    setEditingIdx(null);
  };

  const handleAddManual = () => {
    if (!manualQ.trim()) return;
    
    const newQ: QuizQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      question: manualQ,
      options: gameMode === GameType.BELIEVE_NOT ? (lang === 'ru' ? ['Верю', 'Не верю'] : ['Believe', 'Don\'t Believe']) : [...manualOptions],
      correctAnswerIndex: manualCorrect
    };

    setQuestions(prev => [...prev, newQ]);
    setManualQ('');
    setManualOptions(['', '', '', '']);
    setManualCorrect(0);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (currentIdx === idx) setCurrentIdx(-1);
  };

  const isGameActive = (currentIdx >= 0 || countdown !== null);
  const isQuizType = gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-inner">
        <button onClick={() => { setGameMode(GameType.QUIZ); setCurrentIdx(-1); setQuestions([]); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.QUIZ ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><Zap size={16}/> {t.quiz}</button>
        <button onClick={() => { setGameMode(GameType.BELIEVE_NOT); setCurrentIdx(-1); setQuestions([]); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.BELIEVE_NOT ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><HelpCircle size={16}/> {t.believe}</button>
        <button onClick={() => { setGameMode(GameType.QUEST); setCurrentIdx(-1); setQuestStage(1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.QUEST ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><Rocket size={16}/> {t.quest}</button>
        <button onClick={() => { setGameMode(GameType.SHAKE_IT); setCurrentIdx(-1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.SHAKE_IT ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><RotateCcw size={16}/> {t.shake}</button>
        <button onClick={() => { setGameMode(GameType.PUSH_IT); setCurrentIdx(-1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.PUSH_IT ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><MousePointer2 size={16}/> {t.push}</button>
        <button onClick={() => { setGameMode(GameType.IMAGE_GEN); setCurrentIdx(-1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.IMAGE_GEN ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><ImageIcon size={16}/> {t.art}</button>
        
        <button 
          onClick={handleClearScreen}
          className="ml-auto px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/30"
        >
          <MonitorOff size={16}/> {t.clearScreen}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${isQuizType ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        <div className={`${isQuizType ? 'lg:col-span-2' : ''} space-y-6`}>
          {isQuizType && (
            <div className="space-y-6">
              {/* AI Block */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <Cpu size={18} className="text-indigo-500" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{t.aiSettings}</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.aiTopic}</label>
                      <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Marvel, Space..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.aiCount}</label>
                      <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-indigo-500">
                         {[3, 5, 8, 10].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                       <button onClick={handleGenerateQuestions} disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 uppercase">
                        {isGenerating ? <Cpu size={14} className="animate-spin" /> : <Zap size