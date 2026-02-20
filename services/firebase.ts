import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, onValue, push, set, remove } from "firebase/database";
import { getAuth } from "firebase/auth";

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

// Экспортируем auth
export const auth = getAuth(app);

export const FirebaseService = {
  // --- УПРАВЛЕНИЕ СОБЫТИЯМИ ---
  saveEventToDB: (event: any) => {
    if (!event.id) return;
    update(ref(db, `events/${event.id}`), event);
  },

  deleteEventFromDB: (eventId: string) => {
    remove(ref(db, `events/${eventId}`));
  },

  subscribeToAllEvents: (cb: (events: any[]) => void) => {
    return onValue(ref(db, 'events'), (snapshot) => {
      const data = snapshot.val();
      const eventsList = data ? Object.values(data) : [];
      eventsList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      cb(eventsList);
    });
  },

  // --- ВЕДУЩИЙ (ТЕПЕРЬ ВСЕ ЧЕРЕЗ CODE) ---
  syncEvent: (code: string, event: any) => {
    if (!event || !code) return;
    update(ref(db, `active_events/${code}/currentEvent`), event);
    if (event.id) update(ref(db, `events/${event.id}`), event);
  },

  syncGameState: (code: string, state: any) => {
    if (!state || !code) return;
    update(ref(db, `active_events/${code}/gameState`), state);
  },

  resetGameData: (code: string) => {
    if (!code) return;
    remove(ref(db, `session_data/${code}`));
    update(ref(db, `active_events/${code}/gameState`), { isActive: false });
  },

  // --- CRM ---
  sendLead: (lead: any) => { push(ref(db, 'crm_leads'), lead); },
  
  subscribeToLeads: (cb: (leads: any[]) => void) => {
    return onValue(ref(db, 'crm_leads'), (snapshot) => {
      const data = snapshot.val();
      cb(data ? Object.values(data) : []);
    });
  },
  
  clearLeads: () => { set(ref(db, 'crm_leads'), null); },

  // --- ГОСТЬ / ДЕЙСТВИЯ ---
  joinEvent: (code: string, name: string) => {
    if (!code) return;
    set(ref(db, `session_data/${code}/registry/${name}`), { name, timestamp: Date.now() });
  },

  sendAnswer: (code: string, type: 'quiz' | 'quest', key: string | number, data: any) => {
    if (!code) return;
    const path = type === 'quiz' 
      ? `session_data/${code}/quiz_answers/${data.name}/${key}`
      : `session_data/${code}/quest_responses/${key}`;
    if (type === 'quiz') set(ref(db, path), data);
    else push(ref(db, path), data);
  },

  sendImage: (code: string, data: any) => { 
    if (!code) return;
    push(ref(db, `session_data/${code}/images`), data); 
  },

  updateRaceProgress: (code: string, name: string, count: number) => {
    if (!code) return;
    set(ref(db, `session_data/${code}/race/${name}`), count);
  },

  updateShakeCount: (code: string, name: string, count: number) => {
    if (!code) return;
    set(ref(db, `session_data/${code}/shake/${name}`), count);
  },

  // --- ПОДПИСКИ ---
  findEventByCode: async (code: string) => {
    try {
      const snapshot = await get(ref(db, 'events'));
      const events = snapshot.val();
      if (events) {
        const found = Object.values(events).find((e: any) => e.code === code);
        if (found) return found;
      }
    } catch (e) { console.error(e); }
    return null;
  },

  subscribeToEvent: (code: string, cb: (data: any) => void) => {
    return onValue(ref(db, `active_events/${code}/currentEvent`), (s) => cb(s.val()));
  },

  subscribeToGame: (code: string, cb: (data: any) => void) => {
    return onValue(ref(db, `active_events/${code}/gameState`), (s) => cb(s.val()));
  },

  subscribeToSessionData: (code: string, cb: (data: any) => void) => {
    return onValue(ref(db, `session_data/${code}`), (s) => cb(s.val() || {}));
  },

  sendScreenHeartbeat: (code: string) => {
    if (!code) return;
    set(ref(db, `active_events/${code}/screen_status`), { last_seen: Date.now() });
  },

  subscribeToScreenStatus: (code: string, cb: (lastSeen: number) => void) => {
    return onValue(ref(db, `active_events/${code}/screen_status/last_seen`), (s) => cb(s.val()));
  }
};
