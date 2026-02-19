
export type UserRole = 'HOST' | 'GUEST' | 'SCREEN';
export type Language = 'ru' | 'en';

export interface TimingItem {
  id: string;
  time: string; // Start Time
  endTime?: string; // End Time
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface LiveEvent {
  id: string;
  ownerId?: string;
  name: string;
  date: string;
  code: string;
  type: 'WEDDING' | 'CORPORATE' | 'PARTY';
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  location?: string;
  notes?: string;
  timetable?: TimingItem[];
  contractors?: string;
  contacts?: string;
}

export interface GuestRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string;
  notes?: string;
  lastEventDate?: string;
}

export enum GameType {
  QUIZ = 'QUIZ',
  SHAKE_IT = 'SHAKE_IT',
  NOISE_METER = 'NOISE_METER',
  IMAGE_GEN = 'IMAGE_GEN',
  PUSH_IT = 'PUSH_IT',
  BELIEVE_NOT = 'BELIEVE_NOT',
  QUEST = 'QUEST'
}
