
import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, QuizQuestion, Language } from '../types';
import { Zap, Play, RotateCcw, Award, Plus, Trash2, Cpu, PlayCircle, ImageIcon, Users, Settings2, MousePointer2, HelpCircle, Clock, PlusCircle, List, CheckCircle2, XCircle, Rocket, Layers, MonitorOff, Edit2, Save, X, Check } from 'lucide-react';
import { generateQuizQuestions, generateBelieveNotQuestions } from '../services/geminiService';
import { FirebaseService } from '../services/firebase';

interface Props {
  activeEvent: LiveEvent;
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    quiz: 'Квиз', believe: 'Верю/Не верю', quest: 'Квест', shake: 'Тряси!', push: 'Жми!', art: 'ИИ Арт',
    start: 'НАЧАТЬ ИГРУ', questions: 'Список вопросов', aiGen: 'Сгенерировать через ИИ', manualTitle: 'Свой вопрос',
    addToList: 'Добавить в список', thinking: 'Генерация...', status: 'Текущий статус', onAir: 'В эфире', lobby: 'Ожидание',
    next: 'Далее', reset: 'Сброс', gameEnd: 'Завершить игру', clearScreen: 'ОЧИСТИТЬ ЭКРАН', edit: 'Правка', save: 'ОК',
    aiTopic: 'Тема', aiCount: 'Кол-во', pushStart: 'ОТСЧЕТ 10 СЕК', artTheme: 'Тема конкурса',
    noQs: 'Пусто. Создайте вручную или через ИИ!', qPlaceholder: 'Текст вопроса...', optPlaceholder: 'Вариант',
    trueBtn: 'ВЕРЮ', falseBtn: 'НЕ ВЕРЮ', questFinal: 'ИТОГИ КВЕСТА'
  },
  en: {
    quiz: 'Quiz', believe: 'Believe/Not', quest: 'Quest', shake: 'Shake!', push: 'Push!', art: 'AI Art',
    start: 'START GAME', questions: 'Question List', aiGen: 'AI Generate', manualTitle: 'Custom Question',
    addToList: 'Add to List', thinking: 'Generating...', status: 'Status', onAir: 'On Air', lobby: 'Waiting',
    next: 'Next', reset: 'Reset', gameEnd: 'End Game', clearScreen: 'CLEAR SCREEN', edit: 'Edit', save: 'Save',
    aiTopic: 'Topic', aiCount: 'Count', pushStart: 'START 10S COUNTDOWN', artTheme: 'Theme',
    noQs: 'Empty. Create manually or use AI!', qPlaceholder: 'Question...', optPlaceholder: 'Option',
    trueBtn: 'TRUE', falseBtn: 'FALSE', questFinal: 'QUEST RESULTS'
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

  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [manualQ, setManualQ] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState(0);
  const [artTheme, setArtTheme] = useState(lang === 'ru' ? 'Киберпанк' : 'Cyberpunk');

  const t = TRANSLATIONS[lang];

  // Синхронизация с Firebase при каждом изменении локального состояния
  useEffect(() => {
    if (activeEvent) {
      FirebaseService.updateGameState(activeEvent.code, {
        gameType: gameMode,
        currentIdx,
        questStage,
        isActive: currentIdx >= 0 || countdown !== null,
        isCountdown: countdown !== null,
        countdownValue: countdown,
        questions,
        artTheme
      });
    }
  }, [gameMode, currentIdx, questStage, questions, artTheme, countdown, activeEvent?.code]);

  const handleClearScreen = async () => {
    setCurrentIdx(-1);
    setCountdown(null);
    setQuestStage(1);
    if (activeEvent) await FirebaseService.resetEvent(activeEvent.code);
  };

  const handleStartGame = () => {
    if (gameMode === GameType.PUSH_IT) {
      startPushCountdown();
    } else if (currentIdx === -1) {
      setCurrentIdx(0);
    }
  };

  const startPushCountdown = () => {
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

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
    else setCurrentIdx(questions.length);
  };

  const handleFinishGame = () => {
    setCurrentIdx(questions.length + 10); // Условный флаг финиша
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    let qs: QuizQuestion[] = [];
    if (gameMode === GameType.QUIZ) {
      qs = await generateQuizQuestions(aiTopic || 'Party', lang, aiCount);
    } else if (gameMode === GameType.BELIEVE_NOT) {
      qs = await generateBelieveNotQuestions(aiTopic || 'Party', lang, aiCount);
    }
    setQuestions(prev => [...prev, ...qs]);
    setIsGenerating(false);
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
  };

  const isGameActive = currentIdx >= 0 || countdown !== null;
  const isQuizType = gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        {[GameType.QUIZ, GameType.BELIEVE_NOT, GameType.QUEST, GameType.SHAKE_IT, GameType.PUSH_IT, GameType.IMAGE_GEN].map(mode => (
          <button 
            key={mode}
            onClick={() => { setGameMode(mode); setCurrentIdx(-1); setQuestions([]); setCountdown(null); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${gameMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            {t[mode.toLowerCase() as keyof typeof t] || mode}
          </button>
        ))}
        <button onClick={handleClearScreen} className="ml-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white"><MonitorOff size={14}/> {t.clearScreen}</button>
      </div>

      <div className={`grid grid-cols-1 ${isQuizType ? 'lg:grid-cols-3' : ''} gap-8`}>
        <div className={isQuizType ? 'lg:col-span-2' : ''}>
          {isQuizType && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 grid grid-cols-3 gap-4">
                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder={t.aiTopic} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold" />
                <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-bold">
                  {[3, 5, 8, 10].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleGenerateQuestions} disabled={isGenerating} className="bg-indigo-600 py-2 rounded-xl text-[10px] font-black uppercase">{isGenerating ? '...' : t.aiGen}</button>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <textarea value={manualQ} onChange={e => setManualQ(e.target.value)} placeholder={t.qPlaceholder} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold h-20" />
                {gameMode === GameType.QUIZ && (
                  <div className="grid grid-cols-2 gap-4">
                    {manualOptions.map((opt, i) => (
                      <input key={i} value={opt} onChange={e => { const no = [...manualOptions]; no[i] = e.target.value; setManualOptions(no); }} placeholder={t.optPlaceholder + ' ' + (i+1)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white" />
                    ))}
                  </div>
                )}
                <button onClick={handleAddManual} className="w-full bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase">{t.addToList}</button>
              </div>
            </div>
          )}

          {!isQuizType && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-6">
               <h3 className="text-4xl font-black text-white italic uppercase">{gameMode}</h3>
               {!isGameActive ? (
                  <button onClick={handleStartGame} className="bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all">
                     {gameMode === GameType.PUSH_IT ? t.pushStart : t.start}
                  </button>
               ) : (
                  <div className="flex flex-col items-center gap-6">
                     <div className="text-6xl font-black text-indigo-500">{countdown || 'LIVE'}</div>
                     <div className="flex gap-4">
                       <button onClick={handleNextQuestion} className="px-10 py-4 bg-emerald-600 rounded-2xl text-white font-black text-lg">{t.next}</button>
                       <button onClick={handleFinishGame} className="px-10 py-4 bg-rose-600 rounded-2xl text-white font-black text-lg">{t.gameEnd}</button>
                     </div>
                  </div>
               )}
            </div>
          )}
          
          {isQuizType && isGameActive && (
            <div className="mt-8 flex justify-center gap-4">
               <button onClick={handleNextQuestion} className="px-12 py-5 bg-emerald-600 rounded-2xl text-white font-black text-xl shadow-xl">{t.next}</button>
               <button onClick={handleFinishGame} className="px-12 py-5 bg-rose-600 rounded-2xl text-white font-black text-xl shadow-xl">{t.gameEnd}</button>
            </div>
          )}
        </div>

        {isQuizType && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-full">
            <h3 className="font-black text-white uppercase italic text-sm mb-4">{t.questions}</h3>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
              {questions.map((q, i) => (
                <div key={i} className={`p-4 rounded-xl border ${currentIdx === i ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}>
                  <p className="text-xs font-bold text-white">{i + 1}. {q.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizControl;