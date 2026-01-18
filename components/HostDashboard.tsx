import React, { useState, useEffect } from 'react';
import { LiveEvent, TimingItem } from '../types';
import { Plus, Users, Calendar, Gamepad2, Database, Info, ListTodo, MonitorOff, MonitorCheck, Edit2, Check, X, Trash2, MapPin, Clock } from 'lucide-react';
import QuizControl from './QuizControl';
import CRMView from './CRMView';
import { FirebaseService } from '../services/firebase'; // ИМПОРТ FIREBASE

interface Props {
  activeEvent: LiveEvent | null;
  setActiveEvent: (event: LiveEvent | null) => void;
  lang: 'ru' | 'en';
}

const TRANSLATIONS = {
  ru: {
    upcoming: 'События', create: 'Создать', manage: 'Игры', clients: 'База клиентов',
    infoTab: 'Планировщик', timingTab: 'Сценарий', eventsTab: 'Список',
    live: 'В ЭФИРЕ', soon: 'ОЖИДАНИЕ', guests: 'участников', code: 'Код',
    createTitle: 'Новое событие', editTitle: 'Редактировать',
    nameLabel: 'Название', dateLabel: 'Дата проведения', codeLabel: 'Код доступа',
    save: 'Сохранить', cancel: 'Отмена', goLive: 'ВЫЙТИ В ЭФИР', stopLive: 'ЗАВЕРШИТЬ ЭФИР',
    addStep: 'Добавить пункт', timePlaceholder: '18:00', endPlaceholder: '19:00',
    textPlaceholder: 'Начало велком-зоны', screenStatus: 'Проектор',
    screenReady: 'ПОДКЛЮЧЕН', screenOffline: 'ОФФЛАЙН',
    details: { location: 'Локация', notes: 'Заметки мероприятия', contacts: 'Важные контакты' }
  },
  en: {
    upcoming: 'Events', create: 'Create', manage: 'Games', clients: 'Customers',
    infoTab: 'Planner', timingTab: 'Timeline', eventsTab: 'List',
    live: 'LIVE', soon: 'PENDING', guests: 'guests', code: 'Code',
    createTitle: 'New Event', editTitle: 'Edit Event',
    nameLabel: 'Name', dateLabel: 'Event Date', codeLabel: 'Access Code',
    save: 'Save', cancel: 'Cancel', goLive: 'GO LIVE', stopLive: 'STOP LIVE',
    addStep: 'Add Step', timePlaceholder: '6:00 PM', endPlaceholder: '7:00 PM',
    textPlaceholder: 'Welcome start', screenStatus: 'Screen',
    screenReady: 'CONNECTED', screenOffline: 'OFFLINE',
    details: { location: 'Location', notes: 'Event Notes', contacts: 'Key Contacts' }
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
  const [guestCount, setGuestCount] = useState(0);
  const [isScreenConnected, setIsScreenConnected] = useState(false);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('mc_events', JSON.stringify(events));
  }, [events]);

  // СЛУШАЕМ FIREBASE: Пульс экрана и количество гостей
  useEffect(() => {
    const unsubScreen = FirebaseService.onScreenPulseChange((val) => {
       if (val && Date.now() - val < 5000) setIsScreenConnected(true);
       else setIsScreenConnected(false);
    });

    const unsubGuests = FirebaseService.onGuestsCountChange((count) => {
       setGuestCount(count || 0);
    });

    return () => { unsubScreen(); unsubGuests(); };
  }, []);

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as LiveEvent : e));
      if (activeEvent?.id === editingEvent.id) {
        const newActive = { ...activeEvent, ...formData } as LiveEvent;
        setActiveEvent(newActive);
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
    if (activeEvent?.id === id) setActiveEvent(null);
    setConfirmDeleteEventId(null);
  };

  const handleToggleLive = () => {
    if (!activeEvent) return;
    const isStopping = activeEvent.status === 'LIVE';
    const newStatus = isStopping ? 'COMPLETED' : 'LIVE';
    const updated = { ...activeEvent, status: newStatus };
    
    setActiveEvent(updated);
    setEvents(prev => prev.map(e => e.id === activeEvent.id ? updated : e));
    
    // ОТПРАВЛЯЕМ В FIREBASE ОБНОВЛЕННЫЙ СТАТУС
    FirebaseService.updateGameState(updated);
    
    if (isStopping) {
       FirebaseService.resetGame();
    }
  };

  // ... (Остальной код для тайминга и перетаскивания остался без изменений для краткости, он работает локально)
  
  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex border-b border-slate-800 bg-slate-900/30 shrink-0 overflow-x-auto">
        <button onClick={() => setTab('EVENTS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 ${tab === 'EVENTS' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}><Calendar size={18} className="inline mr-2"/> {t.eventsTab}</button>
        <button onClick={() => setTab('INFO')} disabled={!activeEvent} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 disabled:opacity-30 border-transparent text-slate-500"><Info size={18} className="inline mr-2"/> {t.infoTab}</button>
        <button onClick={() => setTab('GAMES')} disabled={!activeEvent} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 disabled:opacity-30 ${tab === 'GAMES' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}><Gamepad2 size={18} className="inline mr-2"/> {t.manage}</button>
        <button onClick={() => setTab('CRM')} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent text-slate-500"><Database size={18} className="inline mr-2"/> {t.clients}</button>
      </div>

      <div className="bg-slate-900/50 px-6 py-2 border-b border-slate-800 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               {isScreenConnected ? <MonitorCheck size={14} className="text-emerald-500" /> : <MonitorOff size={14} className="text-slate-600" />}
               <span className={`text-[9px] font-black uppercase tracking-widest ${isScreenConnected ? 'text-emerald-500' : 'text-slate-600'}`}>{t.screenStatus}: {isScreenConnected ? t.screenReady : t.screenOffline}</span>
            </div>
         </div>
         {activeEvent && <div className="text-[9px] font-black text-slate-500 uppercase">CODE: {activeEvent.code}</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {tab === 'EVENTS' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-white italic">{t.upcoming}</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl font-black shadow-xl flex items-center gap-2"><Plus size={24}/> {t.create}</button>
            </div>
            <div className="grid gap-4">
              {events.map(event => (
                <div key={event.id} onClick={() => setActiveEvent(event)} className={`bg-slate-900 border-2 p-5 rounded-2xl cursor-pointer ${activeEvent?.id === event.id ? 'border-indigo-500' : 'border-slate-800'}`}>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${event.status === 'LIVE' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>{event.status === 'LIVE' ? t.live : t.soon}</span>
                      <span className="text-slate-500 font-bold text-sm">{event.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} className="p-2 text-slate-600 hover:text-rose-500"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-end">
                    <div><h3 className="text-2xl font-black text-white">{event.name}</h3><p className="text-slate-500 text-xs font-bold mt-1">{t.code}: <span className="text-indigo-400 font-mono">{event.code}</span></p></div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold"><Users size={16}/> {guestCount} {t.guests}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'INFO' && activeEvent && (
          <div className="max-w-4xl mx-auto space-y-8">
             <header className="flex justify-between items-center bg-slate-900 p-8 rounded-[40px] border border-slate-800">
                <div><h2 className="text-3xl font-black text-white italic">{activeEvent.name}</h2><p className="text-slate-400 font-bold uppercase">{activeEvent.code}</p></div>
                <button onClick={handleToggleLive} className={`px-8 py-4 rounded-2xl font-black text-lg shadow-xl ${activeEvent.status === 'LIVE' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>{activeEvent.status === 'LIVE' ? t.stopLive : t.goLive}</button>
             </header>
          </div>
        )}

        {tab === 'GAMES' && activeEvent && <QuizControl activeEvent={activeEvent} lang={lang} />}
        {tab === 'CRM' && <CRMView lang={lang} />}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white italic mb-6">{t.createTitle}</h2>
            <div className="space-y-4">
              <input type="text" placeholder={t.nameLabel} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              <input type="text" placeholder={t.codeLabel} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 py-4 rounded-xl font-black text-white uppercase text-xs">{t.cancel}</button>
                <button onClick={handleSaveEvent} className="flex-1 bg-indigo-600 py-4 rounded-xl font-black text-white uppercase text-xs">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;