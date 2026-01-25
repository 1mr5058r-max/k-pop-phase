// 感情の種類
export type Emotion = 'happy' | 'excited' | 'tired' | 'stressed' | 'sad' | 'guilty';

// 支出カテゴリ
export type SpendingCategory = 'album' | 'goods' | 'concert' | 'streaming' | 'other';

// 満足度（1-5）
export type SatisfactionLevel = 1 | 2 | 3 | 4 | 5;

// 支出記録
export interface SpendingRecord {
  id: number;
  amount: number;
  category: SpendingCategory;
  emotion: Emotion;
  note?: string;
  createdAt: string;
  // 幸福度換算用
  satisfaction?: SatisfactionLevel; // 心の満足度（1-5）
  hourlyWage?: number; // バイト時給（計算用に保存）
}

// メンタル状態
export interface MentalState {
  date: string;
  score: number; // 1-100
  emotion: Emotion;
}

// 月間予算
export interface MonthlyBudget {
  total: number;
  spent: number;
  month: string; // YYYY-MM形式
}

// 幸福度分析結果
export interface HappinessAnalysis {
  averageSatisfaction: number; // 平均満足度
  totalWorkHours: number; // 総労働時間換算
  satisfactionPerHour: number; // 1時間あたりの満足度
  isHealthy: boolean; // 健全な推し活かどうか
  message: string; // フィードバックメッセージ
}
