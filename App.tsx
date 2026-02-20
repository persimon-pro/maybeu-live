import React, { useState, useEffect } from 'react';
import { UserRole, LiveEvent, Language } from './types';
import { FirebaseService, auth } from './services/firebase'; 
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; 
import HostDashboard from './components/HostDashboard';
import GuestPortal from './components/GuestPortal';
import BigScreenView from './components/BigScreenView';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth'; 
import { Settings, X, Globe, Home, LogOut, Loader2 } from 'lucide-react'; 

const TRANSLATIONS = {
  ru: {
    host: 'Ведущий', guest: 'Гость', screen: 'Экран', settings: 'Настройки',
    language: 'Язык приложения', russian: 'Русский', english: 'English',
    close: 'Закрыть', sync: 'Синхронизация', appTitle: 'Maybeu Live', exit: 'Выйти',
    logout: 'Выйти из системы', loading: 'Загрузка профиля...'
  },
  en: {
    host: 'Host', guest: 'Guest', screen: 'Screen', settings: 'Settings',
    language: 'App Language', russian: 'Русский', english: 'English',
    close: 'Close', sync: 'Sync', appTitle: 'Maybeu Live', exit: 'Exit',
    logout: 'Log Out', loading: 'Loading profile...'
  }
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(null);
  const [lang, setLang] = useState<Language>('ru');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Добавляем состояние загрузки для процесса авторизации
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Слушатель состояния входа
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return () => unsubscribe();
  }, [initializing]);

  // Загрузка сохраненного события
  useEffect(() => {
    const savedEvent = localStorage.getItem('active_event');
    if (savedEvent) {
      try {
        setActiveEvent(JSON.parse(savedEvent));
      } catch (e) {
        console.error("Failed to parse saved event", e);
      }
    }
  }, []);

  const handleExit = () => {
    setRole(null);
    setActiveEvent(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRole(null);
      setActiveEvent(null);
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  // 1. Если Firebase еще проверяет старую сессию при загрузке страницы
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black uppercase tracking-widest text-xs">{t.loading}</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (role) {
      case 'HOST':
        // Если ведущий не залогинен - показываем ТОЛЬКО Auth
        if (!user) {
          return (
             <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-slate-950">
                <button 
                  onClick={() => setRole(null)} 
                  className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-colors"
                >
                  <Home size={16} /> На главную
                </button>
                <Auth />
             </div>
          );
        }
        // Если залогинен - пускаем в Dashboard
        return <HostDashboard setActiveEvent={setActiveEvent} activeEvent={activeEvent} lang={lang} />;
      case 'GUEST':
        return <GuestPortal activeEvent={activeEvent} lang={lang} />;
      case 'SCREEN':
        return <BigScreenView activeEvent={activeEvent} lang={lang} />;
      default:
        return <LandingPage onSelectRole={setRole} lang={lang} onLanguageChange={setLang} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {role && (
        <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex justify-between items-center sticky top-0 z-50 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleExit}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg italic shadow-lg shadow-indigo-500/20">M</div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline">{t.appTitle}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {role === 'HOST' && user && (
               <div className="hidden md:flex items-center gap-3 mr-4 border-r border-slate-800 pr-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{user.email}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-500 transition-all"
                    title={t.logout}
                  >
                    <LogOut size={16} />
                  </button>
               </div>
            )}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={handleExit} className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl text-slate-400 transition-all flex items-center gap-2 px-3 py-1.5 font-bold text-xs uppercase">
              <Home size={16} /> {t.exit}
            </button>
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {renderContent()}
      </main>

      {/* Настройки */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Настройки</h2>
               <X className="cursor-pointer text-slate-500" onClick={() => setIsSettingsOpen(false)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setLang('ru')} className={`py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${lang === 'ru' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Русский</button>
               <button onClick={() => setLang('en')} className={`py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${lang === 'en' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>English</button>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 bg-white text-indigo-900 py-4 rounded-2xl font-black uppercase text-xs">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
