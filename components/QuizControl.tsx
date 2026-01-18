import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, QuizQuestion, Language } from '../types';
import { Zap, Play, RotateCcw, Award, Plus, Trash2, Cpu, PlayCircle, ImageIcon, MousePointer2, HelpCircle, Rocket, MonitorOff, CheckCircle2, XCircle, Save, X, Edit2, Check } from 'lucide-react';
import { generateQuizQuestions, generateBelieveNotQuestions } from '../services/geminiService';
import { FirebaseService } from '../services/firebase'; // ВАЖНО

interface Props {
  activeEvent: LiveEvent;
  lang: Language;
}

const TRANSLATIONS = {
  ru: { panel: 'Панель', event: 'Событие', quiz: 'Квиз', believe: 'Верю / Не верю', shake: 'Тряси!', push: 'Жми!', art: 'ИИ Арт', quest: 'Квест', start: 'НАЧАТЬ', questions: 'Вопросы', aiGen: 'ИИ Генерация', manualTitle: 'Свой вопрос', addToList: 'Добавить', clearAll: 'Очистить', thinking: 'Думаю...', noQs: 'Нет вопросов', status: 'Статус', lobby: 'Ожидание', onAir: 'В эфире', next: 'Далее', back: 'Назад', gameEnd: 'Завершить', aiTopic: 'Тема', aiCount: 'Кол-во', save: 'Сохранить', trueBtn: 'Верю', falseBtn: 'Не верю' },
  en: { panel: 'Panel', event: 'Event', quiz: 'Quiz', believe: 'Believe', shake: 'Shake', push: 'Push', art: 'AI Art', quest: 'Quest', start: 'START', questions: 'Questions', aiGen: 'AI Gen', manualTitle: 'Custom Q', addToList: 'Add', clearAll: 'Clear', thinking: 'Thinking...', noQs: 'No questions', status: 'Status', lobby: 'Lobby', onAir: 'On Air', next: 'Next', back: 'Back', gameEnd: 'End Game', aiTopic: 'Topic', aiCount: 'Count', save: 'Save', trueBtn: 'True', falseBtn: 'False' }
};

const QuizControl: React.FC<Props> = ({ activeEvent, lang }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1); 
  const [gameMode, setGameMode] = useState<GameType>(GameType.QUIZ);
  const [questStage, setQuestStage] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  
  const [manualQ, setManualQ] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState(0);
  const [artTheme, setArtTheme] = useState('');

  const t = TRANSLATIONS[lang];

  // СИНХРОНИЗАЦИЯ С FIREBASE
  useEffect(() => {
    // Собираем полное состояние игры для гостей
    const payload = {
      gameType: gameMode,
      currentIdx,
      questStage,
      isActive: currentIdx >= 0 || countdown !== null,
      isCountdown: countdown !== null,
      countdownValue: countdown,
      questions,
      artTheme,
      code: activeEvent.code, // Чтобы гости знали, к чему коннектиться
      timestamp: Date.now()
    };

    FirebaseService.updateGameState({ activeEvent: payload });
  }, [gameMode, currentIdx, questStage, questions, artTheme, countdown, activeEvent.code]);

  const handleStartGame = () => {
    if (gameMode === GameType.PUSH_IT) {
      setCountdown(10);
      let val = 10;
      const timer = setInterval(() => {
        val -= 1;
        setCountdown(val);
        if (val <= 0) {
           clearInterval(timer);
           setCountdown(null);
           setCurrentIdx(0);
        }
      }, 1000);
    } else {
      setCurrentIdx(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(p => p + 1);
    else setCurrentIdx(questions.length); // Финиш
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    const qs = gameMode === GameType.QUIZ 
       ? await generateQuizQuestions(aiTopic || 'Party', lang, aiCount)
       : await generateBelieveNotQuestions(aiTopic || 'Facts', lang, aiCount);
    setQuestions(p => [...p, ...qs]);
    setIsGenerating(false);
  };

  const handleAddManual = () => {
    const newQ: QuizQuestion = {
      id: Date.now().toString(),
      question: manualQ,
      options: gameMode === GameType.BELIEVE_NOT ? (lang === 'ru' ? ['Верю', 'Не верю'] : ['True', 'False']) : manualOptions,
      correctAnswerIndex: manualCorrect
    };
    setQuestions(p => [...p, newQ]);
    setManualQ('');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        {[GameType.QUIZ, GameType.BELIEVE_NOT, GameType.QUEST, GameType.SHAKE_IT, GameType.PUSH_IT, GameType.IMAGE_GEN].map(type => (
           <button key={type} onClick={() => { setGameMode(type); setCurrentIdx(-1); }} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${gameMode === type ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>
              {type}
           </button>
        ))}
        <button onClick={() => { setCurrentIdx(-1); setQuestions([]); }} className="ml-auto px-4 py-2 rounded-xl text-rose-500 bg-rose-500/10 font-black text-xs uppercase"><MonitorOff size={14} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            {(gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT) && (
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h4 className="font-black text-white uppercase flex items-center gap-2"><Cpu size={16} /> {t.aiGen}</h4>
                  <div className="flex gap-4">
                     <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Тема..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white font-bold" />
                     <button onClick={handleGenerateQuestions} disabled={isGenerating} className="bg-indigo-600 px-6 py-3 rounded-xl text-white font-black text-xs uppercase">{isGenerating ? t.thinking : t.start}</button>
                  </div>
               </div>
            )}
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
               <h3 className="text-3xl font-black text-white italic uppercase">{gameMode}</h3>
               {currentIdx === -1 ? (
                  <button onClick={handleStartGame} className="bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black text-xl uppercase shadow-2xl flex items-center justify-center gap-3 mx-auto"><PlayCircle /> {t.start}</button>
               ) : (
                  <div className="flex flex-col items-center gap-4">
                     {countdown ? <div className="text-8xl font-black text-white animate-pulse">{countdown}</div> : (
                        <div className="flex gap-4">
                           <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} className="p-4 bg-slate-800 rounded-2xl text-white"><RotateCcw /></button>
                           <button onClick={handleNextQuestion} className="px-10 py-4 bg-emerald-600 rounded-2xl text-white font-black text-lg shadow-xl uppercase">{t.next}</button>
                           <button onClick={() => setCurrentIdx(-1)} className="p-4 bg-rose-600/20 text-rose-500 rounded-2xl font-black uppercase text-xs">{t.gameEnd}</button>
                        </div>
                     )}
                     {(gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT) && questions[currentIdx] && (
                        <div className="w-full text-left bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4">
                           <p className="text-white font-bold">{questions[currentIdx].question}</p>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>

         {(gameMode === GameType.QUIZ || gameMode === GameType.BELIEVE_NOT) && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-[500px]">
               <h3 className="font-black text-white uppercase italic mb-4">{t.questions}</h3>
               <div className="flex-1 overflow-y-auto space-y-2">
                  {questions.map((q, i) => (
                     <div key={i} className={`p-3 rounded-xl border ${currentIdx === i ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}>
                        <p className="text-xs font-bold text-white line-clamp-2">{i+1}. {q.question}</p>
                     </div>
                  ))}
               </div>
               <div className="pt-4 mt-auto space-y-3 border-t border-slate-800">
                  <textarea value={manualQ} onChange={e => setManualQ(e.target.value)} placeholder={t.manualTitle} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs resize-none" />
                  <button onClick={handleAddManual} disabled={!manualQ} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black uppercase text-xs"><Plus size={14} className="inline"/> {t.addToList}</button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default QuizControl;