import { FirebaseService } from '../services/firebase';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LiveEvent, GameType, Language, QuizQuestion } from '../types';
import { Trophy, Timer, Users, Zap, ImageIcon, MousePointer2, Medal, Star, Clock, HelpCircle, CheckCircle2, XCircle, Flag, Loader2, Maximize2, Calculator, Camera, Upload, Check, Rocket, Flame, MonitorOff, Heart, RotateCcw } from 'lucide-react';

interface Props { 
  activeEvent: LiveEvent | null; 
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    welcome: 'ДОБРО ПОЖАЛОВАТЬ',
    joinOn: 'Заходи на',
    online: 'В сети',
    codeWaiting: 'КОД: ОЖИДАНИЕ',
    quizTitle: 'ИНТЕЛЛЕКТУАЛЬНЫЙ КВИЗ',
    believeTitle: 'ПРАВДА ИЛИ ЛОЖЬ',
    shakeTitle: 'ИСПЫТАНИЕ ТРЯСКИ',
    pushTitle: 'ГОНКА: ЖМИ БЫСТРЕЕ!',
    artTitle: 'ИИ АРТ-БИТВА',
    questTitle: 'МЕГА-КВЕСТ',
    artThemeLabel: 'ТЕМА:',
    questionLabel: 'Вопрос',
    of: 'из',
    guestsCreated: 'Создано гостями:',
    sec: 'СЕК',
    answers: 'ОТВЕТЫ',
    shakeFaster: 'ТРЯСИ БЫСТРЕЕ!',
    pushFaster: 'КЛИКАЙ КАК МОЛНИЯ!',
    guest: 'Гость',
    waitingArt: 'Ожидание шедевров...',
    leader: 'Лидер раунда:',
    engine: 'Maybeu Live Engine v3.5',
    finish: 'ФИНИШ',
    winner: 'ПОБЕДИТЕЛЬ!',
    congrats: 'НЕВЕРОЯТНАЯ СКОРОСТЬ!',
    standby: 'ОЖИДАНИЕ СТАРТА',
    resultsTitle: 'ИТОГИ ИГРЫ',
    questResultsTitle: 'ИТОГИ КВЕСТА',
    score: 'баллов',
    speed: 'скорость',
    ms: 'сек',
    correct: 'ПРАВИЛЬНО',
    incorrect: 'НЕВЕРНО',
    startRace: 'ПРИГОТОВИТЬСЯ К СТАРТУ!',
    getReady: 'ПРИГОТОВЬТЕСЬ...',
    countdown: 'ОТКРЫТИЕ ТРАССЫ ЧЕРЕЗ:',
    fullscreen: 'На весь экран',
    clear: 'Сброс',
    wakeLockActive: 'Экран не погаснет',
    questStage1Title: 'МАШИНА ВРЕМЕНИ',
    questStage1Desc: 'На какой день недели придется {date} в 2099 году?',
    questStage2Title: 'ФОТО-ОХОТА',
    questStage2Desc: 'Сфоткай мужчину с интересной прической или бородой!',
    questStage3Title: 'БЫСТРЫЙ СЧЕТ',
    questStage3Desc: 'Реши уравнение: (250 х 4 х 5 х 2) + 2000 - 500 - 250 - 16 - 1500 + 1500 + 1234 - 50 - 50 - 23',
    questStage4Title: 'МИЛЫЕ ЖИВОТНЫЕ',
    questStage4Desc: 'Найди и пришли фото любого милого животного!',
    photoReceived: 'ФОТО ПОЛУЧЕНО',
    thanks: 'СПАСИБО ЗА ВНИМАНИЕ И ДО НОВЫХ ВСТРЕЧ!',
    completed: 'ЭФИР ЗАВЕРШЕН'
  },
  en: {
    welcome: 'WELCOME',
    joinOn: 'Join on',
    online: 'Online',
    codeWaiting: 'CODE: WAITING',
    quizTitle: 'INTELLECTUAL QUIZ',
    believeTitle: 'TRUE OR FALSE',
    shakeTitle: 'SHAKE CHALLENGE',
    pushTitle: 'RACE: PUSH IT FAST!',
    artTitle: 'AI ART BATTLE',
    questTitle: 'MEGA QUEST',
    artThemeLabel: 'THEME:',
    questionLabel: 'Question',
    of: 'of',
    guestsCreated: 'Created by guests:',
    sec: 'SEC',
    answers: 'ANSWERS',
    shakeFaster: 'SHAKE FASTER!',
    pushFaster: 'CLICK LIKE LIGHTNING!',
    guest: 'Guest',
    waitingArt: 'Waiting for masterpieces...',
    leader: 'Round Leader:',
    engine: 'Maybeu Live Engine v3.5',
    finish: 'ФИНИШ',
    winner: 'WINNER!',
    congrats: 'INCREDIBLE SPEED!',
    standby: 'WAITING FOR START',
    resultsTitle: 'GAME RESULTS',
    questResultsTitle: 'QUEST RESULTS',
    score: 'pts',
    speed: 'speed',
    ms: 's',
    correct: 'CORRECT',
    incorrect: 'WRONG',
    startRace: 'GET READY TO RACE!',
    getReady: 'GET READY...',
    countdown: 'TRACK OPENS IN:',
    fullscreen: 'Fullscreen',
    clear: 'Reset',
    wakeLockActive: 'Wake lock active',
    questStage1Title: 'TIME MACHINE',
    questStage1Desc: 'What day of week is {date} in the year 2099?',
    questStage2Title: 'PHOTO HUNT',
    questStage2Desc: 'Capture a man with an interesting hairstyle or beard!',
    questStage3Title: 'FAST CALC',
    questStage3Desc: 'Solve: (250 x 4 x 5 x 2) + 2000 - 500 - 250 - 16 - 1500 + 1500 + 1234 - 50 - 50 - 23',
    questStage4Title: 'CUTE ANIMALS',
    questStage4Desc: 'Find and send a photo of any cute animal!',
    photoReceived: 'PHOTO RECEIVED',
    thanks: 'THANK YOU FOR WATCHING AND SEE YOU SOON!',
    completed: 'EVENT COMPLETED'
  }
};

