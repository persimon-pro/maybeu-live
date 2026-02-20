import { FirebaseService } from '../services/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { LiveEvent, GameType, Language, GuestRecord } from '../types';
import * as LucideIcons from 'lucide-react';
const { PlayCircle: PlayIcon, Smartphone: PhoneIcon, Zap: ZapIcon, ShieldAlert: AlertIcon, Send: SendIcon, ImageIcon: ImgIcon, Sparkles: SparkIcon, Loader2: LoaderIcon, CheckCircle2: CheckIcon, Clock: ClockIcon, User: UserIcon, Calendar: CalIcon, MessageSquare: MsgIcon, Users, Camera, Calculator, Upload, Check, X, Delete } = LucideIcons;

import { generateAiImage } from '../services/geminiService';

interface Props {
  activeEvent: LiveEvent | null;
  lang: Language;
  initialCode?: string;
}

const TRANSLATIONS = {
  ru: {
    join: 'Вход в игру',
    enterDetails: 'Введите код события и ваше имя',
    namePlaceholder: 'Ваше Имя',
    codePlaceholder: 'Код (напр. LOVE24)',
    go: 'ПОЕХАЛИ!',
    noEvent: 'Событие не найдено или не активно',
    poweredBy: 'Создано на Maybeu Live™',
    waiting: 'Ждем ведущего...',
    getReady: 'Приготовьтесь, {name}! Скоро начнется следующий раунд.',
    question: 'Вопрос',
    challengeActive: 'КОНКУРС АКТИВЕН',
    shakePhone: 'ТРЯСИ ТЕЛЕФОН!',
    enableSensor: 'АКТИВИРОВАТЬ СЕНСОР',
    pushTitle: 'ЖМИ КАК МОЖНО БЫСТРЕЕ!',
    pushBtn: 'ЖМИ!',
    pushWarn: 'НАЖИМАЙТЕ ТОЛЬКО ОДНИМ ПАЛЬЦЕМ, ИНАЧЕ СЛОМАЕТЕ ТЕЛЕФОН!',
    aiArtBattle: 'ИИ АРТ-БИТВА',
    aiArtDesc: 'Опишите ваш шедевр и отправьте его на главный экран!',
    imgDesc: 'Что нарисовать?',
    imgTheme: 'Тема:',
    imgPlaceholder: 'Напр.: Космонавт на дискотеке...',
    magic: 'НЕЙРОСЕТЬ РИСУЕТ...',
    create: 'СОЗДАТЬ ШЕДЕВР',
    sent: 'ОТПРАВЛЕНО!',
    sendToScreen: 'ОТПРАВИТЬ НА ЭКРАН',
    believe: 'Верю',
    notBelieve: 'Не верю',
    countdown: 'ПРИГОТОВЬТЕСЬ! СТАРТ ЧЕРЕЗ:',
    leadFormTitle: 'Мероприятие завершено!',
    leadFormDesc: 'Оставьте ваши контакты и отзыв.',
    leadName: 'Ваше имя',
    leadContact: 'Телефон или Email',
    leadBirthday: 'День рождения',
    leadFeedback: 'Ваш отзыв',
    leadSubmit: 'ОТПРАВИТЬ ДАННЫЕ',
    leadSuccess: 'Спасибо! Ваши данные отправлены.',
    leadClose: 'Закрыть',
    days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    questBtnSubmit: 'ОТПРАВИТЬ ОТВЕТ',
    questPhotoBtn: 'ОТКРЫТЬ КАМЕРУ',
    questUploadBtn: 'ВЫБРАТЬ ФАЙЛ',
    questCalcBtn: 'ВКЛЮЧИТЬ КАЛЬКУЛЯТОР'
  },
  en: {
    join: 'Join Game',
    enterDetails: 'Enter event code and your name',
    namePlaceholder: 'Your Name',
    codePlaceholder: 'Code (e.g. LOVE24)',
    go: "LET'S GO!",
    noEvent: 'Event not found or not active',
    poweredBy: 'Powered by Maybeu Live™',
    waiting: 'Waiting for the host...',
    getReady: 'Get ready, {name}! Next round soon.',
    question: 'Question',
    challengeActive: 'CHALLENGE ACTIVE',
    shakePhone: 'SHAKE YOUR PHONE!',
    enableSensor: 'ENABLE SENSOR',
    pushTitle: 'PUSH AS FAST AS YOU CAN!',
    pushBtn: 'PUSH!',
    pushWarn: 'PRESS WITH ONE FINGER ONLY OR YOU WILL BREAK YOUR PHONE!',
    aiArtBattle: 'AI ART BATTLE',
    aiArtDesc: 'Describe your masterpiece and send it to the screen!',
    imgDesc: 'What to draw?',
    imgTheme: 'Theme:',
    imgPlaceholder: 'e.g.: Astronaut at a disco...',
    magic: 'AI IS DRAWING...',
    create: 'CREATE MASTERPIECE',
    sent: 'SENT!',
    sendToScreen: 'SEND TO SCREEN',
    believe: 'Believe',
    notBelieve: 'Don\'t',
    countdown: 'GET READY! START IN:',
    leadFormTitle: 'Event Completed!',
    leadFormDesc: 'Leave your contact info.',
    leadName: 'Your Name',
    leadContact: 'Phone or Email',
    leadBirthday: 'Birthday',
    leadFeedback: 'Feedback',
    leadSubmit: 'SUBMIT DATA',
    leadSuccess: 'Thank you! Data sent.',
    leadClose: 'Close',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    questBtnSubmit: 'SUBMIT ANSWER',
    questPhotoBtn: 'OPEN CAMERA',
    questUploadBtn: 'CHOOSE FILE',
    questCalcBtn: 'OPEN CALCULATOR'
  }
};

