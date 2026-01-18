import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child } from "firebase/database";

// ВАШИ РАБОЧИЕ КЛЮЧИ
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
  // Копируем активное событие в облако
  syncEvent: (event: any) => {
    if (!event) return;
    set(ref(db, 'currentEvent'), event);
  },

  // Копируем состояние игры (вопрос, стадию) в облако
  syncGameState: (state: any) => {
    if (!state) return;
    set(ref(db, 'gameState'), state);
  },

  // Для Гостя: найти событие по коду (так как у гостя нет локальной базы)
  findEventByCode: async (code: string) => {
    try {
      const snapshot = await get(ref(db, 'currentEvent'));
      const event = snapshot.val();
      if (event && event.code === code) return event;
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  // Для Гостя и Экрана: слушать изменения
  subscribeToEverything: (
    onGame: (g: any) => void
  ) => {
    const unsubGame = onValue(ref(db, 'gameState'), (s) => {
        const val = s.val();
        if (val) onGame(val);
    });
    return () => { unsubGame(); };
  },

  // Регистрация действий
  registerAction: (type: string, payload: any) => {
    // Можно расширить для ответов, но пока хватит синхронизации состояния
    set(ref(db, `actions/${type}`), payload);
  }
};