const BigScreenView: React.FC<Props> = ({ activeEvent: initialEvent, lang }) => {
  const [screenCode, setScreenCode] = useState(initialEvent?.code || '');
  const [isCodeEntered, setIsCodeEntered] = useState(!!initialEvent?.code);
  
  const [gameState, setGameState] = useState<any>(null);
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(initialEvent);
  const [onlineCount, setOnlineCount] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [sessionData, setSessionData] = useState<any>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isCodeEntered || !screenCode) return;
    const unsub = FirebaseService.subscribeToEvent(screenCode, (evt) => {
      setActiveEvent(evt);
    });
    const pulse = setInterval(() => {
      FirebaseService.sendScreenHeartbeat(screenCode);
    }, 2000);
    return () => { unsub(); clearInterval(pulse); };
  }, [isCodeEntered, screenCode]);

  useEffect(() => {
    if (!isCodeEntered || !screenCode) return;
    const unsubGame = FirebaseService.subscribeToGame(screenCode, (gs) => {
      setGameState((prev: any) => {
         const isNewStep = prev?.currentIdx !== gs?.currentIdx || prev?.questStage !== gs?.questStage || prev?.gameType !== gs?.gameType;
         if (isNewStep && gs) {
            if (prev?.gameType !== gs.gameType) {
              setGameFinished(false);
            }
            if (gs.gameType === GameType.QUIZ || gs.gameType === GameType.BELIEVE_NOT || gs.gameType === GameType.QUEST) {
              setGameFinished(gs.currentIdx >= (gs.questions?.length || 10));
            }
         }
         return gs;
      });
    });
    return unsubGame;
  }, []);

  useEffect(() => {
    if (activeEvent?.code) {
      const unsub = FirebaseService.subscribeToSessionData(activeEvent.code, (data) => {
         setSessionData(data || {});
         if (data.registry) {
           setOnlineCount(Object.keys(data.registry).length);
         }
         
         if (gameState?.gameType === GameType.PUSH_IT && data.race && !gameFinished && gameState?.isActive && !gameState?.isCountdown) {
            const winnerEntry = Object.entries(data.race).find(([_, count]) => Number(count) >= 50);
            if (winnerEntry) setGameFinished(true);
         }

         if (gameState?.gameType === GameType.SHAKE_IT && data.shake && !gameFinished && gameState?.isActive) {
            const winnerEntry = Object.entries(data.shake).find(([_, count]) => Number(count) >= 150);
            if (winnerEntry) setGameFinished(true);
         }
      });
      return unsub;
    }
  }, [activeEvent?.code, gameState?.gameType, gameFinished, gameState?.isActive, gameState?.isCountdown]);

  const calculatePoints = (isCorrect: boolean, timeMs: number): number => {
    if (!isCorrect) return 0;
    const seconds = timeMs / 1000;
    const speedBonus = Math.max(0, 100 - (seconds * 10));
    return Math.round(100 + speedBonus);
  };

  const quizLeaders = useMemo(() => {
    if (!activeEvent || !gameState?.questions || !sessionData.quiz_answers) return [];
    const scores: Record<string, number> = {};

    Object.entries(sessionData.quiz_answers).forEach(([guestName, guestAnswers]: [string, any]) => {
      Object.entries(guestAnswers).forEach(([qIdx, ans]: [string, any]) => {
        const question = gameState.questions[parseInt(qIdx)];
        if (question) {
          const isCorrect = ans.value === question.correctAnswerIndex;
          const points = calculatePoints(isCorrect, ans.timeTaken);
          scores[guestName] = (scores[guestName] || 0) + points;
        }
      });
    });

    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [gameFinished, sessionData.quiz_answers, gameState?.questions]);

  const questResults = useMemo(() => {
    if (!activeEvent || !sessionData.quest_responses) return [];
    const participants: Record<string, { score: number }> = {};
    const now = new Date();
    const correctDay2099 = new Date(2099, now.getMonth(), now.getDate()).getDay();
    const correctMathResult = "12345"; 

    Object.entries(sessionData.quest_responses).forEach(([stage, responses]: [string, any]) => {
      const responseList = Object.values(responses);
      responseList.forEach((res: any) => {
        if (!participants[res.name]) participants[res.name] = { score: 0 };
        let isCorrect = false;
        const s = parseInt(stage);
        
        if (s === 1) isCorrect = parseInt(res.value) === correctDay2099;
        else if (s === 3) isCorrect = res.value.toString().trim() === correctMathResult;
        else if (s === 2 || s === 4) isCorrect = !!res.value;

        if (isCorrect) {
          participants[res.name].score += calculatePoints(true, res.timeTaken);
        }
      });
    });

    return Object.entries(participants)
      .map(([name, data]) => ({ name, score: data.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [gameFinished, sessionData.quest_responses]);

  const pushResults = useMemo(() => {
    if (!sessionData.race) return [];
    return Object.entries(sessionData.race)
      .map(([name, count]) => ({ name, score: Number(count) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [sessionData.race]);

  const shakeResults = useMemo(() => {
    if (!sessionData.shake) return [];
    return Object.entries(sessionData.shake)
      .map(([name, count]) => ({ name, score: Number(count) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [sessionData.shake]);

  const getGuestImages = () => {
     if (!sessionData.images) return [];
     return Object.values(sessionData.images);
  };
  
  const getQuestResponses = () => {
     if (!sessionData.quest_responses || !gameState) return [];
     const responses = sessionData.quest_responses[gameState.questStage] || {};
     return Object.values(responses);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleClearScreen = () => {
    if (activeEvent?.code) {
      FirebaseService.resetGameData(activeEvent.code);
    }
  };

 if (!isCodeEntered) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-20 text-center">
         <h1 className="text-4xl font-black text-white mb-8">ПОДКЛЮЧЕНИЕ ЭКРАНА</h1>
         <input 
           value={screenCode} 
           onChange={e => setScreenCode(e.target.value.toUpperCase())} 
           placeholder="ВВЕДИТЕ КОД (например, LOVE24)" 
           className="bg-slate-900 border-2 border-slate-700 text-white text-3xl font-mono text-center p-6 rounded-2xl mb-6 outline-none focus:border-indigo-500 uppercase"
         />
         <button 
           onClick={() => setIsCodeEntered(true)} 
           disabled={!screenCode} 
           className="bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-black px-12 py-6 rounded-2xl disabled:opacity-50 transition-all"
         >
           ПОДКЛЮЧИТЬ ЭКРАН
         </button>
      </div>
    );
  }

  if (activeEvent.status === 'COMPLETED') {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-[5vmin] text-center relative overflow-hidden animate-in fade-in duration-1000">
         <div className="absolute top-6 right-6 flex gap-2 z-50">
           <button onClick={toggleFullscreen} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500"><Maximize2 size={24} /></button>
         </div>
         
         <div className="relative z-10 max-w-5xl space-y-[5vmin]">
            <div className="w-32 h-2 bg-emerald-500 mx-auto rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
            <h1 className="text-[7vmin] font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-2xl">
              {t.thanks}
            </h1>
            <p className="text-[3vmin] font-bold text-slate-500 uppercase tracking-[0.5em]">{t.completed}</p>
         </div>
         
         <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/30 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
         </div>
      </div>
    );
  }

  // Lobby view before game starts
  if (!gameState || (!gameState.isActive && !gameFinished)) {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-[5vmin] text-center relative overflow-hidden">
        <div className="absolute top-6 right-6 flex gap-2 z-50">
           <button onClick={handleClearScreen} className="p-4 bg-white/5 hover:bg-rose-600/20 hover:text-rose-500 rounded-2xl text-slate-500 transition-all" title={t.clear}><MonitorOff size={24} /></button>
           <button onClick={toggleFullscreen} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500"><Maximize2 size={24} /></button>
        </div>
        
        <div className="relative z-10 space-y-[5vmin]">
          <h1 className="text-[10vmin] font-black text-white tracking-tighter uppercase italic leading-none">{activeEvent.name}</h1>
          
          {activeEvent.status === 'LIVE' ? (
            <div className="bg-white p-[2vmin] rounded-[3vmin] shadow-2xl inline-block border-[1vmin] border-indigo-600/20 animate-in zoom-in duration-500">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://maybeu-live.vercel.app/?code=${activeEvent.code}`} alt="QR" className="w-[30vmin] h-[30vmin]" />
              <div className="mt-4 text-indigo-900 font-black text-[2.5vmin] uppercase tracking-widest">{t.joinOn} maybeu-live.vercel.app</div>
            </div>
          ) : (
            <div className="py-20 animate-in fade-in duration-1000">
               <div className="w-32 h-1 bg-indigo-500 mx-auto rounded-full mb-8 animate-pulse"></div>
               <p className="text-[4vmin] font-black text-slate-500 tracking-[0.5em] uppercase italic">{t.standby}</p>
            </div>
          )}

          <div className="flex justify-center gap-[5vmin] text-[3vmin] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-3"><Users size={40} className="text-indigo-500" /> {onlineCount} {t.online}</div>
            <div className="font-mono text-white bg-slate-950 px-8 py-3 rounded-full border border-slate-800">КОД: {activeEvent.code}</div>
          </div>
        </div>
      </div>
    );
  }

  // --- ЗАЩИТА ОТ КРАША ---
  const currentQuestion = gameState.questions ? gameState.questions[gameState.currentIdx] : null;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-slate-950 p-[3vmin] overflow-hidden relative">
      <header className="flex justify-between items-start mb-[3vmin] relative z-10">
        <div className="flex items-center gap-[2vmin]">
          <div className="w-[8vmin] h-[8vmin] bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            {gameState.gameType === GameType.QUEST ? <Rocket size={40} className="text-white" /> : 
             gameState.gameType === GameType.SHAKE_IT ? <RotateCcw size={40} className="text-white" /> : <Zap size={40} className="text-white" />}
          </div>
          <div>
            <h2 className="text-[4vmin] font-black text-white italic uppercase leading-none">
              {gameFinished ? (gameState.gameType === GameType.QUEST ? t.questResultsTitle : t.resultsTitle) : 
               gameState.gameType === GameType.QUIZ ? t.quizTitle :
               gameState.gameType === GameType.BELIEVE_NOT ? t.believeTitle :
               gameState.gameType === GameType.PUSH_IT ? t.pushTitle :
               gameState.gameType === GameType.SHAKE_IT ? t.shakeTitle :
               gameState.gameType === GameType.IMAGE_GEN ? t.artTitle : t.questTitle}
            </h2>
            {!gameFinished && gameState.gameType === GameType.QUEST && <p className="text-[2vmin] text-indigo-400 font-bold uppercase tracking-widest">ЭТАП {gameState.questStage} / 4</p>}
            {!gameFinished && (gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
              <p className="text-[2vmin] text-indigo-400 font-bold uppercase tracking-widest">{t.questionLabel} {gameState.currentIdx + 1} {t.of} {gameState.questions?.length}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleClearScreen} className="p-4 bg-white/5 hover:bg-rose-600/20 hover:text-rose-500 rounded-2xl text-slate-500 transition-all" title={t.clear}><MonitorOff size={24} /></button>
           <button onClick={toggleFullscreen} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500"><Maximize2 size={24} /></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center w-full relative z-10 overflow-hidden">
        {gameFinished ? (
          <div className="w-full max-w-6xl mx-auto space-y-[4vmin] animate-in zoom-in">
            <div className="text-center mb-[4vmin]">
              <Trophy className="text-amber-500 mx-auto animate-bounce w-[15vmin] h-[15vmin]" />
              <h1 className="text-[8vmin] font-black text-white italic mt-4 uppercase tracking-tighter leading-none">{t.winner}</h1>
              {(gameState.gameType === GameType.PUSH_IT || gameState.gameType === GameType.SHAKE_IT) && (
                 <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                    <span className="text-[10vmin] font-black text-amber-500 uppercase italic tracking-tighter">
                      {gameState.gameType === GameType.PUSH_IT ? pushResults[0]?.name : shakeResults[0]?.name}
                    </span>
                 </div>
              )}
            </div>
            {(gameState.gameType === GameType.QUEST ? questResults : (gameState.gameType === GameType.PUSH_IT ? pushResults : (gameState.gameType === GameType.SHAKE_IT ? shakeResults : quizLeaders))).map((player, i) => (
              <div key={player.name} className={`flex items-center gap-[3vmin] bg-slate-900 border-2 p-[2vmin] rounded-[3vmin] transition-all transform hover:scale-105 ${i === 0 ? 'border-amber-500 shadow-2xl scale-110' : 'border-slate-800'}`}>
                <div className={`w-[8vmin] h-[8vmin] rounded-2xl flex items-center justify-center shrink-0 ${i === 0 ? 'bg-amber-500' : 'bg-slate-800'}`}>
                   {i === 0 ? <Trophy className="text-amber-900" size={32} /> : <Medal className="text-slate-500" size={24} />}
                </div>
                <div className="flex-1">
                   <h3 className="text-[4vmin] font-black text-white italic uppercase leading-none">{player.name}</h3>
                   <span className="text-indigo-400 font-bold uppercase tracking-widest text-[2vmin]">{player.score} {gameState.gameType === GameType.PUSH_IT ? 'clicks' : gameState.gameType === GameType.SHAKE_IT ? 'power' : t.score}</span>
                </div>
                <div className="text-[5vmin] font-black text-slate-800">#{i + 1}</div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && gameState.questions && (
              <div className="max-w-7xl mx-auto w-full space-y-[4vmin] h-full flex flex-col justify-center">
                <div className="bg-slate-900/50 backdrop-blur-xl p-[4vmin] rounded-[5vmin] border-4 border-white/10 shadow-2xl">
                  <h1 className="text-[5vmin] font-black text-white text-center leading-tight tracking-tight italic">
                    {currentQuestion?.question || '...'}
                  </h1>
                </div>
                <div className={`grid gap-[3vmin] ${gameState.gameType === GameType.BELIEVE_NOT ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {currentQuestion?.options?.map((opt: string, i: number) => {
                    const isRevealed = gameState.isAnswerRevealed;
                    const isCorrect = i === currentQuestion.correctAnswerIndex;
                    
                    let cardClass = 'bg-slate-900 border-slate-800 text-white';
                    if (isRevealed) {
                        if (isCorrect) cardClass = 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_50px_rgba(16,185,129,0.6)] scale-105 z-10';
                        else cardClass = 'bg-slate-900/30 border-slate-800/30 text-slate-600 opacity-50';
                    }

                    return (
                      <div key={i} className={`${cardClass} border-2 p-[3vmin] rounded-[4vmin] flex items-center gap-[3vmin] shadow-xl relative overflow-hidden transition-all duration-500`}>
                        <div className={`w-[8vmin] h-[8vmin] rounded-2xl flex items-center justify-center text-[4vmin] font-black shrink-0 ${isRevealed && isCorrect ? 'bg-white text-emerald-600' : 'bg-white/10 text-indigo-400'}`}>
                           {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-[4vmin] font-bold uppercase leading-tight">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {gameState.gameType === GameType.PUSH_IT && (
              <div className="w-full max-w-5xl mx-auto space-y-12">
                {gameState.isCountdown ? (
                  <div className="text-center space-y-8 animate-in zoom-in">
                    <h1 className="text-[6vmin] font-black text-indigo-500 uppercase tracking-[0.3em]">{t.getReady}</h1>
                    <div className="text-[25vmin] font-black text-white leading-none animate-pulse">{gameState.countdownValue}</div>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <h1 className="text-[10vmin] font-black text-white italic animate-bounce">{t.pushTitle}</h1>
                    </div>
                    <div className="space-y-[2vmin]">
                      {pushResults.slice(0, 5).map(({name, score}, i) => (
                        <div key={name} className="space-y-2">
                          <div className="flex justify-between items-end px-2">
                            <span className="text-[3vmin] font-black text-white uppercase italic">{name}</span>
                            <span className="text-[3vmin] font-mono text-indigo-400">{score}/50</span>
                          </div>
                          <div className="h-[4vmin] bg-slate-900 rounded-full border-2 border-slate-800 overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full shadow-lg ${i === 0 ? 'bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse' : 'bg-indigo-600'}`}
                              style={{ width: `${(score / 50) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {gameState.gameType === GameType.SHAKE_IT && (
              <div className="w-full max-w-6xl mx-auto space-y-12">
                 <div className="text-center space-y-4">
                    <h1 className="text-[10vmin] font-black text-white italic animate-bounce">{t.shakeTitle}</h1>
                    <p className="text-[3vmin] text-rose-400 font-bold uppercase tracking-widest">{t.shakeFaster}</p>
                 </div>
                 <div className="grid grid-cols-5 gap-[3vmin] items-end h-[50vh]">
                    {shakeResults.map(({name, score}, i) => (
                       <div key={name} className="flex flex-col items-center gap-4 h-full justify-end group">
                          <div className="text-[2.5vmin] font-black text-white uppercase italic truncate w-full text-center">{name}</div>
                          <div className="w-full bg-slate-900 rounded-t-[3vmin] border-4 border-b-0 border-slate-800 relative overflow-hidden flex-1 shadow-2xl">
                             <div 
                               className={`absolute bottom-0 w-full transition-all duration-300 rounded-t-[20px] ${i === 0 ? 'bg-gradient-to-t from-rose-600 to-amber-500 animate-pulse' : 'bg-indigo-600'}`}
                               style={{ height: `${Math.min(100, score / 1.5)}%` }}
                             />
                          </div>
                          <div className="text-[4vmin] font-mono text-indigo-400 font-black">{score}</div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {gameState.gameType === GameType.IMAGE_GEN && (
              <div className="w-full h-full flex flex-col">
                <div className="text-center mb-[4vmin]">
                  <h2 className="text-[3vmin] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">{t.artThemeLabel}</h2>
                  <h1 className="text-[8vmin] font-black text-white italic uppercase tracking-tighter leading-none">{gameState.artTheme}</h1>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-[2vmin] p-4">
                   {getGuestImages().slice(-8).reverse().map((img: any, i: number) => (
                     <div key={i} className="aspect-square rounded-[4vmin] overflow-hidden border-8 border-slate-900 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform bg-slate-900 group relative">
                        <img src={img.url} className="w-full h-full object-cover" alt="Art" />
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl">
                           <p className="text-white font-black text-xs uppercase text-center">{img.user}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {gameState.gameType === GameType.QUEST && (
              <div className="space-y-[5vmin] animate-in fade-in duration-500 h-full flex flex-col justify-center">
                 <div className="text-center max-w-5xl mx-auto space-y-4">
                    <h1 className="text-[8vmin] font-black text-white uppercase italic tracking-tighter leading-none">
                      {gameState.questStage === 1 ? t.questStage1Title : 
                       gameState.questStage === 2 ? t.questStage2Title : 
                       gameState.questStage === 3 ? t.questStage3Title : t.questStage4Title}
                    </h1>
                    <p className="text-[3.5vmin] font-bold text-slate-500 uppercase">
                       {gameState.questStage === 1 ? t.questStage1Desc.replace('{date}', new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' })) : 
                        gameState.questStage === 2 ? t.questStage2Desc : 
                        gameState.questStage === 3 ? t.questStage3Desc : t.questStage4Desc}
                    </p>
                 </div>

                 <div className="flex-1 grid grid-cols-4 gap-[2vmin] auto-rows-max overflow-y-auto p-4">
                    {getQuestResponses().slice(-12).reverse().map((res: any, i: number) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-[2vmin] rounded-[3vmin] animate-in zoom-in overflow-hidden shadow-xl">
                        {res.isImage ? (
                          <div className="aspect-square rounded-2xl mb-3 overflow-hidden border-2 border-emerald-500/20 bg-slate-950">
                            <img src={res.value} className="w-full h-full object-cover" alt="Guest" />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-slate-950 rounded-2xl mb-3">
                            <span className="text-[6vmin] font-black text-indigo-500">{res.value}</span>
                          </div>
                        )}
                        <div className="text-center">
                           <p className="text-[2vmin] font-black text-white uppercase italic truncate">{res.name}</p>
                           <p className="text-[1.5vmin] text-slate-500 font-bold">{(res.timeTaken / 1000).toFixed(1)} {t.ms}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest relative z-10">
         <div className="flex items-center gap-3 bg-slate-900/50 px-[3vmin] py-[1.5vmin] rounded-2xl"><Users size={24} className="text-indigo-500" /> {onlineCount} {t.online}</div>
         <div className="text-indigo-400 font-black">{t.engine}</div>
      </footer>
    </div>
  );
};

export default BigScreenView;
