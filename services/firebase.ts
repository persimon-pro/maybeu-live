import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";
import { LiveEvent } from "../types";

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

// Вспомогательная функция: находит callback среди аргументов
const findCallback = (args: any[]) => args.find(arg => typeof arg === 'function');

export class FirebaseService {
  
  // --- STATE ---
  // Принимаем arg1 и ...args, чтобы "проглотить" любые варианты вызова
  static subscribeToGameState(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
      return onValue(ref(db, 'gameState'), (snapshot) => callback(snapshot.val()));
    }
    return () => {}; // Пустая отписка, если callback не найден
  }

  static onGameStateChange(arg1: any, ...args: any[]) {
    return this.subscribeToGameState(arg1, ...args);
  }

  // Принимаем ...args, чтобы игнорировать лишние параметры
  static updateGameState(event: LiveEvent | null, ...args: any[]) {
    set(ref(db, 'gameState'), { activeEvent: event, timestamp: Date.now() });
  }

  static async resetGame(...args: any[]) {
    await set(ref(db, 'gameState'), null);
  }
  
  static async resetEvent(...args: any[]) {
    await this.resetGame();
  }

  // --- GUESTS ---
  static registerGuest(...args: any[]) {
    // Логика: если первый аргумент объект - берем из него, иначе считаем аргументы по порядку
    let guestId, name;
    if (typeof args[0] === 'object') {
       guestId = args[0].id;
       name = args[0].name;
    } else {
       guestId = args[0];
       name = args[1];
    }
    if (guestId) {
        set(ref(db, `guests/${guestId}`), { name, joinedAt: Date.now(), score: 0 });
    }
  }

  static onGuestsCountChange(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
        return onValue(ref(db, 'guests'), (snapshot) => callback(snapshot.size));
    }
    return () => {};
  }

  // --- PULSE & PROGRESS ---
  static sendScreenPulse(...args: any[]) {
    set(ref(db, 'screenPulse'), Date.now());
  }

  static onScreenPulseChange(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
        return onValue(ref(db, 'screenPulse'), (snapshot) => callback(snapshot.val()));
    }
    return () => {};
  }

  static onPushProgressChange(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
        return onValue(ref(db, 'pushProgress'), (snapshot) => callback(snapshot.val()));
    }
    return () => {};
  }

  static updatePushProgress(val: any, ...args: any[]) {
    set(ref(db, 'pushProgress'), val);
  }

  // --- ANSWERS & IMAGES ---
  static submitAnswer(...args: any[]) {
    const guestId = args[0];
    const answerIdx = args[1];
    if (guestId !== undefined) {
        const key = push(ref(db, 'answers')).key;
        update(ref(db), { [`answers/${key}`]: { guestId, answerIdx, timestamp: Date.now() } });
    }
  }

  static onAnswersChange(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
        return onValue(ref(db, 'answers'), (snapshot) => callback(snapshot.val()));
    }
    return () => {};
  }

  static addGuestImage(...args: any[]) {
    // Пытаемся понять, что нам передали
    const arg1 = args[0];
    const payload = typeof arg1 === 'object' ? arg1 : { guestId: arg1, imageUrl: args[1] };
    push(ref(db, 'guestImages'), payload);
  }

  static onImagesChange(arg1: any, ...args: any[]) {
    const callback = typeof arg1 === 'function' ? arg1 : findCallback(args);
    if (callback) {
        return onValue(ref(db, 'guestImages'), (snapshot) => callback(snapshot.val()));
    }
    return () => {};
  }
}

export const updateGameState = FirebaseService.updateGameState;
export const subscribeToGameState = FirebaseService.subscribeToGameState;