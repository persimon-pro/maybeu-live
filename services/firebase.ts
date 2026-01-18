import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, onValue, push } from "firebase/database";

// Твои рабочие ключи
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
  // Ведущий: отправляет событие в эфир
  syncEvent: (event: any) => {
    if (!event) return;
    update(ref(db, 'currentEvent'), event);
  },

  // Ведущий: отправляет состояние игры (вопрос/слайд)
  syncGameState: (state: any) => {
    if (!state) return;
    update(ref(db, 'gameState'), state);
  },

  // Гость: ищет событие по коду
  findEventByCode: async (code: string) => {
    try {
      const snapshot = await get(ref(db, 'currentEvent'));
      const event = snapshot.val();
      if (event && event.code === code) return event;
    } catch (e) { console.error(e); }
    return null;
  },

  // Гость: слушает игру
  subscribeToGame: (cb: (data: any) => void) => {
    return onValue(ref(db, 'gameState'), (s) => {
      const val = s.val();
      if (val) cb(val);
    });
  },

  // Гость: отправляет клики/ответы
  sendAction: (type: string, data: any) => {
    push(ref(db, `actions/${type}`), { ...data, timestamp: Date.now() });
  }
};