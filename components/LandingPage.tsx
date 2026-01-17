
import React from 'react';
import { UserRole, Language } from '../types';
import { User, PlayCircle, Monitor, Zap, Mic, Smartphone, Sparkles, Globe } from 'lucide-react';

interface Props {
  onSelectRole: (role: UserRole) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

const TRANSLATIONS = {
  ru: {
    title: 'Maybeu Live',
    subtitle: 'Платформа для профи эвентов',
    choicePrompt: 'Кто вы на этом событии?',
    hostTitle: 'Ведущий',
    hostDesc: 'Квизы, игры и CRM.',
    hostAction: 'Вход',
    guestTitle: 'Гость',
    guestDesc: 'Интерактив и ИИ-арт.',
    guestAction: 'Участвовать',
    screenLink: 'Экран проектора',
    features: ['Real-time', 'AI Engine', 'Sensor Battles']
  },
  en: {
    title: 'Maybeu Live',
    subtitle: 'Pro Event Platform',
    choicePrompt: 'Choose your role',
    hostTitle: 'Host',
    hostDesc: 'Quizzes, Games & CRM.',
    hostAction: 'Enter',
    guestTitle: 'Guest',
    guestDesc: 'Interactive & AI-art.',
    guestAction: 'Join',
    screenLink: 'Projector Screen',
    features: ['Real-time', 'AI Engine', 'Sensor Battles']
  }
};

const LandingPage: React.FC<Props> = ({ onSelectRole, lang, onLanguageChange }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-rose-600/10 blur-[100px] rounded-full animate-pulse" />
      
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-10">
        <header className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={12} className="text-amber-500" /> persimon prod
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase drop-shadow-2xl">
            Maybeu <span className="text-indigo-500">Live</span>
          </h1>
          <p className="text-lg text-slate-500 font-bold uppercase tracking-widest">
            {t.subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl animate-in zoom-in duration-700 delay-200">
          {/* Host Card - Compact */}
          <div 
            onClick={() => onSelectRole('HOST')}
            className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Mic className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-black text-white mb-1 uppercase italic">{t.hostTitle}</h3>
              <p className="text-slate-400 text-sm mb-6">{t.hostDesc}</p>
              <div className="w-full py-2.5 bg-indigo-600 rounded-xl font-black text-sm uppercase tracking-wider group-hover:bg-indigo-500 transition-colors">
                {t.hostAction}
              </div>
            </div>
            {/* Background Icon Watermark */}
            <Mic size={80} className="absolute -bottom-4 -right-4 text-white/[0.03] group-hover:text-white/[0.05] transition-colors" />
          </div>

          {/* Guest Card - Compact */}
          <div 
            onClick={() => onSelectRole('GUEST')}
            className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 cursor-pointer transition-all hover:border-rose-500/50 hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-rose-500/10 overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-transform">
                <PlayCircle className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-black text-white mb-1 uppercase italic">{t.guestTitle}</h3>
              <p className="text-slate-400 text-sm mb-6">{t.guestDesc}</p>
              <div className="w-full py-2.5 bg-rose-600 rounded-xl font-black text-sm uppercase tracking-wider group-hover:bg-rose-500 transition-colors">
                {t.guestAction}
              </div>
            </div>
            {/* Background Icon Watermark */}
            <Smartphone size={80} className="absolute -bottom-4 -right-4 text-white/[0.03] group-hover:text-white/[0.05] transition-colors" />
          </div>
        </div>

        <footer className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-1000 delay-500 pt-4">
          <button 
            onClick={() => onSelectRole('SCREEN')}
            className="flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-all font-black uppercase tracking-tighter text-xs"
          >
            <Monitor size={14} /> {t.screenLink}
          </button>
          
          <div className="flex gap-6 opacity-40">
            {t.features.map((f, i) => (
              <span key={i} className="text-[9px] font-black uppercase tracking-[0.2em]">{f}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
