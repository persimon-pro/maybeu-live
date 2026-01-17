export type UserRole = 'HOST' | 'GUEST' | 'SCREEN';
export type Language = 'ru' | 'en';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface LiveEvent {
  id: string;
  title: string;
  isActive: boolean;
  currentStage: 'waiting' | 'quiz' | 'voting' | 'results';
  questions?: QuizQuestion[];
  scores?: Record<string, number>;
}