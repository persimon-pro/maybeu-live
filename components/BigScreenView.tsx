
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LiveEvent, GameType, Language, QuizQuestion } from '../types';
import { Trophy, Users, Zap, Maximize2, Rocket, Clock } from 'lucide-react';
import { FirebaseService } from '../services/firebase';

interface Props { 
  activeEvent: LiveEvent | null; 
  lang: Language;
}

const BigScreenView: React.FC<Props> = ({ activeEvent: initialEvent, lang }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [raceProgress, setRaceProgress] = useState<any>({});
  const [guestImages, setGuestImages] = useState<any[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Подписки на Firebase
  useEffect(() => {
    if (!initialEvent) return;

    // Пульс экрана для ведущего
    const pulseInterval = setInterval(() => {
      FirebaseService.sendScreenPulse(initialEvent.code);
    }, 1000);

    // Слушатели данных
    const unsubGame = FirebaseService.onGameStateChange(initialEvent.code, (state) => {
      if (state) {
        setGameState(prev => {
          if (prev?.gameType !== state.gameType) setGameFinished(false);
          // Автоматическое определение финиша
          if (state.gameType === GameType.QUIZ || state.gameType === GameType.BELIEVE_NOT) {
             if (state.currentIdx >= (state.questions?.length || 0)) setGameFinished(true);
          }
          if (state.currentIdx > 100) setGameFinished(true); // Хак для кнопки "Завершить"
          return state;
        });
      }
    });

    const unsubGuests = FirebaseService.onGuestsCountChange(initialEvent.code, setOnlineCount);
    
    const unsubAnswers = FirebaseService.onAnswersChange(initialEvent.code, 'quiz', (data) => {
      setAnswers(data);
    });

    const unsubPush = FirebaseService.onPushProgressChange(initialEvent.code, (data) => {
      setRaceProgress(data);
      // Проверка победителя в гонке кликов (50 кликов)
      const winner = Object.entries(data).find(([_, count]) => Number(count) >= 50);
      if (winner && !gameFinished) setGameFinished(true);
    });

    const unsubImages = FirebaseService.onImagesChange(initialEvent.code, setGuestImages);

    return () => {
      clearInterval(pulseInterval);
      unsubGame();
      unsubGuests();
      unsubAnswers();
      unsubPush();
      unsubImages();
    };
  }, [initialEvent?.code, gameFinished]);

  const quizLeaders = useMemo(() => {
    if (!gameState?.questions) return [];
    const scores: Record<string, number> = {};
    Object.values(answers).forEach((qAnswers: any) => {
      Object.entries(qAnswers).forEach(([qIdx, ans]: [string, any]) => {
        const q = gameState.questions[parseInt(qIdx)];
        if (q && ans.value === q.correctAnswerIndex) {
          const points = Math.max(50, 200 - Math.floor(ans.timeTaken / 100));
          scores[ans.name] = (scores[ans.name] || 0) + points;
        }
      });
    });
    return Object.entries(scores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [answers, gameState?.questions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  if (!initialEvent) return <div className="h-full bg-slate-950 flex items-center justify-center text-slate-800 text-3xl font-black uppercase italic tracking-widest">Ожидание...</div>;

  if (!gameState || !gameState.isActive && !gameFinished) {
    return (
      <div ref={containerRef} className="h-full bg-slate-950 flex flex-col items-center justify-center p-20 text-center relative overflow-hidden">
        <div className="relative z-10 space-y-12">
          <h1 className="text-8xl font-black text-white uppercase italic">{initialEvent.name}</h1>
          <div className="bg-white p-8 rounded-[40px] shadow-2xl inline-block border-[12px] border-indigo-600/20">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://maybeu.live/join/${initialEvent.code}`} alt="QR" />
            <div className="mt-4 text-indigo-900 font-black text-xl uppercase tracking-widest">maybeu.live</div>
          </div>
          <div className="text-4xl font-bold text-slate-500 uppercase tracking-widest">
            {onlineCount} В сети — КОД: <span className="text-white font-mono">{initialEvent.code}</span>
          </div>
        </div>
        <button onClick={toggleFullscreen} className="absolute top-6 right-6 p-4 bg-white/5 text-slate-500 rounded-2xl"><Maximize2/></button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full bg-slate-950 p-12 flex flex-col relative overflow-hidden">
      <header className="flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Zap size={48} className="text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white italic uppercase">
              {gameFinished ? 'ИТОГИ ИГРЫ' : gameState.gameType}
            </h2>
            {!gameFinished && (gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
               <p className="text-xl text-indigo-400 font-bold uppercase tracking-widest">Вопрос {gameState.currentIdx + 1}</p>
            )}
          </div>
        </div>
        <div className="text-slate-500 font-black uppercase tracking-widest flex items-center gap-4">
           <span>{onlineCount} ОНЛАЙН</span>
           <button onClick={toggleFullscreen} className="p-3 bg-white/5 rounded-xl"><Maximize2/></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center relative z-10">
        {gameFinished ? (
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-in zoom-in">
             <div className="text-center mb-8">
               <Trophy size={100} className="text-amber-500 mx-auto animate-bounce" />
               <h1 className="text-6xl font-black text-white italic mt-4 uppercase">ПОБЕДИТЕЛИ</h1>
             </div>
             {(gameState.gameType === GameType.PUSH_IT ? 
               Object.entries(raceProgress).map(([name, score]) => ({name, score: Number(score)})).sort((a,b) => b.score - a.score).slice(0, 5) : 
               quizLeaders
             ).map((p, i) => (
               <div key={p.name} className={`flex items-center gap-6 bg-slate-900 border-2 p-6 rounded-[30px] ${i === 0 ? 'border-amber-500 scale-110 shadow-2xl' : 'border-slate-800 opacity-80'}`}>
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black ${i === 0 ? 'bg-amber-500 text-amber-900' : 'bg-slate-800 text-slate-400'}`}>{i+1}</div>
                 <div className="flex-1 text-4xl font-black text-white uppercase italic">{p.name}</div>
                 <div className="text-3xl font-mono text-indigo-400">{p.score}</div>
               </div>
             ))}
          </div>
        ) : (
          <>
            {gameState.isCountdown ? (
              <div className="text-center space-y-8 animate-in zoom-in">
                <h1 className="text-6xl font-black text-indigo-500 uppercase tracking-widest">ПРИГОТОВИТЬСЯ!</h1>
                <div className="text-[300px] font-black text-white leading-none animate-pulse">{gameState.countdownValue}</div>
              </div>
            ) : (
              <div className="w-full max-w-6xl mx-auto">
                {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
                  <div className="space-y-12">
                    <div className="bg-slate-900/50 p-12 rounded-[60px] border-4 border-white/10 shadow-2xl text-center">
                      <h1 className="text-6xl font-black text-white italic leading-tight">{gameState.questions[gameState.currentIdx]?.question}</h1>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      {gameState.questions[gameState.currentIdx]?.options.map((opt: string, i: number) => (
                        <div key={i} className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[40px] flex items-center gap-6">
                           <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white">{String.fromCharCode(65 + i)}</div>
                           <span className="text-4xl font-bold text-white uppercase">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gameState.gameType === GameType.PUSH_IT && (
                  <div className="space-y-12">
                    <h1 className="text-8xl font-black text-white text-center italic animate-bounce">ЖМИ БЫСТРЕЕ!</h1>
                    <div className="space-y-6">
                       {Object.entries(raceProgress).sort((a,b) => Number(b[1]) - Number(a[1])).slice(0, 5).map(([name, count]) => (
                         <div key={name} className="space-y-2">
                           <div className="flex justify-between text-2xl font-black text-white uppercase italic"><span>{name}</span><span>{count}/50</span></div>
                           <div className="h-10 bg-slate-900 rounded-full border-4 border-slate-800 overflow-hidden">
                             <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(Number(count)/50)*100}%` }} />
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {gameState.gameType === GameType.IMAGE_GEN && (
                  <div className="grid grid-cols-4 gap-6">
                     {guestImages.slice(-8).reverse().map((img, i) => (
                       <div key={i} className="aspect-square rounded-3xl overflow-hidden border-8 border-slate-900 shadow-2xl">
                         <img src={img.url} className="w-full h-full object-cover" alt="Art" />
                       </div>
                     ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="mt-12 text-center text-indigo-400 font-black uppercase tracking-widest text-xl opacity-30">Maybeu Live Cloud v4.0</footer>
    </div>
  );
};

export default BigScreenView;