const GuestPortal: React.FC<Props> = ({ activeEvent: initialEvent, lang, initialCode = '' }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [name, setName] = useState('');
  const [eventCode, setEventCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [joinedEvent, setJoinedEvent] = useState<LiveEvent | null>(null);
  
  const [pushCount, setPushCount] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isImageSent, setIsImageSent] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState<any>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  const [questInput, setQuestInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Калькулятор
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');

  const [leadName, setLeadName] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadBirthday, setLeadBirthday] = useState('');
  const [leadFeedback, setLeadFeedback] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
     if (isJoined && joinedEvent?.code) {
        return FirebaseService.subscribeToGame(joinedEvent.code, (val) => {
           if (val) {
             setGameState((prev: any) => {
                if (prev?.gameType !== val.gameType) {
                  setPushCount(0);
                  setShakeCount(0);
                  setPermissionGranted(false);
                }
                if (prev?.currentIdx !== val.currentIdx || prev?.questStage !== val.questStage) {
                  setAnswerSubmitted(null);
                  setQuestInput('');
                  setQuestionStartTime(Date.now());
                }
                return val;
             });
           } else {
              setGameState(null);
           }
        });
     }
  }, [isJoined]);

  // ЛОГИКА ТРЯСКИ (SHAKE IT) - ОБНОВЛЕННАЯ
  useEffect(() => {
    if (gameState?.gameType === GameType.SHAKE_IT && permissionGranted && joinedEvent) {
      let lastX = 0, lastY = 0, lastZ = 0;
      let lastUpdate = 0;
      // ПОРОГ ЧУВСТВИТЕЛЬНОСТИ
      // 15 - было слишком чувствительно (считало на столе)
      // 25 - нужно трясти сильнее (отсекает дрожание)
      const SHAKE_THRESHOLD = 25; 
      const MAX_SHAKES = 150; 

      const handleMotion = (e: DeviceMotionEvent) => {
        if (shakeCount >= MAX_SHAKES) return;

        // Используем accelerationIncludingGravity, так как он поддерживается везде
        const current = e.accelerationIncludingGravity;
        if (!current) return;
        
        const curTime = Date.now();
        if ((curTime - lastUpdate) > 100) { // Проверка каждые 100мс
          const diffTime = curTime - lastUpdate;
          lastUpdate = curTime;
          
          // Фильтр "первого кадра": если это первое измерение, просто запоминаем позицию
          if (lastX === 0 && lastY === 0 && lastZ === 0) {
             lastX = current.x!;
             lastY = current.y!;
             lastZ = current.z!;
             return;
          }

          const speed = Math.abs(current.x! + current.y! + current.z! - lastX - lastY - lastZ) / diffTime * 10000;
          
          if (speed > SHAKE_THRESHOLD) {
             setShakeCount(prev => {
               if (prev >= MAX_SHAKES) return prev;
               const newCount = prev + 1;
               if (newCount % 5 === 0 || newCount === MAX_SHAKES) {
                 FirebaseService.updateShakeCount(joinedEvent.code, name, newCount);
               }
               return newCount;
             });
             
             if (window.navigator.vibrate) {
                if (shakeCount + 1 >= MAX_SHAKES) window.navigator.vibrate([200, 100, 200]);
                else window.navigator.vibrate(50);
             }
          }
          lastX = current.x!;
          lastY = current.y!;
          lastZ = current.z!;
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [gameState?.gameType, permissionGranted, joinedEvent, name, shakeCount]);

  const requestShakePermission = () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            setPermissionGranted(true);
          } else {
            alert('Permission denied');
          }
        })
        .catch(console.error);
    } else {
      setPermissionGranted(true);
    }
  };

  const handleJoin = async () => {
    setError('');
    let targetEvent = await FirebaseService.findEventByCode(eventCode.toUpperCase());
    
    if (!targetEvent || (targetEvent.status !== 'LIVE' && targetEvent.status !== 'COMPLETED')) {
      setError(t.noEvent);
      return;
    }
    if (!name.trim()) return;

    setJoinedEvent(targetEvent);
    setLeadName(name); 
    setIsJoined(true);
    FirebaseService.joinEvent(targetEvent.code, name);
  };

  const submitQuestAnswer = (value: any, isImage: boolean = false) => {
    if (answerSubmitted !== null || !joinedEvent || !gameState) return;
    const timeTaken = Date.now() - questionStartTime;
    setAnswerSubmitted(value);
    
    const isStandardQuiz = gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT;
    const key = isStandardQuiz ? gameState.currentIdx : gameState.questStage;
    
    FirebaseService.sendAnswer(joinedEvent.code, isStandardQuiz ? 'quiz' : 'quest', key, {
       value,
       timeTaken,
       name,
       isImage,
       timestamp: Date.now()
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        submitQuestAnswer(base64, true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePush = () => {
    if (pushCount >= 50 || gameState?.isCountdown || !joinedEvent) return;
    const newCount = pushCount + 1;
    setPushCount(newCount);
    FirebaseService.updateRaceProgress(joinedEvent.code, name, newCount);
    if (window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const handleCalcPress = (btn: string) => {
    if (btn === 'C') {
      setCalcExpression('');
    } else if (btn === 'DEL') {
      setCalcExpression(prev => prev.slice(0, -1));
    } else if (btn === '=') {
      try {
        // eslint-disable-next-line no-eval
        const res = eval(calcExpression).toString();
        setQuestInput(res); 
        setIsCalculatorOpen(false); 
        setCalcExpression('');
      } catch {
        setCalcExpression('Error');
        setTimeout(() => setCalcExpression(''), 1000);
      }
    } else {
      setCalcExpression(prev => prev + btn);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const url = await generateAiImage(imagePrompt);
      if (url) {
        setGeneratedImageUrl(url);
        setIsGeneratingImage(false);
      }
    } catch (e) {
      setIsGeneratingImage(false);
    }
  };

  const handleSendToScreen = () => {
    if (!generatedImageUrl || !joinedEvent) return;
    FirebaseService.sendImage(joinedEvent.code, { 
      url: generatedImageUrl, 
      user: name, 
      timestamp: Date.now() 
    });
    setIsImageSent(true);
  };

  const handleLeadSubmit = () => {
    const newLead: GuestRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: leadName || name,
      phone: leadContact.includes('@') ? '' : leadContact,
      email: leadContact.includes('@') ? leadContact : '',
      birthday: leadBirthday,
      notes: leadFeedback ? `Отзыв: ${leadFeedback}` : '',
      lastEventDate: new Date().toISOString().split('T')[0]
    };
    FirebaseService.sendLead(newLead);
    setLeadSubmitted(true);
  };

  if (!isJoined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-indigo-950">
        <div className="max-w-sm w-full space-y-8 animate-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <PhoneIcon size={40} className="text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{t.join}</h1>
            <p className="text-indigo-200">{t.enterDetails}</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t.codePlaceholder}
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              readOnly={!!initialCode}
              className={`w-full bg-indigo-900/50 border-2 border-indigo-400/30 rounded-2xl px-6 py-4 text-white text-xl font-mono font-bold placeholder:text-indigo-300 focus:border-white focus:outline-none transition-all uppercase ${initialCode ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
            <input 
              type="text" 
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-indigo-900/50 border-2 border-indigo-400/30 rounded-2xl px-6 py-4 text-white text-xl font-bold placeholder:text-indigo-300 focus:border-white focus:outline-none transition-all"
            />
            {error && <div className="text-rose-400 text-sm font-bold flex items-center gap-2 animate-bounce"><AlertIcon size={16}/> {error}</div>}
            <button 
              onClick={handleJoin}
              disabled={!name.trim() || !eventCode.trim()}
              className="w-full bg-white text-indigo-900 py-5 rounded-2xl text-2xl font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all"
            >
              {t.go}
            </button>
          </div>
          <div className="text-center text-xs text-indigo-400 font-bold tracking-widest uppercase">{t.poweredBy}</div>
        </div>
      </div>
    );
  }

  if (gameState?.isCollectingLeads) {
     return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-8 duration-500 my-4">
           {!leadSubmitted ? (
             <div className="space-y-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/20">
                   <Users size={32} className="text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{t.leadFormTitle}</h2>
                   <p className="text-slate-400 text-sm mt-1 leading-tight">{t.leadFormDesc}</p>
                </div>
                <div className="space-y-4 text-left">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><UserIcon size={10}/> {t.leadName}</label>
                      <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><PhoneIcon size={10}/> {t.leadContact}</label>
                      <input value={leadContact} onChange={e => setLeadContact(e.target.value)} placeholder="+7... or mail@.." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><CalIcon size={10}/> {t.leadBirthday}</label>
                      <input type="date" value={leadBirthday} onChange={e => setLeadBirthday(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><MsgIcon size={10}/> {t.leadFeedback}</label>
                      <textarea value={leadFeedback} onChange={e => setLeadFeedback(e.target.value)} placeholder="..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500 h-20 resize-none" />
                   </div>
                </div>
                <button 
                  onClick={handleLeadSubmit}
                  className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                   {t.leadSubmit}
                </button>
             </div>
           ) : (
             <div className="py-10 space-y-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                   <CheckIcon size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">{t.leadSuccess}</h2>
                <button 
                  onClick={() => setIsJoined(false)}
                  className="bg-slate-800 px-8 py-3 rounded-xl text-slate-400 font-black uppercase text-xs"
                >
                  {t.leadClose}
                </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (!gameState || !gameState.isActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center space-y-6">
        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl animate-pulse">
           <PlayIcon size={64} className="mx-auto text-indigo-500 mb-4" />
           <h2 className="text-2xl font-black text-white">{t.waiting}</h2>
           <p className="text-slate-400 mt-2">{t.getReady.replace('{name}', name)}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = gameState.questions ? gameState.questions[gameState.currentIdx] : null;

  return (
    <div className="flex-1 flex flex-col p-4 bg-indigo-950 overflow-y-auto">
      {(gameState.gameType === GameType.QUIZ || gameState.gameType === GameType.BELIEVE_NOT) && (
        <div className="flex flex-col space-y-6">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
            <h2 className="text-2xl font-bold text-white leading-tight">
                {currentQuestion?.question || '...'}
            </h2>
          </div>
          <div className={`grid gap-4 ${gameState.gameType === GameType.BELIEVE_NOT ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {currentQuestion?.options?.map((opt: string, i: number) => {
              const isRevealed = gameState.isAnswerRevealed;
              const isCorrect = i === currentQuestion.correctAnswerIndex;
              const isSelected = answerSubmitted === i;
              
              let btnClass = 'bg-white text-indigo-900 border-indigo-200';
              
              if (isRevealed) {
                 if (isCorrect) btnClass = 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105';
                 else if (isSelected) btnClass = 'bg-rose-500 border-rose-700 text-white opacity-50';
                 else btnClass = 'bg-slate-800 border-slate-700 text-slate-500 opacity-50';
              } else if (isSelected) {
                 btnClass = 'bg-amber-400 border-amber-600 text-amber-900';
              } else if (answerSubmitted !== null) {
                 btnClass = 'bg-white/5 border-white/10 text-white/30';
              } else if (i === 0 && gameState.gameType === GameType.BELIEVE_NOT) {
                 btnClass = 'bg-emerald-500 border-emerald-700 text-white';
              } else if (i === 1 && gameState.gameType === GameType.BELIEVE_NOT) {
                 btnClass = 'bg-rose-500 border-rose-700 text-white';
              }

              return (
                <button 
                  key={i}
                  disabled={answerSubmitted !== null || isRevealed}
                  onClick={() => submitQuestAnswer(i)}
                  className={`w-full py-8 px-6 rounded-3xl text-center text-xl font-black transition-all transform active:scale-95 border-b-8 ${btnClass}`}
                >
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState.gameType === GameType.QUEST && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
           {answerSubmitted !== null ? (
             <div className="text-center animate-in zoom-in">
                <CheckIcon size={100} className="text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-black text-white mt-4 uppercase">{t.sent}</h2>
             </div>
           ) : (
             <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-4">
                {gameState.questStage === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {t.days.map((day, idx) => (
                      <button 
                        key={day} 
                        onClick={() => submitQuestAnswer(idx)}
                        className="bg-white text-indigo-900 py-6 rounded-2xl font-black text-2xl active:scale-95 transition-all shadow-xl"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
                
                {gameState.questStage === 2 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square bg-white text-indigo-900 rounded-[50px] flex flex-col items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
                  >
                    <Camera size={80} />
                    <span className="font-black text-xl">{t.questPhotoBtn}</span>
                    <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  </button>
                )}

                {gameState.questStage === 3 && (
                   <div className="space-y-4">
                      {/* КНОПКА ОТКРЫТИЯ КАЛЬКУЛЯТОРА */}
                      <button 
                        onClick={() => { setIsCalculatorOpen(true); setCalcExpression(''); }}
                        className="w-full bg-white/10 p-6 rounded-3xl flex items-center justify-center mb-4 active:bg-white/20 transition-all border-2 border-white/20"
                      >
                        <Calculator size={32} className="text-white mr-3" />
                        <span className="text-white font-black text-lg">{t.questCalcBtn}</span>
                      </button>

                      <input 
                        type="number"
                        value={questInput}
                        onChange={e => setQuestInput(e.target.value)}
                        placeholder="???"
                        className="w-full bg-white/5 border-2 border-white/20 rounded-3xl px-8 py-6 text-white text-4xl font-black text-center focus:border-white outline-none"
                      />
                      <button 
                        onClick={() => submitQuestAnswer(questInput)}
                        className="w-full bg-white text-indigo-900 py-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all"
                      >
                        {t.questBtnSubmit}
                      </button>
                   </div>
                )}

                {gameState.questStage === 4 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white text-indigo-900 py-10 rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
                  >
                    <Upload size={80} />
                    <span className="font-black text-xl">{t.questUploadBtn}</span>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                  </button>
                )}
             </div>
           )}
        </div>
      )}

      {gameState.gameType === GameType.PUSH_IT && (
        <div className="h-full flex flex-col items-center justify-center space-y-12">
          {gameState.isCountdown ? (
             <div className="text-center space-y-6 animate-in zoom-in">
                <ClockIcon size={80} className="mx-auto text-indigo-400 animate-pulse" />
                <h2 className="text-2xl font-black text-white uppercase">{t.countdown}</h2>
                <div className="text-8xl font-black text-white">{gameState.countdownValue}</div>
             </div>
          ) : (
            <>
              <div className="text-center">
                 <h2 className="text-3xl font-black text-white italic uppercase mb-2">{t.pushTitle}</h2>
                 <p className="text-rose-500 font-bold text-xs md:text-sm mb-4 animate-pulse px-4">{t.pushWarn}</p>
                 <div className="text-6xl font-black text-blue-400 font-mono">{pushCount}/50</div>
              </div>
              <button 
                onClick={handlePush}
                disabled={pushCount >= 50}
                className={`w-64 h-64 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all select-none border-8 border-white/20 ${pushCount >= 50 ? 'opacity-50' : ''}`}
              >
                <div className="text-white text-4xl font-black">{t.pushBtn}</div>
              </button>
            </>
          )}
        </div>
      )}

      {gameState.gameType === GameType.SHAKE_IT && (
        <div className="h-full flex flex-col items-center justify-center space-y-12">
          <div className="text-center space-y-4">
             <h2 className="text-5xl font-black text-white italic">{t.shakePhone}</h2>
             <div className="text-6xl font-black text-rose-400 font-mono">{shakeCount}/150</div>
          </div>
          
          {!permissionGranted ? (
            <button 
              onClick={requestShakePermission}
              className="w-48 h-48 bg-rose-600 rounded-full flex flex-col items-center justify-center shadow-2xl animate-pulse active:scale-95 transition-all border-4 border-rose-400"
            >
              <PhoneIcon size={48} className="text-white mb-2" />
              <span className="text-white font-black text-xs uppercase max-w-[100px] text-center">{t.enableSensor}</span>
            </button>
          ) : (
            <div className={`w-48 h-48 bg-rose-500 rounded-full flex items-center justify-center shadow-2xl animate-[spin_0.5s_linear_infinite] border-4 border-white/20 ${shakeCount >= 150 ? 'opacity-50 grayscale' : ''}`}>
              <PhoneIcon size={64} className="text-white" />
            </div>
          )}
        </div>
      )}

      {gameState.gameType === GameType.IMAGE_GEN && (
        <div className="flex flex-col space-y-6">
          <div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-3xl">
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2 italic"><ImgIcon className="text-amber-400" /> {t.aiArtBattle}</h2>
            <div className="text-amber-400 font-black text-sm uppercase mb-1">{t.imgTheme} {gameState.artTheme}</div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <textarea 
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={t.imgPlaceholder}
              className="w-full bg-transparent text-white text-lg font-bold placeholder:text-white/20 border-none outline-none resize-none h-20"
            />
          </div>

          <button 
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
            className="w-full bg-white text-indigo-950 py-4 rounded-2xl text-xl font-black shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isGeneratingImage ? <LoaderIcon className="animate-spin" size={24} /> : <SparkIcon className="text-amber-500" size={24} />}
            {isGeneratingImage ? t.magic : t.create}
          </button>

          {generatedImageUrl && !isGeneratingImage && (
            <div className="space-y-4 mt-2 animate-in zoom-in">
              <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                {isImageSent && <div className="absolute inset-0 bg-emerald-600/60 flex items-center justify-center text-white font-black text-2xl uppercase backdrop-blur-sm">
                  {t.sent}
                </div>}
              </div>
              {!isImageSent && (
                <button 
                  onClick={handleSendToScreen} 
                  className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-2xl font-black shadow-xl transition-all"
                >
                  {t.sendToScreen}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО КАЛЬКУЛЯТОРА */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} /> Калькулятор</h3>
                 <button onClick={() => setIsCalculatorOpen(false)} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              <div className="bg-black/50 p-4 rounded-xl mb-4 text-right">
                 <div className="text-3xl font-mono font-bold text-white h-10">{calcExpression || '0'}</div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                 {['7','8','9','/'].map(b => (
                    <button key={b} onClick={() => handleCalcPress(b)} className="aspect-square bg-slate-800 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">{b}</button>
                 ))}
                 {['4','5','6','*'].map(b => (
                    <button key={b} onClick={() => handleCalcPress(b)} className="aspect-square bg-slate-800 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">{b}</button>
                 ))}
                 {['1','2','3','-'].map(b => (
                    <button key={b} onClick={() => handleCalcPress(b)} className="aspect-square bg-slate-800 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">{b}</button>
                 ))}
                 <button onClick={() => handleCalcPress('C')} className="aspect-square bg-rose-600 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">C</button>
                 <button onClick={() => handleCalcPress('0')} className="aspect-square bg-slate-800 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">0</button>
                 <button onClick={() => handleCalcPress('=')} className="aspect-square bg-emerald-600 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">=</button>
                 <button onClick={() => handleCalcPress('+')} className="aspect-square bg-slate-800 rounded-xl text-xl font-bold text-white active:scale-95 transition-all">+</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestPortal;
