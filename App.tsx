import React, { useState, useEffect } from 'react';
import { UserRole, LiveEvent, Language } from './types';
import { FirebaseService, auth } from './services/firebase'; // Добавили auth
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; // Импорты для авторизации
import HostDashboard from './components/HostDashboard';
import GuestPortal from './components/GuestPortal';
import BigScreenView from './components/BigScreenView';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth'; // Импортируем компонент входа
import { Settings, X, Globe, Home, LogOut } from 'lucide-react'; // Добавили иконку LogOut

const TRANSLATIONS = {
  // ... твои переводы оставляем без изменений ...
  ru: {
    host: 'Ведущий', guest: 'Гость', screen: 'Экран', settings: 'Настройки',
    language: 'Язык приложения', russian: 'Русский', english: 'English',
    close: 'Закрыть', sync: 'Синхронизация', appTitle: 'Maybeu Live', exit: 'Выйти',
    logout: 'Сменить аккаунт' // Добавил новый перевод
  },
  en: {
    host: 'Host', guest: 'Guest', screen: 'Screen', settings: 'Settings',
    language: 'App Language', russian: 'Русский', english: 'English',
    close: 'Close', sync: 'Sync', appTitle: 'Maybeu Live', exit: 'Exit',
    logout: 'Log Out'
  }
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(null);
  const [lang, setLang] = useState<Language>('ru');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Добавляем состояние для пользователя
  const [user, setUser] = useState<User | null>(null);

  const t = TRANSLATIONS[lang];

  // Слушаем статус авторизации Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedEvent = localStorage.getItem('active_event');
    if (savedEvent) {
      try {
        const parsed = JSON.parse(savedEvent);
        setActiveEvent(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleExit = () => {
    localStorage.removeItem('active_event');
    localStorage.removeItem('game_state');
    localStorage.removeItem('guest_images');
    localStorage.removeItem('race_progress');
    setRole(null);
    setActiveEvent(null);
  };

  const handleLogout = () => {
    signOut(auth);
    setRole(null);
  };

  const renderContent = () => {
    switch (role) {
      case 'HOST':
        // ЕСЛИ РОЛЬ ВЕДУЩИЙ, НО НЕТ ПАРОЛЯ — ПОКАЗЫВАЕМ ВХОД
        if (!user) {
          return (
             <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="absolute top-4 left-4">
                   <button onClick={() => setRole(null)} className="text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm">
                     <Home size={16} /> На главную
                   </button>
                </div>
                <Auth />
             </div>
          );
        }
        // ЕСЛИ АВТОРИЗОВАН — ПУСКАЕМ В ДАШБОРД
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
        <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleExit}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg italic shadow-lg shadow-indigo-500/20">M</div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline">{t.appTitle}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Кнопка выхода из аккаунта (только для авторизованного ведущего) */}
            {role === 'HOST' && user && (
               <button 
                 onClick={handleLogout}
                 className="hidden md:flex p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl text-slate-400 transition-all items-center gap-2 px-3 py-1.5 font-bold text-xs uppercase mr-2"
                 title={t.logout || 'Выйти из аккаунта'}
               >
                 <LogOut size={16} /> {user.email}
               </button>
            )}

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleExit}
              className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl text-slate-400 transition-all flex items-center gap-2 px-3 py-1.5 font-bold text-xs uppercase"
            >
              <Home size={16} /> {t.exit}
            </button>
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {renderContent()}
      </main>

      {/* Модалка настроек остается как была... */}
      {isSettingsOpen && (
        // ... твой код модалки настроек ...
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           {/* ... */}
           <button onClick={() => setIsSettingsOpen(false)} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-slate-300">Закрыть</button>
        </div>
      )}
    </div>
  );
};

export default App;
