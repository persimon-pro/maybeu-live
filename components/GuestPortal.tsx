import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, Language } from '../types';
import { Phone, Zap, Send, Image as ImgIcon, Loader2, CheckCircle2, User, Clock } from 'lucide-react';
import { generateAiImage } from '../services/geminiService';
import { FirebaseService } from '../services/firebase'; // ВАЖНО

interface Props { activeEvent: LiveEvent | null; lang: Language; }

const TRANSLATIONS = {
  ru: { join: 'Вход', enter: 'Введите код и имя', name: 'Имя', code: 'Код', go: 'Поехали!', waiting: 'Ждем ведущего...', question: 'Вопрос', sent: 'Отправлено!', push: 'ЖМИ!', shake: 'ТРЯСИ!', draw: 'Рисуй', prompt: 'Что нарисовать?', create: 'Создать' },
  en: { join: 'Join', enter: 'Code & Name', name: 'Name', code: 'Code', go: 'Go!', waiting: 'Waiting...', question: 'Question', sent: 'Sent!', push: 'PUSH!', shake: 'SHAKE!', draw: 'Draw', prompt: 'Prompt', create: 'Create' }
};

const GuestPortal: React.FC<Props> = ({ lang }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [name, setName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState<number | null>(null);
  const [pushCount, setPushCount] = useState(0);
  const [imgPrompt, setImgPrompt] = useState('');
  const [genImg, setGenImg] = useState<string | null>(null);
  const [isGen, setIsGen] = useState(false);

  const t = TRANSLATIONS[lang];

  // ПОДКЛЮЧЕНИЕ К FIREBASE
  useEffect(() => {
    if (!isJoined) return;

    // Слушаем состояние игры
    const unsubGame = FirebaseService.subscribeToGameState((data) => {
       // Проверяем, совпадает ли код события
       if (data && data.activeEvent && data.activeEvent.code === eventCode) {
          setGameState(data.activeEvent);
          
          // Сброс состояния при смене вопроса
          if (data.activeEvent.currentIdx !== gameState?.currentIdx) {
             setAnswerSubmitted(null);
          }
       }
    });

    // Регистрируемся
    FirebaseService.registerGuest(name + Date.now(), name);

    return () => unsubGame();
  }, [isJoined, eventCode, name]);

  const handleJoin = () => {
     if (name && eventCode) setIsJoined(true);
  };

  const submitAnswer = (idx: number) => {
     setAnswerSubmitted(idx);
     FirebaseService.submitAnswer({ guestId: name, answerIdx: idx });
  };

  const handlePush = () => {
     const newCount = pushCount + 1;
     setPushCount(newCount);
     FirebaseService.updatePushProgress({ [name]: newCount }); // Отправка прогресса
     if (window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const handleGenImage = async () => {
     setIsGen(true);
     const url = await generateAiImage(imgPrompt);
     if (url) {
        setGenImg(url);
        FirebaseService.addGuestImage({ guestId: name, imageUrl: url });
     }
     setIsGen(false);
  };

  if (!isJoined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-indigo-950 min-h-screen">
        <div className="w-full max-w-sm space-y-4 text-center">
           <h1 className="text-4xl font-black text-white italic uppercase">{t.join}</h1>
           <input value={eventCode} onChange={e => setEventCode(e.target.value.toUpperCase())} placeholder={t.code} className="w-full p-4 rounded-2xl bg-white/10 text-white font-black text-center text-xl uppercase placeholder:text-white/30 outline-none border-2 border-white/20 focus:border-white" />
           <input value={name} onChange={e => setName(e.target.value)} placeholder={t.name} className="w-full p-4 rounded-2xl bg-white/10 text-white font-black text-center text-xl placeholder:text-white/30 outline-none border-2 border-white/20 focus:border-white" />
           <button onClick={handleJoin} disabled={!name || !eventCode} className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-xl uppercase shadow-xl disabled:opacity-50">{t.go}</button>
        </div>
      </div>
    );
  }

  if (!gameState || !gameState.isActive) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center min-h-screen">
           <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
           <h2 className="text-2xl font-black text-white uppercase">{t.waiting}</h2>
        </div>
     );
  }

  return (
    <div className="flex-1 bg-indigo-950 p-4 min-h-screen flex flex-col">
       {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
          <div className="space-y-6 my-auto">
             <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                <h2 className="text-xl font-bold text-white text-center">{gameState.questions[gameState.currentIdx]?.question}</h2>
             </div>
             <div className="grid gap-3">
                {gameState.questions[gameState.currentIdx]?.options.map((opt: string, i: number) => (
                   <button key={i} onClick={() => submitAnswer(i)} disabled={answerSubmitted !== null} className={`p-6 rounded-2xl text-xl font-black uppercase transition-all ${answerSubmitted === i ? 'bg-amber-500 text-black' : 'bg-white text-indigo-900'}`}>
                      {opt}
                   </button>
                ))}
             </div>
          </div>
       )}

       {gameState.gameType === GameType.PUSH_IT && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
             <div className="text-6xl font-black text-white">{pushCount}</div>
             <button onClick={handlePush} className="w-64 h-64 rounded-full bg-rose-600 border-8 border-rose-400 shadow-2xl flex items-center justify-center active:scale-95 transition-all">
                <span className="text-4xl font-black text-white uppercase">{t.push}</span>
             </button>
          </div>
       )}

       {gameState.gameType === GameType.IMAGE_GEN && (
          <div className="space-y-4 my-auto">
             <h2 className="text-2xl font-black text-white text-center uppercase">{t.draw}: {gameState.artTheme}</h2>
             <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)} placeholder={t.prompt} className="w-full bg-black/30 text-white p-4 rounded-2xl h-32" />
             <button onClick={handleGenImage} disabled={isGen} className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black uppercase">{isGen ? '...' : t.create}</button>
             {genImg && <img src={genImg} className="w-full rounded-2xl border-4 border-white" />}
          </div>
       )}
    </div>
  );
};

export default GuestPortal;