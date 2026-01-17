
import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, Language } from '../types';
import { Smartphone, Send, Zap, Loader2, Sparkles, CheckCircle2, Clock, Camera, Trash2 } from 'lucide-react';
import { generateAiImage } from '../services/geminiService';
import { FirebaseService } from '../services/firebase';

interface Props {
  activeEvent: LiveEvent | null;
  lang: Language;
}

const GuestPortal: React.FC<Props> = ({ activeEvent: initialEvent, lang }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [name, setName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [error, setError] = useState('');
  const [pushCount, setPushCount] = useState(0);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageSent, setIsImageSent] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  useEffect(() => {
    if (isJoined && eventCode) {
      const unsub = FirebaseService.onGameStateChange(eventCode, (state) => {
        if (state) {
          setGameState(prev => {
            if (prev?.currentIdx !== state.currentIdx || prev?.gameType !== state.gameType) {
              setAnswerSubmitted(null);
              setQuestionStartTime(Date.now());
              if (state.gameType === GameType.PUSH_IT) setPushCount(0);
            }
            return state;
          });
        }
      });
      return () => unsub();
    }
  }, [isJoined, eventCode]);

  const handleJoin = async () => {
    if (!name.trim() || !eventCode.trim()) return;
    const events = JSON.parse(localStorage.getItem('mc_events') || '[]');
    const target = events.find((e: any) => e.code.toUpperCase() === eventCode.toUpperCase());
    
    if (!target || target.status === 'UPCOMING') {
      setError('Ñîáûòèå íå àêòèâíî');
      return;
    }

    await FirebaseService.registerGuest(eventCode, name);
    setIsJoined(true);
  };

  const submitAnswer = async (value: number) => {
    if (answerSubmitted !== null || !gameState) return;
    const timeTaken = Date.now() - questionStartTime;
    setAnswerSubmitted(value);
    await FirebaseService.submitAnswer(eventCode, 'quiz', gameState.currentIdx, name, { value, timeTaken, name });
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handlePush = async () => {
    if (pushCount >= 50 || gameState?.isCountdown) return;
    const nc = pushCount + 1;
    setPushCount(nc);
    await FirebaseService.updatePushProgress(eventCode, name, nc);
    if (window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const handleCreateArt = async () => {
    if (!imagePrompt.trim()) return;
    setIsGenerating(true);
    const url = await generateAiImage(imagePrompt);
    if (url) {
      await FirebaseService.addGuestImage(eventCode, { url, user: name, timestamp: Date.now() });
      setIsImageSent(true);
    }
    setIsGenerating(false);
  };

  if (!isJoined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-indigo-950">
        <div className="w-full max-w-sm space-y-8 text-center animate-in zoom-in">
          <Smartphone size={80} className="mx-auto text-white opacity-20" />
          <h1 className="text-4xl font-black text-white italic uppercase">Âõîä â èãğó</h1>
          <div className="space-y-4">
            <input placeholder="ÊÎÄ ÑÎÁÛÒÈß" value={eventCode} onChange={e => setEventCode(e.target.value.toUpperCase())} className="w-full bg-indigo-900 border-2 border-indigo-400/30 rounded-2xl px-6 py-4 text-white text-xl font-mono font-bold uppercase outline-none focus:border-white" />
            <input placeholder="ÂÀØÅ ÈÌß" value={name} onChange={e => setName(e.target.value)} className="w-full bg-indigo-900 border-2 border-indigo-400/30 rounded-2xl px-6 py-4 text-white text-xl font-bold outline-none focus:border-white" />
            {error && <p className="text-rose-400 font-bold">{error}</p>}
            <button onClick={handleJoin} className="w-full bg-white text-indigo-900 py-5 rounded-2xl text-2xl font-black shadow-xl active:scale-95 transition-all">ÏÎÅÕÀËÈ!</button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState || !gameState.isActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center animate-pulse"><Smartphone className="text-white" size={40} /></div>
        <h2 className="text-2xl font-black text-white italic">ÆÄÅÌ ÂÅÄÓÙÅÃÎ...</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ñêîğî íà÷íåòñÿ èíòåğàêòèâ</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-indigo-950">
      {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
        <div className="space-y-6">
           <div className="bg-white/10 p-6 rounded-3xl border border-white/20"><h2 className="text-2xl font-bold text-white">{gameState.questions[gameState.currentIdx]?.question}</h2></div>
           <div className="grid gap-4">
              {gameState.questions[gameState.currentIdx]?.options.map((opt: string, i: number) => (
                <button key={i} onClick={() => submitAnswer(i)} disabled={answerSubmitted !== null} className={`py-8 rounded-3xl text-xl font-black transition-all active:scale-95 border-b-8 ${answerSubmitted === i ? 'bg-amber-400 border-amber-600 text-amber-900' : 'bg-white text-indigo-900 border-indigo-200 opacity-90'}`}>{opt}</button>
              ))}
           </div>
        </div>
      )}

      {gameState.gameType === GameType.PUSH_IT && (
        <div className="h-full flex flex-col items-center justify-center space-y-12">
          {gameState.isCountdown ? <div className="text-8xl font-black text-white animate-pulse">{gameState.countdownValue}</div> : (
            <>
              <div className="text-center"><h2 className="text-3xl font-black text-white italic mb-2">ÆÌÈ ÁÛÑÒĞÅÅ!</h2><div className="text-6xl font-black text-blue-400">{pushCount}/50</div></div>
              <button onClick={handlePush} disabled={pushCount >= 50} className="w-64 h-64 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-8 border-white/20 text-white text-4xl font-black">ÆÌÈ!</button>
            </>
          )}
        </div>
      )}

      {gameState.gameType === GameType.IMAGE_GEN && (
        <div className="space-y-6">
           <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20"><h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">ÈÈ ÀĞÒ-ÁÈÒÂÀ</h2></div>
           <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="×òî íàğèñîâàòü?" className="w-full bg-indigo-900 border-2 border-indigo-400/30 rounded-2xl p-6 text-white text-lg font-bold outline-none h-32" />
           <button onClick={handleCreateArt} disabled={isGenerating || isImageSent} className="w-full bg-white text-indigo-950 py-5 rounded-2xl text-2xl font-black shadow-xl flex items-center justify-center gap-3">
             {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="text-amber-500" />}
             {isImageSent ? 'ÎÒÏĞÀÂËÅÍÎ!' : 'ĞÈÑÎÂÀÒÜ!'}
           </button>
        </div>
      )}
    </div>
  );
};

export default GuestPortal;