import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update, push } from "firebase/database";

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
  // Зеркалим событие (чтобы телефон его нашел)
  syncEvent: (event: any) => {
    if (!event) return;
    update(ref(db, 'currentEvent'), event);
  },

  // Зеркалим состояние игры (вопросы, таймер)
  syncGameState: (state: any) => {
    if (!state) return;
    update(ref(db, 'gameState'), state);
  },

  // Для Гостя: поиск события в облаке
  findEventByCode: async (code: string) => {
    try {
      const snapshot = await get(ref(db, 'currentEvent'));
      const event = snapshot.val();
      // Проверяем код (если совпадает - возвращаем)
      if (event && event.code && event.code.toUpperCase() === code.toUpperCase()) {
          return event;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  // Подписка для Гостя и Экрана
  subscribeToGame: (callback: (data: any) => void) => {
    return onValue(ref(db, 'gameState'), (snapshot) => {
      const val = snapshot.val();
      if (val) callback(val);
    });
  },

  // Обратная связь: Гость отправляет ответы/картинки
  sendAction: (type: string, data: any) => {
     push(ref(db, `actions/${type}`), { ...data, timestamp: Date.now() });
  },
  
  subscribeToActions: (type: string, callback: (data: any) => void) => {
     return onValue(ref(db, `actions/${type}`), (snapshot) => {
        const val = snapshot.val();
        if (val) callback(Object.values(val));
     });
  }
};