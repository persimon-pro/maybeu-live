import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update } from "firebase/database";

// ВАШИ РАБОЧИЕ КЛЮЧИ (Связь идет через них)
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

// Вспомогательная функция, чтобы найти callback (функцию ответа),
// даже если ваш код передает лишние аргументы
const getCallback = (args: any[]) => {
  return args.find(arg => typeof arg === 'function');
};

export class FirebaseService {
  
  // --- ОСНОВНОЕ СОСТОЯНИЕ ИГРЫ ---
  static subscribeToGameState(...args: any[]) {
    console.log("🔥 Firebase: Подписка на GameState");
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'gameState'), (snapshot) => {
        const val = snapshot.val();
        console.log("🔥 Firebase: Получены данные игры:", val);
        cb(val);
      });
    }
    return () => {};
  }

  // Дублер для совместимости
  static onGameStateChange(...args: any[]) {
    return this.subscribeToGameState(...args);
  }

  static updateGameState(data: any, ...args: any[]) {
    console.log("🔥 Firebase: Отправка данных игры:", data);
    set(ref(db, 'gameState'), { activeEvent: data, timestamp: Date.now() });
  }

  static async resetGame(...args: any[]) {
    await set(ref(db, 'gameState'), null);
  }
  
  static async resetEvent(...args: any[]) {
    await this.resetGame();
  }

  // --- ГОСТИ ---
  static registerGuest(...args: any[]) {
    // Пытаемся понять, передали объект или два параметра
    let id, name;
    if (typeof args[0] === 'object') {
      id = args[0].id || args[0].guestId;
      name = args[0].name;
    } else {
      id = args[0];
      name = args[1];
    }

    if (id) {
      console.log(`🔥 Firebase: Регистрация гостя ${name} (${id})`);
      set(ref(db, `guests/${id}`), { name, joinedAt: Date.now(), score: 0 });
    }
  }

  static onGuestsCountChange(...args: any[]) {
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'guests'), (snapshot) => cb(snapshot.size));
    }
    return () => {};
  }

  // --- ЭКРАН (ПУЛЬС) ---
  static sendScreenPulse(...args: any[]) {
    set(ref(db, 'screenPulse'), Date.now());
  }

  static onScreenPulseChange(...args: any[]) {
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'screenPulse'), (s) => cb(s.val()));
    }
    return () => {};
  }

  // --- ОТВЕТЫ ---
  static submitAnswer(...args: any[]) {
    const arg1 = args[0];
    const arg2 = args[1];
    
    // Если передали объект {guestId, answerIdx}
    if (typeof arg1 === 'object') {
       const key = push(ref(db, 'answers')).key;
       update(ref(db), { [`answers/${key}`]: arg1 });
    } 
    // Если передали (guestId, answerIdx) отдельно
    else {
       const key = push(ref(db, 'answers')).key;
       update(ref(db), { [`answers/${key}`]: { guestId: arg1, answerIdx: arg2 } });
    }
  }

  static onAnswersChange(...args: any[]) {
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'answers'), (s) => cb(s.val()));
    }
    return () => {};
  }
  
  // --- КАРТИНКИ И ПРОГРЕСС ---
  static addGuestImage(...args: any[]) {
    const arg1 = args[0];
    const arg2 = args[1];
    const payload = typeof arg1 === 'object' ? arg1 : { guestId: arg1, imageUrl: arg2 };
    push(ref(db, 'guestImages'), payload);
  }
  
  static onImagesChange(...args: any[]) {
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'guestImages'), (s) => cb(s.val()));
    }
    return () => {};
  }

  static updatePushProgress(val: any) {
    set(ref(db, 'pushProgress'), val);
  }

  static onPushProgressChange(...args: any[]) {
    const cb = getCallback(args);
    if (cb) {
      return onValue(ref(db, 'pushProgress'), (s) => cb(s.val()));
    }
    return () => {};
  }
}

// Экспорты для надежности (чтобы работали и import { FirebaseService } и import ... from)
export const updateGameState = FirebaseService.updateGameState;
export const subscribeToGameState = FirebaseService.subscribeToGameState;