import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, onValue, push, set, remove, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC-vmOaMUz_fBFjltcxp6RyNvyMmAmdqJ0",
  authDomain: "maybeu-live.firebaseapp.com",
  databaseURL: "https://maybeu-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maybeu-live",
  storageBucket: "maybeu-live.firebasestorage.app",
  messagingSenderId: "192864240880",
  appId: "1:192864240880:web:78fed94f46e3b19a2eae35",
  measurementId: "G-1BC95R85WM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const FirebaseService = {
  // --- ВЕДУЩИЙ ---
  syncEvent: (event: any) => {
    if (!event) return;
    update(ref(db, 'currentEvent'), event);
  },

  syncGameState: (state: any) => {
    if (!state) return;
    update(ref(db, 'gameState'), state);
  },

  resetGameData: (code: string) => {
    remove(ref(db, `session_data/${code}`));
    set(ref(db, 'gameState'), { isActive: false });
  },

  // --- CRM / ЛИДЫ ---
  
  // Отправка (Гость)
  sendLead: (lead: any) => {
    push(ref(db, 'crm_leads'), lead);
  },

  // Получение (Ведущий)
  subscribeToLeads: (cb: (leads: any[]) => void) => {
    return onValue(ref(db, 'crm_leads'), (snapshot) => {
      const data = snapshot.val();
      // Превращаем объект Firebase в массив
      const leadsList = data ? Object.values(data) : [];
      cb(leadsList);
    });
  },

  // Очистка базы (Ведущий)
  clearLeads: () => {
    set(ref(db, 'crm_leads'), null);
  },

  // --- ГОСТЬ / ДЕЙСТВИЯ ---
  
  joinEvent: (code: string, name: string) => {
    const userRef = ref(db, `session_data/${code}/registry/${name}`);
    set(userRef, { name, timestamp: Date.now() });
  },

  sendAnswer: (code: string, type: 'quiz' | 'quest', key: string | number, data: any) => {
    const path = type === 'quiz' 
      ? `session_data/${code}/quiz_answers/${data.name}/${key}`
      : `session_data/${code}/quest_responses/${key}`;
    
    if (type === 'quiz') {
      set(ref(db, path), data);
    } else {
      push(ref(db, path), data);
    }
  },

  sendImage: (code: string, data: any) => {
    push(ref(db, `session_data/${code}/images`), data);
  },

  updateRaceProgress: (code: string, name: string, count: number) => {
    set(ref(db, `session_data/${code}/race/${name}`), count);
  },

  // --- ПОДПИСКИ (LISTENERS) ---

  findEventByCode: async (code: string) => {
    try {
      const snapshot = await get(ref(db, 'currentEvent'));
      const event = snapshot.val();
      if (event && event.code === code) return event;
    } catch (e) { console.error(e); }
    return null;
  },

  subscribeToEvent: (cb: (data: any) => void) => {
    return onValue(ref(db, 'currentEvent'), (s) => cb(s.val()));
  },

  subscribeToGame: (cb: (data: any) => void) => {
    return onValue(ref(db, 'gameState'), (s) => cb(s.val()));
  },

  subscribeToSessionData: (code: string, cb: (data: any) => void) => {
    return onValue(ref(db, `session_data/${code}`), (s) => cb(s.val() || {}));
  },

  sendScreenHeartbeat: () => {
    set(ref(db, 'screen_status'), { last_seen: Date.now() });
  },

  subscribeToScreenStatus: (cb: (lastSeen: number) => void) => {
    return onValue(ref(db, 'screen_status/last_seen'), (s) => cb(s.val()));
  }
};