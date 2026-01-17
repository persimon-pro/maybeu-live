import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";

// ВАЖНО: Ваши рабочие ключи
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

// Универсальный сервис, который примет любые команды от вашего кода
export class FirebaseService {
  
  static subscribeToGameState(callback: any) {
    // Если передали лишние параметры, берем последний (обычно это callback)
    const cb = typeof callback === 'function' ? callback : arguments[arguments.length - 1];
    if (typeof cb === 'function') {
      return onValue(ref(db, 'gameState'), (snapshot) => cb(snapshot.val()));
    }
    return () => {};
  }

  static onGameStateChange(cb: any, ...args: any[]) {
    return this.subscribeToGameState(cb);
  }

  static updateGameState(data: any) {
    set(ref(db, 'gameState'), { activeEvent: data, timestamp: Date.now() });
  }

  static async resetGame() {
    await set(ref(db, 'gameState'), null);
  }
  
  static async resetEvent() {
    await this.resetGame();
  }

  // Гости
  static registerGuest(guestId: string, name: string) {
    // Поддержка и объекта, и отдельных аргументов
    if (typeof guestId === 'object' && (guestId as any).id) {
        const g = guestId as any;
        set(ref(db, `guests/${g.id}`), { name: g.name, joinedAt: Date.now(), score: 0 });
    } else {
        set(ref(db, `guests/${guestId}`), { name, joinedAt: Date.now(), score: 0 });
    }
  }

  static onGuestsCountChange(cb: any) {
     const callback = typeof cb === 'function' ? cb : arguments[arguments.length - 1];
     if (typeof callback === 'function') {
        return onValue(ref(db, 'guests'), (s) => callback(s.size));
     }
     return () => {};
  }

  // Пульс экрана (связь)
  static sendScreenPulse() {
    set(ref(db, 'screenPulse'), Date.now());
  }

  static onScreenPulseChange(cb: any) {
    const callback = typeof cb === 'function' ? cb : arguments[arguments.length - 1];
    if (typeof callback === 'function') {
      return onValue(ref(db, 'screenPulse'), (s) => callback(s.val()));
    }
    return () => {};
  }

  // Ответы
  static submitAnswer(guestId: any, answerIdx: any) {
     const gid = typeof guestId === 'object' ? guestId.guestId : guestId;
     const ans = typeof guestId === 'object' ? guestId.answerIdx : answerIdx;
     
     const key = push(ref(db, 'answers')).key;
     update(ref(db), { [`answers/${key}`]: { guestId: gid, answerIdx: ans } });
  }

  static onAnswersChange(cb: any) {
    const callback = typeof cb === 'function' ? cb : arguments[arguments.length - 1];
    if (typeof callback === 'function') {
      return onValue(ref(db, 'answers'), (s) => callback(s.val()));
    }
    return () => {};
  }
  
  // Картинки и прогресс
  static addGuestImage(guestId: any, url: any) {
      push(ref(db, 'guestImages'), { guestId, imageUrl: url });
  }
  
  static onImagesChange(cb: any) {
      const callback = typeof cb === 'function' ? cb : arguments[arguments.length - 1];
      if (typeof callback === 'function') {
        return onValue(ref(db, 'guestImages'), (s) => callback(s.val()));
      }
      return () => {};
  }

  static updatePushProgress(val: any) {
      set(ref(db, 'pushProgress'), val);
  }

  static onPushProgressChange(cb: any) {
      const callback = typeof cb === 'function' ? cb : arguments[arguments.length - 1];
      if (typeof callback === 'function') {
        return onValue(ref(db, 'pushProgress'), (s) => callback(s.val()));
      }
      return () => {};
  }
}

// Экспорты для надежности
export const updateGameState = FirebaseService.updateGameState;
export const subscribeToGameState = FirebaseService.subscribeToGameState;