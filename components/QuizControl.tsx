import { FirebaseService } from '../services/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, QuizQuestion, Language } from '../types';
import { Zap, Play, RotateCcw, Award, Plus, Trash2, Cpu, PlayCircle, ImageIcon, MousePointer2, HelpCircle, PlusCircle, List, CheckCircle2, XCircle, Rocket, MonitorOff, Edit2, Save, X, Check, Clock, Eye, Users } from 'lucide-react';
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
    pushDesc: 'Кто быстрее нажмет на кнопку 50 раз? Нажимайте только одним пальцем, иначе сломаете телефон!',
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
    save: 'Сохранить',
    reveal: 'ПОКАЗАТЬ ОТВЕТ'
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
    pushDesc: 'Who can tap 50 times faster? Press with only one finger, otherwise you will break the phone!',
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
    save: 'Save',
    reveal: 'REVEAL ANSWER'
  }
};

const QuizControl: React.FC<Props> = ({ activeEvent, lang }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(activeEvent.questions || []);
  const [currentIdx, setCurrentIdx] = useState<number>(-1); 
  const [gameMode, setGameMode] = useState<GameType>(GameType.QUIZ);
  const [questStage, setQuestStage] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // --- НОВОЕ: Состояние раскрытия ответа и счетчики ---
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);

  const countdownInterval = useRef<any>(null);
  const autoNextTimeout = useRef<any>(null);

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
    setQuestions(activeEvent.questions || []);
  }, [activeEvent]);

  // --- СЛЕЖИМ ЗА ОТВЕТАМИ ГОСТЕЙ И АВТО-ПЕРЕКЛЮЧЕНИЕМ ---
  useEffect(() => {
    if ((gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT) && currentIdx >= 0) {
      const unsub = FirebaseService.subscribeToSessionData(activeEvent.code, (data) => {
        const totalGuests = data.registry ? Object.keys(data.registry).length : 0;
        setOnlineCount(totalGuests);

        // Считаем, сколько людей ответило на ТЕКУЩИЙ вопрос
        let currentAnswers = 0;
        if (data.quiz_answers) {
           Object.values(data.quiz_answers).forEach((userAns: any) => {
              if (userAns && userAns[currentIdx]) currentAnswers++;
           });
        }
        setAnswersCount(currentAnswers);

        // ЛОГИКА АВТОМАТИКИ: Если все ответили и ответ еще скрыт -> Показать -> Ждать -> Дальше
        if (totalGuests > 0 && currentAnswers >= totalGuests && !isAnswerRevealed) {
           handleRevealAndNext();
        }
      });
      return unsub;
    }
  }, [activeEvent.code, currentIdx, gameMode, isAnswerRevealed]);

  const saveQuestionsToFirebase = (newQuestions: QuizQuestion[]) => {
    setQuestions(newQuestions); 
    FirebaseService.saveEventToDB({
      ...activeEvent,
      questions: newQuestions
    });
  };

