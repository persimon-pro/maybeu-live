
import React, { useState, useEffect } from 'react';
import { LiveEvent, GameType, Language, TimingItem } from '../types';
import { Plus, Users, Calendar, Gamepad2, Database, ChevronRight, PlayCircle, X, Trash2, Edit2, MapPin, Clock, Briefcase, Info, Save, ListTodo, GripVertical, MonitorOff, MonitorCheck, AlertTriangle, Check } from 'lucide-react';
import QuizControl from './QuizControl';
import CRMView from './CRMView';

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
    details: {
      location: 'Location',
      notes: 'Event Notes',
      contacts: 'Key Contacts'
    }
  }
};

const HostDashboard: React.FC<Props> = ({ activeEvent, setActiveEvent, lang }) => {
  const [tab, setTab] = useState<'EVENTS' | 'GAMES' | 'CRM' | 'INFO' | 'TIMING'>('EVENTS');
  const [events, setEvents] = useState<LiveEvent[]>(() => {
    const saved = localStorage.getItem('mc_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [formData, setFormData] = useState<Partial<LiveEvent>>({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] });
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isScreenConnected, setIsScreenConnected] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('mc_events', JSON.stringify(events));
  }, [events]);

  // Sync monitoring
  useEffect(() => {
    const channel = new BroadcastChannel('maybeu_sync');
    let lastPulse = 0;
    
    channel.onmessage = (msg) => {
      if (msg.data.type === 'SCREEN_ALIVE') {
        lastPulse = msg.data.timestamp;
        setIsScreenConnected(true);
      }
    };

    const checkStatus = setInterval(() => {
      if (Date.now() - lastPulse > 2000) {
        setIsScreenConnected(false);
      }
    }, 1000);

    return () => {
      clearInterval(checkStatus);
      channel.close();
    };
  }, []);

  useEffect(() => {
    const checkGuests = () => {
      const counts: Record<string, number> = {};
      events.forEach(ev => {
        const reg = localStorage.getItem(`guest_registry_${ev.code}`);
        counts[ev.code] = reg ? JSON.parse(reg).length : 0;
      });
      setGuestCounts(counts);
    };
    checkGuests();
    const interval = setInterval(checkGuests, 2000);
    return () => clearInterval(interval);
  }, [events]);

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as LiveEvent : e));
      if (activeEvent?.id === editingEvent.id) {
        const newActive = { ...activeEvent, ...formData } as LiveEvent;
        setActiveEvent(newActive);
        localStorage.setItem('active_event', JSON.stringify(newActive));
      }
    } else {
      const event: LiveEvent = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Untitled',
        date: formData.date || new Date().toISOString().split('T')[0],
        code: formData.code || Math.random().toString(36).substr(2, 6).toUpperCase(),
        type: formData.type as any || 'PARTY',
        status: 'UPCOMING',
        timetable: []
      };
      setEvents(prev => [event, ...prev]);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (activeEvent?.id === id) {
      setActiveEvent(null);
      localStorage.removeItem('active_event');
    }
    setConfirmDeleteEventId(null);
  };

  const handleToggleLive = () => {
    if (!activeEvent) return;
    const isStopping = activeEvent.status === 'LIVE';
    const newStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED' = isStopping ? 'COMPLETED' : 'LIVE';
    const updated: LiveEvent = { ...activeEvent, status: newStatus };
    setActiveEvent(updated);
    setEvents(prev => prev.map(e => e.id === activeEvent.id ? updated : e));
    localStorage.setItem('active_event', JSON.stringify(updated));

    if (isStopping) {
      const currentGs = JSON.parse(localStorage.getItem('game_state') || '{}');
      localStorage.setItem('game_state', JSON.stringify({
        ...currentGs,
        isCollectingLeads: true,
        timestamp: Date.now()
      }));
    }
  };

  const updateDetail = (field: keyof LiveEvent, value: any) => {
    if (!activeEvent) return;
    const updated = { ...activeEvent, [field]: value };
    setActiveEvent(updated as LiveEvent);
    setEvents(prev => prev.map(e => e.id === activeEvent.id ? (updated as LiveEvent) : e));
    localStorage.setItem('active_event', JSON.stringify(updated));
  };

  const cascadeTimes = (list: TimingItem[]) => {
    const newList = [...list];
    for (let i = 0; i < newList.length - 1; i++) {
      if (newList[i].endTime) {
        newList[i+1].time = newList[i].endTime as string;
      }
    }
    return newList;
  };

  const addTimingStep = () => {
    if (!activeEvent) return;
    const lastStep = activeEvent.timetable?.[activeEvent.timetable.length - 1];
    const newItem: TimingItem = { 
      id: Date.now().toString(), 
      time: lastStep?.endTime || '', 
      endTime: '',
      text: '' 
    };
    updateDetail('timetable', [...(activeEvent.timetable || []), newItem]);
  };

  const updateTimingStep = (id: string, field: 'time' | 'endTime' | 'text', value: string) => {
    if (!activeEvent) return;
    let steps = [...(activeEvent.timetable || [])];
    const idx = steps.findIndex(item => item.id === id);
    if (idx === -1) return;

    steps[idx] = { ...steps[idx], [field]: value };
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
    list = cascadeTimes(list);

    setDraggedItemIndex(index);
    updateDetail('timetable', list);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
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
                  key={event.id}
                  onClick={() => { setActiveEvent(event); localStorage.setItem('active_event', JSON.stringify(event)); }}
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
                      <h3 className="text-2xl font-black text-white">{event.name}</h3>
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">{t.code}: <span className="text-indigo-400 font-mono">{event.code}</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-950 px-4 py-2 rounded-xl">
                      <Users size={16} className="text-indigo-500" /> {guestCounts[event.code] || 0} {t.guests}
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
                      <h2 className="text-3xl font-black text-white italic">{activeEvent.name}</h2>
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
                <button onClick={addTimingStep} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                  <Plus size={16} /> {t.addStep}
                </button>
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
