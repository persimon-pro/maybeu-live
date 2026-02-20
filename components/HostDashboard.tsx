import { FirebaseService } from '../services/firebase';
import { auth } from '../services/firebase';
import React, { useState, useEffect } from 'react';
import { LiveEvent, GameType, Language, TimingItem } from '../types';
import { Plus, Users, Calendar, Gamepad2, Database, ChevronRight, PlayCircle, X, Trash2, Edit2, MapPin, Clock, Briefcase, Info, Save, ListTodo, GripVertical, MonitorOff, MonitorCheck, AlertTriangle, Check, FileText, Download } from 'lucide-react';
import QuizControl from './QuizControl';
import CRMView from './CRMView';

// Импорты для создания DOCX
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface Props {
  activeEvent: LiveEvent | null;
  setActiveEvent: (event: LiveEvent | null) => void;
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    upcoming: 'События',
    create: 'Создать',
    manage: 'Игры',
    clients: 'База клиентов',
    infoTab: 'Планировщик',
    timingTab: 'Сценарий',
    eventsTab: 'Список',
    live: 'В ЭФИРЕ',
    soon: 'ОЖИДАНИЕ',
    guests: 'участников',
    code: 'Код',
    createTitle: 'Новое событие',
    editTitle: 'Редактировать',
    nameLabel: 'Название',
    dateLabel: 'Дата проведения',
    typeLabel: 'Тип',
    codeLabel: 'Код доступа',
    save: 'Сохранить',
    cancel: 'Отмена',
    goLive: 'ВЫЙТИ В ЭФИР',
    stopLive: 'ЗАВЕРШИТЬ ЭФИР',
    addStep: 'Добавить пункт',
    timePlaceholder: '18:00',
    endPlaceholder: '19:00',
    textPlaceholder: 'Начало велком-зоны',
    screenStatus: 'Проектор',
    screenReady: 'ПОДКЛЮЧЕН',
    screenOffline: 'ОФФЛАЙН',
    downloadDocx: 'Скачать DOCX',
    details: {
      location: 'Локация',
      notes: 'Заметки мероприятия',
      contacts: 'Важные контакты'
    }
  },
  en: {
    upcoming: 'Events',
    create: 'Create',
    manage: 'Games',
    clients: 'Customers',
    infoTab: 'Planner',
    timingTab: 'Timeline',
    eventsTab: 'List',
    live: 'LIVE',
    soon: 'PENDING',
    guests: 'guests',
    code: 'Code',
    createTitle: 'New Event',
    editTitle: 'Edit Event',
    nameLabel: 'Name',
    dateLabel: 'Event Date',
    typeLabel: 'Type',
    codeLabel: 'Access Code',
    save: 'Save',
    cancel: 'Cancel',
    goLive: 'GO LIVE',
    stopLive: 'STOP LIVE',
    addStep: 'Add Step',
    timePlaceholder: '6:00 PM',
    endPlaceholder: '7:00 PM',
    textPlaceholder: 'Welcome start',
    screenStatus: 'Screen',
    screenReady: 'CONNECTED',
    screenOffline: 'OFFLINE',
    downloadDocx: 'Download DOCX',
    details: {
      location: 'Location',
      notes: 'Event Notes',
      contacts: 'Key Contacts'
    }
  }
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ВРЕМЕНИ ---
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (minutes: number): string => {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  // Обработка перехода через полночь (24:00 -> 00:00)
  h = h % 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const HostDashboard: React.FC<Props> = ({ activeEvent, setActiveEvent, lang }) => {
  const [tab, setTab] = useState<'EVENTS' | 'GAMES' | 'CRM' | 'INFO' | 'TIMING'>('EVENTS');
  const [events, setEvents] = useState<LiveEvent[]>([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [formData, setFormData] = useState<Partial<LiveEvent>>({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] });
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isScreenConnected, setIsScreenConnected] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // 1. Обязательно ждем, пока activeEvent не появится
    if (!activeEvent?.code) return; 
    
    // 2. Передаем activeEvent.code ПЕРВЫМ аргументом
    const unsubScreen = FirebaseService.subscribeToScreenStatus(activeEvent.code, (ts) => {
        if (ts && Date.now() - ts < 8000) {
            setIsScreenConnected(true);
        } else {
            setIsScreenConnected(false);
        }
    });
    return () => unsubScreen();
  }, [activeEvent?.code]);

  useEffect(() => {
    if (activeEvent) {
       FirebaseService.saveEventToDB(activeEvent);
    }
  }, [activeEvent]); 

  useEffect(() => {
    const unsubScreen = FirebaseService.subscribeToScreenStatus((ts) => {
        if (ts && Date.now() - ts < 8000) {
            setIsScreenConnected(true);
        } else {
            setIsScreenConnected(false);
        }
    });
    return () => unsubScreen();
  }, []);

  const handleSaveEvent = () => {
    if (editingEvent) {
      const updated = { ...editingEvent, ...formData } as LiveEvent;
      FirebaseService.saveEventToDB(updated);
      
      if (activeEvent?.id === editingEvent.id) {
        setActiveEvent(updated);
      }
    } else {
      const event: LiveEvent = {
        id: Math.random().toString(36).substr(2, 9),
        ownerId: auth.currentUser?.uid,
        name: formData.name || 'Untitled',
        date: formData.date || new Date().toISOString().split('T')[0],
        code: formData.code || Math.random().toString(36).substr(2, 6).toUpperCase(),
        type: formData.type as any || 'PARTY',
        status: 'UPCOMING',
        timetable: [],
        questions: []
      };
      FirebaseService.saveEventToDB(event);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteEvent = (id: string) => {
    if (!id) return;
    FirebaseService.deleteEventFromDB(id);
    if (activeEvent?.id === id) {
      setActiveEvent(null);
    }
    setConfirmDeleteEventId(null);
  };

  const handleToggleLive = () => {
    if (!activeEvent) return;
    const isStopping = activeEvent.status === 'LIVE';
    const newStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED' = isStopping ? 'COMPLETED' : 'LIVE';
    
    const updated: LiveEvent = { ...activeEvent, status: newStatus };
    setActiveEvent(updated);
    
    // ДОБАВЛЯЕМ updated.code
    FirebaseService.syncEvent(updated.code, updated); 

    if (isStopping) {
      // ДОБАВЛЯЕМ updated.code
      FirebaseService.syncGameState(updated.code, {
        isActive: false,
        isCollectingLeads: true,
        timestamp: Date.now()
      });
    }
  };

  const updateDetail = (field: keyof LiveEvent, value: any) => {
    if (!activeEvent) return;
    const updated = { ...activeEvent, [field]: value };
    setActiveEvent(updated as LiveEvent);
  };

  // --- УЛУЧШЕННАЯ ЛОГИКА КАСКАДА ВРЕМЕНИ ---
  const cascadeTimes = (list: TimingItem[]) => {
    const newList = list.map(item => ({ ...item })); // Глубокая копия для безопасности

    for (let i = 0; i < newList.length; i++) {
      const current = newList[i];
      
      // 1. Вычисляем длительность текущего элемента (если время есть)
      // Если это новый элемент или время не задано, ставим дефолт 30 минут
      const startMins = timeToMinutes(current.time);
      const endMins = timeToMinutes(current.endTime || current.time);
      
      let duration = endMins - startMins;
      if (duration <= 0) duration = 30; // Дефолтная длительность 30 мин

      // 2. Если это не первый элемент, его начало должно совпадать с концом предыдущего
      if (i > 0) {
        const prevEnd = newList[i - 1].endTime;
        if (prevEnd) {
          newList[i].time = prevEnd;
        }
      }

      // 3. Пересчитываем конец текущего элемента: Новое Начало + Сохраненная Длительность
      const newStartMins = timeToMinutes(newList[i].time);
      newList[i].endTime = minutesToTime(newStartMins + duration);
    }

    return newList;
  };

  const addTimingStep = () => {
    if (!activeEvent) return;
    const lastStep = activeEvent.timetable?.[activeEvent.timetable.length - 1];
    
    // Если есть последний шаг, берем его конец как начало нового.
    // Если нет, ставим 18:00
    const newStartTime = lastStep?.endTime || '18:00';
    
    // Вычисляем конец для нового шага (+30 минут)
    const newStartMins = timeToMinutes(newStartTime);
    const newEndTime = minutesToTime(newStartMins + 30);

    const newItem: TimingItem = { 
      id: Date.now().toString(), 
      time: newStartTime, 
      endTime: newEndTime,
      text: '' 
    };
    
    // cascadeTimes не нужен здесь, так как мы добавили в конец, но для надежности можно вызвать
    const newList = [...(activeEvent.timetable || []), newItem];
    updateDetail('timetable', newList);
  };

  const updateTimingStep = (id: string, field: 'time' | 'endTime' | 'text', value: string) => {
    if (!activeEvent) return;
    let steps = [...(activeEvent.timetable || [])];
    const idx = steps.findIndex(item => item.id === id);
    if (idx === -1) return;

    // Обновляем значение
    steps[idx] = { ...steps[idx], [field]: value };
    
    // Пересчитываем всю цепочку, чтобы сохранить длительности и целостность
    steps = cascadeTimes(steps);
    updateDetail('timetable', steps);
  };

  const removeTimingStep = (id: string) => {
    if (!activeEvent) return;
    let steps = (activeEvent.timetable || []).filter(i => i.id !== id);
    steps = cascadeTimes(steps);
    updateDetail('timetable', steps);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    let list = [...(activeEvent?.timetable || [])];
    const item = list[draggedItemIndex];
    list.splice(draggedItemIndex, 1);
    list.splice(index, 0, item);
    
    // При перетаскивании пересчитываем времена, сохраняя длительности блоков
    list = cascadeTimes(list);

    setDraggedItemIndex(index);
    updateDetail('timetable', list);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // --- ЛОГИКА ГЕНЕРАЦИИ DOCX (ЧИСТАЯ ВЕРСИЯ) ---
  const handleDownloadDocx = async () => {
    if (!activeEvent) return;

    const tableRows = (activeEvent.timetable || []).map(step => 
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: step.time, bold: true, size: 24, color: "000000" }),
                  new TextRun({ text: step.endTime ? ` - ${step.endTime}` : '', size: 24, color: "000000" })
                ]
              })
            ],
            verticalAlign: "center",
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: step.text, size: 24, color: "000000" })]
              })
            ],
            verticalAlign: "center",
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
        ],
      })
    );

    // Шапка таблицы
    tableRows.unshift(
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Время", bold: true, size: 28, color: "000000" })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: "E0E0E0" }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Действие / Описание", bold: true, size: 28, color: "000000" })] })],
            width: { size: 80, type: WidthType.PERCENTAGE },
            shading: { fill: "E0E0E0" }
          }),
        ]
      })
    );

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: activeEvent.name || "Сценарий мероприятия", bold: true, size: 48, color: "000000" })],
            alignment: "center",
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Дата: ${activeEvent.date}`, bold: true, size: 28, color: "000000" }),
            ],
            spacing: { after: 400 }
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            }
          }),
          new Paragraph({ text: "", spacing: { before: 400 } }),
          // Только заметки
          ...(activeEvent.notes ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Заметки / Важная информация:", bold: true, size: 28, color: "000000" }),
                new TextRun({ text: `\n${activeEvent.notes}`, size: 24, color: "000000" })
              ]
            })
          ] : [])
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Сценарий_${(activeEvent.name || 'Event').replace(/\s+/g, '_')}.docx`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex border-b border-slate-800 bg-slate-900/30 shrink-0 overflow-x-auto">
        <button onClick={() => setTab('EVENTS')} className={`flex-1 min-w-[60px] md:min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${tab === 'EVENTS' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
          <Calendar size={18} className="inline md:mr-2" /> <span className="hidden md:inline">{t.eventsTab}</span>
        </button>
        <button onClick={() => setTab('INFO')} disabled={!activeEvent} className={`flex-1 min-w-[60px] md:min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors disabled:opacity-30 ${tab === 'INFO' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
          <Info size={18} className="inline md:mr-2" /> <span className="hidden md:inline">{t.infoTab}</span>
        </button>
        <button onClick={() => setTab('TIMING')} disabled={!activeEvent} className={`flex-1 min-w-[60px] md:min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors disabled:opacity-30 ${tab === 'TIMING' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
          <ListTodo size={18} className="inline md:mr-2" /> <span className="hidden md:inline">{t.timingTab}</span>
        </button>
        <button onClick={() => setTab('GAMES')} disabled={!activeEvent} className={`flex-1 min-w-[60px] md:min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors disabled:opacity-30 ${tab === 'GAMES' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
          <Gamepad2 size={18} className="inline md:mr-2" /> <span className="hidden md:inline">{t.manage}</span>
        </button>
        <button onClick={() => setTab('CRM')} className={`flex-1 min-w-[60px] md:min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${tab === 'CRM' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
          <Database size={18} className="inline md:mr-2" /> <span className="hidden md:inline">{t.clients}</span>
        </button>
      </div>

      {/* Sync Status Bar */}
      <div className="bg-slate-900/50 px-6 py-2 border-b border-slate-800 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               {isScreenConnected ? <MonitorCheck size={14} className="text-emerald-500" /> : <MonitorOff size={14} className="text-slate-600" />}
               <span className={`text-[9px] font-black uppercase tracking-widest ${isScreenConnected ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {t.screenStatus}: {isScreenConnected ? t.screenReady : t.screenOffline}
               </span>
            </div>
         </div>
         {activeEvent && (
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
               ID: {activeEvent.id}
            </div>
         )}
      </div>

      {/* TABS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {tab === 'EVENTS' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-3xl font-black text-white italic tracking-tighter">{t.upcoming}</h2>
              <button 
                type="button"
                onClick={() => { setEditingEvent(null); setFormData({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} 
                className="bg-white text-indigo-900 w-12 h-12 md:w-auto md:px-6 md:py-2.5 rounded-xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={24} /> <span className="hidden md:inline">{t.create}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {events.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl opacity-30 italic font-bold uppercase tracking-widest">
                  Нет запланированных событий
                </div>
              ) : events.map(event => (
                <div 
                  key={event.id || Math.random()} 
                  onClick={() => setActiveEvent(event)}
                  className={`bg-slate-900 border-2 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden ${activeEvent?.id === event.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${event.status === 'LIVE' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                        {event.status === 'LIVE' ? t.live : t.soon}
                      </span>
                      <span className="text-slate-500 font-bold text-sm">{event.date}</span>
                    </div>
                    <div className="flex gap-2 relative z-30" onClick={e => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setFormData(event); setIsModalOpen(true); }} 
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400 transition-all shadow-md active:scale-90"
                        title={t.editTitle}
                      >
                        <Edit2 size={20} />
                      </button>
                      
                      {confirmDeleteEventId === event.id ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} 
                            className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-all shadow-md active:scale-90"
                          >
                            <Check size={20} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteEventId(null); }} 
                            className="p-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all shadow-md active:scale-90"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteEventId(event.id); }} 
                          className="p-3 bg-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all shadow-md active:scale-90"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-black text-white">{event.name || 'Без названия'}</h3>
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">{t.code}: <span className="text-indigo-400 font-mono">{event.code}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'INFO' && activeEvent && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4">
             <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[40px] border border-slate-800">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                      <Info className="text-white" size={32} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white italic">{activeEvent.name || 'Без названия'}</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">{activeEvent.code} — {activeEvent.date}</p>
                   </div>
                </div>
                <button 
                  onClick={handleToggleLive}
                  className={`px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 ${activeEvent.status === 'LIVE' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  {activeEvent.status === 'LIVE' ? t.stopLive : t.goLive}
                </button>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                   <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 group focus-within:border-indigo-500 transition-all">
                      <label className="text-xs font-black text-indigo-500 uppercase flex items-center gap-2 mb-3"><MapPin size={14}/> {t.details.location}</label>
                      <input 
                        className="w-full bg-transparent text-white text-lg font-bold border-none outline-none" 
                        value={activeEvent.location || ''} 
                        onChange={e => updateDetail('location', e.target.value)}
                        placeholder="Адрес или название зала..."
                      />
                   </div>
                   <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 h-64 flex flex-col">
                      <label className="text-xs font-black text-indigo-500 uppercase flex items-center gap-2 mb-3"><Users size={14}/> {t.details.contacts}</label>
                      <textarea 
                        className="w-full flex-1 bg-transparent text-white font-medium border-none outline-none resize-none" 
                        value={activeEvent.contacts || ''} 
                        onChange={e => updateDetail('contacts', e.target.value)}
                        placeholder="Координатор: +7..."
                      />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 h-full flex flex-col min-h-[300px]">
                      <label className="text-xs font-black text-indigo-500 uppercase flex items-center gap-2 mb-3"><Clock size={14}/> {t.details.notes}</label>
                      <textarea 
                        className="w-full flex-1 bg-transparent text-white font-medium border-none outline-none resize-none" 
                        value={activeEvent.notes || ''} 
                        onChange={e => updateDetail('notes', e.target.value)}
                        placeholder="Заметки по мероприятию..."
                      />
                   </div>
                </div>
             </div>
          </div>
        )}

        {tab === 'TIMING' && activeEvent && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white italic">{t.timingTab}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadDocx}
                    className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-700 transition-colors"
                  >
                    <Download size={16} /> {t.downloadDocx}
                  </button>
                  <button onClick={addTimingStep} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                    <Plus size={16} /> {t.addStep}
                  </button>
                </div>
             </div>

             <div className="space-y-3">
                {(activeEvent.timetable || []).length === 0 && (
                  <p className="text-center text-slate-600 py-10 italic border-2 border-dashed border-slate-800 rounded-3xl">Добавьте первый пункт программы...</p>
                )}
                {(activeEvent.timetable || []).map((step, idx) => (
                   <div 
                      key={step.id} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onDragEnd={onDragEnd}
                      className={`flex gap-3 items-center group bg-slate-900/40 p-3 rounded-2xl border transition-all cursor-move ${draggedItemIndex === idx ? 'opacity-50 border-indigo-500 scale-95' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="text-slate-700 group-hover:text-slate-500">
                        <GripVertical size={20} />
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-3 flex-1">
                        <div className="flex gap-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block ml-1">Start</span>
                            <input 
                              value={step.time} 
                              onChange={e => updateTimingStep(step.id, 'time', e.target.value)}
                              placeholder={t.timePlaceholder}
                              className="w-20 md:w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs font-black text-indigo-400 uppercase outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block ml-1">End</span>
                            <input 
                              value={step.endTime || ''} 
                              onChange={e => updateTimingStep(step.id, 'endTime', e.target.value)}
                              placeholder={t.endPlaceholder}
                              className="w-20 md:w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs font-black text-rose-400 uppercase outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block ml-1">Activity</span>
                           <input 
                            value={step.text} 
                            onChange={e => updateTimingStep(step.id, 'text', e.target.value)}
                            placeholder={t.textPlaceholder}
                            className="w-full bg-slate-950/30 border border-slate-800 rounded-lg px-3 py-2 font-bold text-white text-sm outline-none focus:border-slate-600"
                          />
                        </div>
                      </div>

                      <button onClick={() => removeTimingStep(step.id)} className="text-slate-700 hover:text-rose-500 transition-colors p-2 bg-slate-950/50 rounded-xl">
                        <Trash2 size={16} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'GAMES' && activeEvent && <QuizControl activeEvent={activeEvent} lang={lang} />}
        {tab === 'CRM' && <CRMView lang={lang} />}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-white italic mb-6">{editingEvent ? t.editTitle : t.createTitle}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1">{t.nameLabel}</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none font-bold text-white" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1">{t.dateLabel}</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none font-bold text-white" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1">{t.codeLabel}</label>
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none font-mono font-bold text-indigo-400" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-black uppercase text-xs text-white">{t.cancel}</button>
                <button onClick={handleSaveEvent} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black uppercase text-xs shadow-xl text-white">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