// Синхронизация состояния с Firebase
  useEffect(() => {
    if (!activeEvent?.code) return; // Обязательная защита!

    FirebaseService.syncGameState(activeEvent.code, {
      gameType: gameMode,
      currentIdx,
      questStage,
      isActive: currentIdx >= 0 || countdown !== null,
      isCountdown: countdown !== null,
      countdownValue: countdown,
      questions,
      artTheme,
      isAnswerRevealed, 
      timestamp: Date.now()
    });
  }, [activeEvent?.code, gameMode, currentIdx, questStage, questions, artTheme, countdown, isAnswerRevealed]);

  const handleClearScreen = () => {
    setCurrentIdx(-1);
    setCountdown(null);
    setQuestStage(1);
    setIsAnswerRevealed(false);
    if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    FirebaseService.resetGameData(activeEvent.code);
  };

  const handleStartGame = () => {
    if (gameMode === GameType.PUSH_IT) {
      startPushCountdown();
      return;
    }
    if (currentIdx === -1) {
      setCurrentIdx(0);
      setIsAnswerRevealed(false);
    }
  };

  const startPushCountdown = () => {
    FirebaseService.resetGameData(activeEvent.code);
    setCountdown(10);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval.current);
          setCurrentIdx(0); 
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- ЛОГИКА КНОПКИ "ДАЛЕЕ" ---
  const handleNextClick = () => {
    // 1. Если ответ скрыт - сначала показываем его
    if (!isAnswerRevealed && (gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT)) {
      setIsAnswerRevealed(true);
    } else {
      // 2. Если уже показан или это не квиз - переходим к следующему вопросу
      forceNextQuestion();
    }
  };

  // Авто-цепочка: Показать -> Таймер 4 сек -> Следующий
  const handleRevealAndNext = () => {
    setIsAnswerRevealed(true);
    
    if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    
    // Ждем 4 секунды, чтобы люди увидели правильный ответ
    autoNextTimeout.current = setTimeout(() => {
       forceNextQuestion();
    }, 4000);
  };

  const forceNextQuestion = () => {
    if (autoNextTimeout.current) clearTimeout(autoNextTimeout.current);
    
    setIsAnswerRevealed(false); // Скрываем ответ для нового вопроса
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Конец игры
      setCurrentIdx(questions.length);
    }
  };

  const handleFinishGame = () => {
    if (gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT || gameMode === GameType.QUEST) {
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
    
    const updatedList = [...questions, ...qs];
    saveQuestionsToFirebase(updatedList); 
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
    saveQuestionsToFirebase(updated); 
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

    const updatedList = [...questions, newQ];
    saveQuestionsToFirebase(updatedList); 
    
    setManualQ('');
    setManualOptions(['', '', '', '']);
    setManualCorrect(0);
  };

  const removeQuestion = (idx: number) => {
    const updatedList = questions.filter((_, i) => i !== idx);
    saveQuestionsToFirebase(updatedList); 
    if (currentIdx === idx) setCurrentIdx(-1);
  };

  const isGameActive = (currentIdx >= 0 || countdown !== null);
  const isQuizType = gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-inner">
        <button onClick={() => { setGameMode(GameType.QUIZ); setCurrentIdx(-1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.QUIZ ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><Zap size={16}/> {t.quiz}</button>
        <button onClick={() => { setGameMode(GameType.BELIEVE_NOT); setCurrentIdx(-1); setCountdown(null); }} className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all text-xs uppercase ${gameMode === GameType.BELIEVE_NOT ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}><HelpCircle size={16}/> {t.believe}</button>
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
                        {isGenerating ? <Cpu size={14} className="animate-spin" /> : <Zap size={14} />}
                        {isGenerating ? t.thinking : t.aiGen}
                      </button>
                    </div>
                 </div>
              </div>

              {/* Manual Creation Block */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                 <div className="flex items-center gap-3">
                    <PlusCircle size={18} className="text-indigo-500" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{t.manualTitle}</h4>
                 </div>
                 
                 <div className="space-y-4">
                    <textarea 
                      value={manualQ} 
                      onChange={e => setManualQ(e.target.value)}
                      placeholder={t.qPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500 resize-none h-20"
                    />

                    {gameMode === GameType.QUIZ && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {manualOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-2 rounded-xl focus-within:border-indigo-500 group">
                            <button 
                              onClick={() => setManualCorrect(i)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-black transition-all ${manualCorrect === i ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}
                            >
                              {String.fromCharCode(65 + i)}
                            </button>
                            <input 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...manualOptions];
                                newOpts[i] = e.target.value;
                                setManualOptions(newOpts);
                              }}
                              placeholder={`${t.optPlaceholder} ${i+1}`}
                              className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {gameMode === GameType.BELIEVE_NOT && (
                      <div className="flex gap-4">
                         <button 
                           onClick={() => setManualCorrect(0)} 
                           className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all flex items-center justify-center gap-2 ${manualCorrect === 0 ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'border-slate-800 text-slate-500'}`}
                         >
                           <CheckCircle2 size={16}/> {t.trueBtn}
                         </button>
                         <button 
                           onClick={() => setManualCorrect(1)} 
                           className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all flex items-center justify-center gap-2 ${manualCorrect === 1 ? 'bg-rose-500 border-rose-400 text-white shadow-lg' : 'border-slate-800 text-slate-500'}`}
                         >
                           <XCircle size={16}/> {t.falseBtn}
                         </button>
                      </div>
                    )}

                    <button 
                      onClick={handleAddManual}
                      disabled={!manualQ.trim()}
                      className="w-full bg-slate-800 hover:bg-indigo-600 py-4 rounded-xl text-[10px] font-black text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                       <Plus size={16} /> {t.addToList}
                    </button>
                 </div>
              </div>
            </div>
          )}

          {gameMode === GameType.QUEST && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-indigo-600 rounded-[40px] flex items-center justify-center border-4 border-slate-800 shadow-xl shadow-indigo-600/20">
                <Rocket size={48} className="text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white italic uppercase">{t.questTitle}</h3>
                <p className="text-slate-500 font-bold max-w-sm mx-auto mt-2">{t.questDesc}</p>
              </div>

              {!isGameActive ? (
                <button 
                  onClick={handleStartGame}
                  className="bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center gap-3 uppercase"
                >
                  <PlayCircle /> {t.start}
                </button>
              ) : (
                <div className="w-full space-y-8">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(s => (
                      <button 
                        key={s}
                        onClick={() => setQuestStage(s)}
                        className={`py-6 rounded-2xl font-black text-2xl transition-all border-2 ${questStage === s ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-slate-800">
                     <button 
                      onClick={handleFinishGame}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-white font-black text-xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                       <Award size={24} /> {t.questFinal}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {gameMode === GameType.IMAGE_GEN && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">{t.artTheme}</label>
              <input 
                value={artTheme} 
                onChange={e => setArtTheme(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500"
                placeholder="Задайте тему битвы..." 
              />
            </div>
          )}

          {!isQuizType && gameMode !== GameType.QUEST && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 bg-slate-950 rounded-[40px] flex items-center justify-center border-4 border-slate-800 group-hover:border-indigo-500 transition-all">
                  {gameMode === GameType.SHAKE_IT ? <RotateCcw size={48} className="text-rose-500" /> :
                   gameMode === GameType.PUSH_IT ? <MousePointer2 size={48} className="text-blue-500" /> : <ImageIcon size={48} className="text-amber-500" />}
               </div>
               <div>
                  <h3 className="text-3xl font-black text-white italic uppercase">{gameMode === GameType.SHAKE_IT ? t.shakeTitle : gameMode === GameType.PUSH_IT ? t.pushTitle : t.artTitle}</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto mt-2">{gameMode === GameType.SHAKE_IT ? t.shakeDesc : gameMode === GameType.PUSH_IT ? t.pushDesc : gameMode === GameType.IMAGE_GEN ? t.artDesc : 'Интерактивная игра для всех гостей.'}</p>
               </div>
               
               {!isGameActive ? (
                  <button 
                    onClick={handleStartGame}
                    className="bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center gap-3"
                  >
                     {gameMode === GameType.PUSH_IT ? <Clock /> : <PlayCircle />} {gameMode === GameType.PUSH_IT ? t.pushStart : t.start}
                  </button>
               ) : (
                  <div className="w-full flex flex-col items-center gap-6">
                     {countdown !== null ? (
                       <div className="text-6xl font-black text-white animate-pulse">{countdown}</div>
                     ) : (
                       <div className="flex gap-4">
                          <button onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} className="p-4 bg-slate-800 rounded-2xl text-white hover:bg-slate-700"><RotateCcw /></button>
                          <button onClick={handleNextClick} className="px-10 py-4 bg-emerald-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-emerald-600/20">{t.next}</button>
                       </div>
                     )}
                     <button onClick={handleFinishGame} className="text-rose-500 font-black uppercase tracking-widest text-xs hover:underline">{t.gameEnd}</button>
                  </div>
               )}
            </div>
          )}

          {isQuizType && isGameActive && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-full flex flex-col items-center gap-6">
                  {/* Счетчик ответивших */}
                  <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase text-indigo-400 animate-in fade-in">
                     <Users size={14} /> Ответили: {answersCount} / {onlineCount}
                  </div>

                  <div className="flex gap-4">
                     <button onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} className="p-4 bg-slate-800 rounded-2xl text-white hover:bg-slate-700"><RotateCcw /></button>
                     <button 
                       onClick={handleNextClick} 
                       className={`px-10 py-4 rounded-2xl text-white font-black text-lg shadow-xl transition-all ${isAnswerRevealed ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                     >
                        {isAnswerRevealed ? t.next : t.reveal}
                     </button>
                  </div>
                  <button onClick={handleFinishGame} className="text-rose-500 font-black uppercase tracking-widest text-xs hover:underline">{t.gameEnd}</button>
               </div>
            </div>
          )}
        </div>

        {isQuizType && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <List size={18} className="text-slate-500" />
                  <h3 className="font-black text-white uppercase italic text-sm">{t.questions}</h3>
                </div>
                {questions.length > 0 && (
                  <button onClick={() => setQuestions([])} className="text-rose-500 hover:text-rose-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
            </div>
            <div className="flex-1 p-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{t.status}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isGameActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>{isGameActive ? t.onAir : t.lobby}</span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {questions.length > 0 ? questions.map((q, i) => (
                      <div key={q.id || i} className={`p-4 rounded-xl border transition-all flex flex-col gap-3 group ${currentIdx === i ? 'bg-indigo-600/10 border-indigo-500 shadow-lg' : 'bg-slate-950/30 border-slate-800'}`}>
                        {editingIdx === i ? (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <input 
                              value={editQuestionText} 
                              onChange={e => setEditQuestionText(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500"
                            />
                            {gameMode === GameType.QUIZ && (
                              <div className="grid grid-cols-2 gap-2">
                                {editOptions.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-1">
                                    <button 
                                      onClick={() => setEditCorrectIdx(optIdx)}
                                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${editCorrectIdx === optIdx ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                                    >
                                      <Check size={12} />
                                    </button>
                                    <input 
                                      value={opt}
                                      onChange={e => {
                                        const newOpts = [...editOptions];
                                        newOpts[optIdx] = e.target.value;
                                        setEditOptions(newOpts);
                                      }}
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            {gameMode === GameType.BELIEVE_NOT && (
                               <div className="flex gap-2">
                                  <button onClick={() => setEditCorrectIdx(0)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border ${editCorrectIdx === 0 ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{lang === 'ru' ? 'ВЕРЮ' : 'BELIEVE'}</button>
                                  <button onClick={() => setEditCorrectIdx(1)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border ${editCorrectIdx === 1 ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{lang === 'ru' ? 'НЕ ВЕРЮ' : 'DON\'T'}</button>
                               </div>
                            )}
                            <div className="flex gap-2">
                              <button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 py-1.5 rounded-lg text-[10px] font-black text-white flex items-center justify-center gap-1"><Save size={12}/> {t.save}</button>
                              <button onClick={() => setEditingIdx(null)} className="p-1.5 bg-slate-800 rounded-lg text-slate-400"><X size={12}/></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                  <p className="text-xs font-bold text-white line-clamp-2">{i + 1}. {q.question}</p>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mt-1">Ans: {gameMode === GameType.BELIEVE_NOT ? (q.correctAnswerIndex === 0 ? 'True' : 'False') : String.fromCharCode(65 + q.correctAnswerIndex)}</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleStartEdit(i)} className="p-1 text-indigo-400 hover:bg-indigo-500/10 rounded transition-all">
                                  <Edit2 size={14} />
                                </button>
                                {!isGameActive && (
                                  <button onClick={() => removeQuestion(i)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                  )) : (
                      <div className="text-center py-20">
                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">{t.noQs}</p>
                      </div>
                  )}
                </div>

                {!isGameActive && questions.length > 0 && (
                  <button 
                    onClick={handleStartGame}
                    className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-auto"
                  >
                    <PlayCircle size={24} /> {t.start}
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizControl;
