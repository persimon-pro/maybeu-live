import React, { useState, useEffect } from 'react';
import { LiveEvent, GameType, Language } from '../types';
import { Trophy, Users, Zap, Maximize2, Loader2, Rocket } from 'lucide-react';
import { FirebaseService } from '../services/firebase'; // ВАЖНО

interface Props { activeEvent: LiveEvent | null; lang: Language; }

const BigScreenView: React.FC<Props> = ({ lang }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [raceProgress, setRaceProgress] = useState<Record<string, number>>({});
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    // Слушаем игру
    const unsubGame = FirebaseService.subscribeToGameState((data) => {
       if (data && data.activeEvent) setGameState(data.activeEvent);
       else setGameState(null);
    });

    // Слушаем гостей
    const unsubGuests = FirebaseService.onGuestsCountChange(c => setOnlineCount(c));

    // Слушаем прогресс кликеров (Push It)
    const unsubPush = FirebaseService.onPushProgressChange(val => {
       if (val) setRaceProgress(prev => ({ ...prev, ...val }));
       else setRaceProgress({});
    });

    // Слушаем картинки
    const unsubImages = FirebaseService.onImagesChange(val => {
       if (val) setImages(Object.values(val));
    });

    return () => { unsubGame(); unsubGuests(); unsubPush(); unsubImages(); };
  }, []);

  if (!gameState || !gameState.isActive) {
     return (
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-center">
           <h1 className="text-6xl font-black text-white uppercase italic tracking-widest mb-8">MAYBEU LIVE</h1>
           <div className="flex items-center gap-4 text-2xl text-slate-500 font-bold uppercase"><Users /> {onlineCount} ONLINE</div>
           <p className="mt-8 text-indigo-500 animate-pulse font-mono">WAITING FOR HOST...</p>
        </div>
     );
  }

  return (
    <div className="flex-1 bg-slate-950 p-12 flex flex-col relative overflow-hidden">
       <div className="flex justify-between items-start mb-12">
          <div>
             <h1 className="text-5xl font-black text-white italic uppercase">{gameState.gameType}</h1>
             {(gameState.gameType === GameType.QUIZ) && <p className="text-2xl text-indigo-500 font-bold mt-2">ВОПРОС {gameState.currentIdx + 1}</p>}
          </div>
          <div className="text-2xl text-slate-500 font-bold flex items-center gap-2"><Users /> {onlineCount}</div>
       </div>

       <div className="flex-1 flex flex-col justify-center">
          {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && gameState.questions && (
             <div className="space-y-12 text-center">
                <h2 className="text-6xl font-black text-white leading-tight">{gameState.questions[gameState.currentIdx]?.question}</h2>
                <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                   {gameState.questions[gameState.currentIdx]?.options.map((opt: string, i: number) => (
                      <div key={i} className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[40px] text-4xl font-black text-white uppercase">{opt}</div>
                   ))}
                </div>
             </div>
          )}

          {gameState.gameType === GameType.PUSH_IT && (
             <div className="space-y-6 max-w-4xl mx-auto w-full">
                {Object.entries(raceProgress).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, score], i) => (
                   <div key={name} className="space-y-2">
                      <div className="flex justify-between text-white font-black text-2xl uppercase"><span>{name}</span> <span>{score}</span></div>
                      <div className="h-8 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${Math.min(100, (score/50)*100)}%` }} /></div>
                   </div>
                ))}
             </div>
          )}

          {gameState.gameType === GameType.IMAGE_GEN && (
             <div className="grid grid-cols-4 gap-4">
                {images.slice(-8).map((img, i) => (
                   <div key={i} className="aspect-square rounded-3xl overflow-hidden border-4 border-white"><img src={img.imageUrl} className="w-full h-full object-cover" /></div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default BigScreenView;