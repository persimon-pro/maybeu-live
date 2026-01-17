
import React, { useState, useEffect, useRef } from 'react';
import { GuestRecord, Language } from '../types';
import { Search, UserPlus, Sparkles, Database, Send, Trash2, Download, Upload, FileJson, X, Check } from 'lucide-react';
import { generateGuestGreeting } from '../services/geminiService';

interface Props {
  lang: Language;
}

const TRANSLATIONS = {
  ru: {
    clients: 'Клиенты',
    search: 'Поиск...',
    noContacts: 'Контакты отсутствуют',
    selectClient: 'Выберите клиента из списка или добавьте нового.',
    birthday: 'День рождения',
    notes: 'Заметки ведущего',
    contentCenter: 'ИИ Поздравление',
    write: 'Генерация...',
    genGreeting: 'СОЗДАТЬ ИИ ПОЗДРАВЛЕНИЕ',
    sendWA: 'WhatsApp',
    regen: 'ПЕРЕГЕНЕРИРОВАТЬ',
    addClientTitle: 'Добавить контакт',
    name: 'ФИО',
    phone: 'Телефон',
    email: 'Email',
    save: 'Сохранить',
    cancel: 'Отмена',
    export: 'Экспорт базы',
    import: 'Импорт',
    importSuccess: 'База успешно обновлена!',
    importError: 'Ошибка при чтении файла',
    confirmDelete: 'Удалить?'
  },
  en: {
    clients: 'Clients',
    search: 'Search...',
    noContacts: 'No contacts found',
    selectClient: 'Select a client or add a new one.',
    birthday: 'Birthday',
    notes: 'Host Notes',
    contentCenter: 'AI Greeting',
    write: 'Writing...',
    genGreeting: 'CREATE AI GREETING',
    sendWA: 'WhatsApp',
    regen: 'REGENERATE',
    addClientTitle: 'Add Contact',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    save: 'Save',
    cancel: 'Cancel',
    export: 'Export Data',
    import: 'Import',
    importSuccess: 'Database updated!',
    importError: 'Invalid file',
    confirmDelete: 'Delete?'
  }
};

