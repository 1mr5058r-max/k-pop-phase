'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SpendingRecord, Emotion, SpendingCategory } from '@/types';
import EmotionBadge, { emotionConfig } from '@/components/EmotionBadge';

const categoryConfig: Record<SpendingCategory, { emoji: string; label: string; color: string }> = {
  album: { emoji: '💿', label: 'アルバム', color: 'bg-blue-300' },
  goods: { emoji: '🎁', label: 'グッズ', color: 'bg-pink-300' },
  concert: { emoji: '🎤', label: 'コンサート', color: 'bg-purple-300' },
  streaming: { emoji: '📱', label: '配信/サブスク', color: 'bg-green-300' },
  other: { emoji: '✨', label: 'その他', color: 'bg-gray-300' },
};

export default function StatsPage() {
  const [records] = useLocalStorage<SpendingRecord[]>('kpause-records', []);
  const [hourlyWage] = useLocalStorage<number>('kpause-hourly-wage', 1000);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 今月の記録をフィルタリング
  const currentMonthRecords = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return records.filter(record => record.createdAt.startsWith(currentMonth));
  }, [records]);

  // カテゴリ別の支出を計算
  const categoryStats = useMemo(() => {
    const stats: Record<SpendingCategory, number> = {
      album: 0,
      goods: 0,
      concert: 0,
      streaming: 0,
      other: 0,
    };
    
    currentMonthRecords.forEach(record => {
      stats[record.category] += record.amount;
    });
    
    return stats;
  }, [currentMonthRecords]);

  // 感情別の支出を計算
  const emotionStats = useMemo(() => {
    const stats: Record<Emotion, { count: number; total: number; avgSatisfaction: number }> = {
      happy: { count: 0, total: 0, avgSatisfaction: 0 },
      excited: { count: 0, total: 0, avgSatisfaction: 0 },
      tired: { count: 0, total: 0, avgSatisfaction: 0 },
      stressed: { count: 0, total: 0, avgSatisfaction: 0 },
      sad: { count: 0, total: 0, avgSatisfaction: 0 },
      guilty: { count: 0, total: 0, avgSatisfaction: 0 },
    };
    
    currentMonthRecords.forEach(record => {
      stats[record.emotion].count++;
      stats[record.emotion].total += record.amount;
      if (record.satisfaction) {
        stats[record.emotion].avgSatisfaction += record.satisfaction;
      }
    });

    // 平均満足度を計算
    Object.keys(stats).forEach(emo => {
      const emotion = emo as Emotion;
      if (stats[emotion].count > 0) {
        stats[emotion].avgSatisfaction = Math.round((stats[emotion].avgSatisfaction / stats[emotion].count) * 10) / 10;
      }
    });
    
    return stats;
  }, [currentMonthRecords]);

  // 満足度別の支出を計算
  const satisfactionStats = useMemo(() => {
    const stats: Record<number, { count: number; total: number }> = {
      1: { count: 0, total: 0 },
      2: { count: 0, total: 0 },
      3: { count: 0, total: 0 },
      4: { count: 0, total: 0 },
      5: { count: 0, total: 0 },
    };
    
    currentMonthRecords.forEach(record => {
      if (record.satisfaction) {
        stats[record.satisfaction].count++;
        stats[record.satisfaction].total += record.amount;
      }
    });
    
    return stats;
  }, [currentMonthRecords]);

  // 幸福度分析
  const happinessAnalysis = useMemo(() => {
    const recordsWithSatisfaction = currentMonthRecords.filter(r => r.satisfaction);
    if (recordsWithSatisfaction.length === 0) {
      return {
        avgSatisfaction: 0,
        totalWorkHours: 0,
        satisfactionPerHour: 0,
        isHealthy: true,
        status: 'none',
      };
    }

    const totalSpent = currentMonthRecords.reduce((sum, r) => sum + r.amount, 0);
    const avgSatisfaction = recordsWithSatisfaction.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / recordsWithSatisfaction.length;
    const totalWorkHours = totalSpent / hourlyWage;
    const satisfactionPerHour = avgSatisfaction / (totalWorkHours || 1);

    // 健全度判定
    let status: 'excellent' | 'good' | 'warning' | 'danger' = 'good';
    if (avgSatisfaction >= 4 && totalWorkHours < 40) {
      status = 'excellent';
    } else if (avgSatisfaction >= 3 && totalWorkHours < 60) {
      status = 'good';
    } else if (avgSatisfaction < 3 && totalWorkHours > 40) {
      status = 'danger';
    } else if (avgSatisfaction < 3 || totalWorkHours > 60) {
      status = 'warning';
    }

    return {
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      satisfactionPerHour: Math.round(satisfactionPerHour * 100) / 100,
      isHealthy: status === 'excellent' || status === 'good',
      status,
    };
  }, [currentMonthRecords, hourlyWage]);

  // 合計支出
  const totalSpending = currentMonthRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // 最大カテゴリ支出（グラフ用）
  const maxCategoryAmount = Math.max(...Object.values(categoryStats), 1);
  
  // 最大満足度支出（グラフ用）
  const maxSatisfactionAmount = Math.max(...Object.values(satisfactionStats).map(s => s.total), 1);

  const statusConfig = {
    excellent: { emoji: '💎', label: '絶好調！', color: 'from-green-200 to-emerald-300', textColor: 'text-green-600' },
    good: { emoji: '✨', label: '良いバランス', color: 'from-pink-200 to-purple-200', textColor: 'text-pink-600' },
    warning: { emoji: '🌸', label: '要注意', color: 'from-yellow-200 to-orange-200', textColor: 'text-yellow-600' },
    danger: { emoji: '⚠️', label: '見直そう', color: 'from-red-200 to-orange-200', textColor: 'text-red-600' },
    none: { emoji: '📝', label: '記録してね', color: 'from-gray-200 to-gray-300', textColor: 'text-gray-600' },
  };

  const currentStatus = statusConfig[happinessAnalysis.status as keyof typeof statusConfig];

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
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">統計</h1>
          <p className="text-pink-600 text-sm mt-1">推し活の振り返り 📊</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 幸福度分析メイン */}
        <section className={`card-pastel p-6 bg-gradient-to-r ${currentStatus.color}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">推し活の健全度</h2>
            <span className="text-4xl animate-sparkle">{currentStatus.emoji}</span>
          </div>

          <div className="text-center py-4">
            <p className={`text-3xl font-bold ${currentStatus.textColor}`}>
              {currentStatus.label}
            </p>
          </div>

          {happinessAnalysis.status !== 'none' && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/70 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">平均満足度</p>
                <p className="text-xl font-bold text-purple-600">
                  {happinessAnalysis.avgSatisfaction}
                </p>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${star <= happinessAnalysis.avgSatisfaction ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/70 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">労働時間換算</p>
                <p className="text-xl font-bold text-pink-600">
                  {happinessAnalysis.totalWorkHours}h
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  約{Math.round(happinessAnalysis.totalWorkHours / 8)}日分
                </p>
              </div>
              <div className="bg-white/70 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-500">効率スコア</p>
                <p className="text-xl font-bold text-blue-600">
                  {(happinessAnalysis.satisfactionPerHour * 100).toFixed(0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  満足/時間
                </p>
              </div>
            </div>
          )}

          {/* アドバイス */}
          <div className="mt-4 p-4 bg-white/80 rounded-2xl">
            <p className="text-sm text-gray-700">
              {happinessAnalysis.status === 'excellent'
                ? '💎 最高の推し活！高い満足度で無理のない出費。この調子でいこう！'
                : happinessAnalysis.status === 'good'
                ? '✨ 良いバランス！満足度と出費のバランスが取れてるよ'
                : happinessAnalysis.status === 'warning'
                ? '🌸 ちょっと注意かも。満足度に対して出費が多いかな？本当に欲しいものに絞ってみよう'
                : happinessAnalysis.status === 'danger'
                ? '⚠️ 無理な推し活になってるかも...満足度が低いのにお金を使いすぎてない？'
                : '📝 まずは支出を記録してみよう！'}
            </p>
          </div>
        </section>

        {/* 満足度別グラフ */}
        <section className="card-pastel p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">満足度別の支出 💕</h2>
          
          {totalSpending === 0 ? (
            <p className="text-center text-gray-500 py-4">まだ記録がありません</p>
          ) : (
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((level) => {
                const stats = satisfactionStats[level];
                const percentage = (stats.total / maxSatisfactionAmount) * 100;
                const satisfactionEmojis: Record<number, string> = {
                  5: '🤩 最高！',
                  4: '😊 満足',
                  3: '🙂 普通',
                  2: '😕 まあまあ',
                  1: '😢 後悔',
                };
                
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">
                        {satisfactionEmojis[level]}
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ¥{stats.total.toLocaleString()} ({stats.count}件)
                      </span>
                    </div>
                    <div className="h-4 bg-pink-50 rounded-full overflow-hidden border border-pink-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          level >= 4
                            ? 'bg-gradient-to-r from-green-200 to-emerald-300'
                            : level === 3
                            ? 'bg-gradient-to-r from-yellow-200 to-orange-200'
                            : 'bg-gradient-to-r from-red-200 to-orange-200'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 満足度インサイト */}
          {totalSpending > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <p className="text-sm text-purple-700">
                {(satisfactionStats[4].total + satisfactionStats[5].total) > (satisfactionStats[1].total + satisfactionStats[2].total)
                  ? '💎 満足度の高い買い物が多い！良い推し活ができてるね'
                  : (satisfactionStats[1].total + satisfactionStats[2].total) > totalSpending * 0.3
                  ? '💭 後悔する買い物が多いかも...本当に欲しいものだけにしよう'
                  : '✨ バランスの取れた推し活！'}
              </p>
            </div>
          )}
        </section>

        {/* 今月のサマリー */}
        <section className="card-pastel p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">今月のサマリー</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 text-center border-2 border-pink-100">
              <p className="text-sm text-gray-500 mb-1">支出合計</p>
              <p className="text-2xl font-bold text-pink-600">¥{totalSpending.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 text-center border-2 border-purple-100">
              <p className="text-sm text-gray-500 mb-1">記録数</p>
              <p className="text-2xl font-bold text-purple-600">{currentMonthRecords.length}件</p>
            </div>
          </div>
        </section>

        {/* カテゴリ別グラフ */}
        <section className="card-pastel p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">カテゴリ別支出 🛍️</h2>
          
          {totalSpending === 0 ? (
            <p className="text-center text-gray-500 py-4">まだ記録がありません</p>
          ) : (
            <div className="space-y-4">
              {(Object.keys(categoryConfig) as SpendingCategory[]).map((cat) => {
                const amount = categoryStats[cat];
                const percentage = (amount / maxCategoryAmount) * 100;
                
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span>{categoryConfig[cat].emoji}</span>
                        <span className="text-gray-600">{categoryConfig[cat].label}</span>
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ¥{amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-4 bg-pink-50 rounded-full overflow-hidden border border-pink-100">
                      <div
                        className={`h-full ${categoryConfig[cat].color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 感情とお金の関係 */}
        <section className="card-pastel p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">感情とお金の関係 💭</h2>
          
          {totalSpending === 0 ? (
            <p className="text-center text-gray-500 py-4">まだ記録がありません</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(emotionConfig) as Emotion[])
                .filter(emo => emotionStats[emo].count > 0)
                .sort((a, b) => emotionStats[b].total - emotionStats[a].total)
                .map((emo) => {
                  const stats = emotionStats[emo];
                  const avgAmount = Math.round(stats.total / stats.count);
                  
                  return (
                    <div
                      key={emo}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl border-2 border-pink-100"
                    >
                      <div className="flex items-center gap-3">
                        <EmotionBadge emotion={emo} size="sm" />
                        <div>
                          <span className="text-sm text-gray-500">{stats.count}回</span>
                          {stats.avgSatisfaction > 0 && (
                            <div className="flex mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xs ${star <= stats.avgSatisfaction ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-700">
                          平均 ¥{avgAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          合計 ¥{stats.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* 全記録一覧 */}
        <section className="card-pastel p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">すべての記録 📋</h2>
          
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-4">まだ記録がありません</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...records].reverse().map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border-2 border-pink-100 rounded-2xl bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryConfig[record.category].emoji}</span>
                    <div>
                      <p className="font-bold text-gray-700">-¥{record.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {record.satisfaction && (
                        <div className="flex mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xs ${star <= record.satisfaction! ? 'text-yellow-400' : 'text-gray-200'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      {record.note && (
                        <p className="text-xs text-gray-400 mt-1">{record.note}</p>
                      )}
                    </div>
                  </div>
                  <EmotionBadge emotion={record.emotion} size="sm" showLabel={false} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
