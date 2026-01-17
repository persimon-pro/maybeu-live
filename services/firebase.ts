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

export class FirebaseService {
  
  static subscribeToGameState(callback: (data: any) => void) {
    onValue(ref(db, 'gameState'), (snapshot) => callback(snapshot.val()));
  }

  // Дублируем для совместимости, так как в разных файлах вы называли это по-разному
  static onGameStateChange(callback: (data: any) => void) {
    this.subscribeToGameState(callback);
  }

  static updateGameState(event: LiveEvent | null) {
    set(ref(db, 'gameState'), { activeEvent: event, timestamp: Date.now() });
  }

  static async resetGame() {
    await set(ref(db, 'gameState'), null);
  }
  
  static async resetEvent() {
    await this.resetGame();
  }

  // --- Гости ---
  static registerGuest(guestId: string, name: string) {
    set(ref(db, `guests/${guestId}`), { name, joinedAt: Date.now(), score: 0 });
  }

  static onGuestsCountChange(callback: (count: number) => void) {
    onValue(ref(db, 'guests'), (snapshot) => {
      callback(snapshot.size);
    });
  }

  // --- Экран и Пульс ---
  static sendScreenPulse() {
    set(ref(db, 'screenPulse'), Date.now());
  }

  static onScreenPulseChange(callback: (timestamp: number) => void) {
    onValue(ref(db, 'screenPulse'), (snapshot) => callback(snapshot.val()));
  }

  static onPushProgressChange(callback: (val: any) => void) {
    onValue(ref(db, 'pushProgress'), (snapshot) => callback(snapshot.val()));
  }

  static updatePushProgress(val: number) {
    set(ref(db, 'pushProgress'), val);
  }

  // --- Ответы и Картинки ---
  static submitAnswer(guestId: string, answerIdx: number) {
    const key = push(ref(db, 'answers')).key;
    update(ref(db), { [`answers/${key}`]: { guestId, answerIdx } });
  }

  static onAnswersChange(callback: (data: any) => void) {
    onValue(ref(db, 'answers'), (snapshot) => callback(snapshot.val()));
  }

  static addGuestImage(guestId: string, imageUrl: string) {
    push(ref(db, 'guestImages'), { guestId, imageUrl });
  }

  static onImagesChange(callback: (data: any) => void) {
    onValue(ref(db, 'guestImages'), (snapshot) => callback(snapshot.val()));
  }
}