const CRMView: React.FC<Props> = ({ lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState<GuestRecord[]>(() => {
    const saved = localStorage.getItem('mc_crm_guests');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGreeting, setAiGreeting] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ name: '', phone: '', email: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('mc_crm_guests', JSON.stringify(guests));
  }, [guests]);

  const handleAddClient = () => {
    if (!newGuestData.name) return;
    const newGuest: GuestRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGuestData.name,
      phone: newGuestData.phone,
      email: newGuestData.email,
      notes: '',
      birthday: ''
    };
    setGuests(prev => [...prev, newGuest]);
    setIsModalOpen(false);
    setNewGuestData({ name: '', phone: '', email: '' });
  };

  const updateGuestField = (id: string, field: keyof GuestRecord, value: string) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    if (selectedGuest?.id === id) {
      setSelectedGuest(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const deleteGuest = (id: string) => {
    const updated = guests.filter(g => g.id !== id);
    setGuests(updated);
    if (selectedGuest?.id === id) setSelectedGuest(null);
    setConfirmDeleteId(null);
  };

  const handleGenerateGreeting = async (guest: GuestRecord) => {
    setIsGenerating(true);
    const greeting = await generateGuestGreeting(guest.name, "Birthday", "Collaboration", lang);
    setAiGreeting(greeting);
    setIsGenerating(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(guests, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `maybeu_crm_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          setGuests(json);
          alert(t.importSuccess);
        } else {
          alert(t.importError);
        }
      } catch (err) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col md:flex-row h-[700px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500">
      <div className="w-full md:w-1/3 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 space-y-4 bg-slate-950/50">
          <div className="flex justify-between items-center mb-1">
             <h3 className="font-black text-lg text-white italic uppercase tracking-tighter">{t.clients}</h3>
             <div className="flex gap-2">
                <button 
                  onClick={handleExport}
                  title={t.export}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  title={t.import}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
                >
                  <Upload size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
             </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)} 
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <UserPlus size={18} /> {t.addClientTitle}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 outline-none transition-all text-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {guests.length === 0 ? (
            <div className="p-10 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">{t.noContacts}</div>
          ) : guests.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(guest => (
            <div 
              key={guest.id} 
              onClick={() => { setSelectedGuest(guest); setAiGreeting(''); }}
              className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-all flex justify-between items-center group ${selectedGuest?.id === guest.id ? 'bg-indigo-600/10 border-r-4 border-indigo-500' : ''}`}
            >
              <div className="flex-1 truncate">
                <p className="font-bold text-slate-100">{guest.name}</p>
                <p className="text-[10px] text-slate-500 font-bold truncate uppercase">{guest.phone || guest.email || 'Нет контактов'}</p>
              </div>
              
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {confirmDeleteId === guest.id ? (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                    <button 
                      onClick={() => deleteGuest(guest.id)} 
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)} 
                      className="p-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setConfirmDeleteId(guest.id)} 
                    className="p-2 text-slate-600 group-hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-950/30 overflow-y-auto p-4 md:p-8">
        {!selectedGuest ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center opacity-30">
            <Database size={64} className="mb-4" />
            <p className="font-bold uppercase tracking-widest">{t.selectClient}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono">
               <FileJson size={14} /> 
               <span>Backup system active</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">{selectedGuest.name}</h2>
              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase block">{t.phone}</span>
                  <span className="text-indigo-400 font-bold text-sm">{selectedGuest.phone || '—'}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase block">{t.birthday}</span>
                  <input 
                    type="date" 
                    value={selectedGuest.birthday || ''} 
                    onChange={e => updateGuestField(selectedGuest.id, 'birthday', e.target.value)}
                    className="bg-transparent text-white font-bold outline-none border-none text-sm"
                  />
                </div>
              </div>
            </header>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
               <h4 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2"> {t.notes}</h4>
               <textarea 
                  value={selectedGuest.notes || ''} 
                  onChange={e => updateGuestField(selectedGuest.id, 'notes', e.target.value)}
                  placeholder="Добавьте важную информацию о клиенте..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 font-medium outline-none focus:border-indigo-500 h-28 resize-none text-sm"
               />
            </div>

            <div className="space-y-4">
              <button 
                type="button"
                onClick={() => handleGenerateGreeting(selectedGuest)}
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 tracking-widest"
              >
                <Sparkles size={16} /> {isGenerating ? t.write : t.genGreeting}
              </button>

              {aiGreeting && (
                <div className="bg-indigo-950/20 border-2 border-indigo-500/20 p-6 rounded-3xl relative animate-in slide-in-from-bottom-2">
                  <p className="text-base leading-relaxed text-indigo-100 font-medium italic">"{aiGreeting}"</p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <a 
                      href={`https://wa.me/${selectedGuest.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(aiGreeting)}`}
                      target="_blank"
                      className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all text-white uppercase"
                    >
                      <Send size={14} /> {t.sendWA}
                    </a>
                    <button 
                      type="button"
                      onClick={() => handleGenerateGreeting(selectedGuest)}
                      className="flex-1 px-6 py-3 border border-indigo-500/30 hover:bg-indigo-500/10 rounded-xl text-[10px] font-black text-indigo-300 transition-all uppercase"
                    >
                      {t.regen}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-white italic mb-6 uppercase tracking-tighter">{t.addClientTitle}</h2>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.name}</label>
                    <input type="text" value={newGuestData.name} onChange={e => setNewGuestData({...newGuestData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500" placeholder="Иван Иванов" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.phone}</label>
                    <input type="text" value={newGuestData.phone} onChange={e => setNewGuestData({...newGuestData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500" placeholder="+7 999 000 00 00" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.email}</label>
                    <input type="email" value={newGuestData.email} onChange={e => setNewGuestData({...newGuestData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500" placeholder="ivan@mail.ru" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl font-black text-white uppercase text-xs">{t.cancel}</button>
                    <button type="button" onClick={handleAddClient} disabled={!newGuestData.name} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-white uppercase text-xs shadow-xl shadow-indigo-600/20">{t.save}</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;