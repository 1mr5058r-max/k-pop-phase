'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SpendingRecord, Emotion, SpendingCategory, SatisfactionLevel } from '@/types';
import { emotionConfig } from '@/components/EmotionBadge';

const categoryConfig: Record<SpendingCategory, { emoji: string; label: string }> = {
  album: { emoji: '💿', label: 'アルバム' },
  goods: { emoji: '🎁', label: 'グッズ' },
  concert: { emoji: '🎤', label: 'コンサート' },
  streaming: { emoji: '📱', label: '配信/サブスク' },
  other: { emoji: '✨', label: 'その他' },
};

const satisfactionLabels: Record<SatisfactionLevel, { emoji: string; label: string }> = {
  1: { emoji: '😢', label: '後悔...' },
  2: { emoji: '😕', label: 'まあまあ' },
  3: { emoji: '🙂', label: '普通' },
  4: { emoji: '😊', label: '満足！' },
  5: { emoji: '🤩', label: '最高！！' },
};

export default function RecordPage() {
  const router = useRouter();
  const [records, setRecords] = useLocalStorage<SpendingRecord[]>('kpause-records', []);
  const [mentalScore, setMentalScore] = useLocalStorage<number>('kpause-mental', 70);
  const [hourlyWage] = useLocalStorage<number>('kpause-hourly-wage', 1000);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<SpendingCategory>('album');
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(3);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // バイト時間換算
  const workHoursEquivalent = useMemo(() => {
    const amountNum = parseInt(amount) || 0;
    if (amountNum <= 0 || hourlyWage <= 0) return 0;
    return Math.round((amountNum / hourlyWage) * 10) / 10;
  }, [amount, hourlyWage]);

  // 金額に応じたフィードバック
  const getAmountFeedback = () => {
    const amountNum = parseInt(amount) || 0;
    if (amountNum === 0) return null;
    
    if (workHoursEquivalent >= 40) {
      return { emoji: '💸', text: 'まるまる1週間のバイト分！本当に必要？', color: 'text-red-500' };
    }
    if (workHoursEquivalent >= 16) {
      return { emoji: '⚠️', text: '2日分のバイト相当。よく考えてね', color: 'text-orange-500' };
    }
    if (workHoursEquivalent >= 8) {
      return { emoji: '🤔', text: '1日分のバイト相当。納得してる？', color: 'text-yellow-600' };
    }
    if (workHoursEquivalent >= 4) {
      return { emoji: '💭', text: '半日分のバイト相当', color: 'text-purple-500' };
    }
    return { emoji: '✨', text: 'ご褒美にいいかも！', color: 'text-pink-500' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseInt(amount) <= 0) {
      alert('金額を入力してください');
      return;
    }

    setIsSaving(true);

    const newRecord: SpendingRecord = {
      id: Date.now(),
      amount: parseInt(amount),
      category,
      emotion,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      satisfaction,
      hourlyWage,
    };

    // 記録を追加
    setRecords(prev => [...prev, newRecord]);

    // 感情と満足度に基づいてメンタルスコアを調整
    const emotionImpact: Record<Emotion, number> = {
      happy: 5,
      excited: 8,
      tired: -5,
      stressed: -10,
      sad: -8,
      guilty: -12,
    };
    
    // 満足度が高ければプラス、低ければマイナス
    const satisfactionImpact = (satisfaction - 3) * 3;
    
    setMentalScore(prev => {
      const newScore = prev + emotionImpact[emotion] + satisfactionImpact;
      return Math.max(0, Math.min(100, newScore));
    });

    // 成功メッセージ表示
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      
      // フォームリセット
      setAmount('');
      setNote('');
      setSatisfaction(3);
      
      // 2秒後にダッシュボードへ
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 500);
  };

  const amountFeedback = getAmountFeedback();

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">✅</div>
          <p className="text-2xl font-bold text-pink-600">記録しました！</p>
          <p className="text-gray-500 mt-2">推し活、楽しんでね 💕</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-700 p-6 rounded-b-[32px] shadow-lg">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">支出を記録</h1>
          <p className="text-pink-600 text-sm mt-1">推し活の記録をつけよう ✏️</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 金額入力 */}
          <section className="card-pastel p-6">
            <label className="block text-lg font-bold text-gray-700 mb-4">
              いくら使った？ 💰
            </label>
            <div className="flex items-center gap-2">
              <span className="text-3xl text-pink-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-4xl font-bold text-gray-800 border-b-3 border-pink-200 focus:border-pink-400 pb-2 bg-transparent"
              />
            </div>

            {/* バイト時間換算 */}
            {amount && parseInt(amount) > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">バイト換算</p>
                    <p className="text-xl font-bold text-purple-600">
                      約{workHoursEquivalent}時間分 ⏰
                    </p>
                  </div>
                  {amountFeedback && (
                    <div className={`text-right ${amountFeedback.color}`}>
                      <span className="text-2xl">{amountFeedback.emoji}</span>
                      <p className="text-xs mt-1 font-medium">{amountFeedback.text}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 心の満足度 */}
          <section className="card-pastel p-6">
            <label className="block text-lg font-bold text-gray-700 mb-4">
              心の満足度は？ 💕
            </label>
            <div className="flex justify-between gap-2">
              {([1, 2, 3, 4, 5] as SatisfactionLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSatisfaction(level)}
                  className={`flex-1 p-3 rounded-2xl border-3 transition-all ${
                    satisfaction === level
                      ? 'border-pink-400 bg-pink-50 scale-105'
                      : 'border-gray-100 hover:border-pink-200 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{satisfactionLabels[level].emoji}</div>
                  <div className="text-xs font-medium text-gray-600">{satisfactionLabels[level].label}</div>
                </button>
              ))}
            </div>
            
            {/* 満足度フィードバック */}
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
              <p className="text-sm text-center text-gray-600">
                {satisfaction >= 4
                  ? '✨ 高い満足度！良い買い物だね'
                  : satisfaction === 3
                  ? '🌸 普通くらいかな？'
                  : '💭 あんまり満足できてない...？本当に必要だった？'}
              </p>
            </div>
          </section>

          {/* カテゴリ選択 */}
          <section className="card-pastel p-6">
            <label className="block text-lg font-bold text-gray-700 mb-4">
              何に使った？ 🛍️
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(categoryConfig) as SpendingCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-4 rounded-2xl border-3 transition-all ${
                    category === cat
                      ? 'border-pink-400 bg-pink-50 scale-105'
                      : 'border-gray-100 hover:border-pink-200 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-1">{categoryConfig[cat].emoji}</div>
                  <div className="text-xs font-medium text-gray-600">{categoryConfig[cat].label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 感情選択 */}
          <section className="card-pastel p-6">
            <label className="block text-lg font-bold text-gray-700 mb-4">
              今の気持ちは？ 💭
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(emotionConfig) as Emotion[]).map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setEmotion(emo)}
                  className={`p-4 rounded-2xl border-3 transition-all ${
                    emotion === emo
                      ? 'border-pink-400 bg-pink-50 scale-105'
                      : 'border-gray-100 hover:border-pink-200 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-1">{emotionConfig[emo].emoji}</div>
                  <div className="text-xs font-medium text-gray-600">{emotionConfig[emo].label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* メモ */}
          <section className="card-pastel p-6">
            <label className="block text-lg font-bold text-gray-700 mb-4">
              メモ（任意） 📝
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="どんな推し活だった？✨"
              rows={3}
              className="w-full px-4 py-3 border-2 border-pink-100 rounded-2xl bg-white resize-none text-gray-700"
            />
          </section>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 rounded-3xl font-bold text-white text-lg shadow-lg transition-all ${
              isSaving
                ? 'bg-gray-300'
                : 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 hover:opacity-90 active:scale-98'
            }`}
          >
            {isSaving ? '保存中...' : '記録する ✨'}
          </button>
        </form>
      </main>
    </div>
  );
}
