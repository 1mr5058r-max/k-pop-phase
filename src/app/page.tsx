'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SpendingRecord, Emotion } from '@/types';
import EmotionBadge, { emotionConfig } from '@/components/EmotionBadge';
import Link from 'next/link';

export default function Dashboard() {
  const [records, setRecords] = useLocalStorage<SpendingRecord[]>('kpause-records', []);
  const [monthlyBudget, setMonthlyBudget] = useLocalStorage<number>('kpause-budget', 30000);
  const [mentalScore, setMentalScore] = useLocalStorage<number>('kpause-mental', 70);
  const [hourlyWage, setHourlyWage] = useLocalStorage<number>('kpause-hourly-wage', 1000);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 今月の支出を計算
  const getCurrentMonthSpending = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return records
      .filter(record => record.createdAt.startsWith(currentMonth))
      .reduce((sum, record) => sum + record.amount, 0);
  };

  // 今月の記録を取得
  const currentMonthRecords = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return records.filter(record => record.createdAt.startsWith(currentMonth));
  }, [records]);

  // 平均満足度を計算
  const averageSatisfaction = useMemo(() => {
    const recordsWithSatisfaction = currentMonthRecords.filter(r => r.satisfaction);
    if (recordsWithSatisfaction.length === 0) return 0;
    const sum = recordsWithSatisfaction.reduce((acc, r) => acc + (r.satisfaction || 0), 0);
    return sum / recordsWithSatisfaction.length;
  }, [currentMonthRecords]);

  // 労働時間換算を計算
  const totalWorkHours = useMemo(() => {
    const totalSpent = currentMonthRecords.reduce((sum, r) => sum + r.amount, 0);
    return Math.round((totalSpent / hourlyWage) * 10) / 10;
  }, [currentMonthRecords, hourlyWage]);

  // 最近の感情を取得
  const getRecentEmotion = (): Emotion => {
    if (records.length === 0) return 'happy';
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedRecords[0].emotion;
  };

  // 状態に応じた絵文字を取得
  const getStatusEmoji = () => {
    const spending = getCurrentMonthSpending();
    const budgetRatio = spending / monthlyBudget;
    
    if (budgetRatio >= 1) return { emoji: '💸', label: '使いすぎ注意！', color: 'text-red-500' };
    if (budgetRatio >= 0.8) return { emoji: '⚠️', label: '予算残りわずか', color: 'text-orange-500' };
    if (mentalScore >= 80 && budgetRatio < 0.5) return { emoji: '💎', label: '推し活絶好調！', color: 'text-purple-500' };
    if (mentalScore >= 60) return { emoji: '✨', label: '良いバランス', color: 'text-pink-500' };
    if (mentalScore >= 40) return { emoji: '🌸', label: 'ちょっと休憩？', color: 'text-pink-400' };
    return { emoji: '💜', label: '無理しないでね', color: 'text-purple-400' };
  };

  // メンタルスコアに応じたメッセージ
  const getMentalMessage = () => {
    if (mentalScore >= 80) return { text: '絶好調！推し活を楽しんで✨', color: 'text-green-600' };
    if (mentalScore >= 60) return { text: '良い感じ！バランス取れてるよ💕', color: 'text-pink-600' };
    if (mentalScore >= 40) return { text: 'ちょっと疲れてない？休憩も大事だよ🌸', color: 'text-yellow-600' };
    return { text: '無理しないで。自分を大切にね💜', color: 'text-purple-600' };
  };

  const monthlySpending = getCurrentMonthSpending();
  const remainingBudget = monthlyBudget - monthlySpending;
  const budgetPercentage = Math.min((monthlySpending / monthlyBudget) * 100, 100);
  const mentalMessage = getMentalMessage();
  const recentEmotion = getRecentEmotion();
  const statusEmoji = getStatusEmoji();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-pink-400 animate-pulse">Loading... 💕</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-700 p-6 rounded-b-[32px] shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              K-Pause
            </h1>
            <p className="text-pink-600 text-sm mt-1">推し活と心のバランスを大切に 💜</p>
          </div>
          <div className="text-right">
            <span className={`text-4xl animate-sparkle ${statusEmoji.color}`}>{statusEmoji.emoji}</span>
            <p className={`text-xs mt-1 font-medium ${statusEmoji.color}`}>{statusEmoji.label}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 心の余裕度カード */}
        <section className="card-pastel p-6 animate-pulse-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">心の余裕度</h2>
            <EmotionBadge emotion={recentEmotion} size="sm" />
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-36 h-36">
                {/* 円形プログレス */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#ffe4ec"
                    strokeWidth="14"
                    fill="none"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="url(#pastel-gradient)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${mentalScore * 3.77} 377`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="pastel-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffb6c1" />
                      <stop offset="50%" stopColor="#dda0dd" />
                      <stop offset="100%" stopColor="#b0e0e6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {mentalScore}%
                  </span>
                  <span className="text-xl mt-1">{statusEmoji.emoji}</span>
                </div>
              </div>
            </div>
            
            <p className={`text-center font-medium ${mentalMessage.color}`}>
              {mentalMessage.text}
            </p>
          </div>

          {/* メンタル調整スライダー */}
          <div className="mt-6">
            <label className="text-sm text-gray-500 mb-2 block font-medium">今の気分を教えて 💭</label>
            <input
              type="range"
              min="0"
              max="100"
              value={mentalScore}
              onChange={(e) => setMentalScore(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ffb6c1 0%, #dda0dd ${mentalScore}%, #e8e8e8 ${mentalScore}%, #e8e8e8 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span>😔 疲れてる</span>
              <span>元気！ 😊</span>
            </div>
          </div>
        </section>

        {/* 今月の推し活残金カード */}
        <section className="card-pastel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">今月の推し活残金</h2>
            <span className="text-2xl animate-float">
              {remainingBudget > 0 ? '💰' : '💸'}
            </span>
          </div>

          <div className="text-center mb-4">
            <p className={`text-5xl font-bold ${remainingBudget >= 0 ? 'text-gray-700' : 'text-red-500'}`}>
              ¥{remainingBudget.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              予算 ¥{monthlyBudget.toLocaleString()} のうち
            </p>
          </div>

          {/* 予算進捗バー */}
          <div className="relative h-5 bg-pink-50 rounded-full overflow-hidden mb-3 border-2 border-pink-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetPercentage >= 90
                  ? 'bg-gradient-to-r from-red-300 to-red-400'
                  : budgetPercentage >= 70
                  ? 'bg-gradient-to-r from-orange-200 to-orange-300'
                  : 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 font-medium">
            <span>使用: ¥{monthlySpending.toLocaleString()}</span>
            <span>{Math.round(budgetPercentage)}% 使用</span>
          </div>

          {/* 労働時間換算 */}
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">バイト換算</p>
                <p className="text-xl font-bold text-purple-600">
                  約{totalWorkHours}時間分 ⏰
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">平均満足度</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= averageSatisfaction ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 予算設定 */}
          <div className="mt-4 pt-4 border-t-2 border-pink-50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">月間予算</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-pink-100 rounded-xl text-sm bg-white"
                    placeholder="予算"
                  />
                  <span className="text-xs text-gray-400">円</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">時給設定</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 border-2 border-pink-100 rounded-xl text-sm bg-white"
                    placeholder="時給"
                  />
                  <span className="text-xs text-gray-400">円</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 幸福度分析カード */}
        {currentMonthRecords.length > 0 && (
          <section className="card-pastel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">幸福度分析</h2>
              <span className="text-2xl">📊</span>
            </div>
            
            {/* 幸福度メーター */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">推し活の健全度</span>
                <span className="text-sm font-bold text-purple-600">
                  {averageSatisfaction >= 4 && budgetPercentage < 80
                    ? '💎 絶好調！'
                    : averageSatisfaction >= 3
                    ? '✨ 良いバランス'
                    : averageSatisfaction >= 2
                    ? '🌸 まあまあ'
                    : '⚠️ 見直そう'}
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    averageSatisfaction >= 4 && budgetPercentage < 80
                      ? 'bg-gradient-to-r from-green-300 to-emerald-400'
                      : averageSatisfaction >= 3
                      ? 'bg-gradient-to-r from-pink-300 to-purple-300'
                      : averageSatisfaction >= 2
                      ? 'bg-gradient-to-r from-yellow-200 to-orange-300'
                      : 'bg-gradient-to-r from-red-200 to-red-300'
                  }`}
                  style={{ width: `${(averageSatisfaction / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* インサイト */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <p className="text-sm text-purple-700">
                {averageSatisfaction >= 4 && budgetPercentage < 80
                  ? '💎 高い満足度で予算内！最高の推し活ができてるよ'
                  : averageSatisfaction >= 3 && budgetPercentage >= 80
                  ? '✨ 満足してるけど、ちょっと使いすぎかも？'
                  : averageSatisfaction < 3 && budgetPercentage >= 80
                  ? '💭 使ってる割に満足度低め...本当に欲しいものに絞ろう'
                  : '🌸 まだ余裕あり！自分へのご褒美も忘れずに'}
              </p>
            </div>
          </section>
        )}

        {/* 最近の記録 */}
        <section className="card-pastel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">最近の記録</h2>
            <Link href="/record" className="text-pink-500 text-sm font-bold hover:underline">
              + 記録する
            </Link>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3 animate-float">📝</div>
              <p className="text-gray-500 font-medium">まだ記録がありません</p>
              <Link
                href="/record"
                className="inline-block mt-4 px-8 py-3 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 text-white rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg"
              >
                最初の記録をつける ✨
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {records.slice(-3).reverse().map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl border-2 border-pink-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emotionConfig[record.emotion].emoji}</span>
                    <div>
                      <p className="font-bold text-gray-700">-¥{record.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {record.satisfaction && (
                          <span className="text-xs text-yellow-500">
                            {'★'.repeat(record.satisfaction)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <EmotionBadge emotion={record.emotion} size="sm" showLabel={false} />
                </div>
              ))}
              
              <Link
                href="/stats"
                className="block text-center text-pink-500 text-sm font-bold hover:underline pt-2"
              >
                すべての記録を見る →
              </Link>
            </div>
          )}
        </section>

        {/* クイックアクション */}
        <section className="grid grid-cols-2 gap-4">
          <Link
            href="/record"
            className="bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300 text-gray-700 rounded-3xl p-6 text-center shadow-lg hover:shadow-xl transition-all active:scale-98"
          >
            <div className="text-4xl mb-2 animate-float">✏️</div>
            <p className="font-bold">支出を記録</p>
          </Link>
          <Link
            href="/stats"
            className="bg-gradient-to-br from-purple-200 via-purple-300 to-indigo-300 text-gray-700 rounded-3xl p-6 text-center shadow-lg hover:shadow-xl transition-all active:scale-98"
          >
            <div className="text-4xl mb-2 animate-float">📊</div>
            <p className="font-bold">統計を見る</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
