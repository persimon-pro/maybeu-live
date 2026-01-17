
import React, { useState, useEffect } from 'react';
import { LiveEvent, GameType, Language, TimingItem } from '../types';
import { Plus, Users, Calendar, Gamepad2, Database, Edit2, Trash2, Info, ListTodo, MonitorCheck, MonitorOff, Check, X } from 'lucide-react';
import QuizControl from './QuizControl';
import CRMView from './CRMView';
import { FirebaseService } from '../services/firebase';

interface Props {
  activeEvent: LiveEvent | null;
  setActiveEvent: (event: LiveEvent | null) => void;
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    upcoming: 'События', create: 'Создать', manage: 'Игры', clients: 'Клиенты', infoTab: 'План', timingTab: 'Сценарий', eventsTab: 'Список',
    live: 'В ЭФИРЕ', soon: 'СКОРО', guests: 'гостей', code: 'Код', createTitle: 'Новое событие', editTitle: 'Правка', save: 'ОК', cancel: 'Отмена',
    goLive: 'ВЫЙТИ В ЭФИР', stopLive: 'ЗАВЕРШИТЬ ЭФИР', screenStatus: 'Экран', screenReady: 'ОНЛАЙН', screenOffline: 'ОФФЛАЙН'
  },
  en: {
    upcoming: 'Events', create: 'Create', manage: 'Games', clients: 'Clients', infoTab: 'Planner', timingTab: 'Timeline', eventsTab: 'List',
    live: 'LIVE', soon: 'SOON', guests: 'guests', code: 'Code', createTitle: 'New Event', editTitle: 'Edit', save: 'Save', cancel: 'Cancel',
    goLive: 'GO LIVE', stopLive: 'STOP LIVE', screenStatus: 'Screen', screenReady: 'ONLINE', screenOffline: 'OFFLINE'
  }
};

const HostDashboard: React.FC<Props> = ({ activeEvent, setActiveEvent, lang }) => {
  const [tab, setTab] = useState<'EVENTS' | 'GAMES' | 'CRM' | 'INFO' | 'TIMING'>('EVENTS');
  const [events, setEvents] = useState<LiveEvent[]>(() => JSON.parse(localStorage.getItem('mc_events') || '[]'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [formData, setFormData] = useState<Partial<LiveEvent>>({ name: '', type: 'PARTY', code: '', date: new Date().toISOString().split('T')[0] });
  const [isScreenConnected, setIsScreenConnected] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('mc_events', JSON.stringify(events));
  }, [events]);

  // Мониторинг пульса экрана и количества гостей через Firebase
  useEffect(() => {
    if (activeEvent?.status === 'LIVE') {
      const unsubPulse = FirebaseService.onScreenPulseChange(activeEvent.code, (timestamp) => {
        setIsScreenConnected(Date.now() - timestamp < 3000);
      });
      const unsubGuests = FirebaseService.onGuestsCountChange(activeEvent.code, setGuestCount);
      return () => { unsubPulse(); unsubGuests(); };
    }
  }, [activeEvent?.code, activeEvent?.status]);

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as LiveEvent : e));
    } else {
      const event: LiveEvent = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Event',
        date: formData.date || '',
        code: formData.code || Math.random().toString(36).substr(2, 6).toUpperCase(),
        type: 'PARTY',
        status: 'UPCOMING',
        timetable: []
      };
      setEvents(prev => [event, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleToggleLive = () => {
    if (!activeEvent) return;
    const newStatus = activeEvent.status === 'LIVE' ? 'COMPLETED' : 'LIVE';
    const updated = { ...activeEvent, status: newStatus as any };
    setActiveEvent(updated);
    setEvents(prev => prev.map(e => e.id === activeEvent.id ? updated : e));
    localStorage.setItem('active_event', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex border-b border-slate-800 bg-slate-900/30 overflow-x-auto shrink-0">
        {['EVENTS', 'INFO', 'TIMING', 'GAMES', 'CRM'].map(id => (
          <button key={id} onClick={() => setTab(id as any)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${tab === id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>
            {t[(id.toLowerCase() + 'Tab') as keyof typeof t] || t[id.toLowerCase() as keyof typeof t]}
          </button>
        ))}
      </div>

      <div className="bg-slate-900/50 px-6 py-2 border-b border-slate-800 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               {isScreenConnected ? <MonitorCheck size={14} className="text-emerald-500" /> : <MonitorOff size={14} className="text-slate-600" />}
               <span className={`text-[9px] font-black uppercase tracking-widest ${isScreenConnected ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {t.screenStatus}: {isScreenConnected ? t.screenReady : t.screenOffline}
               </span>
            </div>
            {activeEvent?.status === 'LIVE' && <div className="text-[9px] font-black text-indigo-400 uppercase">Гостей: {guestCount}</div>}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {tab === 'EVENTS' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-white italic">{t.upcoming}</h2><button onClick={() => setIsModalOpen(true)} className="bg-white text-indigo-900 px-6 py-2 rounded-xl font-black shadow-xl">+</button></div>
            <div className="grid gap-4">
              {events.map(event => (
                <div key={event.id} onClick={() => { setActiveEvent(event); localStorage.setItem('active_event', JSON.stringify(event)); }} className={`bg-slate-900 border-2 p-5 rounded-2xl cursor-pointer transition-all ${activeEvent?.id === event.id ? 'border-indigo-500' : 'border-slate-800'}`}>
                  <div className="flex justify-between items-start">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${event.status === 'LIVE' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>{event.status === 'LIVE' ? t.live : t.soon}</span>
                    <span className="text-slate-500 text-sm">{event.date}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-4">{event.name} — <span className="text-indigo-400 font-mono">{event.code}</span></h3>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'INFO' && activeEvent && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4">
            <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex justify-between items-center">
              <div><h2 className="text-3xl font-black text-white italic">{activeEvent.name}</h2><p className="text-slate-400 font-mono">{activeEvent.code}</p></div>
              <button onClick={handleToggleLive} className={`px-8 py-4 rounded-2xl font-black text-lg ${activeEvent.status === 'LIVE' ? 'bg-rose-600' : 'bg-emerald-600'} text-white shadow-2xl`}>{activeEvent.status === 'LIVE' ? t.stopLive : t.goLive}</button>
            </div>
          </div>
        )}
        {tab === 'GAMES' && activeEvent && <QuizControl activeEvent={activeEvent} lang={lang} />}
        {tab === 'CRM' && <CRMView lang={lang} />}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 space-y-4">
            <h2 className="text-2xl font-black text-white italic">Новое событие</h2>
            <input placeholder="Название" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            <input placeholder="Код (LOVE24)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono" />
            <div className="flex gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 py-4 rounded-xl text-white font-black uppercase text-xs">Отмена</button><button onClick={handleSaveEvent} className="flex-1 bg-indigo-600 py-4 rounded-xl text-white font-black uppercase text-xs">Сохранить</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;